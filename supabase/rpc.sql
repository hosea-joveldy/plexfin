-- =============================================================================
-- PlexFin — content management RPC functions
-- Target: Supabase (PostgreSQL 15+)
--
-- Depends on supabase/schema.sql (tables + pg_trgm extension).
--
-- Every catalog function returns JSONB shaped like the frontend's
-- ContentItem interface (src/data/types.ts):
--
--   id              -> content.slug      (stable public identifier)
--   title           -> title
--   description     -> description
--   logline         -> logline           (optional)
--   thumbnailUrl    -> thumbnail_url
--   backdropUrl     -> backdrop_url
--   year            -> release_year
--   rating          -> rating_code       (age rating, e.g. "PG-13")
--   genres          -> aggregated genre names (text[])
--   durationMinutes -> duration_minutes
--   stars           -> average_rating    (optional, 0-5, from content_ratings)
--   progressPercent -> progress_percent  (optional, continue-watching only)
--
-- Functions are SECURITY DEFINER only where they must read another user's
-- rows (get_continue_watching); everything else stays SECURITY INVOKER so
-- Row Level Security (task 04) still applies.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- Shared helper: one ContentItem JSON object per content row.
-- Keeping the projection in one place guarantees every function returns the
-- exact same shape for the same row.
-- -----------------------------------------------------------------------------
create or replace function public.content_item_json(c public.content)
returns jsonb
language sql
stable
as $$
  select jsonb_build_object(
    'id', c.slug,
    'title', c.title,
    'contentType', c.content_type,
    'description', c.description,
    'logline', c.logline,
    'thumbnailUrl', c.thumbnail_url,
    'videoUrl', c.video_url,
    'backdropUrl', c.backdrop_url,
    'year', c.release_year,
    'rating', c.rating_code,
    'genres', coalesce((
      select array_agg(g.name order by g.name)
      from public.content_genres cg
      join public.genres g on g.id = cg.genre_id
      where cg.content_id = c.id
    ), array[]::text[]),
    'durationMinutes', c.duration_minutes,
    'stars', coalesce((
      select cr.average_rating
      from public.content_ratings cr
      where cr.content_id = c.id
    ), 0)
  )
$$;

-- -----------------------------------------------------------------------------
-- get_content_list — paginated catalog with optional filters
-- -----------------------------------------------------------------------------
create or replace function public.get_content_list(
  p_type text default null,        -- 'movie' | 'series' | 'short'
  p_genre text default null,       -- genre name or slug
  p_year integer default null,     -- release year
  p_language text default null,    -- language name or code
  p_page integer default 1,
  p_page_size integer default 20
)
returns jsonb
language sql
stable
as $$
  select coalesce(jsonb_agg(item order by item->>'year' desc nulls last, item->>'id'), '[]'::jsonb)
  from (
    select public.content_item_json(c) as item
    from public.content c
    where c.status = 'published'
      and (p_type is null or c.content_type = p_type)
      and (
        p_genre is null
        or exists (
          select 1
          from public.content_genres cg
          join public.genres g on g.id = cg.genre_id
          where cg.content_id = c.id
            and (g.name ilike p_genre or g.slug ilike p_genre)
        )
      )
      and (p_year is null or c.release_year = p_year)
      and (
        p_language is null
        or exists (
          select 1
          from public.content_languages cl
          join public.languages l on l.id = cl.language_id
          where cl.content_id = c.id
            and (l.name ilike p_language or l.code ilike p_language)
        )
      )
    order by c.release_year desc, c.id
    limit least(p_page_size, 100) offset (greatest(p_page, 1) - 1) * least(p_page_size, 100)
  ) rows
$$;

-- -----------------------------------------------------------------------------
-- get_content_by_id — single item by UUID or slug
-- p_id is text so PostgREST clients can pass a raw UUID string; it is cast
-- to uuid explicitly (invalid uuids raise, which callers should treat as
-- "not found"). Pass p_slug instead to look up by the public identifier.
-- -----------------------------------------------------------------------------
create or replace function public.get_content_by_id(
  p_id text default null,
  p_slug text default null
)
returns jsonb
language sql
stable
as $$
  select public.content_item_json(c)
  from public.content c
  where c.status = 'published'
    and (
      (p_id is not null and c.id = p_id::uuid)
      or (p_id is null and p_slug is not null and c.slug = p_slug)
    )
  limit 1
$$;

