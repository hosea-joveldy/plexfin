import { useSupabase } from './useSupabase'

export const useWatchHistory = () => {
  const supabase = useSupabase()

  const start_watch_history = async (userId: string, contentId: string) => {
    const { error } = await supabase.rpc('start_watch_history', { userId, contentId })
    if (error) throw error
  }

  const update_watch_progress = async (watchHistoryId: string, newProgress: number) => {
    const { error } = await supabase.rpc('update_watch_progress', { watchHistoryId, newProgress })
    if (error) throw error
  }

  const finish_watch_history = async (watchHistoryId: string) => {
    const { error } = await supabase.rpc('finish_watch_history', { watchHistoryId })
    if (error) throw error
  }

  const get_watch_history = async (userId: string) => {
    const { data, error } = await supabase.rpc('get_watch_history', { userId })
    if (error) throw error
    return data
  }

  const get_watch_progress = async (watchHistoryId: string) => {
    const { data, error } = await supabase.rpc('get_watch_progress', { watchHistoryId })
    if (error) throw error
    return data
  }

  return {
    start_watch_history,
    update_watch_progress,
    finish_watch_history,
    get_watch_history,
    get_watch_progress,
  }
}
