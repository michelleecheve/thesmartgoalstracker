import {
  addDaysLocal,
  addMonthsLocal,
  diffDays,
  eachDay,
  endOfMonthLocal,
  endOfWeekLocal,
  maxDate,
  minDate,
  startOfMonthLocal,
  startOfWeekLocal,
  type LocalDate,
} from '@/lib/dates'
import type { GoalRow, HabitRow } from '@/types/database'
import { completionKey, consistency, daysRemaining, type Consistency, type HabitForStats } from './progress'
import { isScheduledOn } from './schedule'

/**
 * Estadísticas. Todo se calcula con las mismas reglas de progress.ts:
 *  - Los días futuros no entran en el denominador.
 *  - Hoy solo cuenta si ya se completó (pendiente ≠ incumplido).
 *  - Se respetan inicio/fin, frecuencias, versiones históricas y pausas.
 *  - Metas completadas y archivadas: su historial cuenta hasta el día en que
 *    cambiaron de estado (desde ahí tienen una pausa abierta); después, no.
 */

export type PeriodKind = 'semana' | 'mes' | 'mes_anterior' | 'rango'

export interface Period {
  from: LocalDate
  to: LocalDate
}

export function resolvePeriod(kind: PeriodKind, today: LocalDate, custom?: Period): Period {
  switch (kind) {
    case 'semana':
      return { from: startOfWeekLocal(today), to: endOfWeekLocal(today) }
    case 'mes':
      return { from: startOfMonthLocal(today), to: endOfMonthLocal(today) }
    case 'mes_anterior': {
      const prev = addMonthsLocal(startOfMonthLocal(today), -1)
      return { from: prev, to: endOfMonthLocal(prev) }
    }
    case 'rango':
      return custom ?? { from: addDaysLocal(today, -29), to: today }
  }
}

/** Parte transcurrida del periodo (hasta hoy), o null si el periodo es futuro. */
export function elapsedPeriod(period: Period, today: LocalDate): Period | null {
  const to = minDate(period.to, today)!
  return to < period.from ? null : { from: period.from, to }
}

export interface SeriesPoint {
  /** Primer día del punto (el día, o el lunes de la semana). */
  date: LocalDate
  /** Último día del punto. */
  end: LocalDate
  scheduled: number
  completed: number
  /** Porcentaje 0–100, o null si no hubo hábitos que evaluar. */
  rate: number | null
}

export type Granularity = 'dia' | 'semana'

/** Diario para periodos cortos; semanal para más de 45 días. */
export function granularityFor(period: Period): Granularity {
  return diffDays(period.to, period.from) + 1 > 45 ? 'semana' : 'dia'
}

function point(stats: HabitForStats[], completions: ReadonlySet<string>, from: LocalDate, to: LocalDate, today: LocalDate): SeriesPoint {
  const c = consistency(stats, completions, from, to, today)
  return { date: from, end: to, ...c }
}

/** Evolución del cumplimiento a lo largo del periodo transcurrido. */
export function consistencySeries(
  stats: HabitForStats[],
  completions: ReadonlySet<string>,
  period: Period,
  today: LocalDate,
  granularity: Granularity,
): SeriesPoint[] {
  const elapsed = elapsedPeriod(period, today)
  if (!elapsed) return []
  if (granularity === 'dia') {
    return eachDay(elapsed.from, elapsed.to).map((d) => point(stats, completions, d, d, today))
  }
  const points: SeriesPoint[] = []
  for (let week = startOfWeekLocal(elapsed.from); week <= elapsed.to; week = addDaysLocal(week, 7)) {
    const from = maxDate(week, elapsed.from)!
    const to = minDate(endOfWeekLocal(week), elapsed.to)!
    points.push(point(stats, completions, from, to, today))
  }
  return points
}

export interface HabitRank {
  habit: HabitRow
  consistency: Consistency
}

/** Hábitos ordenados de mayor a menor constancia en el periodo (solo los que tuvieron días que evaluar). */
export function rankHabits(
  habits: HabitRow[],
  stats: HabitForStats[],
  completions: ReadonlySet<string>,
  period: Period,
  today: LocalDate,
): HabitRank[] {
  const statById = new Map(stats.map((s) => [s.id, s]))
  return habits
    .map((habit) => {
      const stat = statById.get(habit.id)
      return { habit, consistency: stat ? consistency([stat], completions, period.from, period.to, today) : null }
    })
    .filter((r): r is HabitRank => r.consistency !== null && r.consistency.rate !== null)
    .sort(
      (a, b) =>
        b.consistency.rate! - a.consistency.rate! ||
        b.consistency.scheduled - a.consistency.scheduled ||
        a.habit.name.localeCompare(b.habit.name, 'es'),
    )
}

/**
 * Totales de un día para la racha. Usa la misma regla de corte que la
 * constancia: después de archivar/completar no cuenta; ese mismo día, solo si se completó.
 */
function dayTotals(stats: HabitForStats[], completions: ReadonlySet<string>, date: LocalDate) {
  let total = 0
  let done = 0
  for (const s of stats) {
    if (s.cutoff && date > s.cutoff) continue
    if (!isScheduledOn(s.schedule, date)) continue
    const completed = completions.has(completionKey(s.id, date))
    if (s.cutoff && date === s.cutoff && !completed) continue
    total++
    if (completed) done++
  }
  return { total, done }
}

/**
 * Racha actual: días seguidos en los que completaste TODOS los hábitos programados.
 *  - Los días sin hábitos programados (o en pausa) no rompen ni suman.
 *  - Hoy suma si ya completaste todo; si aún no, no rompe la racha.
 */
export function currentStreak(
  stats: HabitForStats[],
  completions: ReadonlySet<string>,
  today: LocalDate,
  earliest: LocalDate | null,
): number {
  if (!earliest) return 0
  let streak = 0
  for (let d = today; d >= earliest; d = addDaysLocal(d, -1)) {
    const { total, done } = dayTotals(stats, completions, d)
    if (total === 0) continue
    if (done === total) streak++
    else if (d === today) continue
    else break
  }
  return streak
}

export type DeadlineBucket = 'vencida' | 'semana' | 'mes' | 'despues'

export const deadlineBucketLabels: Record<DeadlineBucket, string> = {
  vencida: 'Vencidas',
  semana: 'Vencen en los próximos 7 días',
  mes: 'Vencen en los próximos 30 días',
  despues: 'Más adelante',
}

export function deadlineBucket(daysLeft: number): DeadlineBucket {
  if (daysLeft < 0) return 'vencida'
  if (daysLeft <= 7) return 'semana'
  if (daysLeft <= 30) return 'mes'
  return 'despues'
}

/** Solo metas activas, agrupadas por cercanía de su fecha límite. */
export function upcomingDeadlines(goals: GoalRow[], today: LocalDate) {
  const buckets: Record<DeadlineBucket, { goal: GoalRow; daysLeft: number }[]> = {
    vencida: [],
    semana: [],
    mes: [],
    despues: [],
  }
  for (const goal of goals) {
    if (goal.status !== 'active') continue
    const daysLeft = daysRemaining(goal.deadline, today)
    buckets[deadlineBucket(daysLeft)].push({ goal, daysLeft })
  }
  for (const list of Object.values(buckets)) list.sort((a, b) => a.daysLeft - b.daysLeft)
  return buckets
}
