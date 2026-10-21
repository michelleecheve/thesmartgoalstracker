import { useMemo } from 'react'
import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { endOfWeekLocal, monthGridDays, startOfWeekLocal, type LocalDate } from '@/lib/dates'
import { toHabitsForStats, type GoalBundleData } from '@/domain/mappers'
import { completionKey } from '@/domain/progress'
import type { AgendaContext } from '@/domain/agenda'
import { fetchCompletions, markCompleted, unmarkCompleted, type CompletionRef } from '@/services/completions'
import { toSpanishMessage } from '@/services/errors'
import { queryKeys } from '@/features/goals/queries'

/** Programación de todos los hábitos, calculada una sola vez por carga de datos. */
export function useAgendaContext(bundle: GoalBundleData | undefined): AgendaContext | null {
  return useMemo(
    () => (bundle ? { goals: bundle.goals, habits: bundle.habits, stats: toHabitsForStats(bundle) } : null),
    [bundle],
  )
}

/**
 * Cumplimientos de la cuadrícula del mes que contiene la fecha (semanas completas).
 * Cubre a la vez el selector de días, la semana y el mes.
 */
export function useMonthCompletions(date: LocalDate) {
  const days = monthGridDays(date)
  const from = days[0]!
  const to = days[days.length - 1]!
  const query = useQuery({
    queryKey: queryKeys.completions(from, to),
    queryFn: () => fetchCompletions(from, to),
    placeholderData: keepPreviousData,
  })
  const set = useMemo(() => new Set((query.data ?? []).map((c) => completionKey(c.habit_id, c.date))), [query.data])
  return { ...query, set }
}

/** Cumplimientos de la semana de hoy (para el progreso del encabezado). */
export function useTodayCompletions(today: LocalDate) {
  const from = startOfWeekLocal(today)
  const to = endOfWeekLocal(today)
  const query = useQuery({ queryKey: queryKeys.completions(from, to), queryFn: () => fetchCompletions(from, to) })
  const set = useMemo(() => new Set((query.data ?? []).map((c) => completionKey(c.habit_id, c.date))), [query.data])
  return { ...query, set }
}

interface ToggleInput {
  habitId: string
  date: LocalDate
  completed: boolean
}

/**
 * Marca o desmarca un hábito con actualización inmediata (optimista):
 * la pantalla cambia al instante y, si el servidor falla, se revierte.
 */
export function useToggleCompletion() {
  const client = useQueryClient()

  return useMutation({
    mutationFn: ({ habitId, date, completed }: ToggleInput) =>
      completed ? markCompleted(habitId, date) : unmarkCompleted(habitId, date),

    onMutate: async ({ habitId, date, completed }) => {
      await client.cancelQueries({ queryKey: queryKeys.allCompletions })
      const snapshot = client.getQueriesData<CompletionRef[]>({ queryKey: queryKeys.allCompletions })
      client.setQueriesData<CompletionRef[]>({ queryKey: queryKeys.allCompletions }, (old) => {
        if (!old) return old
        const without = old.filter((c) => !(c.habit_id === habitId && c.date === date))
        return completed ? [...without, { habit_id: habitId, date }] : without
      })
      return { snapshot }
    },

    onError: (error, _input, context) => {
      context?.snapshot.forEach(([key, data]) => client.setQueryData(key, data))
      toast.error(toSpanishMessage(error))
    },

    onSettled: () => client.invalidateQueries({ queryKey: queryKeys.allCompletions }),
  })
}
