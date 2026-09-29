import { useEffect, useMemo, useRef, useState, type ChangeEvent } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ArrowLeft, FolderOpen, Play } from 'lucide-react'
import { allContent } from '@/data/mock-rows'
import { mockSearchResults } from '@/data/mockSearchResults'
import { mockRatingsCatalog } from '@/data/mockRatings'
import type { ContentItem } from '@/data/types'
import { supabase } from '@/lib/supabase/client'

const placeholderPoster = '/posters/placeholder.svg'

export default function ContentDetailPage() {
  const { id = '' } = useParams()
  const mockItem = useMemo<ContentItem | undefined>(() => {
    const catalogItem = allContent.find((content) => content.id === id)
    if (catalogItem) return catalogItem
    const searchItem = mockSearchResults.find((content) => content.id === id)
    if (searchItem) return {
      id: searchItem.id,
      title: searchItem.title,
      description: 'Add the title description to the local catalog metadata when it is available.',
      thumbnailUrl: searchItem.thumbnail,
      backdropUrl: searchItem.thumbnail,
      videoUrl: `/movies/${searchItem.id}.mp4`,
      year: searchItem.year,
      rating: searchItem.rating,
      genres: [searchItem.genre],
      durationMinutes: Number.parseInt(searchItem.duration, 10) || 0,
    }
    const ratingsItem = mockRatingsCatalog.find((content) => content.id === id)
    if (!ratingsItem) return undefined
    return {
      id: ratingsItem.id,
      title: ratingsItem.title,
      description: 'Add the title description to the local catalog metadata when it is available.',
      thumbnailUrl: ratingsItem.thumbnail,
      backdropUrl: ratingsItem.thumbnail,
      videoUrl: `/movies/${ratingsItem.id}.mp4`,
      year: ratingsItem.year,
      rating: ratingsItem.rating,
      genres: [ratingsItem.genre],
      durationMinutes: ratingsItem.durationMinutes,
    }
  }, [id])
  const [detailItem, setDetailItem] = useState<ContentItem | undefined>(mockItem)
  const [loading, setLoading] = useState(!mockItem)
  const [videoSource, setVideoSource] = useState<string | null>(mockItem?.videoUrl ?? null)
  const [videoError, setVideoError] = useState(false)
  const [posterSource, setPosterSource] = useState(mockItem?.thumbnailUrl ?? placeholderPoster)
  const temporaryUrls = useRef<string[]>([])

  useEffect(() => {
    let cancelled = false
    setDetailItem(mockItem)
    setVideoSource(mockItem?.videoUrl ?? null)
    setVideoError(false)
    setPosterSource(mockItem?.thumbnailUrl ?? placeholderPoster)

    if (mockItem || !supabase) {
      setLoading(false)
      return () => { cancelled = true }
    }

    setLoading(true)
    void (async () => {
      try {
        const { data, error } = await supabase.rpc('get_content_by_slug', { p_slug: id })
        if (cancelled) return
        if (!error && data) {
          const content = data as ContentItem
          const localId = encodeURIComponent(content.id)
          setDetailItem({
            ...content,
            thumbnailUrl: `/posters/${localId}.jpg`,
            backdropUrl: `/posters/${localId}-backdrop.jpg`,
            videoUrl: `/movies/${localId}.mp4`,
          })
        }
      } catch {
        // Leave the missing-title state visible if the connection fails.
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => { cancelled = true }
  }, [id, mockItem])

  useEffect(() => () => {
    temporaryUrls.current.forEach((url) => URL.revokeObjectURL(url))
  }, [])

  if (loading) {
    return <div className="px-6 py-12 text-white/70 md:px-12">Loading title…</div>
  }

  if (!detailItem) {
    return (
      <section className="px-6 py-12 text-white md:px-12">
        <h1 className="text-3xl font-semibold">Title not found</h1>
        <p className="mt-3 text-white/65">This item is not in the local catalog.</p>
        <Link to="/" className="mt-6 inline-flex items-center gap-2 text-brand hover:underline"><ArrowLeft size={18} /> Back to home</Link>
      </section>
    )
  }

  const item = detailItem

  const chooseVideo = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return
    setVideoError(false)
    const url = URL.createObjectURL(file)
    temporaryUrls.current.push(url)
    setVideoSource(url)
  }

  const choosePoster = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      const url = URL.createObjectURL(file)
      temporaryUrls.current.push(url)
      setPosterSource(url)
    }
  }

  return (
    <article className="min-h-screen text-white">
      <header className="flex items-center justify-between px-6 py-5 md:px-12">
        <Link to="/" className="inline-flex items-center gap-2 text-sm text-white/75 hover:text-white"><ArrowLeft size={18} /> Back to browse</Link>
        <label className="cursor-pointer inline-flex items-center gap-2 rounded-md border border-white/15 px-3 py-2 text-sm hover:bg-white/10">
          <FolderOpen size={17} /> Preview poster
          <input className="sr-only" type="file" accept="image/*" onChange={choosePoster} />
        </label>
      </header>

      <div className="grid gap-8 px-6 pb-12 md:grid-cols-[minmax(0,1.6fr)_minmax(220px,0.65fr)] md:px-12">
        <div>
          <div className="relative aspect-video overflow-hidden rounded-lg border border-white/10 bg-black">
            {videoSource && !videoError ? (
              <video key={videoSource} className="h-full w-full" controls playsInline preload="metadata" poster={posterSource} onError={() => setVideoError(true)}>
                <source src={videoSource} />
                Your browser cannot play this video format.
              </video>
            ) : (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-black/70 p-6 text-center">
                <img src={posterSource} alt="" className="absolute inset-0 h-full w-full object-cover opacity-25" onError={(event) => { event.currentTarget.src = placeholderPoster }} />
                <div className="relative z-10 flex h-16 w-16 items-center justify-center rounded-full bg-brand text-black"><Play fill="currentColor" /></div>
                <p className="relative z-10 max-w-lg text-sm text-white/80">
                  {videoError ? `Couldn't open /movies/${item.id}.mp4. Select the movie file from your device to play it.` : 'No local movie file is available yet. Select a movie file from your device to play it.'}
                </p>
                <label className="relative z-10 cursor-pointer rounded-md bg-white px-4 py-2.5 text-sm font-semibold text-black hover:bg-white/85">
                  Choose movie file
                  <input className="sr-only" type="file" accept="video/*,.mkv,.avi" onChange={chooseVideo} />
                </label>
              </div>
            )}
          </div>
          <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-xs text-white/55">
            <span>Local playback stays on this device and lasts for this browser session.</span>
            <label className="cursor-pointer underline underline-offset-2 hover:text-white">Choose another file<input className="sr-only" type="file" accept="video/*,.mkv,.avi" onChange={chooseVideo} /></label>
          </div>
        </div>

        <aside>
          <img src={posterSource} alt={`${item.title} poster`} className="mb-5 aspect-[2/3] w-full rounded-md object-cover" onError={(event) => { event.currentTarget.src = placeholderPoster }} />
          <h1 className="text-3xl font-semibold">{item.title}</h1>
          <p className="mt-3 text-sm text-white/60">{[item.year, item.rating, ...item.genres, item.durationMinutes ? `${item.durationMinutes} min` : null].filter(Boolean).join(' · ')}</p>
          <p className="mt-5 leading-7 text-white/80">{item.description}</p>
          <p className="mt-6 border-t border-white/10 pt-4 text-xs leading-5 text-white/45">
            To keep the poster after closing this page, place it in <code>public/movies</code> and <code>public/posters</code>, named <code>{item.id}.mp4</code> and <code>{item.id}.jpg</code>.
          </p>
        </aside>
      </div>
    </article>
  )
}
