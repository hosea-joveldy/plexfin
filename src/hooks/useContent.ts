import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase/client'
import { mockContentRows } from '@/data/mockData'
import type { ContentItem, ContentRow } from '@/data/types'

type ContentRowWithKind = ContentRow & { type: string }

const useContent = () => {
    const [contentRows, setContentRows] = useState<ContentRowWithKind[]>(mockContentRows)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    const load = async () => {
      if (!supabase) {
        setContentRows(mockContentRows as ContentRowWithKind[])
        setLoading(false)
        return
      }
      try {
        const [trendingResult, newResult] = await Promise.all([
          supabase.rpc('get_trending_content', { p_limit: 12 }),
          supabase.rpc('get_new_releases', { p_page: 1, p_page_size: 12 }),
        ])
        if (trendingResult.error) throw trendingResult.error
        if (newResult.error) throw newResult.error
        if (cancelled) return
        const trending = (trendingResult.data ?? []) as ContentItem[]
        const newReleases = (newResult.data ?? []) as ContentItem[]
        if (trending.length === 0 && newReleases.length === 0) {
          setContentRows(mockContentRows)
        } else {
          setContentRows([
            { id: 'trending', type: 'trending', title: 'Trending Now', items: trending },
            { id: 'new-releases', type: 'new_releases', title: 'New Releases', items: newReleases },
          ])
        }
      } catch {
        if (cancelled) return
        setContentRows(mockContentRows as ContentRowWithKind[])
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    void load()
    return () => { cancelled = true }
  }, [])

  return { contentRows, loading }
}

export default useContent
