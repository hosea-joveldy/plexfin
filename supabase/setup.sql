-- PlexFin complete Supabase setup
-- Run this one file in the Supabase SQL Editor.
-- It creates/updates tables and functions, recreates triggers/policies, and
-- preserves existing rows. It does not delete or reset user data.



-- ============================================================================
-- Schema and shared authorization helpers
-- Source: supabase/schema.sql
-- ============================================================================

-- =============================================================================
-- PlexFin — initial database schema
-- Target: Supabase (PostgreSQL 15+)
--
-- Tables: users, profiles, content, genres, content_genres, languages,
--         ratings, content_ratings, watch_history, reviews, settings
--
-- Notes:
--  * Every entity uses a UUID primary key with a database-side default.
--  * `content.slug` mirrors the string ids used by the frontend mock data
--    (e.g. "the-last-lighthouse") so rows can be referenced by URL while
--    keeping a stable UUID for storage keys and foreign keys.
--  * Row Level Security policies live in supabase/rls.sql (task 04) so they
--    can be reviewed and applied independently of this schema.
-- =============================================================================

create extension if not exists "pgcrypto";
create extension if not exists "pg_trgm";

-- -----------------------------------------------------------------------------
-- Shared trigger: keep updated_at honest on every mutable table
-- -----------------------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

