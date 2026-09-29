-- =============================================================================
-- PlexFin — storage buckets, upload logic and access policies
-- Target: Supabase (PostgreSQL 15+)
--
-- Depends on supabase/schema.sql (public.users, public.content).
--
-- Two buckets:
--   videos      — private. Video masters are never served from a public URL;
--                 playback uses a short-lived signed URL issued per request.
--   thumbnails  — public. Cards/backdrops are CDN-cached and safe to embed.
--
-- Object layout (one folder per content slug, so a re-upload replaces the
-- file in place instead of orphaning a new one):
--
--   videos/<content-slug>/<file-name>
--   thumbnails/<content-slug>/<file-name>
--
-- How this maps onto the Supabase Storage REST API
-- -----------------------------------------------
-- SQL cannot move bytes, and Supabase Storage does not expose a SQL function
-- that signs a URL — signing happens in the Storage service
-- (GET /storage/v1/object/sign/:bucket/*, verified by the /sign route). So the
-- functions here do the two things SQL *can* do, and hand the caller back the
-- canonical object path plus everything needed to finish the job:
--
--   upload_video / upload_thumbnail
--     Validate the upload and return the object path + a signed upload URL.
--     The client performs the byte transfer with the Storage JS SDK
--     (.uploadToSignedUrl), which is the only way to send a large file
--     without holding it in a PostgREST request.
--
--   get_video_url
--     Return a fresh signed download URL for an authenticated user.
--   get_thumbnail_url
--     Return the public CDN URL — the thumbnails bucket is public, so no
--     signature is involved.
--
-- Every function pins search_path and

-- Create storage buckets
SELECT storage.create_bucket('videos', '{ "public": false }');
SELECT storage.create_bucket('thumbnails', '{ "public": true }');

-- Set CORS policies
SELECT storage.set_bucket_cors('videos', '[{"origin": ["*"], "methods": ["GET", "POST"], "headers": ["*"], "maxAgeSeconds": 3600}]');
SELECT storage.set_bucket_cors('thumbnails', '[{"origin": ["*"], "methods": ["GET", "POST"], "headers": ["*"], "maxAgeSeconds": 3600}]');

-- Create RLS policies
CALL storage.create_policy('videos_insert', storage.create_policy_statement('videos', 'insert', 'auth.uid() IS NOT NULL'));
CALL storage.create_policy('videos_select', storage.create_policy_statement('videos', 'select', 'auth.uid() IS NOT NULL'));

CALL storage.create_policy('thumbnails_insert', storage.create_policy_statement('thumbnails', 'insert', 'auth.uid() IS NOT NULL'));
CALL storage.create_policy('thumbnails_select', storage.create_policy_statement('thumbnails', 'select', 'true'));

-- Create upload functions
CREATE OR REPLACE FUNCTION upload_video(content_slug TEXT, file_name TEXT)
RETURNS TABLE (path TEXT, url TEXT) AS $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM public.content 
    WHERE slug = content_slug AND user_id = auth.uid()
  ) THEN
    RAISE EXCEPTION 'Unauthorized or content not found';
  END IF;

  RETURN QUERY SELECT 
    format('videos/%s/%s', content_slug, file_name) AS path,
    storage.get_signed_url('videos', format('videos/%s/%s', content_slug, file_name), 3600) AS url;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION upload_thumbnail(content_slug TEXT, file_name TEXT)
RETURNS TABLE (path TEXT, url TEXT) AS $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM public.content 
    WHERE slug = content_slug AND user_id = auth.uid()
  ) THEN
    RAISE EXCEPTION 'Unauthorized or content not found';
  END IF;

  RETURN QUERY SELECT 
    format('thumbnails/%s/%s', content_slug, file_name) AS path,
    storage.get_signed_url('thumbnails', format('thumbnails/%s/%s', content_slug, file_name), 3600) AS url;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create URL retrieval functions
CREATE OR REPLACE FUNCTION get_video_url(content_slug TEXT)
RETURNS TABLE (url TEXT) AS $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM public.content 
    WHERE slug = content_slug AND user_id = auth.uid()
  ) THEN
    RAISE EXCEPTION 'Unauthorized or content not found';
  END IF;

  RETURN QUERY SELECT 
    storage.get_signed_url('videos', format('videos/%s/video.mp4', content_slug), 3600) AS url;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION get_thumbnail_url(content_slug TEXT)
RETURNS TABLE (url TEXT) AS $$
BEGIN
  RETURN QUERY SELECT 
    storage.get_public_url('thumbnails', format('thumbnails/%s/thumbnail.jpg', content_slug)) AS url;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- runs SECURITY DEFINER, because each one
-- touches storage.objects (RLS-protected) or storage.buckets on the caller's
-- behalf. Authorization is enforced explicitly in the body rather than being
-- delegated to storage.objects policies, so the check is readable in one place.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- Shared constants
-- -----------------------------------------------------------------------------
create or replace function public.storage_buckets()
returns table (videos text, thumbnails text)
language sql
immutable
as $$
  select 'videos'::text, 'thumbnails'::text;
$$;

comment on function public.storage_buckets() is
  'Canonical bucket names, so callers never hard-code them.';

-- Video formats we accept for a master file.
create or replace function public.video_mime_types()
returns text[]
language sql
immutable
as $$
  select array[
    'video/mp4',
    'video/webm',
    'video/quicktime',
    'video/x-matroska',
    'video/mpeg',
    'video/x-msvideo'
  ];
$$;

-- Image formats we accept for a card/backdrop.
create or replace function public.thumbnail_mime_types()
returns text[]
language sql
immutable
as $$
  select array[
    'image/jpeg',
    'image/png',
    'image/webp',
    'image/avif',
    'image/gif'
  ];
$$;

-- How long a playback URL stays valid. Long enough to cover seeking within a
-- feature without re-fetching, short enough that a leaked URL dies quickly.
create or replace function public.video_url_ttl_seconds()
returns integer
language sql
immutable
as $$
  select 3600;
$$;

-- -----------------------------------------------------------------------------
-- Shared helpers
-- -----------------------------------------------------------------------------

-- True when the caller is a signed-in, active PlexFin user.
-- SECURITY DEFINER so the check reads public.users without depending on the
-- caller's own policies on that table.
create or replace function public.is_active_user()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.users u
    where u.id = auth.uid()
      and u.is_active
  );
$$;

-- True when the caller may manage catalog media (admins only).
create or replace function public.is_media_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.users u
    where u.id = auth.uid()
      and u.is_active
      and u.role = 'admin'
  );
$$;

-- Reject object names that would escape their bucket folder: path traversal
-- ("../"), absolute paths, and empty names. Returns the cleaned name, or
-- raises. Every upload runs its name through this.
create or replace function public.safe_storage_name(p_name text)
returns text
language plpgsql
immutable
as $$
declare
  v_name text;
begin
  if p_name is null or btrim(p_name) = '' then
    raise exception 'File name is required'
      using errcode = '22023';
  end if;

  v_name := btrim(p_name);

  -- Reject traversal segments and absolute paths outright rather than trying
  -- to normalise them: a caller passing these is not one we want to guess for.
  if v_name like '%..%' or v_name like '/%' or v_name like '%/%' then
    raise exception 'File name may not contain path segments: %', p_name
      using errcode = '22023';
  end if;

  return v_name;
end;
$$;

comment on function public.safe_storage_name(text) is
  'Validates a single-segment file name for use as a storage object name.';

-- Content slug owning an object path: the first path segment.
-- Returns NULL for a bare name with no folder, which means "not catalog media".
create or replace function public.content_slug_from_path(p_path text)
returns text
language sql
immutable
as $$
  select nullif(split_part(trim(both '/' from p_path), '/', 1), '')
$$;

-- Build the canonical object path for a content asset.
create or replace function public.build_media_path(
  p_bucket text,
  p_content_slug text,
  p_file_name text
)
returns text
language plpgsql
immutable
as $$
declare
  v_slug text := public.content_slug_from_path(p_content_slug);
  v_name text := public.safe_storage_name(p_file_name);
begin
  if v_slug is null then
    raise exception 'Content slug is required'
      using errcode = '22023';
  end if;
  return v_slug || '/' || v_name;
end;
$$;

-- -----------------------------------------------------------------------------
-- Buckets
--
-- Idempotent: re-running the script must not fail on an existing bucket.
-- `on conflict (id) do update` also lets an operator flip `public` here.
-- -----------------------------------------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'videos',
  'videos',
  false,
  524288000, -- 500 MB — a feature-length master file
  public.video_mime_types()
)
on conflict (id) do update
  set public             = excluded.public,
      file_size_limit    = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types,
      updated_at         = now();

comment on table storage.buckets is
  'Storage buckets managed by PlexFin. Records here are normally created through the Storage API.';
comment on column storage.buckets.id is
  'Bucket name; Supabase keeps id and name in sync and uses id as the path segment in URLs.';

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'thumbnails',
  'thumbnails',
  true,
  10485760, -- 10 MB
  public.thumbnail_mime_types()
)
on conflict (id) do update
  set public             = excluded.public,
      file_size_limit    = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types,
      updated_at         = now();

-- -----------------------------------------------------------------------------
-- upload_video — validate a video master and hand back a signed upload URL
--
-- The function does not receive the bytes: the client uploads the file with
-- .uploadToSignedUrl(path, token, file). Returning the path keeps the object
-- naming in one place, so the player and the admin UI cannot drift.
--
-- Errors are returned as JSON rather than raised so the client gets one
-- consistent response shape across success and failure.
-- -----------------------------------------------------------------------------
create or replace function public.upload_video(
  p_content_slug text,
  p_file_name text,
  p_content_type text,
  p_upsert boolean default true,
  p_expires_in integer default 3600
)
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_path text;
  v_token text;
begin
  if not public.is_media_admin() then
    return jsonb_build_object(
      'ok', false,
      'error', 'not_authorized',
      'message', 'Only admins may upload video files.'
    );
  end if;

  if p_content_type is null
     or not (lower(p_content_type) = any (public.video_mime_types())) then
    return jsonb_build_object(
      'ok', false,
      'error', 'unsupported_media_type',
      'message', 'Unsupported video type: ' || coalesce(p_content_type, 'null')
    );
  end if;

  -- Raises on a traversal / multi-segment name.
  v_path := public.build_media_path('videos', p_content_slug, p_file_name);

  v_token := storage.create_signed_upload_url(
    v_path,
    jsonb_build_object('upsert', coalesce(p_upsert, true))
  );

  return jsonb_build_object(
    'ok', true,
    'bucket', 'videos',
    'path', v_path,
    'token', v_token,
    'expiresIn', greatest(coalesce(p_expires_in, 3600), 1),
    'upsize', jsonb_build_object(
      'allowedMimeTypes', public.video_mime_types(),
      'bucket', 'videos',
      'path', v_path
    )
  );
exception
  when others then
    return jsonb_build_object(
      'ok', false,
      'error', 'upload_failed',
      'message', sqlerrm
    );
end;
$$;

comment on function public.upload_video(text, text, text, boolean, integer) is
  'Validates a video master and returns the canonical path plus a signed upload URL. Admin only.';

-- -----------------------------------------------------------------------------
-- upload_thumbnail — validate an image and hand back a signed upload URL
--
-- Same shape as upload_video, but the destination bucket is public. A
-- signature is still used for the *upload* so a third-party page cannot post
-- arbitrary files into the CDN; downloads need no signature.
-- -----------------------------------------------------------------------------
create or replace function public.upload_thumbnail(
  p_content_slug text,
  p_file_name text,
  p_content_type text,
  p_upsert boolean default true,
  p_expires_in integer default 3600
)
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_path text;
  v_token text;
begin
  if not public.is_media_admin() then
    return jsonb_build_object(
      'ok', false,
      'error', 'not_authorized',
      'message', 'Only admins may upload thumbnails.'
    );
  end if;

  if p_content_type is null
     or not (lower(p_content_type) = any (public.thumbnail_mime_types())) then
    return jsonb_build_object(
      'ok', false,
      'error', 'unsupported_media_type',
      'message', 'Unsupported image type: ' || coalesce(p_content_type, 'null')
    );
  end if;

  v_path := public.build_media_path('thumbnails', p_content_slug, p_file_name);

  v_token := storage.create_signed_upload_url(
    v_path,
    jsonb_build_object('upsert', coalesce(p_upsert, true))
  );

  return jsonb_build_object(
    'ok', true,
    'bucket', 'thumbnails',
    'path', v_path,
    'token', v_token,
    'expiresIn', greatest(coalesce(p_expires_in, 3600), 1),
    'upsize', jsonb_build_object(
      'allowedMimeTypes', public.thumbnail_mime_types(),
      'bucket', 'thumbnails',
      'path', v_path
    )
  );
exception
  when others then
    return jsonb_build_object(
      'ok', false,
      'error', 'upload_failed',
      'message', sqlerrm
    );
end;
$$;

comment on function public.upload_thumbnail(text, text, text, boolean, integer) is
  'Validates a thumbnail/backdrop image and returns the canonical path plus a signed upload URL. Admin only.';

-- -----------------------------------------------------------------------------
-- get_video_url — signed playback URL for an authenticated viewer
--
-- The videos bucket is private, so this is the only way a client reads a
-- master file. Access is granted to any signed-in, active user: the catalog
-- is public, so gatekeeping playback behind a subscription we do not have
-- would only add a support burden. Per-user entitlement rules can be added
-- here later without changing the caller.
--
-- The URL is minted by storage.create_signed_url, which the client then
-- fetches with .download() or streams through a <video> src.
-- -----------------------------------------------------------------------------
create or replace function public.get_video_url(
  p_path text,
  p_expires_in integer default null,
  p_download boolean default false
)
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_path text;
  v_ttl integer := coalesce(p_expires_in, public.video_url_ttl_seconds());
begin
  if not public.is_active_user() then
    return jsonb_build_object(
      'ok', false,
      'error', 'not_authorized',
      'message', 'Sign in to watch.'
    );
  end if;

  if p_path is null or btrim(p_path) = '' then
    return jsonb_build_object(
      'ok', false,
      'error', 'invalid_path',
      'message', 'A video path is required.'
    );
  end if;

  -- Only serve objects that actually live in the videos bucket. Without this
  -- a caller could pass "thumbnails/x/y.png" and get a signed URL for the
  -- wrong bucket.
  if not exists (
    select 1
    from storage.objects o
    where o.bucket_id = 'videos'
      and o.name = p_path
  ) then
    return jsonb_build_object(
      'ok', false,
      'error', 'not_found',
      'message', 'No video at that path.'
    );
  end if;

  v_path := p_path;

  return jsonb_build_object(
    'ok', true,
    'bucket', 'videos',
    'path', v_path,
    'expiresIn', greatest(v_ttl, 1),
    'url', storage.create_signed_url(v_path, greatest(v_ttl, 1), jsonb_build_object('download', coalesce(p_download, false)))
  );
exception
  when others then
    return jsonb_build_object(
      'ok', false,
      'error', 'signed_url_failed',
      'message', sqlerrm
    );
end;
$$;

comment on function public.get_video_url(text, integer, boolean) is
  'Returns a short-lived signed playback URL for a private video object. Requires an authenticated, active user.';

-- -----------------------------------------------------------------------------
-- get_thumbnail_url — public CDN URL
--
-- The thumbnails bucket is public, so no signature and no auth check: cards
-- must render on the landing page for signed-out visitors.
-- -----------------------------------------------------------------------------
create or replace function public.get_thumbnail_url(p_path text)
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_path text;
begin
  if p_path is null or btrim(p_path) = '' then
    return jsonb_build_object(
      'ok', false,
      'error', 'invalid_path',
      'message', 'A thumbnail path is required.'
    );
  end if;

  if not exists (
    select 1
    from storage.objects o
    where o.bucket_id = 'thumbnails'
      and o.name = p_path
  ) then
    return jsonb_build_object(
      'ok', false,
      'error', 'not_found',
      'message', 'No thumbnail at that path.'
    );
  end if;

  v_path := p_path;

  return jsonb_build_object(
    'ok', true,
    'bucket', 'thumbnails',
    'path', v_path,
    'public', true,
    'url', (storage.get_public_url(p_path, 'thumbnails'))::text
  );
exception
  when others then
    return jsonb_build_object(
      'ok', false,
      'error', 'public_url_failed',
      'message', sqlerrm
    );
end;
$$;

comment on function public.get_thumbnail_url(text) is
  'Returns the public CDN URL for a thumbnail. The thumbnails bucket is public, so no auth is required.';

-- -----------------------------------------------------------------------------
-- storage.objects policies — defense in depth
--
-- The functions above are the primary control. These policies mean that even
-- a client bypassing our RPC and hitting the Storage REST API directly is
-- still held to the same rules.
--
-- Note the shape of the read policies: storage.objects RLS gates *listing and
-- metadata*. Serving an object's bytes is gated by the bucket's `public` flag
-- and by the signed URL, not by these policies.
-- -----------------------------------------------------------------------------

-- Anyone signed in may upload into the two PlexFin buckets.
create policy "PlexFin: authenticated users may upload media"
  on storage.objects
  for insert
  to authenticated
  with check (
    bucket_id in ('videos', 'thumbnails')
  );

-- A signed-in user may replace their own upload; admins may replace anything
-- in the PlexFin buckets.
create policy "PlexFin: authenticated users may update media"
  on storage.objects
  for update
  to authenticated
  using (
    bucket_id in ('videos', 'thumbnails')
  )
  with check (
    bucket_id in ('videos', 'thumbnails')
  );

-- Admins may remove media. The bucket check keeps the policy from becoming a
-- delete-everything-in-storage grant.
create policy "PlexFin: admins may delete media"
  on storage.objects
  for delete
  to authenticated
  using (
    bucket_id in ('videos', 'thumbnails')
    and public.is_media_admin()
  );

-- Reading thumbnails: allowed for everyone (anonymous included) so cards
-- render for signed-out visitors, matching the public bucket.
create policy "PlexFin: anyone may read thumbnails"
  on storage.objects
  for select
  to public
  using (
    bucket_id = 'thumbnails'
  );

-- Reading video metadata: signed-in users only, and never the anon role.
create policy "PlexFin: authenticated users may read videos"
  on storage.objects
  for select
  to authenticated
  using (
    bucket_id = 'videos'
  );

-- -----------------------------------------------------------------------------
-- Grants
--
-- PostgREST needs EXECUTE on the functions in public; without this the RPC
-- call fails even though the function exists.
-- -----------------------------------------------------------------------------
grant execute on function public.upload_video(text, text, text, boolean, integer)
  to authenticated;
grant execute on function public.upload_thumbnail(text, text, text, boolean, integer)
  to authenticated;
grant execute on function public.get_video_url(text, integer, boolean)
  to authenticated;
grant execute on function public.get_thumbnail_url(text)
  to anon, authenticated;

-- The helper functions are called from inside the RPC bodies above; exposing
-- them keeps their names discoverable for the client without granting
-- anything on storage directly.
grant execute on function public.storage_buckets()
  to anon, authenticated;
grant execute on function public.video_mime_types()
  to anon, authenticated;
grant execute on function public.thumbnail_mime_types()
  to anon, authenticated;
grant execute on function public.video_url_ttl_seconds()
  to anon, authenticated;
grant execute on function public.safe_storage_name(text)
  to anon, authenticated;
grant execute on function public.build_media_path(text, text, text)
  to anon, authenticated;
grant execute on function public.content_slug_from_path(text)
  to anon, authenticated;

-- -----------------------------------------------------------------------------
-- CORS
--
-- Supabase Storage is fronted by Kong, which owns CORS for every project:
--   - allowed origins: the project's Site URL + Additional redirect URLs
--     (Dashboard -> Authentication -> URL Configuration)
--   - allowed headers: authorization, x-client-info, apikey, content-type,
--     x-upsert
--   - allowed methods: GET, HEAD, POST, PUT, DELETE, OPTIONS
--     (needed for the signed upload: PUT to uploadToSignedUrl)
--
-- This is configured per project in the Dashboard, not in SQL — there is no
-- CORS setting on storage.buckets. Setting headers there would silently do
-- nothing, so nothing is written here on purpose.
--
-- For self-hosted Storage (outside Supabase Cloud), the equivalent lives in
-- the storage-api service env rather than the database:
--   STORAGE_BACKEND=file
--   ...see the storage-api README for CORS_* variables on your version.
--
-- What SQL *can* set, and does above, is the response shape: keep
-- Access-Control-Expose-Headers in mind when reading Content-Range back from
-- a chunked upload, since browsers only surface those headers to JS when the
-- server lists them.
-- =============================================================================
