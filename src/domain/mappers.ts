import { minDate, timestampToLocalDate, type LocalDate } from '@/lib/dates'
import type {
  GoalPauseRow,
  GoalRow,
  HabitPauseRow,
  HabitRow,
  HabitScheduleVersionRow,
} from '@/types/database'
import type { HabitForStats } from './progress'
import type { HabitSchedule, PausePeriod, ScheduleVersion } from './schedule'

export function toScheduleVersion(row: HabitScheduleVersionRow): ScheduleVersion {
  return {
    effectiveFrom: row.effective_from,
    frequencyType: row.frequency_type,
    weekdays: row.weekdays,
    intervalDays: row.interval_days,
  }
}

export function toPause(row: Pick<HabitPauseRow | GoalPauseRow, 'start_date' | 'end_date'>): PausePeriod {
  return { startDate: row.start_date, endDate: row.end_date }
}

export function toHabitSchedule(
  habit: HabitRow,
  versions: HabitScheduleVersionRow[],
  habitPauses: HabitPauseRow[],
  goalPauses: GoalPauseRow[],
): HabitSchedule {
  return {
    startDate: habit.start_date,
    endDate: habit.end_date,
    versions: versions.filter((v) => v.habit_id === habit.id).map(toScheduleVersion),
    pauses: [
      ...habitPauses.filter((p) => p.habit_id === habit.id).map(toPause),
      ...goalPauses.filter((p) => p.goal_id === habit.goal_id).map(toPause),
    ],
  }
}

/**
 * Último día en que un hábito cuenta para la constancia:
 * cuando se archivó el hábito, o cuando su meta se completó o archivó.
 */
export function habitCutoff(habit: HabitRow, goal: GoalRow | undefined): LocalDate | null {
  const dates = [habit.archived_at, goal?.completed_at, goal?.archived_at]
    .filter((t): t is string => Boolean(t))
    .map(timestampToLocalDate)
  return minDate(...dates)
}

export interface GoalBundleData {
  goals: GoalRow[]
  habits: HabitRow[]
  versions: HabitScheduleVersionRow[]
  habitPauses: HabitPauseRow[]
  goalPauses: GoalPauseRow[]
}

export function toHabitsForStats(data: GoalBundleData, habitFilter?: (h: HabitRow) => boolean): HabitForStats[] {
  const goalsById = new Map(data.goals.map((g) => [g.id, g]))
  return data.habits
    .filter((h) => (habitFilter ? habitFilter(h) : true))
    .map((h) => ({
      id: h.id,
      schedule: toHabitSchedule(h, data.versions, data.habitPauses, data.goalPauses),
      cutoff: habitCutoff(h, goalsById.get(h.goal_id)),
    }))
}
