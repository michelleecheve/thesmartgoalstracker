import { diffDays, eachDay, isoWeekday, maxDate, minDate, type LocalDate } from '@/lib/dates'
import type { FrequencyType } from '@/types/database'

/**
 * Programación recurrente de hábitos.
 *
 * Reglas:
 *  - Un hábito solo ocurre entre su fecha de inicio y de fin (ambas inclusive).
 *  - La frecuencia de un día D la define la versión con el mayor
 *    effectiveFrom <= D. Así, cambiar la frecuencia no altera el pasado.
 *    Si D es anterior a todas las versiones (p. ej. se adelantó la fecha de
 *    inicio), se usa la primera versión.
 *  - "Cada N días" cuenta desde la fecha de inicio del hábito para la primera
 *    versión, y desde effectiveFrom para las versiones posteriores.
 *  - Los días en pausa (del hábito o de su meta) no tienen ocurrencias.
 *  - Las ocurrencias se calculan bajo demanda para un rango; nunca se guardan.
 */

export interface ScheduleVersion {
  effectiveFrom: LocalDate
  frequencyType: FrequencyType
  /** Días ISO: 1 = lunes … 7 = domingo. */
  weekdays: number[] | null
  intervalDays: number | null
}

export interface PausePeriod {
  startDate: LocalDate
  /** null = pausa vigente. Inclusivo. */
  endDate: LocalDate | null
}

export interface HabitSchedule {
  startDate: LocalDate
  endDate: LocalDate | null
  versions: ScheduleVersion[]
  /** Pausas del hábito y de su meta. */
  pauses: PausePeriod[]
}

export function sortVersions(versions: ScheduleVersion[]): ScheduleVersion[] {
  return [...versions].sort((a, b) => (a.effectiveFrom < b.effectiveFrom ? -1 : a.effectiveFrom > b.effectiveFrom ? 1 : 0))
}

/** Versión vigente en una fecha (las versiones deben venir ordenadas). */
export function resolveVersion(
  sorted: ScheduleVersion[],
  date: LocalDate,
): { version: ScheduleVersion; isFirst: boolean } | null {
  if (sorted.length === 0) return null
  let index = 0
  for (let i = 0; i < sorted.length; i++) {
    if (sorted[i]!.effectiveFrom <= date) index = i
    else break
  }
  return { version: sorted[index]!, isFirst: index === 0 }
}

export function matchesPattern(version: ScheduleVersion, anchor: LocalDate, date: LocalDate): boolean {
  switch (version.frequencyType) {
    case 'daily':
      return true
    case 'weekly':
      return (version.weekdays ?? []).includes(isoWeekday(date))
    case 'interval': {
      const n = version.intervalDays ?? 0
      if (n < 1) return false
      const diff = diffDays(date, anchor)
      return diff >= 0 && diff % n === 0
    }
  }
}

export function isPaused(pauses: PausePeriod[], date: LocalDate): boolean {
  return pauses.some((p) => p.startDate <= date && (p.endDate === null || date <= p.endDate))
}

export function isWithinHabitDates(habit: Pick<HabitSchedule, 'startDate' | 'endDate'>, date: LocalDate): boolean {
  return date >= habit.startDate && (habit.endDate === null || date <= habit.endDate)
}

function scheduledWith(habit: HabitSchedule, sorted: ScheduleVersion[], date: LocalDate): boolean {
  if (!isWithinHabitDates(habit, date)) return false
  if (isPaused(habit.pauses, date)) return false
  const resolved = resolveVersion(sorted, date)
  if (!resolved) return false
  const anchor = resolved.isFirst ? habit.startDate : resolved.version.effectiveFrom
  return matchesPattern(resolved.version, anchor, date)
}

/** ¿El hábito tiene una ocurrencia programada en esta fecha? */
export function isScheduledOn(habit: HabitSchedule, date: LocalDate): boolean {
  return scheduledWith(habit, sortVersions(habit.versions), date)
}

/** Fechas con ocurrencia programada dentro de [from, to]. */
export function scheduledDates(habit: HabitSchedule, from: LocalDate, to: LocalDate): LocalDate[] {
  const start = maxDate(from, habit.startDate)!
  const end = minDate(to, habit.endDate)!
  if (start > end) return []
  const sorted = sortVersions(habit.versions)
  return eachDay(start, end).filter((d) => scheduledWith(habit, sorted, d))
}

/** Versión que rige hoy, o la próxima si el hábito aún no empieza. */
export function currentVersion(habit: HabitSchedule, today: LocalDate): ScheduleVersion | null {
  const sorted = sortVersions(habit.versions)
  return resolveVersion(sorted, maxDate(today, habit.startDate)!)?.version ?? null
}
