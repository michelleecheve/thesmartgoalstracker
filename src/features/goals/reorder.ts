import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import type { GoalBundleData } from '@/domain/mappers'
import { saveGoalOrder } from '@/services/goals'
import { saveHabitOrder } from '@/services/habits'
import { toSpanishMessage } from '@/services/errors'
import { queryKeys } from './queries'

/** Guarda un orden con actualización inmediata; si falla, se revierte. */
function useReorder(table: 'goals' | 'habits', save: (orderedIds: string[]) => Promise<void>) {
  const client = useQueryClient()

  return useMutation({
    mutationFn: save,

    onMutate: async (orderedIds: string[]) => {
      await client.cancelQueries({ queryKey: queryKeys.goalBundle })
      const previous = client.getQueryData<GoalBundleData>(queryKeys.goalBundle)
      const position = new Map(orderedIds.map((id, i) => [id, i + 1]))
      const apply = <R extends { id: string; sort_order: number | null }>(rows: R[]): R[] =>
        rows.map((r) => (position.has(r.id) ? { ...r, sort_order: position.get(r.id)! } : r))
      client.setQueryData<GoalBundleData>(queryKeys.goalBundle, (old) =>
        old ? (table === 'goals' ? { ...old, goals: apply(old.goals) } : { ...old, habits: apply(old.habits) }) : old,
      )
      return { previous }
    },

    onError: (error, _ids, context) => {
      if (context?.previous) client.setQueryData(queryKeys.goalBundle, context.previous)
      toast.error(toSpanishMessage(error))
    },

    onSettled: () => client.invalidateQueries({ queryKey: queryKeys.goalBundle }),
  })
}

export const useReorderGoals = () => useReorder('goals', saveGoalOrder)
export const useReorderHabits = () => useReorder('habits', saveHabitOrder)