-- -----------------------------------------------------------------------------
-- users — 1:1 mirror of auth.users, holds app-level account state
-- -----------------------------------------------------------------------------
create table if not exists public.users (
  id uuid primary key references auth.users (id) on delete cascade,
  email text not null unique,
  display_name text,
  role text not null default 'user' check (role in ('user', 'admin')),
  is_active boolean not null default true,
  last_login_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.users is 'Application-level account record mirroring auth.users.';

create index if not exists users_role_idx on public.users (role);
create index if not exists users_created_at_idx on public.users (created_at desc);

drop trigger if exists users_set_updated_at on public.users;
create trigger users_set_updated_at
  before update on public.users
  for each row execute function public.set_updated_at();

-- -----------------------------------------------------------------------------
-- profiles — public-facing display fields, private by default
-- -----------------------------------------------------------------------------
create table if not exists public.profiles (
  id uuid primary key references public.users (id) on delete cascade,
  username text unique,
  full_name text,
  avatar_url text,
  bio text,
  date_of_birth date,
  country_code text,
  preferred_language_code text,
  is_public boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.profiles is 'Display profile for a PlexFin user. Only public profiles are readable by other users.';

create index if not exists profiles_username_idx on public.profiles (username);
create index if not exists profiles_is_public_idx on public.profiles (is_public);

drop trigger if exists profiles_set_updated_at on public.profiles;
create trigger profiles_set_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

-- -----------------------------------------------------------------------------
-- content — films and shows
-- Columns mirror ContentItem in src/data/types.ts.
-- -----------------------------------------------------------------------------
create table if not exists public.content (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title text not null,
  description text not null default '',
  logline text,
  content_type text not null default 'movie' check (content_type in ('movie', 'series', 'short')),
  release_year integer not null check (release_year between 1888 and 2200),
  -- Content age rating code: G, PG, PG-13, R, NC-17, TV-Y, TV-G, TV-PG, TV-14, TV-MA
  rating_code text not null default 'NR',
  duration_minutes integer check (duration_minutes is null or duration_minutes > 0),
  season_count integer check (season_count is null or season_count > 0),
  episode_count integer check (episode_count is null or episode_count > 0),
  thumbnail_url text,
  backdrop_url text,
  video_url text,
  trailer_url text,
  status text not null default 'published'
    check (status in ('draft', 'published', 'archived')),
  is_featured boolean not null default false,
  view_count bigint not null default 0,
  created_by uuid references public.users (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.content is 'Films and shows in the PlexFin catalog.';
comment on column public.content.slug is 'URL-safe identifier matching the frontend mock ids, e.g. the-last-lighthouse.';

create index if not exists content_release_year_idx on public.content (release_year desc);
create index if not exists content_content_type_idx on public.content (content_type);
create index if not exists content_rating_code_idx on public.content (rating_code);
create index if not exists content_status_idx on public.content (status);
create index if not exists content_created_by_idx on public.content (created_by);
create index if not exists content_is_featured_idx on public.content (is_featured) where is_featured;
create index if not exists content_title_trgm_idx on public.content using gin (title gin_trgm_ops);

drop trigger if exists content_set_updated_at on public.content;
create trigger content_set_updated_at
  before update on public.content
  for each row execute function public.set_updated_at();

-- -----------------------------------------------------------------------------
-- genres + content_genres — many-to-many join
-- -----------------------------------------------------------------------------
create table if not exists public.genres (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null unique,
  description text,
  created_at timestamptz not null default now()
);

create index if not exists genres_name_idx on public.genres (name);

create table if not exists public.content_genres (
  content_id uuid not null references public.content (id) on delete cascade,
  genre_id uuid not null references public.genres (id) on delete cascade,
  primary key (content_id, genre_id)
);

create index if not exists content_genres_genre_id_idx on public.content_genres (genre_id);

-- -----------------------------------------------------------------------------
-- languages
-- -----------------------------------------------------------------------------
create table if not exists public.languages (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  name text not null unique,
  created_at timestamptz not null default now()
);

create index if not exists languages_code_idx on public.languages (code);

create table if not exists public.content_languages (
  content_id uuid not null references public.content (id) on delete cascade,
  language_id uuid not null references public.languages (id) on delete cascade,
  is_primary boolean not null default false,
  primary key (content_id, language_id)
);

create index if not exists content_languages_language_id_idx on public.content_languages (language_id);

-- -----------------------------------------------------------------------------
-- ratings — one star rating per user per content item
-- -----------------------------------------------------------------------------
create table if not exists public.ratings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users (id) on delete cascade,
  content_id uuid not null references public.content (id) on delete cascade,
  rating smallint not null check (rating between 1 and 5),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, content_id)
);

create index if not exists ratings_content_id_idx on public.ratings (content_id);
create index if not exists ratings_user_id_idx on public.ratings (user_id);

drop trigger if exists ratings_set_updated_at on public.ratings;
create trigger ratings_set_updated_at
  before update on public.ratings
  for each row execute function public.set_updated_at();

-- -----------------------------------------------------------------------------
-- content_ratings — aggregate view of user ratings per content item
-- -----------------------------------------------------------------------------
create table if not exists public.content_ratings (
  content_id uuid primary key references public.content (id) on delete cascade,
  average_rating numeric(3, 2) not null default 0 check (average_rating between 0 and 5),
  rating_count integer not null default 0 check (rating_count >= 0),
  -- Denormalised counters kept for fast "trending" style sorting
  five_star_count integer not null default 0 check (five_star_count >= 0),
  four_star_count integer not null default 0 check (four_star_count >= 0),
  three_star_count integer not null default 0 check (three_star_count >= 0),
  two_star_count integer not null default 0 check (two_star_count >= 0),
  one_star_count integer not null default 0 check (one_star_count >= 0),
  updated_at timestamptz not null default now()
);

comment on table public.content_ratings is
  'Per-content aggregate of user ratings, recalculated by RPC get_content_ratings.';

create index if not exists content_ratings_average_rating_idx
  on public.content_ratings (average_rating desc);

drop trigger if exists content_ratings_set_updated_at on public.content_ratings;
create trigger content_ratings_set_updated_at
  before update on public.content_ratings
  for each row execute function public.set_updated_at();

-- -----------------------------------------------------------------------------
-- watch_history — playback progress per user per content item
-- -----------------------------------------------------------------------------
create table if not exists public.watch_history (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users (id) on delete cascade,
  content_id uuid not null references public.content (id) on delete cascade,
  progress_percent numeric(5, 2) not null default 0
    check (progress_percent between 0 and 100),
  position_seconds integer not null default 0 check (position_seconds >= 0),
  completed boolean not null default false,
  watch_count integer not null default 0 check (watch_count >= 0),
  first_watched_at timestamptz not null default now(),
  last_watched_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, content_id)
);

create index if not exists watch_history_content_id_idx on public.watch_history (content_id);
create index if not exists watch_history_user_id_idx on public.watch_history (user_id);
create index if not exists watch_history_user_id_last_watched_at_idx
  on public.watch_history (user_id, last_watched_at desc);
create index if not exists watch_history_user_id_completed_idx
  on public.watch_history (user_id, completed);

drop trigger if exists watch_history_set_updated_at on public.watch_history;
create trigger watch_history_set_updated_at
  before update on public.watch_history
  for each row execute function public.set_updated_at();

-- -----------------------------------------------------------------------------
-- reviews — one written review per user per content item
-- -----------------------------------------------------------------------------
create table if not exists public.reviews (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users (id) on delete cascade,
  content_id uuid not null references public.content (id) on delete cascade,
  rating smallint check (rating is null or rating between 1 and 5),
  title text,
  body text not null,
  is_spoiler boolean not null default false,
  helpful_count integer not null default 0 check (helpful_count >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, content_id)
);

create index if not exists reviews_content_id_idx on public.reviews (content_id);
create index if not exists reviews_user_id_idx on public.reviews (user_id);
create index if not exists reviews_content_id_created_at_idx
  on public.reviews (content_id, created_at desc);

drop trigger if exists reviews_set_updated_at on public.reviews;
create trigger reviews_set_updated_at
  before update on public.reviews
  for each row execute function public.set_updated_at();

-- -----------------------------------------------------------------------------
-- settings — one row per user, created alongside the account
-- -----------------------------------------------------------------------------
create table if not exists public.settings (
  user_id uuid primary key references public.users (id) on delete cascade,
  email_notifications boolean not null default true,
  push_notifications boolean not null default true,
  auto_play_next boolean not null default true,
  show_profile_to_others boolean not null default false,
  preferred_language text not null default 'en',
  playback_quality text not null default 'auto'
    check (playback_quality in ('auto', 'low', 'medium', 'high')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists settings_preferred_language_idx on public.settings (preferred_language);

drop trigger if exists settings_set_updated_at on public.settings;
create trigger settings_set_updated_at
  before update on public.settings
  for each row execute function public.set_updated_at();

-- Shared authorization checks used by RLS and Storage policies.
create or replace function public.is_active_user()
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.users where id = auth.uid() and is_active);
$$;

create or replace function public.is_media_admin()
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.users where id = auth.uid() and is_active and role = 'admin');
$$;


-- ============================================================================
-- Auth account bootstrap
-- Source: supabase/auth-setup.sql
-- ============================================================================

-- Create the app's public account rows when Supabase Auth creates a user.
-- Does not modify Supabase-managed auth configuration.

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.users (id, email, display_name)
  values (new.id, coalesce(new.email, ''), coalesce(new.raw_user_meta_data ->> 'display_name', new.raw_user_meta_data ->> 'name'))
  on conflict (id) do update set email = excluded.email;

  insert into public.profiles (id, username, full_name)
  values (new.id, nullif(new.raw_user_meta_data ->> 'username', ''), coalesce(new.raw_user_meta_data ->> 'full_name', new.raw_user_meta_data ->> 'name'))
  on conflict (id) do nothing;

  insert into public.settings (user_id) values (new.id) on conflict (user_id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();


-- ============================================================================
-- Catalog RPCs
-- Source: supabase/rpc.sql
-- ============================================================================

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
    'description', c.description,
    'logline', c.logline,
    'thumbnailUrl', c.thumbnail_url,
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


-- ============================================================================
-- Ratings and reviews RPCs
-- Source: supabase/rpc-ratings-reviews.sql
-- ============================================================================

-- Ratings and reviews functions accept the public content slug used by the UI.
create or replace function public.refresh_content_rating(p_content_id uuid)
returns void language plpgsql security definer set search_path = '' as $$
declare vals record;
begin
  select coalesce(avg(rating), 0)::numeric(3,2) as average_rating, count(*)::integer as rating_count,
    count(*) filter (where rating = 5)::integer as five_count,
    count(*) filter (where rating = 4)::integer as four_count,
    count(*) filter (where rating = 3)::integer as three_count,
    count(*) filter (where rating = 2)::integer as two_count,
    count(*) filter (where rating = 1)::integer as one_count
  into vals from public.ratings where content_id = p_content_id;
  insert into public.content_ratings(content_id, average_rating, rating_count, five_star_count, four_star_count, three_star_count, two_star_count, one_star_count)
  values (p_content_id, vals.average_rating, vals.rating_count, vals.five_count, vals.four_count, vals.three_count, vals.two_count, vals.one_count)
  on conflict (content_id) do update set average_rating = excluded.average_rating, rating_count = excluded.rating_count, five_star_count = excluded.five_star_count, four_star_count = excluded.four_star_count, three_star_count = excluded.three_star_count, two_star_count = excluded.two_star_count, one_star_count = excluded.one_star_count, updated_at = now();
end; $$;

create or replace function public.set_rating(p_content_slug text, p_rating smallint)
returns public.ratings language plpgsql security invoker set search_path = '' as $$
declare result public.ratings; content_uuid uuid;
begin
  if auth.uid() is null then raise exception 'Sign in to rate content'; end if;
  if p_rating < 1 or p_rating > 5 then raise exception 'Rating must be from 1 to 5'; end if;
  select id into content_uuid from public.content where slug = p_content_slug and status = 'published';
  if content_uuid is null then raise exception 'Content not found'; end if;
  insert into public.ratings (user_id, content_id, rating) values (auth.uid(), content_uuid, p_rating)
  on conflict (user_id, content_id) do update set rating = excluded.rating, updated_at = now() returning * into result;
  perform public.refresh_content_rating(content_uuid);
  return result;
end; $$;

create or replace function public.get_user_rating(p_content_slug text)
returns smallint language sql stable security invoker set search_path = '' as $$
  select r.rating from public.ratings r join public.content c on c.id = r.content_id
  where r.user_id = auth.uid() and c.slug = p_content_slug;
$$;

create or replace function public.get_content_ratings(p_content_slug text)
returns table(average_rating numeric, rating_count bigint) language sql stable security invoker set search_path = '' as $$
  select coalesce(avg(r.rating), 0)::numeric, count(*) from public.ratings r join public.content c on c.id = r.content_id where c.slug = p_content_slug;
$$;

create or replace function public.set_review(p_content_slug text, p_body text, p_title text default null, p_is_spoiler boolean default false)
returns public.reviews language plpgsql security invoker set search_path = '' as $$
declare result public.reviews; content_uuid uuid;
begin
  if auth.uid() is null then raise exception 'Sign in to review content'; end if;
  if nullif(trim(p_body), '') is null then raise exception 'Review text is required'; end if;
  select id into content_uuid from public.content where slug = p_content_slug and status = 'published';
  if content_uuid is null then raise exception 'Content not found'; end if;
  insert into public.reviews (user_id, content_id, body, title, is_spoiler) values (auth.uid(), content_uuid, trim(p_body), p_title, p_is_spoiler)
  on conflict (user_id, content_id) do update set body = excluded.body, title = excluded.title, is_spoiler = excluded.is_spoiler, updated_at = now() returning * into result;
  return result;
end; $$;

create or replace function public.get_content_reviews(p_content_slug text, p_page integer default 1, p_page_size integer default 20)
returns setof public.reviews language sql stable security invoker set search_path = '' as $$
  select r.* from public.reviews r join public.content c on c.id = r.content_id where c.slug = p_content_slug
  order by r.created_at desc limit least(greatest(p_page_size, 1), 100) offset (greatest(p_page, 1) - 1) * least(greatest(p_page_size, 1), 100);
$$;


-- ============================================================================
-- Watch-history RPCs
-- Source: supabase/rpc-watch-history.sql
-- ============================================================================

-- Watch history functions use catalog slugs at the API boundary.
create or replace function public.start_watch_history(p_content_slug text)
returns uuid language plpgsql security invoker set search_path = '' as $$
declare result_id uuid; content_uuid uuid;
begin
  if auth.uid() is null then raise exception 'Sign in to record watch history'; end if;
  select id into content_uuid from public.content where slug = p_content_slug and status = 'published';
  if content_uuid is null then raise exception 'Content not found'; end if;
  insert into public.watch_history (user_id, content_id, watch_count, progress_percent, position_seconds, completed)
  values (auth.uid(), content_uuid, 1, 0, 0, false)
  on conflict (user_id, content_id) do update set watch_count = public.watch_history.watch_count + 1, completed = false, progress_percent = 0, position_seconds = 0, last_watched_at = now()
  returning id into result_id;
  return result_id;
end; $$;

create or replace function public.update_watch_progress(p_content_slug text, p_progress_percent numeric, p_position_seconds integer)
returns void language plpgsql security invoker set search_path = '' as $$
begin
  if p_progress_percent < 0 or p_progress_percent > 100 or p_position_seconds < 0 then raise exception 'Invalid playback progress'; end if;
  update public.watch_history w set progress_percent = p_progress_percent, position_seconds = p_position_seconds, completed = p_progress_percent >= 95, last_watched_at = now()
  from public.content c where w.content_id = c.id and c.slug = p_content_slug and w.user_id = auth.uid();
  if not found then raise exception 'Watch history not found'; end if;
end; $$;

create or replace function public.get_watch_history()
returns table(id uuid, content_slug text, progress_percent numeric, position_seconds integer, completed boolean, last_watched_at timestamptz)
language sql stable security invoker set search_path = '' as $$
  select w.id, c.slug, w.progress_percent, w.position_seconds, w.completed, w.last_watched_at
  from public.watch_history w join public.content c on c.id = w.content_id where w.user_id = auth.uid() order by w.last_watched_at desc;
$$;


-- ============================================================================
-- Row-level security
-- Source: supabase/rls.sql
-- ============================================================================

-- Row-level security for the tables created by schema.sql.
-- Run after schema.sql and auth-setup.sql.
-- Remove names used by the first draft so old permissive rules do not stack.
drop policy if exists content_select on public.content;
drop policy if exists genres_select on public.genres;
drop policy if exists languages_select on public.languages;
drop policy if exists ratings_select on public.ratings;
drop policy if exists watch_history_user on public.watch_history;
drop policy if exists reviews_user on public.reviews;
drop policy if exists settings_user on public.settings;
drop policy if exists profiles_select on public.profiles;
drop policy if exists content_admin on public.content;
drop policy if exists content_ratings_user on public.content_ratings;

drop policy if exists users_select_self on public.users;
drop policy if exists profiles_select_public_or_self on public.profiles;
drop policy if exists profiles_update_self on public.profiles;
drop policy if exists content_read_published on public.content;
drop policy if exists content_admin_manage on public.content;
drop policy if exists genres_read on public.genres;
drop policy if exists content_genres_read on public.content_genres;
drop policy if exists languages_read on public.languages;
drop policy if exists content_languages_read on public.content_languages;
drop policy if exists ratings_read on public.ratings;
drop policy if exists ratings_manage_self on public.ratings;
drop policy if exists content_ratings_read on public.content_ratings;
drop policy if exists watch_history_manage_self on public.watch_history;
drop policy if exists reviews_read on public.reviews;
drop policy if exists reviews_manage_self on public.reviews;
drop policy if exists settings_manage_self on public.settings;

do $$ declare t text; begin
  foreach t in array array['users','profiles','content','genres','content_genres','languages','content_languages','ratings','content_ratings','watch_history','reviews','settings'] loop
    execute format('alter table public.%I enable row level security', t);
  end loop;
end $$;

create policy users_select_self on public.users for select to authenticated using (id = (select auth.uid()));
create policy profiles_select_public_or_self on public.profiles for select to authenticated using (is_public or id = (select auth.uid()));
create policy profiles_update_self on public.profiles for update to authenticated using (id = (select auth.uid())) with check (id = (select auth.uid()));
create policy content_read_published on public.content for select to anon, authenticated using (status = 'published');
create policy content_admin_manage on public.content for all to authenticated using (public.is_media_admin()) with check (public.is_media_admin());
create policy genres_read on public.genres for select to anon, authenticated using (true);
create policy content_genres_read on public.content_genres for select to anon, authenticated using (true);
create policy languages_read on public.languages for select to anon, authenticated using (true);
create policy content_languages_read on public.content_languages for select to anon, authenticated using (true);
create policy ratings_read on public.ratings for select to anon, authenticated using (true);
create policy ratings_manage_self on public.ratings for all to authenticated using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
create policy content_ratings_read on public.content_ratings for select to anon, authenticated using (true);
create policy watch_history_manage_self on public.watch_history for all to authenticated using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
create policy reviews_read on public.reviews for select to anon, authenticated using (true);
create policy reviews_manage_self on public.reviews for all to authenticated using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
create policy settings_manage_self on public.settings for all to authenticated using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));


