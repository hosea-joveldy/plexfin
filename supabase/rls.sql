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
drop policy if exists watchlist_user on public.watchlist;
drop policy if exists genres_admin_manage on public.genres;
drop policy if exists content_genres_admin_manage on public.content_genres;
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
drop policy if exists watchlist_manage_self on public.watchlist;
drop policy if exists genres_admin_manage on public.genres;
drop policy if exists content_genres_admin_manage on public.content_genres;

do $$ declare t text; begin
  foreach t in array array['users','profiles','content','genres','content_genres','languages','content_languages','ratings','content_ratings','watch_history','watchlist','reviews','settings'] loop
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
create policy genres_admin_manage on public.genres for all to authenticated using (public.is_media_admin()) with check (public.is_media_admin());
create policy content_genres_admin_manage on public.content_genres for all to authenticated using (public.is_media_admin()) with check (public.is_media_admin());
create policy languages_read on public.languages for select to anon, authenticated using (true);
create policy content_languages_read on public.content_languages for select to anon, authenticated using (true);
create policy ratings_read on public.ratings for select to anon, authenticated using (true);
create policy ratings_manage_self on public.ratings for all to authenticated using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
create policy content_ratings_read on public.content_ratings for select to anon, authenticated using (true);
create policy watch_history_manage_self on public.watch_history for all to authenticated using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
create policy reviews_read on public.reviews for select to anon, authenticated using (true);
create policy reviews_manage_self on public.reviews for all to authenticated using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
create policy settings_manage_self on public.settings for all to authenticated using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
create policy watchlist_manage_self on public.watchlist for all to authenticated using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
