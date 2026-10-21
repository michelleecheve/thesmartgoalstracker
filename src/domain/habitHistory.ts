import type { LocalDate } from '@/lib/dates'
import { completionKey, consistency, type Consistency, type HabitForStats } from './progress'
import { isScheduledOn, sortVersions, type ScheduleVersion } from './schedule'
import { currentStreak } from './stats'

/**
 * Historial de un hábito. Usa las mismas reglas que el resto de la app:
 * la constancia solo mide los días programados; los registros en días no
 * programados ("extra") cuentan como veces completadas, pero no en la constancia.
 */

export type HabitDayState =
  | 'completado' // programado y hecho
  | 'extra' // hecho en un día no programado
  | 'no_completado' // programado, ya pasó y no se hizo
  | 'pendiente' // programado hoy, aún sin hacer
  | 'programado' // programado en el futuro
  | 'libre' // no programado (o en pausa / fuera de fechas)

export function habitDayState(
  stat: HabitForStats,
  date: LocalDate,
  completions: ReadonlySet<string>,
  today: LocalDate,
): HabitDayState {
  const done = completions.has(completionKey(stat.id, date))
  const afterCutoff = stat.cutoff !== null && date > stat.cutoff
  const scheduled = !afterCutoff && isScheduledOn(stat.schedule, date)
  if (done) return scheduled ? 'completado' : 'extra'
  if (!scheduled) return 'libre'
  if (date > today) return 'programado'
  if (date === today || date === stat.cutoff) return 'pendiente'
  return 'no_completado'
}

export interface HabitCompletionEntry {
  date: LocalDate
  /** true si ese día no estaba programado. */
  extra: boolean
}

export interface HabitSummary {
  /** Todas las veces completado (incluye extras). */
  totalCompleted: number
  extras: number
  /** Constancia sobre los días programados hasta hoy. */
  consistency: Consistency
  streak: number
  /** Registros del más reciente al más antiguo. */
  history: HabitCompletionEntry[]
}

export function summarizeHabit(
  stat: HabitForStats,
  completionDates: LocalDate[],
  completions: ReadonlySet<string>,
  today: LocalDate,
): HabitSummary {
  const history = [...new Set(completionDates)]
    .filter((d) => d <= today)
    .sort((a, b) => (a < b ? 1 : -1))
    .map((date) => {
      const state = habitDayState(stat, date, completions, today)
      return { date, extra: state === 'extra' }
    })
  return {
    totalCompleted: history.length,
    extras: history.filter((h) => h.extra).length,
    consistency: consistency([stat], completions, stat.schedule.startDate, today, today),
    streak: currentStreak([stat], completions, today, stat.schedule.startDate),
    history,
  }
}

/** Versiones de frecuencia, de la más reciente a la más antigua (la primera rige desde el inicio). */
export function frequencyTimeline(versions: ScheduleVersion[], startDate: LocalDate): { from: LocalDate; version: ScheduleVersion }[] {
  const sorted = sortVersions(versions)
  return sorted
    .map((version, i) => ({ from: i === 0 && startDate < version.effectiveFrom ? startDate : version.effectiveFrom, version }))
    .reverse()
}
