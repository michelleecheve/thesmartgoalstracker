import type { LocalDate } from '@/lib/dates'
import type { GoalRow, HabitRow } from '@/types/database'
import { completionKey, consistency, occurrenceStatus, type Consistency, type HabitForStats, type OccurrenceStatus } from './progress'
import { isScheduledOn } from './schedule'

/**
 * Agenda diaria y calendario. Inicio (Día, Semana y Mes) usa exclusivamente
 * estas funciones, que a su vez usan la misma programación (schedule.ts) y la
 * misma constancia (progress.ts) que Mis metas y Estadísticas.
 */

export interface AgendaContext {
  goals: GoalRow[]
  habits: HabitRow[]
  /** Programación de cada hábito (incluye pausas del hábito y de su meta). */
  stats: HabitForStats[]
}

export interface AgendaItem {
  habit: HabitRow
  completed: boolean
  status: OccurrenceStatus
}

export interface AgendaGroup {
  goal: GoalRow
  items: AgendaItem[]
  completed: number
  total: number
}

export interface DayAgenda {
  date: LocalDate
  groups: AgendaGroup[]
  completed: number
  total: number
  /** Porcentaje del día (0–100), o null si no hay hábitos programados. */
  percent: number | null
  isFuture: boolean
}

function byTimeThenName(a: HabitRow, b: HabitRow): number {
  if (a.time_of_day !== b.time_of_day) {
    if (!a.time_of_day) return 1
    if (!b.time_of_day) return -1
    return a.time_of_day < b.time_of_day ? -1 : 1
  }
  return a.name.localeCompare(b.name, 'es')
}

/** Hábitos programados en una fecha, agrupados por meta. */
export function buildDayAgenda(
  ctx: AgendaContext,
  date: LocalDate,
  completions: ReadonlySet<string>,
  today: LocalDate,
): DayAgenda {
  const statsById = new Map(ctx.stats.map((s) => [s.id, s]))
  const groups: AgendaGroup[] = []

  for (const goal of ctx.goals) {
    const items: AgendaItem[] = ctx.habits
      .filter((h) => h.goal_id === goal.id)
      .filter((h) => {
        const stat = statsById.get(h.id)
        return stat ? isScheduledOn(stat.schedule, date) : false
      })
      .sort(byTimeThenName)
      .map((habit) => {
        const completed = completions.has(completionKey(habit.id, date))
        return { habit, completed, status: occurrenceStatus(date, today, completed) }
      })
    if (items.length > 0) {
      groups.push({ goal, items, completed: items.filter((i) => i.completed).length, total: items.length })
    }
  }

  const total = groups.reduce((n, g) => n + g.total, 0)
  const completed = groups.reduce((n, g) => n + g.completed, 0)
  return {
    date,
    groups,
    total,
    completed,
    percent: total === 0 ? null : (completed / total) * 100,
    isFuture: date > today,
  }
}

export type DayIndicator =
  | { kind: 'empty' } // sin hábitos programados
  | { kind: 'future'; total: number } // programado, aún no llega
  | { kind: 'progress'; completed: number; total: number; ratio: number; isToday: boolean }

/** Indicador de cumplimiento para un día del calendario. */
export function dayIndicator(
  ctx: AgendaContext,
  date: LocalDate,
  completions: ReadonlySet<string>,
  today: LocalDate,
): DayIndicator {
  let total = 0
  let completed = 0
  for (const stat of ctx.stats) {
    if (!isScheduledOn(stat.schedule, date)) continue
    total++
    if (completions.has(completionKey(stat.id, date))) completed++
  }
  if (total === 0) return { kind: 'empty' }
  if (date > today) return { kind: 'future', total }
  return { kind: 'progress', completed, total, ratio: completed / total, isToday: date === today }
}

/**
 * Cumplimiento de un periodo (semana o mes). Usa la misma regla que las
 * estadísticas: días futuros no cuentan y hoy solo cuenta si ya se completó.
 */
export function periodConsistency(
  ctx: AgendaContext,
  from: LocalDate,
  to: LocalDate,
  completions: ReadonlySet<string>,
  today: LocalDate,
): Consistency {
  return consistency(ctx.stats, completions, from, to, today)
}
