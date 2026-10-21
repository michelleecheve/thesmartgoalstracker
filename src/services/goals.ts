import { supabase } from '@/lib/supabase'
import { todayLocal } from '@/lib/dates'
import type { GoalBundleData } from '@/domain/mappers'
import type { Database, GoalRow, GoalStatus } from '@/types/database'
import { toAppError } from './errors'
import { fetchAll } from './fetchAll'

export type GoalInsert = Database['public']['Tables']['goals']['Insert']
export type GoalUpdate = Database['public']['Tables']['goals']['Update']

/** Indica si el usuario ya creó alguna meta (de cualquier estado). */
export async function hasAnyGoal(): Promise<boolean> {
  const { count, error } = await supabase.from('goals').select('id', { count: 'exact', head: true })
  if (error) throw toAppError(error)
  return (count ?? 0) > 0
}

/**
 * Carga todas las metas del usuario con sus hábitos, versiones de horario y
 * pausas. Es la base común de Inicio, Mis metas y Estadísticas.
 */
export async function fetchGoalBundle(): Promise<GoalBundleData> {
  const [goals, habits, versions, habitPauses, goalPauses] = await Promise.all([
    fetchAll((a, b) => supabase.from('goals').select('*').order('created_at').order('id').range(a, b)),
    fetchAll((a, b) => supabase.from('habits').select('*').order('created_at').order('id').range(a, b)),
    fetchAll((a, b) =>
      supabase.from('habit_schedule_versions').select('*').order('effective_from').order('id').range(a, b),
    ),
    fetchAll((a, b) => supabase.from('habit_pauses').select('*').order('start_date').order('id').range(a, b)),
    fetchAll((a, b) => supabase.from('goal_pauses').select('*').order('start_date').order('id').range(a, b)),
  ])
  return { goals, habits, versions, habitPauses, goalPauses }
}

export async function createGoal(input: GoalInsert): Promise<GoalRow> {
  const { data, error } = await supabase.from('goals').insert(input).select('*').single()
  if (error) throw toAppError(error)
  return data
}

export async function updateGoal(id: string, patch: GoalUpdate): Promise<GoalRow> {
  const { data, error } = await supabase.from('goals').update(patch).eq('id', id).select('*').single()
  if (error) throw toAppError(error)
  return data
}

/** Pausar, reanudar, completar, archivar o restaurar (atómico, ver migración). */
export async function setGoalStatus(id: string, status: GoalStatus): Promise<GoalRow> {
  const { data, error } = await supabase.rpc('set_goal_status', {
    p_goal_id: id,
    p_status: status,
    p_today: todayLocal(),
  })
  if (error) throw toAppError(error)
  return data
}

/** Eliminación permanente: borra también hábitos y registros. */
export async function deleteGoal(id: string): Promise<void> {
  const { error } = await supabase.from('goals').delete().eq('id', id)
  if (error) throw toAppError(error)
}