-- -----------------------------------------------------------------------------
-- get_content_by_genre — paginated items sharing a genre
-- -----------------------------------------------------------------------------
create or replace function public.get_content_by_genre(
  p_genre text,                    -- genre name or slug
  p_page integer default 1,
  p_page_size integer default 20
)
returns jsonb
language sql
stable
as $$
  select coalesce(jsonb_agg(item order by item->>'year' desc nulls last, item->>'id'), '[]'::jsonb)
  from (
    select public.content_item_json(c) as item
    from public.content c
    where c.status = 'published'
      and exists (
        select 1
        from public.content_genres cg
        join public.genres g on g.id = cg.genre_id
        where cg.content_id = c.id
          and (g.name ilike p_genre or g.slug ilike p_genre)
      )
    order by c.release_year desc, c.id
    limit least(p_page_size, 100) offset (greatest(p_page, 1) - 1) * least(p_page_size, 100)
  ) rows
$$;

-- -----------------------------------------------------------------------------
-- get_trending_content — most-watched / best-rated, optionally within a window
-- The schema records no per-view timestamps, so p_window_days filters on
-- recency of the catalog entry itself (null/0 = all time); results are
-- ordered by view_count desc, then average_rating desc, then id for
-- deterministic pagination.
-- -----------------------------------------------------------------------------
create or replace function public.get_trending_content(
  p_window_days integer default 30,
  p_limit integer default 20
)
returns jsonb
language sql
stable
as $$
  select coalesce(jsonb_agg(item order by item->>'id'), '[]'::jsonb)
  from (
    select public.content_item_json(c) as item
    from public.content c
    left join public.content_ratings cr on cr.content_id = c.id
    where c.status = 'published'
      and (
        p_window_days is null
        or p_window_days <= 0
        or c.created_at >= now() - make_interval(days => p_window_days)
      )
    order by c.view_count desc, cr.average_rating desc nulls last, c.id
    limit greatest(p_limit, 1)
  ) rows
$$;

-- -----------------------------------------------------------------------------
-- get_continue_watching — a user's in-progress items (0 < progress < 100)
-- SECURITY DEFINER: reads another user's watch_history on their behalf.
-- Caller is expected to pass auth.uid() from the client.
-- -----------------------------------------------------------------------------
create or replace function public.get_continue_watching(
  p_user_id uuid,
  p_limit integer default 20
)
returns jsonb
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce(jsonb_agg(item order by last_watched_at desc), '[]'::jsonb)
  from (
    select
      public.content_item_json(c) || jsonb_build_object('progressPercent', w.progress_percent) as item,
      w.last_watched_at
    from public.watch_history w
    join public.content c on c.id = w.content_id
    where w.user_id = auth.uid()
      and w.progress_percent > 0
      and w.progress_percent < 100
      and c.status = 'published'
    order by w.last_watched_at desc
    limit greatest(p_limit, 1)
  ) rows
$$;

-- -----------------------------------------------------------------------------
-- get_new_releases — newest catalog additions, paginated
-- -----------------------------------------------------------------------------
create or replace function public.get_new_releases(
  p_page integer default 1,
  p_page_size integer default 20
)
returns jsonb
language sql
stable
as $$
  select coalesce(jsonb_agg(item order by item->>'year' desc nulls last, item->>'id'), '[]'::jsonb)
  from (
    select public.content_item_json(c) as item
    from public.content c
    where c.status = 'published'
    order by c.release_year desc, c.created_at desc, c.id
    limit least(p_page_size, 100) offset (greatest(p_page, 1) - 1) * least(p_page_size, 100)
  ) rows
$$;

-- -----------------------------------------------------------------------------
-- search_content — trigram (pg_trgm) search over title and description
-- -----------------------------------------------------------------------------
create or replace function public.search_content(
  p_query text,
  p_page integer default 1,
  p_page_size integer default 20
)
returns jsonb
language sql
stable
as $$
  select coalesce(jsonb_agg(item order by score desc, item->>'id'), '[]'::jsonb)
  from (
    select public.content_item_json(c) as item,
           greatest(
             similarity(c.title, p_query),
             coalesce(similarity(c.description, p_query), 0)
           ) as score
    from public.content c
    where c.status = 'published'
      and (c.title % p_query or c.description % p_query)
    order by score desc, c.id
    limit least(p_page_size, 100) offset (greatest(p_page, 1) - 1) * least(p_page_size, 100)
  ) rows
$$;

