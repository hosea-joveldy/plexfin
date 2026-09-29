import { useState, type FormEvent, type ReactNode } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import { useSupabase } from '@/hooks/useSupabase'

export default function AdminPage() {
  const { user, isAdmin, loading: authLoading } = useAuth()
  const supabase = useSupabase()
  const navigate = useNavigate()
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!supabase || !user || !isAdmin) return
    const form = new FormData(event.currentTarget)
    const title = String(form.get('title') ?? '').trim()
    const slug = String(form.get('slug') ?? '').trim().toLowerCase()
    const description = String(form.get('description') ?? '').trim()
    const year = Number(form.get('year'))
    const rating = String(form.get('rating') ?? 'NR')
    const contentType = String(form.get('contentType') ?? 'movie')
    const duration = Number(form.get('duration') || 0)
    const genres = String(form.get('genres') ?? '').split(',').map((value) => value.trim()).filter(Boolean)
    const poster = form.get('poster')
    const movie = form.get('movie')
    if (!(poster instanceof File) || poster.size === 0 || !(movie instanceof File) || movie.size === 0) { setError('Choose both a poster and a movie file.'); return }
    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) { setError('Use a slug with lowercase letters, numbers, and hyphens.'); return }

    setBusy(true); setError(''); setMessage('Uploading poster and movie…')
    const posterPath = `${slug}/poster.${extension(poster.name, 'jpg')}`
    const videoPath = `${slug}/movie.${extension(movie.name, 'mp4')}`
    try {
      const { error: posterError } = await supabase.storage.from('thumbnails').upload(posterPath, poster, { upsert: false, contentType: poster.type })
      if (posterError) throw posterError
      const { error: movieError } = await supabase.storage.from('videos').upload(videoPath, movie, { upsert: false, contentType: movie.type })
      if (movieError) throw movieError
      const { data: inserted, error: contentError } = await supabase.from('content').insert({
        slug, title, description, content_type: contentType, release_year: year, rating_code: rating,
        duration_minutes: duration || null, thumbnail_url: posterPath, video_url: videoPath, status: 'published', created_by: user.id,
      }).select('id, slug').single()
      if (contentError) throw contentError
      for (const name of genres) {
        const genreSlug = slugify(name)
        const { data: genre, error: genreError } = await supabase.from('genres').upsert({ slug: genreSlug, name }, { onConflict: 'slug' }).select('id').single()
        if (genreError) throw genreError
        const { error: linkError } = await supabase.from('content_genres').upsert({ content_id: inserted.id, genre_id: genre.id }, { onConflict: 'content_id,genre_id' })
        if (linkError) throw linkError
      }
      setMessage('Movie added to the catalog.')
      navigate(`/content/${inserted.slug}`)
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Movie upload failed.')
      setMessage('')
    } finally { setBusy(false) }
  }

  if (authLoading) return <main className="px-6 py-12 text-white">Checking admin access…</main>
  if (!user) return <main className="px-6 py-12 text-white"><h1 className="text-3xl font-semibold">Admin access</h1><p className="mt-3 text-white/65">Sign in with an administrator account to add movies.</p><Link to="/account" className="mt-5 inline-block rounded bg-brand px-4 py-2 font-semibold text-black">Sign in</Link></main>
  if (!isAdmin) return <main className="px-6 py-12 text-white"><h1 className="text-3xl font-semibold">Admins only</h1><p className="mt-3 text-white/65">Your account does not have permission to add catalog titles.</p></main>

  return (
    <main className="mx-auto max-w-3xl px-6 py-10 text-white md:px-12">
      <h1 className="text-3xl font-semibold">Add a movie</h1>
      <p className="mt-2 text-white/60">Upload your video and poster to the private PlexFin Supabase project.</p>
      <form onSubmit={submit} className="mt-8 grid gap-5 sm:grid-cols-2">
        <Field label="Title"><input name="title" required className={inputClass} /></Field>
        <Field label="URL slug"><input name="slug" required pattern="[a-z0-9]+(-[a-z0-9]+)*" placeholder="my-new-film" className={inputClass} /></Field>
        <Field label="Release year"><input name="year" type="number" min="1888" max="2200" required defaultValue={new Date().getFullYear()} className={inputClass} /></Field>
        <Field label="Content rating"><select name="rating" className={inputClass}><option>NR</option>{['G','PG','PG-13','R','NC-17','TV-Y','TV-G','TV-PG','TV-14','TV-MA'].map((rating) => <option key={rating}>{rating}</option>)}</select></Field>
        <Field label="Type"><select name="contentType" className={inputClass}><option value="movie">Movie</option><option value="short">Short</option><option value="series">Series</option></select></Field>
        <Field label="Runtime (minutes)"><input name="duration" type="number" min="1" className={inputClass} /></Field>
        <Field label="Genres (comma-separated)" className="sm:col-span-2"><input name="genres" placeholder="Drama, Mystery" className={inputClass} /></Field>
        <Field label="Description" className="sm:col-span-2"><textarea name="description" rows={4} required className={inputClass} /></Field>
        <Field label="Poster image"><input name="poster" type="file" accept="image/jpeg,image/png,image/webp,image/avif" required className={fileClass} /></Field>
        <Field label="Movie file (MP4 recommended)"><input name="movie" type="file" accept="video/mp4,video/webm,video/quicktime,video/x-matroska" required className={fileClass} /></Field>
        {error && <p role="alert" className="sm:col-span-2 text-sm text-red-300">{error}</p>}
        {message && <p role="status" className="sm:col-span-2 text-sm text-emerald-300">{message}</p>}
        <button disabled={busy} className="sm:col-span-2 rounded-md bg-brand px-5 py-3 font-semibold text-black disabled:opacity-60">{busy ? 'Uploading…' : 'Upload and publish movie'}</button>
        <p className="sm:col-span-2 text-xs leading-5 text-white/45">Uploads are private/public according to their bucket settings. Only admins can upload or change catalog records; signed-in active members can watch published titles. Confirm your Supabase Storage limits can accept the selected file size.</p>
      </form>
    </main>
  )
}

const inputClass = 'mt-1 w-full rounded border border-white/15 bg-[#171717] px-3 py-2.5 text-white'
const fileClass = 'mt-1 block w-full rounded border border-white/15 bg-white/5 px-3 py-2 text-sm'
function Field({ label, className = '', children }: { label: string; className?: string; children: ReactNode }) { return <label className={`block text-sm ${className}`}>{label}{children}</label> }
function extension(filename: string, fallback: string) { const match = filename.toLowerCase().match(/\.([a-z0-9]{1,8})$/); return match?.[1] ?? fallback }
function slugify(value: string) { return value.toLowerCase().normalize('NFKD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') }
