import { useCallback, useEffect, useState } from 'react'
import { useAuth } from './useAuth'
import { useSupabase } from './useSupabase'
import type { ContentItem } from '@/data/types'

export const useMyList = () => {
  const supabase = useSupabase()
  const { user } = useAuth()
  const [items, setItems] = useState<ContentItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const refresh = useCallback(async () => {
    if (!supabase || !user) { setItems([]); setLoading(false); return }
    setLoading(true)
    const { data, error: requestError } = await supabase.rpc('get_my_list')
    if (requestError) { setError(requestError.message); setItems([]) }
    else {
      const content = (data ?? []) as ContentItem[]
      setItems(content.map((item) => ({
        ...item,
        thumbnailUrl: resolvePoster(supabase, item.thumbnailUrl, item.id),
        videoUrl: item.videoUrl ?? `/movies/${encodeURIComponent(item.id)}.mp4`,
      })))
      setError(null)
    }
    setLoading(false)
  }, [supabase, user])

  useEffect(() => { void refresh() }, [refresh])

  const toggle = async (contentSlug: string) => {
    if (!supabase || !user) throw new Error('Sign in to use My List.')
    const { data, error: requestError } = await supabase.rpc('toggle_my_list', { p_content_slug: contentSlug })
    if (requestError) throw requestError
    await refresh()
    return Boolean(data)
  }

  return { items, loading, error, isSaved: (slug: string) => items.some((item) => item.id === slug), toggle, refresh, signedIn: Boolean(user) }
}

function resolvePoster(supabase: NonNullable<ReturnType<typeof useSupabase>>, path: string, slug: string) {
  if (!path) return `/posters/${encodeURIComponent(slug)}.jpg`
  if (path.startsWith('http') || path.startsWith('/')) return path
  return supabase.storage.from('thumbnails').getPublicUrl(path).data.publicUrl
}