-- -----------------------------------------------------------------------------
-- get_related_content — items sharing at least one genre with the seed item
-- -----------------------------------------------------------------------------
create or replace function public.get_related_content(
  p_content_id uuid,
  p_limit integer default 12
)
returns jsonb
language sql
stable
as $$
  select coalesce(jsonb_agg(item order by shared_genres desc, item->>'id'), '[]'::jsonb)
  from (
    select public.content_item_json(c) as item,
           count(distinct cg.genre_id) as shared_genres
    from public.content c
    join public.content_genres cg on cg.content_id = c.id
    where c.id <> p_content_id
      and c.status = 'published'
      and cg.genre_id in (
        select genre_id from public.content_genres where content_id = p_content_id
      )
    group by c.id
    order by shared_genres desc, c.id
    limit greatest(p_limit, 1)
  ) rows
$$;

-- -----------------------------------------------------------------------------
-- get_all_genres — taxonomy lookup for filter menus
-- -----------------------------------------------------------------------------
create or replace function public.get_all_genres()
returns jsonb
language sql
stable
as $$
  select coalesce(jsonb_agg(
    jsonb_build_object(
      'id', g.id,
      'slug', g.slug,
      'name', g.name,
      'description', g.description
    ) order by g.name
  ), '[]'::jsonb)
  from public.genres g
$$;

-- -----------------------------------------------------------------------------
-- get_all_languages — taxonomy lookup for filter menus
-- -----------------------------------------------------------------------------
create or replace function public.get_all_languages()
returns jsonb
language sql
stable
as $$
  select coalesce(jsonb_agg(
    jsonb_build_object(
      'id', l.id,
      'code', l.code,
      'name', l.name
    ) order by l.name
  ), '[]'::jsonb)
  from public.languages l
$$;

-- -----------------------------------------------------------------------------
-- get_content_by_rating_range — filter by aggregate star rating
-- -----------------------------------------------------------------------------
create or replace function public.get_content_by_rating_range(
  p_min_rating numeric default null,  -- 0..5, null = no lower bound
  p_max_rating numeric default null,  -- 0..5, null = no upper bound
  p_page integer default 1,
  p_page_size integer default 20
)
returns jsonb
language sql
stable
as $$
  select coalesce(jsonb_agg(item order by item->>'stars' desc nulls last, item->>'id'), '[]'::jsonb)
  from (
    select public.content_item_json(c) as item
    from public.content c
    left join public.content_ratings cr on cr.content_id = c.id
    where c.status = 'published'
      and (p_min_rating is null or coalesce(cr.average_rating, 0) >= p_min_rating)
      and (p_max_rating is null or coalesce(cr.average_rating, 0) <= p_max_rating)
    order by coalesce(cr.average_rating, 0) desc, c.id
    limit least(p_page_size, 100) offset (greatest(p_page, 1) - 1) * least(p_page_size, 100)
  ) rows
$$;


-- Featured item for the home hero; falls back to the newest published item.
create or replace function public.get_featured_content()
returns jsonb language sql stable set search_path = '' as $$
  select public.content_item_json(c) from public.content c
  where c.status = 'published'
  order by c.is_featured desc, c.release_year desc, c.created_at desc, c.id
  limit 1;
$$;


-- Fetch a catalog item by the slug used in local UI routes.
create or replace function public.get_content_by_slug(p_slug text)
returns jsonb language sql stable set search_path = '' as $$
  select public.content_item_json(c)
  from public.content c
  where c.slug = p_slug and c.status = 'published'
  limit 1;
$$;


-- A user's saved list, shaped like catalog cards and scoped to auth.uid().
create or replace function public.get_my_list()
returns jsonb language sql stable security invoker set search_path = '' as $$
  select coalesce(jsonb_agg(public.content_item_json(c) order by w.created_at desc), '[]'::jsonb)
  from public.watchlist w
  join public.content c on c.id = w.content_id
  where w.user_id = auth.uid() and c.status = 'published';
$$;

create or replace function public.toggle_my_list(p_content_slug text)
returns boolean language plpgsql security invoker set search_path = '' as $$
declare content_uuid uuid;
begin
  if auth.uid() is null then raise exception 'Sign in to use My List'; end if;
  select id into content_uuid from public.content where slug = p_content_slug and status = 'published';
  if content_uuid is null then raise exception 'Content not found'; end if;
  delete from public.watchlist where user_id = auth.uid() and content_id = content_uuid;
  if found then return false; end if;
  insert into public.watchlist(user_id, content_id) values (auth.uid(), content_uuid);
  return true;
end; $$;
