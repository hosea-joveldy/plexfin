import { useSupabase } from './useSupabase'

export const useRatings = () => {
  const supabase = useSupabase()

  const create_rating = async (userId: string, contentId: string, rating: number) => {
    const { error } = await supabase.rpc('create_rating', { userId, contentId, rating })
    if (error) throw error
  }

  const update_rating = async (userId: string, contentId: string, newRating: number) => {
    const { error } = await supabase.rpc('update_rating', { userId, contentId, newRating })
    if (error) throw error
  }

  const delete_rating = async (userId: string, contentId: string) => {
    const { error } = await supabase.rpc('delete_rating', { userId, contentId })
    if (error) throw error
  }

  const get_user_rating = async (userId: string, contentId: string) => {
    const { data, error } = await supabase.rpc('get_user_rating', { userId, contentId })
    if (error) throw error
    return data
  }

  const create_review = async (userId: string, contentId: string, review: string) => {
    const { error } = await supabase.rpc('create_review', { userId, contentId, review })
    if (error) throw error
  }

  const update_review = async (userId: string, contentId: string, updatedReview: string) => {
    const { error } = await supabase.rpc('update_review', { userId, contentId, updatedReview })
    if (error) throw error
  }

  const delete_review = async (userId: string, contentId: string) => {
    const { error } = await supabase.rpc('delete_review', { userId, contentId })
    if (error) throw error
  }

  const get_user_review = async (userId: string, contentId: string) => {
    const { data, error } = await supabase.rpc('get_user_review', { userId, contentId })
    if (error) throw error
    return data
  }

  const get_content_ratings = async (contentId: string) => {
    const { data, error } = await supabase.rpc('get_content_ratings', { contentId })
    if (error) throw error
    return data
  }

  const get_content_reviews = async (contentId: string) => {
    const { data, error } = await supabase.rpc('get_content_reviews', { contentId })
    if (error) throw error
    return data
  }

  return {
    create_rating,
    update_rating,
    delete_rating,
    get_user_rating,
    create_review,
    update_review,
    delete_review,
    get_user_review,
    get_content_ratings,
    get_content_reviews,
  }
}
