import { useEffect, useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import { useRatings } from '@/hooks/useRatings'
import { useSupabase } from '@/hooks/useSupabase'

type Review = { id: string; title: string | null; body: string; rating: number | null; is_spoiler: boolean; created_at: string }
type RatingSummary = { average_rating: number; rating_count: number }

export default function RatingsAndReviews({ slug }: { slug: string }) {
  const { user } = useAuth()
  const supabase = useSupabase()
  const { setRating, getUserRating, getContentRatings, setReview, getContentReviews } = useRatings()
  const [summary, setSummary] = useState<RatingSummary | null>(null)
  const [myRating, setMyRating] = useState(0)
  const [reviews, setReviews] = useState<Review[]>([])
  const [body, setBody] = useState('')
  const [title, setTitle] = useState('')
  const [spoiler, setSpoiler] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  const refresh = async () => {
    try {
      const [aggregate, mine, reviewRows] = await Promise.all([getContentRatings(slug), user ? getUserRating(slug) : Promise.resolve(null), getContentReviews(slug)])
      setSummary((aggregate as RatingSummary[] | null)?.[0] ?? null)
      setMyRating(Number(mine ?? 0))
      setReviews((reviewRows ?? []) as Review[])
    } catch (cause) { setError(cause instanceof Error ? cause.message : 'Could not load ratings and reviews.') }
  }
  useEffect(() => { if (supabase) void refresh() }, [slug, user?.id, supabase])

  const rate = async (value: number) => {
    if (!user) return
    setError(''); setMessage('')
    try { await setRating(slug, value); setMyRating(value); await refresh() }
    catch (cause) { setError(cause instanceof Error ? cause.message : 'Could not save rating.') }
  }
  const submitReview = async (event: FormEvent) => {
    event.preventDefault(); setError(''); setMessage('')
    try { await setReview(slug, body, title || undefined, spoiler); setBody(''); setTitle(''); setSpoiler(false); setMessage('Review saved.'); await refresh() }
    catch (cause) { setError(cause instanceof Error ? cause.message : 'Could not save review.') }
  }

  if (!supabase) return <section className="mt-12 border-t border-white/10 pt-8"><h2 className="text-2xl font-semibold">Ratings &amp; reviews</h2><p className="mt-2 text-sm text-white/60">Connect Supabase to rate or review this title.</p></section>

  return <section className="mt-12 border-t border-white/10 pt-8">
    <h2 className="text-2xl font-semibold">Ratings &amp; reviews</h2>
    <p className="mt-2 text-sm text-white/60">{summary?.rating_count ? `${Number(summary.average_rating).toFixed(1)} / 5 from ${summary.rating_count} ratings` : 'No ratings yet'}</p>
    {user ? <div className="mt-4"><p className="text-sm text-white/70">Your rating</p><div className="mt-1 flex gap-1">{[1,2,3,4,5].map((value) => <button key={value} aria-label={`Rate ${value} out of 5`} aria-pressed={myRating === value} onClick={() => void rate(value)} className={`text-2xl ${value <= myRating ? 'text-brand' : 'text-white/30'}`}>★</button>)}</div></div> : <p className="mt-4 text-sm text-white/65"><Link className="text-brand underline" to="/account">Sign in</Link> to rate or review this title.</p>}
    {user && <form onSubmit={submitReview} className="mt-6 grid gap-3 rounded-lg border border-white/10 bg-white/[0.03] p-4">
      <h3 className="font-medium">Write a review</h3>
      <input value={title} onChange={(event) => setTitle(event.target.value)} placeholder="Review title (optional)" className="rounded border border-white/10 bg-black/30 px-3 py-2" />
      <textarea required minLength={3} value={body} onChange={(event) => setBody(event.target.value)} rows={4} placeholder="What did you think?" className="rounded border border-white/10 bg-black/30 px-3 py-2" />
      <label className="flex items-center gap-2 text-sm text-white/65"><input type="checkbox" checked={spoiler} onChange={(event) => setSpoiler(event.target.checked)} /> Contains spoilers</label>
      <button className="justify-self-start rounded bg-brand px-4 py-2 text-sm font-semibold text-black">Post review</button>
    </form>}
    {error && <p role="alert" className="mt-4 text-sm text-red-300">{error}</p>}{message && <p role="status" className="mt-4 text-sm text-emerald-300">{message}</p>}
    <div className="mt-6 space-y-4">{reviews.map((review) => <article key={review.id} className="rounded-lg border border-white/10 p-4"><div className="flex justify-between gap-4"><h3 className="font-medium">{review.title || 'Member review'}</h3>{review.rating ? <span className="text-brand">{review.rating}/5</span> : null}</div>{review.is_spoiler ? <details className="mt-3"><summary className="cursor-pointer text-xs text-white/50">Spoiler — reveal review</summary><p className="mt-2 text-sm leading-6 text-white/75">{review.body}</p></details> : <p className="mt-3 text-sm leading-6 text-white/75">{review.body}</p>}<time className="mt-3 block text-xs text-white/40">{new Date(review.created_at).toLocaleDateString()}</time></article>)}</div>
  </section>
}
