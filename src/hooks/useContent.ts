import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase/client'
import { mockContentRows } from '@/data/mockData'
import { heroContent } from '@/data/mock-hero'
import { useAuth } from './useAuth'
import type { ContentItem, ContentRow } from '@/data/types'

type ContentRowWithKind = ContentRow & { type: string }

function resolveAsset(path: string | null | undefined, id: string, kind: 'thumbnails' | 'videos') {
  if (!path) return kind === 'thumbnails' ? `/posters/${encodeURIComponent(id)}.jpg` : `/movies/${encodeURIComponent(id)}.mp4`
  if (path.startsWith('http') || path.startsWith('/')) return path
  return supabase?.storage.from(kind).getPublicUrl(path).data.publicUrl ?? path
}

function withStorageMedia(item: ContentItem): ContentItem {
  return {
    ...item,
    thumbnailUrl: resolveAsset(item.thumbnailUrl, item.id, 'thumbnails'),
    backdropUrl: resolveAsset(item.backdropUrl, item.id, 'thumbnails'),
    videoUrl: item.videoUrl ?? `/movies/${encodeURIComponent(item.id)}.mp4`,
  }
}

const useContent = () => {
  const { user } = useAuth()
  const [featuredContent, setFeaturedContent] = useState<ContentItem>(heroContent[0])
  const [contentRows, setContentRows] = useState<ContentRowWithKind[]>(mockContentRows)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    const load = async () => {
      if (!supabase) { setFeaturedContent(heroContent[0]); setContentRows(mockContentRows); setLoading(false); return }
      setLoading(true)
      try {
        const [featuredResult, trendingResult, newResult] = await Promise.all([
          supabase.rpc('get_featured_content'),
          supabase.rpc('get_trending_content', { p_limit: 12 }),
          supabase.rpc('get_new_releases', { p_page: 1, p_page_size: 12 }),
        ])
        if (featuredResult.error) throw featuredResult.error
        if (trendingResult.error) throw trendingResult.error
        if (newResult.error) throw newResult.error
        let continueItems: ContentItem[] = []
        if (user) {
          const history = await supabase.rpc('get_continue_watching', { p_user_id: user.id, p_limit: 12 })
          if (!history.error) continueItems = ((history.data ?? []) as ContentItem[]).map(withStorageMedia)
        }
        if (cancelled) return
        const featured = featuredResult.data as ContentItem | null
        if (featured) setFeaturedContent(withStorageMedia(featured))
        const trending = ((trendingResult.data ?? []) as ContentItem[]).map(withStorageMedia)
        const newReleases = ((newResult.data ?? []) as ContentItem[]).map(withStorageMedia)
        if (!trending.length && !newReleases.length && !continueItems.length) { setFeaturedContent(heroContent[0]); setContentRows(mockContentRows) }
        else setContentRows([
          ...(continueItems.length ? [{ id: 'continue-watching', type: 'continue_watching', title: 'Continue Watching', items: continueItems }] : []),
          { id: 'trending', type: 'trending', title: 'Trending Now', items: trending },
          { id: 'new-releases', type: 'new_releases', title: 'New Releases', items: newReleases },
        ])
      } catch {
        if (!cancelled) { setFeaturedContent(heroContent[0]); setContentRows(mockContentRows) }
      } finally { if (!cancelled) setLoading(false) }
    }
    void load()
    return () => { cancelled = true }
  }, [user?.id])

  return { featuredContent, contentRows, loading }
}

export default useContent
