import { Link } from 'react-router-dom'
import ContentCard from '@/components/home/ContentCard'
import { useMyList } from '@/hooks/useMyList'
import { useAuth } from '@/hooks/useAuth'

export default function MyListPage() {
  const { user } = useAuth()
  const { items, loading, error } = useMyList()
  if (!user) return <main className="px-6 py-12 text-white md:px-12"><h1 className="text-3xl font-semibold">My List</h1><p className="mt-3 text-white/65">Sign in to keep your saved titles across devices.</p><Link to="/account" className="mt-5 inline-block rounded bg-brand px-4 py-2 font-semibold text-black">Sign in</Link></main>
  return <main className="min-h-screen px-6 py-10 text-white md:px-12"><h1 className="text-3xl font-semibold">My List</h1><p className="mt-2 text-white/60">Your saved movies and shows.</p>{loading ? <p className="py-10 text-white/60">Loading your list…</p> : error ? <p role="alert" className="py-10 text-red-300">{error}</p> : items.length ? <div className="mt-8 grid grid-cols-2 gap-5 sm:grid-cols-3 lg:grid-cols-5">{items.map((item) => <ContentCard key={item.id} item={item} />)}</div> : <p className="py-12 text-white/60">Your list is empty. Open a title and choose “Add to My List”.</p>}</main>
}
