import { diffDays, minDate, type LocalDate } from '@/lib/dates'
import { scheduledDates, type HabitSchedule } from './schedule'

/**
 * Progreso y constancia. Se distinguen dos conceptos:
 *  1. Avance hacia la meta: valor actual / valor objetivo del indicador numérico.
 *  2. Constancia de hábitos: ocurrencias completadas / ocurrencias programadas.
 * Nunca se mezclan, y una meta nunca se completa automáticamente.
 */

/** Avance hacia la meta (0–100) o null si la meta no tiene indicador numérico. */
export function metricProgress(goal: { metricTarget: number | null; metricCurrent: number }): number | null {
  if (goal.metricTarget === null || goal.metricTarget <= 0) return null
  return Math.min(100, Math.max(0, (goal.metricCurrent / goal.metricTarget) * 100))
}

export type OccurrenceStatus = 'completado' | 'no_completado' | 'pendiente' | 'programado'

/**
 * Estado de una ocurrencia programada:
 *  - completado: tiene registro.
 *  - no_completado: el día ya pasó sin registro.
 *  - pendiente: es hoy y aún no se registra.
 *  - programado: es un día futuro (no se puede marcar todavía).
 */
export function occurrenceStatus(date: LocalDate, today: LocalDate, completed: boolean): OccurrenceStatus {
  if (completed) return 'completado'
  if (date < today) return 'no_completado'
  if (date === today) return 'pendiente'
  return 'programado'
}

export interface HabitForStats {
  id: string
  schedule: HabitSchedule
  /**
   * Último día en que el hábito pudo contar (fecha de archivado del hábito, o
   * de completado/archivado de su meta). null si sigue vigente.
   */
  cutoff: LocalDate | null
}

export interface Consistency {
  scheduled: number
  completed: number
  /** Porcentaje 0–100, o null si no hay ocurrencias que evaluar. */
  rate: number | null
}

/** Clave para buscar cumplimientos: `${habitId}|${fecha}`. */
export function completionKey(habitId: string, date: LocalDate): string {
  return `${habitId}|${date}`
}

/**
 * Constancia en [from, to]. Reglas:
 *  - Los días futuros no cuentan.
 *  - El último día evaluable (hoy, o el día de archivado/completado) solo
 *    cuenta si se completó: aún "pendiente" no penaliza.
 *  - Los días en pausa no tienen ocurrencias (ver schedule.ts).
 *  - Un registro en un día no programado no suma.
 */
export function consistency(
  habits: HabitForStats[],
  completions: ReadonlySet<string>,
  from: LocalDate,
  to: LocalDate,
  today: LocalDate,
): Consistency {
  let scheduled = 0
  let completed = 0

  for (const habit of habits) {
    const last = minDate(today, habit.cutoff)!
    const end = minDate(to, last)!
    for (const date of scheduledDates(habit.schedule, from, end)) {
      const done = completions.has(completionKey(habit.id, date))
      if (date < last) {
        scheduled++
        if (done) completed++
      } else if (done) {
        scheduled++
        completed++
      }
    }
  }

  return { scheduled, completed, rate: scheduled === 0 ? null : (completed / scheduled) * 100 }
}

/** Días que faltan para la fecha límite (negativo si ya venció). */
export function daysRemaining(deadline: LocalDate, today: LocalDate): number {
  return diffDays(deadline, today)
}

export function deadlineLabel(deadline: LocalDate, today: LocalDate): string {
  const days = daysRemaining(deadline, today)
  if (days === 0) return 'Vence hoy'
  if (days === 1) return 'Falta 1 día'
  if (days > 1) return `Faltan ${days} días`
  if (days === -1) return 'Venció ayer'
  return `Venció hace ${-days} días`
}

const percentFormat = new Intl.NumberFormat('es-MX', { maximumFractionDigits: 1 })

/** 58.333 → "58.3%" */
export function formatPercent(value: number): string {
  return `${percentFormat.format(value)}%`
}

export function formatNumber(value: number): string {
  return percentFormat.format(value)
}
