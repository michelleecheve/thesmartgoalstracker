import { describe, expect, it } from 'vitest'
import { isValidLocalDate, monthGridDays, startOfWeekLocal, weekDays } from '@/lib/dates'
import type { GoalRow, HabitRow } from '@/types/database'
import { buildDayAgenda, dayIndicator, periodConsistency, type AgendaContext } from './agenda'
import { completionKey, type HabitForStats } from './progress'
import type { ScheduleVersion } from './schedule'

const goal = (id: string, name: string): GoalRow =>
  ({ id, name, color: 'sage', status: 'active' }) as GoalRow

const habit = (id: string, goalId: string, name: string, time: string | null = null): HabitRow =>
  ({ id, goal_id: goalId, name, time_of_day: time, color: null, status: 'active' }) as HabitRow

const weekly = (days: number[]): ScheduleVersion => ({
  effectiveFrom: '2026-11-01',
  frequencyType: 'weekly',
  weekdays: days,
  intervalDays: null,
})

const stat = (id: string, versions: ScheduleVersion[], pauses: HabitForStats['schedule']['pauses'] = []): HabitForStats => ({
  id,
  schedule: { startDate: '2026-11-01', endDate: '2027-03-31', versions, pauses },
  cutoff: null,
})

// Ejemplo de la especificación.
const ctx: AgendaContext = {
  goals: [goal('coursera', 'Completar curso de Coursera'), goal('fisica', 'Mejorar mi condición física')],
  habits: [
    habit('estudiar', 'coursera', 'Estudiar 45 minutos'),
    habit('repasar', 'coursera', 'Repasar apuntes'),
    habit('entrenar', 'fisica', 'Entrenamiento matutino', '07:00'),
    habit('estirar', 'fisica', 'Estiramientos de 15 minutos', null),
  ],
  stats: [
    stat('estudiar', [weekly([1, 3, 5])]),
    stat('repasar', [weekly([1, 7])]),
    stat('entrenar', [weekly([1, 2, 3, 4, 5])]),
    stat('estirar', [weekly([1, 3])], [{ startDate: '2026-11-04', endDate: null }]),
  ],
}

const done = (...pairs: [string, string][]) => new Set(pairs.map(([h, d]) => completionKey(h, d)))

describe('agenda del día', () => {
  it('ejemplo de la especificación: lunes 2 de noviembre agrupado por meta', () => {
    const a = buildDayAgenda(ctx, '2026-11-02', done(['entrenar', '2026-11-02']), '2026-11-02')
    expect(a.groups.map((g) => g.goal.name)).toEqual(['Completar curso de Coursera', 'Mejorar mi condición física'])
    expect(a.groups[0]!.items.map((i) => i.habit.name)).toEqual(['Estudiar 45 minutos', 'Repasar apuntes'])
    // Primero los que tienen hora.
    expect(a.groups[1]!.items.map((i) => [i.habit.name, i.completed])).toEqual([
      ['Entrenamiento matutino', true],
      ['Estiramientos de 15 minutos', false],
    ])
    expect(a.groups[1]).toMatchObject({ completed: 1, total: 2 })
    expect(a).toMatchObject({ completed: 1, total: 4, percent: 25, isFuture: false })
  })

  it('solo muestra los hábitos programados ese día', () => {
    const a = buildDayAgenda(ctx, '2026-11-03', done(), '2026-11-03') // martes
    expect(a.groups.flatMap((g) => g.items.map((i) => i.habit.id))).toEqual(['entrenar'])
  })

  it('oculta hábitos en pausa', () => {
    const a = buildDayAgenda(ctx, '2026-11-09', done(), '2026-11-09') // lunes, "estirar" en pausa desde el 4
    expect(a.groups.flatMap((g) => g.items.map((i) => i.habit.id))).not.toContain('estirar')
  })

  it('omite metas sin hábitos ese día y maneja días vacíos', () => {
    const a = buildDayAgenda(ctx, '2026-11-07', done(), '2026-11-07') // sábado
    expect(a).toMatchObject({ groups: [], total: 0, percent: null })
  })

  it('distingue pendiente, no completado y programado', () => {
    const past = buildDayAgenda(ctx, '2026-11-02', done(), '2026-11-10')
    expect(past.groups[0]!.items[0]!.status).toBe('no_completado')
    const now = buildDayAgenda(ctx, '2026-11-10', done(), '2026-11-10')
    expect(now.groups[0]!.items[0]!.status).toBe('pendiente')
    const future = buildDayAgenda(ctx, '2026-11-16', done(), '2026-11-10')
    expect(future.isFuture).toBe(true)
    expect(future.groups[0]!.items[0]!.status).toBe('programado')
  })
})

describe('indicadores del calendario', () => {
  it('describe días vacíos, futuros y con progreso', () => {
    const c = done(['estudiar', '2026-11-02'], ['repasar', '2026-11-02'])
    expect(dayIndicator(ctx, '2026-11-07', c, '2026-11-10')).toEqual({ kind: 'empty' })
    expect(dayIndicator(ctx, '2026-11-16', c, '2026-11-10')).toEqual({ kind: 'future', total: 3 }) // "estirar" está en pausa
    expect(dayIndicator(ctx, '2026-11-02', c, '2026-11-10')).toEqual({
      kind: 'progress',
      completed: 2,
      total: 4,
      ratio: 0.5,
      isToday: false,
    })
  })
})

describe('cumplimiento del periodo', () => {
  it('no cuenta los días futuros de la semana', () => {
    // Semana del 2 al 8 de noviembre; hoy es miércoles 4.
    const c = done(['estudiar', '2026-11-02'], ['repasar', '2026-11-02'], ['entrenar', '2026-11-02'], ['entrenar', '2026-11-03'])
    const s = periodConsistency(ctx, '2026-11-02', '2026-11-08', c, '2026-11-04')
    // Lunes: 4 programados (3 hechos). Martes: 1 (hecho). Miércoles (hoy) pendiente: no cuenta.
    expect(s).toEqual({ scheduled: 5, completed: 4, rate: 80 })
  })
})

describe('calendario', () => {
  it('las semanas empiezan en lunes', () => {
    expect(startOfWeekLocal('2026-11-01')).toBe('2026-10-26') // domingo → lunes anterior
    expect(weekDays('2026-11-04')).toEqual([
      '2026-11-02',
      '2026-11-03',
      '2026-11-04',
      '2026-11-05',
      '2026-11-06',
      '2026-11-07',
      '2026-11-08',
    ])
  })

  it('la cuadrícula del mes son semanas completas', () => {
    const grid = monthGridDays('2026-11-15')
    expect(grid[0]).toBe('2026-10-26')
    expect(grid.at(-1)).toBe('2026-12-06')
    expect(grid.length % 7).toBe(0)
  })

  it('cruza el cambio de año', () => {
    const grid = monthGridDays('2027-01-10')
    expect(grid[0]).toBe('2026-12-28')
    expect(grid).toContain('2027-01-31')
  })

  it('valida fechas de la URL', () => {
    expect(isValidLocalDate('2026-11-02')).toBe(true)
    expect(isValidLocalDate('2026-02-30')).toBe(false)
    expect(isValidLocalDate('hola')).toBe(false)
    expect(isValidLocalDate(null)).toBe(false)
  })
})
