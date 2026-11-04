import { supabase } from '@/lib/supabase'
import type { LocalDate } from '@/lib/dates'
import { toAppError } from './errors'
import { fetchAll } from './fetchAll'

/** Días en que la persona congeló su racha. */
export async function fetchFreezes(): Promise<LocalDate[]> {
  const rows = await fetchAll((a, b) => supabase.from('streak_freezes').select('date').order('date').range(a, b))
  return rows.map((r) => r.date)
}

/** Congela la racha de un día. Si ya estaba congelado, no hace nada. */
export async function freezeDay(date: LocalDate): Promise<void> {
  const { error } = await supabase
    .from('streak_freezes')
    .upsert({ date }, { onConflict: 'user_id,date', ignoreDuplicates: true })
  if (error) throw toAppError(error)
}

export async function unfreezeDay(date: LocalDate): Promise<void> {
  const { error } = await supabase.from('streak_freezes').delete().eq('date', date)
  if (error) throw toAppError(error)
}
