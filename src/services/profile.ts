import { supabase } from '@/lib/supabase'
import type { ProfileRow } from '@/types/database'
import { toAppError } from './errors'

export async function getProfile(userId: string): Promise<ProfileRow | null> {
  const { data, error } = await supabase.from('profiles').select('*').eq('id', userId).maybeSingle()
  if (error) throw toAppError(error)
  return data
}

export async function updateDisplayName(userId: string, displayName: string): Promise<ProfileRow> {
  const { data, error } = await supabase
    .from('profiles')
    .update({ display_name: displayName.trim() || null })
    .eq('id', userId)
    .select('*')
    .single()
  if (error) throw toAppError(error)
  return data
}
