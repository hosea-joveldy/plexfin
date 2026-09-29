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
