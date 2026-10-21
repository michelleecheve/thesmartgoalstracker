import { supabase } from '@/lib/supabase'
import { todayLocal, type LocalDate } from '@/lib/dates'
import type { Database, FrequencyType, HabitRow, HabitStatus } from '@/types/database'
import { toAppError } from './errors'

export interface FrequencyInput {
  frequencyType: FrequencyType
  weekdays: number[] | null
  intervalDays: number | null
}

export interface HabitInput extends FrequencyInput {
  goalId: string
  name: string
  description: string | null
  startDate: LocalDate
  endDate: LocalDate | null
  timeOfDay: string | null
  durationMinutes: number | null
  color: string | null
}

/** Normaliza la frecuencia para que cumpla las restricciones de la base de datos. */
function frequencyArgs(f: FrequencyInput) {
  return {
    p_frequency_type: f.frequencyType,
    p_weekdays: f.frequencyType === 'weekly' ? [...new Set(f.weekdays ?? [])].sort((a, b) => a - b) : null,
    p_interval_days: f.frequencyType === 'interval' ? f.intervalDays : null,
  }
}

/** Crea el hábito y su primera versión de horario (atómico). */
export async function createHabit(input: HabitInput): Promise<HabitRow> {
  const { data, error } = await supabase.rpc('create_habit', {
    p_goal_id: input.goalId,
    p_name: input.name,
    p_description: input.description,
    p_start_date: input.startDate,
    p_end_date: input.endDate,
    p_time_of_day: input.timeOfDay,
    p_duration_minutes: input.durationMinutes,
    p_color: input.color,
    ...frequencyArgs(input),
  })
  if (error) throw toAppError(error)
  return data
}

export type HabitUpdate = Pick<
  Database['public']['Tables']['habits']['Update'],
  'goal_id' | 'name' | 'description' | 'start_date' | 'end_date' | 'time_of_day' | 'duration_minutes' | 'color'
>

export async function updateHabit(id: string, patch: HabitUpdate): Promise<HabitRow> {
  const { data, error } = await supabase.from('habits').update(patch).eq('id', id).select('*').single()
  if (error) throw toAppError(error)
  return data
}

/**
 * Cambia la frecuencia desde hoy (o desde el inicio si aún no empieza).
 * Las fechas anteriores conservan su programación original.
 */
export async function changeHabitSchedule(id: string, frequency: FrequencyInput): Promise<void> {
  const { error } = await supabase.rpc('change_habit_schedule', {
    p_habit_id: id,
    p_effective_from: todayLocal(),
    ...frequencyArgs(frequency),
  })
  if (error) throw toAppError(error)
}

export async function setHabitStatus(id: string, status: HabitStatus): Promise<HabitRow> {
  const { data, error } = await supabase.rpc('set_habit_status', {
    p_habit_id: id,
    p_status: status,
    p_today: todayLocal(),
  })
  if (error) throw toAppError(error)
  return data
}

export async function deleteHabit(id: string): Promise<void> {
  const { error } = await supabase.from('habits').delete().eq('id', id)
  if (error) throw toAppError(error)
}
