import { useCallback, useMemo } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { minDate, todayLocal, type LocalDate } from '@/lib/dates'
import { completionKey } from '@/domain/progress'
import type { GoalBundleData } from '@/domain/mappers'
import { fetchGoalBundle } from '@/services/goals'
import { fetchCompletions } from '@/services/completions'

export const queryKeys = {
  goalBundle: ['goal-bundle'] as const,
  completions: (from: LocalDate, to: LocalDate) => ['completions', from, to] as const,
  allCompletions: ['completions'] as const,
}

/** Metas, hábitos, versiones y pausas del usuario. */
export function useGoalBundle() {
  return useQuery({ queryKey: queryKeys.goalBundle, queryFn: fetchGoalBundle })
}

/** Cumplimientos en un rango, como conjunto de claves `${habitId}|${fecha}`. */
export function useCompletionSet(from: LocalDate | null, to: LocalDate) {
  const query = useQuery({
    queryKey: queryKeys.completions(from ?? '', to),
    queryFn: () => fetchCompletions(from!, to),
    enabled: Boolean(from),
  })
  const set = useMemo(
    () => new Set((query.data ?? []).map((c) => completionKey(c.habit_id, c.date))),
    [query.data],
  )
  return { ...query, set }
}

/** Fecha más antigua con datos (inicio de metas o hábitos), para calcular la constancia total. */
export function earliestDate(bundle: GoalBundleData | undefined): LocalDate | null {
  if (!bundle) return null
  return minDate(...bundle.goals.map((g) => g.start_date), ...bundle.habits.map((h) => h.start_date))
}

/** Todos los cumplimientos desde el inicio hasta hoy. */
export function useAllCompletions(bundle: GoalBundleData | undefined) {
  const from = earliestDate(bundle)
  const today = todayLocal()
  return useCompletionSet(from && from <= today ? from : null, today)
}

/** Refresca los datos después de un cambio. */
export function useRefreshGoals() {
  const client = useQueryClient()
  return useCallback(
    () =>
      Promise.all([
        client.invalidateQueries({ queryKey: queryKeys.goalBundle }),
        client.invalidateQueries({ queryKey: queryKeys.allCompletions }),
      ]),
    [client],
  )
}
