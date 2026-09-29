import { useEffect, useState } from 'react'
import type { Session, User } from '@supabase/supabase-js'
import { useSupabase } from './useSupabase'

type AppRole = 'user' | 'admin' | null

export const useAuth = () => {
  const supabase = useSupabase()
  const [session, setSession] = useState<Session | null>(null)
  const [user, setUser] = useState<User | null>(null)
  const [role, setRole] = useState<AppRole>(null)
  const [loading, setLoading] = useState(Boolean(supabase))

  useEffect(() => {
    if (!supabase) return
    let mounted = true
    let roleTimer: ReturnType<typeof setTimeout> | undefined
    const loadRole = (userId: string) => {
      void (async () => {
        try {
          const { data } = await supabase.from('users').select('role').eq('id', userId).maybeSingle()
          if (mounted) setRole(data?.role === 'admin' ? 'admin' : 'user')
        } catch { if (mounted) setRole('user') }
      })()
    }
    void supabase.auth.getSession().then(({ data }) => {
      if (!mounted) return
      setSession(data.session)
      setUser(data.session?.user ?? null)
      if (data.session?.user) loadRole(data.session.user.id)
      setLoading(false)
    })
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession)
      setUser(nextSession?.user ?? null)
      setRole(null)
      if (nextSession?.user) {
        roleTimer = setTimeout(() => loadRole(nextSession.user.id), 0)
      }
    })
    return () => {
      mounted = false
      if (roleTimer) clearTimeout(roleTimer)
      subscription.unsubscribe()
    }
  }, [supabase])

  const signIn = async (email: string, password: string) => {
    if (!supabase) throw new Error('Supabase is not configured.')
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) throw error
    return data
  }

  const signUp = async (email: string, password: string, displayName: string) => {
    if (!supabase) throw new Error('Supabase is not configured.')
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { display_name: displayName } },
    })
    if (error) throw error
    return data
  }

  const signOut = async () => {
    if (!supabase) throw new Error('Supabase is not configured.')
    const { error } = await supabase.auth.signOut()
    if (error) throw error
    setRole(null)
  }

  return { session, user, role, isAdmin: role === 'admin', loading, signIn, signUp, signOut, configured: Boolean(supabase) }
}
