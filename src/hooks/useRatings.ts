import { useSupabase } from './useSupabase'

export const useRatings = () => {
  const supabase = useSupabase()
  const client = () => {
    if (!supabase) throw new Error('Supabase is not configured.')
    return supabase
  }
  const setRating = async (contentId: string, rating: number) => {
    const { data, error } = await client().rpc('set_rating', { p_content_slug: contentId, p_rating: rating })
    if (error) throw error
    return data
  }
  const getUserRating = async (contentId: string) => {
    const { data, error } = await client().rpc('get_user_rating', { p_content_slug: contentId })
    if (error) throw error
    return data
  }
  const getContentRatings = async (contentId: string) => {
    const { data, error } = await client().rpc('get_content_ratings', { p_content_slug: contentId })
    if (error) throw error
    return data
  }
  const setReview = async (contentId: string, body: string, title?: string, isSpoiler = false) => {
    const { data, error } = await client().rpc('set_review', { p_content_slug: contentId, p_body: body, p_title: title ?? null, p_is_spoiler: isSpoiler })
    if (error) throw error
    return data
  }
  const getContentReviews = async (contentId: string, page = 1, pageSize = 20) => {
    const { data, error } = await client().rpc('get_content_reviews', { p_content_slug: contentId, p_page: page, p_page_size: pageSize })
    if (error) throw error
    return data
  }
  return { setRating, getUserRating, getContentRatings, setReview, getContentReviews }
}
