import { useState } from 'react'
import { Bookmark, BookmarkCheck } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useMyList } from '@/hooks/useMyList'

export default function MyListToggleButton({ slug }: { slug: string }) {
  const { signedIn, isSaved, toggle } = useMyList()
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const saved = isSaved(slug)
  if (!signedIn) return <Link to="/account" className="rounded-md bg-white/10 px-4 py-3 text-sm font-medium hover:bg-white/20">Sign in to save</Link>
  const onToggle = async () => {
    setBusy(true); setError('')
    try { await toggle(slug) } catch (cause) { setError(cause instanceof Error ? cause.message : 'Could not update My List.') }
    finally { setBusy(false) }
  }
  return <div><button disabled={busy} onClick={() => void onToggle()} className="inline-flex items-center gap-2 rounded-md bg-white/10 px-4 py-3 text-sm font-medium hover:bg-white/20 disabled:opacity-60">{saved ? <BookmarkCheck size={18} /> : <Bookmark size={18} />}{saved ? 'In My List' : 'Add to My List'}</button>{error && <p role="alert" className="mt-2 text-xs text-red-300">{error}</p>}</div>
}
