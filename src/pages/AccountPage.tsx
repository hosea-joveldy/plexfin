import { useState, type FormEvent, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'

export default function AccountPage() {
  const { user, role, loading, configured, signIn, signUp, signOut } = useAuth()
  const [mode, setMode] = useState<'signin' | 'signup'>('signin')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const submit = async (event: FormEvent) => {
    event.preventDefault()
    setSubmitting(true); setError(''); setMessage('')
    try {
      if (mode === 'signin') await signIn(email, password)
      else {
        const result = await signUp(email, password, displayName)
        setMessage(result.session ? 'Your account is ready.' : 'Check your email to confirm your account, then sign in.')
      }
    } catch (cause) { setError(cause instanceof Error ? cause.message : 'Could not complete account request.') }
    finally { setSubmitting(false) }
  }

  if (!configured) return <AccountShell><h1 className="text-3xl">Connect Supabase</h1><p className="mt-3 text-white/65">Add the Supabase URL and publishable key to `.env` to sign in.</p></AccountShell>
  if (loading) return <AccountShell><p>Loading account…</p></AccountShell>
  if (user) return <AccountShell><h1 className="text-3xl">Your account</h1><p className="mt-3 text-white/70">{user.email}</p><p className="mt-1 text-sm capitalize text-white/50">{role ?? 'member'}</p><div className="mt-6 flex gap-3"><Link to="/my-list" className="rounded bg-white/10 px-4 py-2">My List</Link><button onClick={() => void signOut()} className="rounded bg-white/10 px-4 py-2">Sign out</button></div></AccountShell>

  return (
    <AccountShell>
      <h1 className="text-3xl font-semibold">{mode === 'signin' ? 'Welcome back' : 'Create your account'}</h1>
      <p className="mt-2 text-sm text-white/60">Sign in to save titles and watch movies.</p>
      <form onSubmit={submit} className="mt-7 space-y-4">
        {mode === 'signup' && <label className="block text-sm">Name<input required value={displayName} onChange={(event) => setDisplayName(event.target.value)} className="mt-1 w-full rounded border border-white/15 bg-white/5 px-3 py-2" /></label>}
        <label className="block text-sm">Email<input type="email" required autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} className="mt-1 w-full rounded border border-white/15 bg-white/5 px-3 py-2" /></label>
        <label className="block text-sm">Password<input type="password" minLength={8} required autoComplete={mode === 'signup' ? 'new-password' : 'current-password'} value={password} onChange={(event) => setPassword(event.target.value)} className="mt-1 w-full rounded border border-white/15 bg-white/5 px-3 py-2" /></label>
        {error && <p role="alert" className="text-sm text-red-300">{error}</p>}
        {message && <p role="status" className="text-sm text-emerald-300">{message}</p>}
        <button disabled={submitting} className="w-full rounded bg-brand px-4 py-3 font-semibold text-black disabled:opacity-60">{submitting ? 'Please wait…' : mode === 'signin' ? 'Sign in' : 'Create account'}</button>
      </form>
      <button className="mt-5 text-sm text-white/60 underline" onClick={() => { setMode(mode === 'signin' ? 'signup' : 'signin'); setError(''); setMessage('') }}>{mode === 'signin' ? 'New here? Create an account' : 'Already have an account? Sign in'}</button>
    </AccountShell>
  )
}

function AccountShell({ children }: { children: ReactNode }) {
  return <section className="mx-auto max-w-lg px-6 py-14 text-white md:px-12">{children}</section>
}
