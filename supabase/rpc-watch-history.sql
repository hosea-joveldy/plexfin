-- Supabase RPC functions for watch history tracking

-- Create or update watch history entry when starting to watch content
CREATE OR REPLACE FUNCTION start_watch_history(
    user_id uuid,
    content_id uuid,
    OUT watch_history_id uuid
) RETURNS uuid AS $$
DECLARE
    existing_entry uuid;
BEGIN
    -- Check if an existing uncompleted entry exists for the user and content
    SELECT id INTO existing_entry FROM watch_history
    WHERE user_id = start_watch_history.user_id
      AND content_id = start_watch_history.content_id
      AND completed_at IS NULL
    LIMIT 1;

    IF existing_entry IS NOT NULL THEN
        -- Return existing entry ID if found
        watch_history_id := existing_entry;
        RETURN watch_history_id;
    ELSE
        -- Insert new watch history entry
        INSERT INTO watch_history (user_id, content_id, progress, last_watched)
        VALUES (user_id, content_id, 0, NOW())
        RETURNING id INTO watch_history_id;

        RETURN watch_history_id;
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update watch progress for an existing watch history entry
CREATE OR REPLACE FUNCTION update_watch_progress(
    watch_history_id uuid,
    new_progress integer,
    OUT current_progress integer
) RETURNS integer AS $$
BEGIN
    -- Validate input progress
    IF new_progress < 0 OR new_progress > 100 THEN
        RAISE EXCEPTION 'Progress must be between 0 and 100';
    END IF;

    -- Update progress and timestamp
    UPDATE watch_history
    SET progress = new_progress,
        last_watched = NOW(),
        completed_at = NULL  -- Reset completion if updating progress
    WHERE id = update_watch_progress.watch_history_id
    RETURNING progress INTO current_progress;

    RETURN current_progress;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Mark a watch history entry as finished
CREATE OR REPLACE FUNCTION finish_watch_history(
    watch_history_id uuid,
    OUT is_completed boolean
) RETURNS boolean AS $$
BEGIN
    -- Update to mark as completed
    UPDATE watch_history
    SET progress = 100,
        completed_at = NOW(),
        last_watched = NOW()
    WHERE id = finish_watch_history.watch_history_id
    RETURNING completed_at IS NOT NULL INTO is_completed;

    RETURN is_completed;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Get watch history for a user
CREATE OR REPLACE FUNCTION get_watch_history(
    user_id uuid
) RETURNS TABLE (id uuid, content_id uuid, progress integer, last_watched timestamptz, completed_at timestamptz) AS $$
BEGIN
    RETURN QUERY
    SELECT id, content_id, progress, last_watched, completed_at
    FROM watch_history
    WHERE user_id = get_watch_history.user_id
    ORDER BY last_watched DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Get current watch progress for specific content
CREATE OR REPLACE FUNCTION get_watch_progress(
    user_id uuid,
    content_id uuid,
    OUT progress integer,
    OUT last_watched timestamptz
) RETURNS RECORD AS $$
DECLARE
    wh_record watch_history;
BEGIN
    SELECT * INTO wh_record
    FROM watch_history
    WHERE user_id = get_watch_progress.user_id
      AND content_id = get_watch_progress.content_id
      AND completed_at IS NULL
    ORDER BY last_watched DESC
    LIMIT 1;

    IF wh_record IS NULL THEN
        progress := 0;
        last_watched := NULL;
    ELSE
        progress := wh_record.progress;
        last_watched := wh_record.last_watched;
    END IF;

    RETURN;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;