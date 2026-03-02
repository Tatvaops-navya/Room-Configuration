import { createClient, SupabaseClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

/** Server-side Supabase client (use in API routes). Uses service_role for full access to product_variations. */
export function getSupabaseServer(): SupabaseClient {
  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in environment.')
  }
  return createClient(supabaseUrl, supabaseServiceKey)
}

/** Browser-safe client (anon key). Use for client-side if needed. */
export function getSupabaseBrowser(): SupabaseClient | null {
  if (typeof window === 'undefined' || !supabaseUrl || !supabaseAnonKey) return null
  return createClient(supabaseUrl, supabaseAnonKey)
}
