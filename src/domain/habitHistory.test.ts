import { describe, expect, it } from 'vitest'
import type { GoalRow, HabitRow } from '@/types/database'
import { buildDayAgenda, extraCandidates, type AgendaContext } from './agenda'
import { frequencyTimeline, habitDayState, summarizeHabit } from './habitHistory'
import { completionKey, type HabitForStats } from './progress'
import type { ScheduleVersion } from './schedule'

const weekly = (from: string, days: number[]): ScheduleVersion => ({ effectiveFrom: from, frequencyType: 'weekly', weekdays: days, intervalDays: null })

// "Estudiar": lunes, miércoles y viernes desde el 1 de noviembre de 2026.
const stat = (overrides: Partial<HabitForStats> = {}): HabitForStats => ({
  id: 'h',
  schedule: { startDate: '2026-11-01', endDate: null, versions: [weekly('2026-11-01', [1, 3, 5])], pauses: [] },
  cutoff: null,
  ...overrides,
})
const done = (...dates: string[]) => new Set(dates.map((d) => completionKey('h', d)))

describe('estado de cada día de un hábito', () => {
  const c = done('2026-11-02', '2026-11-07') // lunes (programado) y sábado (extra)
  it('distingue completado, extra, no completado, pendiente, programado y libre', () => {
    const today = '2026-11-11' // miércoles
    expect(habitDayState(stat(), '2026-11-02', c, today)).toBe('completado')
    expect(habitDayState(stat(), '2026-11-07', c, today)).toBe('extra')
    expect(habitDayState(stat(), '2026-11-04', c, today)).toBe('no_completado')
    expect(habitDayState(stat(), '2026-11-11', c, today)).toBe('pendiente')
    expect(habitDayState(stat(), '2026-11-13', c, today)).toBe('programado')
    expect(habitDayState(stat(), '2026-11-10', c, today)).toBe('libre') // martes
  })

  it('los días en pausa son libres', () => {
    const s = stat({ schedule: { ...stat().schedule, pauses: [{ startDate: '2026-11-04', endDate: '2026-11-06' }] } })
    expect(habitDayState(s, '2026-11-04', c, '2026-11-11')).toBe('libre')
  })
})

describe('resumen del hábito', () => {
  it('cuenta todas las veces completadas, pero la constancia solo mide lo programado', () => {
    // Programados hasta el miércoles 11 (hoy, pendiente): 2, 4, 6, 9. Hechos: 2, 6, 9. Extra: sábado 7.
    const c = done('2026-11-02', '2026-11-06', '2026-11-07', '2026-11-09')
    const s = summarizeHabit(stat(), ['2026-11-02', '2026-11-06', '2026-11-07', '2026-11-09'], c, '2026-11-11')
    expect(s.totalCompleted).toBe(4)
    expect(s.extras).toBe(1)
    expect(s.consistency).toEqual({ scheduled: 4, completed: 3, rate: 75 })
    expect(s.streak).toBe(2) // viernes 6 y lunes 9; hoy pendiente no la rompe
    expect(s.history.map((h) => [h.date, h.extra])).toEqual([
      ['2026-11-09', false],
      ['2026-11-07', true],
      ['2026-11-06', false],
      ['2026-11-02', false],
    ])
  })

  it('sin registros', () => {
    const s = summarizeHabit(stat(), [], done(), '2026-11-11')
    expect(s).toMatchObject({ totalCompleted: 0, extras: 0, streak: 0, history: [] })
  })

  it('muestra los cambios de frecuencia del más reciente al más antiguo', () => {
    const t = frequencyTimeline([weekly('2026-12-01', [2, 4]), weekly('2026-11-01', [1, 3])], '2026-11-01')
    expect(t.map((x) => [x.from, x.version.weekdays])).toEqual([
      ['2026-12-01', [2, 4]],
      ['2026-11-01', [1, 3]],
    ])
  })
})

describe('hábitos extra en Inicio', () => {
  const goal = { id: 'g', name: 'Curso', status: 'active' } as GoalRow
  const habit = (id: string, extra: Partial<HabitRow> = {}) =>
    ({ id, goal_id: 'g', name: id, status: 'active', start_date: '2026-11-01', time_of_day: null, ...extra }) as HabitRow
  const ctx: AgendaContext = {
    goals: [goal],
    habits: [habit('h'), habit('futuro', { start_date: '2026-12-01' }), habit('pausado', { status: 'paused' })],
    stats: [stat(), stat({ id: 'futuro' }), stat({ id: 'pausado' })],
  }

  it('el día muestra los extras sin cambiar su porcentaje', () => {
    const a = buildDayAgenda(ctx, '2026-11-07', done('2026-11-07'), '2026-11-11') // sábado
    expect(a.groups).toEqual([])
    expect(a.percent).toBeNull()
    expect(a.extras.map((e) => e.habit.id)).toEqual(['h'])
  })

  it('propone solo hábitos activos, ya iniciados, no programados y no registrados', () => {
    expect(extraCandidates(ctx, '2026-11-07', done(), '2026-11-11').map((e) => e.habit.id)).toEqual(['h'])
    // Ya registrado como extra: no se vuelve a proponer.
    expect(extraCandidates(ctx, '2026-11-07', done('2026-11-07'), '2026-11-11')).toEqual([])
    // Si estaba programado ese día (lunes), no es extra.
    expect(extraCandidates(ctx, '2026-11-02', done(), '2026-11-11')).toEqual([])
  })

  it('nunca en fechas futuras', () => {
    expect(extraCandidates(ctx, '2026-11-14', done(), '2026-11-11')).toEqual([])
  })
})
