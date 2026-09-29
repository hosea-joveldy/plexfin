import { createClient, type SupabaseClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL
const publishableKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY

/** The UI remains usable with mock data until a Supabase project is configured. */
export const supabase: SupabaseClient | null =
  url && publishableKey ? createClient(url, publishableKey) : null
