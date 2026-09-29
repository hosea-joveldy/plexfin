-- supabase/rpc-ratings-reviews.sql
-- RPC functions for ratings and reviews


-- Create a new rating for content (1-5 stars)
create or replace function create_rating(
  user_id uuid,
  content_id uuid,
  rating int
)
returns content_ratings
language plpgsql
security invoker
as $$
begin
  -- Ensure rating is between 1 and 5
  if rating < 1 or rating > 5 then
    raise exception 'Rating must be between 1 and 5';
  end if;

  -- Check if user already rated this content
  if exists (
    select 1 from content_ratings
    where user_id = create_rating.user_id
      and content_id = create_rating.content_id
  ) then
    raise exception 'User already rated this content';
  end if;

  insert into content_ratings (user_id, content_id, rating)
  values (user_id, content_id, rating)
  returning *;
end;
$$;


-- Update existing rating
create or replace function update_rating(
  user_id uuid,
  content_id uuid,
  new_rating int
)
returns content_ratings
language plpgsql
security invoker
as $$
begin
  if new_rating < 1 or new_rating > 5 then
    raise exception 'Rating must be between 1 and 5';
  end if;

  update content_ratings
  set rating = new_rating,
      updated_at = now()
  where user_id = update_rating.user_id
    and content_id = update_rating.content_id
  returning *;
end;
$$;


-- Delete a rating
create or replace function delete_rating(
  user_id uuid,
  content_id uuid
)
returns content_ratings
language plpgsql
security invoker
as $$
delete from content_ratings
where user_id = delete_rating.user_id
  and content_id = delete_rating.content_id
returning *;
$$;


-- Get user's rating for specific content
create or replace function get_user_rating(
  user_id uuid,
  content_id uuid
)
returns content_ratings
language sql
security invoker
as $$
select * from content_ratings
where user_id = get_user_rating.user_id
  and content_id = get_user_rating.content_id;
$$;


-- Create a new review
create or replace function create_review(
  user_id uuid,
  content_id uuid,
  review_text text
)
returns reviews
language plpgsql
security invoker
as $$
begin
  -- Check if user already reviewed this content
  if exists (
    select 1 from reviews
    where user_id = create_review.user_id
      and content_id = create_review.content_id
  ) then
    raise exception 'User already reviewed this content';
  end if;

  insert into reviews (user_id, content_id, review_text)
  values (user_id, content_id, review_text)
  returning *;
end;
$$;


-- Update existing review
create or replace function update_review(
  review_id uuid,
  new_review_text text
)
returns reviews
language plpgsql
security invoker
as $$
update reviews
set review_text = new_review_text,
    updated_at = now()
where id = update_review.review_id
  returning *;
$$;


-- Delete a review
create or replace function delete_review(
  review_id uuid
)
returns reviews
language plpgsql
security invoker
as $$
delete from reviews
where id = delete_review.review_id
returning *;
$$;


-- Get user's review for specific content
create or replace function get_user_review(
  user_id uuid,
  content_id uuid
)
returns reviews
language sql
security invoker
as $$
select * from reviews
where user_id = get_user_review.user_id
  and content_id = get_user_review.content_id;
$$;


-- Get aggregated ratings for content
create or replace function get_content_ratings(
  c_id uuid
)
returns table (average_rating numeric, rating_count int)
language sql
security invoker
as $$
select
  avg(rating) as average_rating,
  count(*) as rating_count
from content_ratings
where content_id = c_id;
$$;


-- Get paginated reviews for content
create or replace function get_content_reviews(
  c_id uuid,
  page int,
  per_page int
)
returns reviews
language plpgsql
security invoker
as $$
begin
  return query
  select * from reviews
  where content_id = c_id
  order by created_at desc
  offset (page - 1) * per_page
  limit per_page;
end;
$$;
