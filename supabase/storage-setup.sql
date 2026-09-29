-- Storage buckets and policies. Uploads should use the Supabase Storage SDK.
-- Remove policies from the earlier setup draft.
drop policy if exists videos_insert on storage.objects;
drop policy if exists videos_select on storage.objects;
drop policy if exists thumbnails_insert on storage.objects;
drop policy if exists thumbnails_select on storage.objects;
-- Video files are private; thumbnail assets are publicly readable.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('videos', 'videos', false, 1500000000, array['video/mp4','video/webm','video/quicktime','video/x-matroska'])
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
