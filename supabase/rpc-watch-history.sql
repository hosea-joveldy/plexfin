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
  on conflict (user_id, content_id) do update set
    watch_count = public.watch_history.watch_count + 1,
    progress_percent = case when public.watch_history.completed then 0 else public.watch_history.progress_percent end,
    position_seconds = case when public.watch_history.completed then 0 else public.watch_history.position_seconds end,
    completed = false, last_watched_at = now()
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
