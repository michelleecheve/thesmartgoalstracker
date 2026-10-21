import type { LocalDate } from '@/lib/dates'
import { toHabitsForStats, type GoalBundleData } from '@/domain/mappers'
import { consistency, daysRemaining, metricProgress, type Consistency } from '@/domain/progress'
import type { GoalRow, GoalStatus, HabitRow } from '@/types/database'

export interface GoalSummary {
  goal: GoalRow
  /** Hábitos no archivados. */
  habits: HabitRow[]
  archivedHabits: HabitRow[]
  /** Avance hacia la meta (0–100) o null sin indicador numérico. */
  metric: number | null
  /** Constancia de hábitos desde el inicio de la meta. */
  consistency: Consistency
  daysLeft: number
}

export function buildGoalSummary(
  bundle: GoalBundleData,
  goal: GoalRow,
  completions: ReadonlySet<string>,
  today: LocalDate,
): GoalSummary {
  const goalHabits = bundle.habits.filter((h) => h.goal_id === goal.id)
  const stats = toHabitsForStats(bundle, (h) => h.goal_id === goal.id)
  const from = goalHabits.reduce((min, h) => (h.start_date < min ? h.start_date : min), goal.start_date)

  return {
    goal,
    habits: goalHabits.filter((h) => h.status !== 'archived'),
    archivedHabits: goalHabits.filter((h) => h.status === 'archived'),
    metric: metricProgress({ metricTarget: goal.metric_target, metricCurrent: goal.metric_current }),
    consistency: consistency(stats, completions, from, today, today),
    daysLeft: daysRemaining(goal.deadline, today),
  }
}

export type GoalFilter = 'activas' | 'completadas' | 'archivadas'

const filterStatuses: Record<GoalFilter, GoalStatus[]> = {
  activas: ['active', 'paused'],
  completadas: ['completed'],
  archivadas: ['archived'],
}

/** Metas de un filtro, ordenadas por fecha límite (las activas primero que las pausadas). */
export function filterGoals(goals: GoalRow[], filter: GoalFilter): GoalRow[] {
  const statuses = filterStatuses[filter]
  return goals
    .filter((g) => statuses.includes(g.status))
    .sort((a, b) => {
      if (a.status !== b.status) return a.status === 'active' ? -1 : b.status === 'active' ? 1 : 0
      return a.deadline < b.deadline ? -1 : a.deadline > b.deadline ? 1 : 0
    })
}
