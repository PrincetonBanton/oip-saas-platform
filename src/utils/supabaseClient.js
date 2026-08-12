import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Fetch public table names using Supabase RPC or direct table query
export async function fetchAvailableTables() {
  const { data, error } = await supabase
    .rpc('get_tables') // Optional: if you have an RPC function set up
    .catch(() => ({ data: null }))

  if (data) return data

  // Fallback: Query standard schema tables directly if public access is enabled
  const { data: schemaData, error: schemaError } = await supabase
    .from('pg_tables')
    .select('tablename')
    .eq('schemaname', 'public')

  if (schemaError) {
    // Standard RLS fallback: You can query a designated lookup table or provide a schema query
    throw new Error('Unable to auto-detect schema. Ensure RLS permits reading public tables.')
  }

  return schemaData.map(t => t.tablename)
}