-- ============================================================================
-- Storage buckets and policies
-- Source: supabase/storage-setup.sql
-- ============================================================================

-- Storage buckets and policies. Uploads should use the Supabase Storage SDK.
-- Remove policies from the earlier setup draft.
drop policy if exists videos_insert on storage.objects;
drop policy if exists videos_select on storage.objects;
drop policy if exists thumbnails_insert on storage.objects;
drop policy if exists thumbnails_select on storage.objects;
-- Video files are private; thumbnail assets are publicly readable.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('videos', 'videos', false, 524288000, array['video/mp4','video/webm','video/quicktime','video/x-matroska'])
on conflict (id) do update set public = excluded.public, file_size_limit = excluded.file_size_limit, allowed_mime_types = excluded.allowed_mime_types;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('thumbnails', 'thumbnails', true, 10485760, array['image/jpeg','image/png','image/webp','image/avif'])
on conflict (id) do update set public = excluded.public, file_size_limit = excluded.file_size_limit, allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists videos_admin_insert on storage.objects;
create policy videos_admin_insert on storage.objects for insert to authenticated with check (bucket_id = 'videos' and public.is_media_admin());
drop policy if exists videos_admin_update on storage.objects;
create policy videos_admin_update on storage.objects for update to authenticated using (bucket_id = 'videos' and public.is_media_admin()) with check (bucket_id = 'videos' and public.is_media_admin());
drop policy if exists videos_active_read on storage.objects;
create policy videos_active_read on storage.objects for select to authenticated using (bucket_id = 'videos' and public.is_active_user());
drop policy if exists thumbnails_admin_insert on storage.objects;
create policy thumbnails_admin_insert on storage.objects for insert to authenticated with check (bucket_id = 'thumbnails' and public.is_media_admin());
drop policy if exists thumbnails_admin_update on storage.objects;
create policy thumbnails_admin_update on storage.objects for update to authenticated using (bucket_id = 'thumbnails' and public.is_media_admin()) with check (bucket_id = 'thumbnails' and public.is_media_admin());
drop policy if exists thumbnails_public_read on storage.objects;
create policy thumbnails_public_read on storage.objects for select to anon, authenticated using (bucket_id = 'thumbnails');
