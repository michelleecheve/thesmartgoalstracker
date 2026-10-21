import { supabase } from '@/lib/supabase'
import type { LocalDate } from '@/lib/dates'
import type { HabitCompletionRow } from '@/types/database'
import { toAppError } from './errors'
import { fetchAll } from './fetchAll'

export type CompletionRef = Pick<HabitCompletionRow, 'habit_id' | 'date'>

/** Cumplimientos dentro de [from, to] (ambos inclusive). */
export async function fetchCompletions(from: LocalDate, to: LocalDate): Promise<CompletionRef[]> {
  return fetchAll((a, b) =>
    supabase
      .from('habit_completions')
      .select('habit_id, date')
      .gte('date', from)
      .lte('date', to)
      .order('date')
      .order('habit_id')
      .range(a, b),
  )
}

/**
 * Marca un hábito como completado en una fecha.
 * Si ya estaba marcado (p. ej. doble toque), no hace nada: nunca hay duplicados.
 */
export async function markCompleted(habitId: string, date: LocalDate): Promise<void> {
  const { error } = await supabase
    .from('habit_completions')
    .upsert({ habit_id: habitId, date }, { onConflict: 'habit_id,date', ignoreDuplicates: true })
  if (error) throw toAppError(error)
}

/** Desmarca un hábito en una fecha. */
export async function unmarkCompleted(habitId: string, date: LocalDate): Promise<void> {
  const { error } = await supabase.from('habit_completions').delete().eq('habit_id', habitId).eq('date', date)
  if (error) throw toAppError(error)
}
