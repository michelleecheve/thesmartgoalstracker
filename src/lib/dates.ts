import {
  addDays,
  addMonths,
  differenceInCalendarDays,
  endOfMonth,
  endOfWeek,
  format,
  getISODay,
  isValid,
  parseISO,
  startOfMonth,
  startOfWeek,
} from 'date-fns'
import { es } from 'date-fns/locale'

/**
 * Las fechas de calendario (días de hábitos, fechas límite) se manejan como
 * cadenas 'yyyy-MM-dd' en la zona horaria local del usuario, nunca como
 * instantes UTC. Así evitamos desfaces por zona horaria u horario de verano.
 * Al tener formato ISO, se pueden comparar directamente como texto.
 */
export type LocalDate = string

export function toLocalDate(date: Date): LocalDate {
  return format(date, 'yyyy-MM-dd')
}

export function todayLocal(): LocalDate {
  return toLocalDate(new Date())
}

/** Convierte 'yyyy-MM-dd' a un Date a medianoche local (no UTC). */
export function fromLocalDate(value: LocalDate): Date {
  return parseISO(value)
}

/** Día local en el que ocurrió una marca de tiempo (timestamptz). */
export function timestampToLocalDate(timestamp: string): LocalDate {
  return toLocalDate(new Date(timestamp))
}

export function addDaysLocal(date: LocalDate, days: number): LocalDate {
  return toLocalDate(addDays(fromLocalDate(date), days))
}

/** Diferencia en días de calendario: a − b. */
export function diffDays(a: LocalDate, b: LocalDate): number {
  return differenceInCalendarDays(fromLocalDate(a), fromLocalDate(b))
}

/** Día ISO de la semana: 1 = lunes … 7 = domingo. */
export function isoWeekday(date: LocalDate): number {
  return getISODay(fromLocalDate(date))
}

export function minDate(...dates: (LocalDate | null | undefined)[]): LocalDate | null {
  let result: LocalDate | null = null
  for (const d of dates) if (d && (result === null || d < result)) result = d
  return result
}

export function maxDate(...dates: (LocalDate | null | undefined)[]): LocalDate | null {
  let result: LocalDate | null = null
  for (const d of dates) if (d && (result === null || d > result)) result = d
  return result
}

/** Todos los días entre from y to (ambos inclusive). */
export function eachDay(from: LocalDate, to: LocalDate): LocalDate[] {
  const days: LocalDate[] = []
  for (let d = from; d <= to; d = addDaysLocal(d, 1)) days.push(d)
  return days
}

// --- Calendario (semanas de lunes a domingo) ---------------------------------

const WEEK = { weekStartsOn: 1 } as const

export function startOfWeekLocal(date: LocalDate): LocalDate {
  return toLocalDate(startOfWeek(fromLocalDate(date), WEEK))
}

export function endOfWeekLocal(date: LocalDate): LocalDate {
  return toLocalDate(endOfWeek(fromLocalDate(date), WEEK))
}

export function startOfMonthLocal(date: LocalDate): LocalDate {
  return toLocalDate(startOfMonth(fromLocalDate(date)))
}

export function endOfMonthLocal(date: LocalDate): LocalDate {
  return toLocalDate(endOfMonth(fromLocalDate(date)))
}

export function addMonthsLocal(date: LocalDate, months: number): LocalDate {
  return toLocalDate(addMonths(fromLocalDate(date), months))
}

export function isSameMonthLocal(a: LocalDate, b: LocalDate): boolean {
  return a.slice(0, 7) === b.slice(0, 7)
}

/** Los 7 días de la semana (lunes a domingo) que contiene la fecha. */
export function weekDays(date: LocalDate): LocalDate[] {
  return eachDay(startOfWeekLocal(date), endOfWeekLocal(date))
}

/** Días de la cuadrícula del mes: semanas completas de lunes a domingo. */
export function monthGridDays(date: LocalDate): LocalDate[] {
  return eachDay(startOfWeekLocal(startOfMonthLocal(date)), endOfWeekLocal(endOfMonthLocal(date)))
}

export function isValidLocalDate(value: string | null | undefined): value is LocalDate {
  return Boolean(value && /^\d{4}-\d{2}-\d{2}$/.test(value) && isValid(parseISO(value)) && toLocalDate(parseISO(value)) === value)
}

/** Formatea con la configuración regional en español. */
export function formatEs(date: Date | LocalDate, pattern: string): string {
  const d = typeof date === 'string' ? fromLocalDate(date) : date
  return format(d, pattern, { locale: es })
}

/** "lunes, 2 de noviembre" con la primera letra en mayúscula. */
export function formatLongDate(date: Date | LocalDate): string {
  return capitalize(formatEs(date, "EEEE, d 'de' MMMM"))
}

/** "31 mar 2027" */
export function formatShortDate(date: Date | LocalDate): string {
  return formatEs(date, 'd MMM yyyy').replace('.', '')
}

/** "31 de marzo de 2027" */
export function formatFullDate(date: Date | LocalDate): string {
  return formatEs(date, "d 'de' MMMM 'de' yyyy")
}

export function capitalize(text: string): string {
  return text.charAt(0).toUpperCase() + text.slice(1)
}
