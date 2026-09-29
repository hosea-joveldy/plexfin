import { useSupabase } from './useSupabase'

export const useWatchHistory = () => {
  const supabase = useSupabase()
  const client = () => {
    if (!supabase) throw new Error('Supabase is not configured.')
    return supabase
  }
  const startWatchHistory = async (contentId: string) => {
    const { data, error } = await client().rpc('start_watch_history', { p_content_slug: contentId })
    if (error) throw error
    return data
  }
  const updateWatchProgress = async (contentId: string, progressPercent: number, positionSeconds: number) => {
    const { error } = await client().rpc('update_watch_progress', { p_content_slug: contentId, p_progress_percent: progressPercent, p_position_seconds: positionSeconds })
    if (error) throw error
  }
  const getWatchHistory = async () => {
    const { data, error } = await client().rpc('get_watch_history')
    if (error) throw error
    return data
  }
  return { startWatchHistory, updateWatchProgress, getWatchHistory }
}
