import { describe, expect, it } from 'vitest'
import type { GoalRow, HabitRow } from '@/types/database'
import { completionKey, type HabitForStats } from './progress'
import type { ScheduleVersion } from './schedule'
import {
  consistencySeries,
  currentStreak,
  deadlineBucket,
  elapsedPeriod,
  granularityFor,
  rankHabits,
  resolvePeriod,
  upcomingDeadlines,
} from './stats'

const daily: ScheduleVersion = { effectiveFrom: '2026-11-01', frequencyType: 'daily', weekdays: null, intervalDays: null }
const weekly = (days: number[]): ScheduleVersion => ({ ...daily, frequencyType: 'weekly', weekdays: days })

const stat = (id: string, versions = [daily], extra: Partial<HabitForStats['schedule']> = {}, cutoff: string | null = null): HabitForStats => ({
  id,
  schedule: { startDate: '2026-11-01', endDate: null, versions, pauses: [], ...extra },
  cutoff,
})
const done = (...pairs: [string, string][]) => new Set(pairs.map(([h, d]) => completionKey(h, d)))
const habit = (id: string, name: string) => ({ id, name }) as HabitRow

describe('periodos', () => {
  it('resuelve esta semana, este mes y el mes anterior', () => {
    expect(resolvePeriod('semana', '2026-11-04')).toEqual({ from: '2026-11-02', to: '2026-11-08' })
    expect(resolvePeriod('mes', '2026-11-04')).toEqual({ from: '2026-11-01', to: '2026-11-30' })
    expect(resolvePeriod('mes_anterior', '2026-11-04')).toEqual({ from: '2026-10-01', to: '2026-10-31' })
    expect(resolvePeriod('mes_anterior', '2027-01-15')).toEqual({ from: '2026-12-01', to: '2026-12-31' })
  })

  it('el rango personalizado usa las fechas elegidas', () => {
    expect(resolvePeriod('rango', '2026-11-04', { from: '2026-09-01', to: '2026-09-30' })).toEqual({
      from: '2026-09-01',
      to: '2026-09-30',
    })
  })

  it('solo considera la parte transcurrida', () => {
    expect(elapsedPeriod({ from: '2026-11-01', to: '2026-11-30' }, '2026-11-04')).toEqual({ from: '2026-11-01', to: '2026-11-04' })
    expect(elapsedPeriod({ from: '2026-12-01', to: '2026-12-31' }, '2026-11-04')).toBeNull()
  })

  it('usa puntos diarios hasta 45 días y semanales después', () => {
    expect(granularityFor({ from: '2026-11-01', to: '2026-11-30' })).toBe('dia')
    expect(granularityFor({ from: '2026-09-01', to: '2026-11-30' })).toBe('semana')
  })
})

describe('evolución del cumplimiento', () => {
  it('serie diaria: no incluye días futuros y hoy pendiente queda sin dato', () => {
    const s = consistencySeries([stat('a')], done(['a', '2026-11-01']), { from: '2026-11-01', to: '2026-11-30' }, '2026-11-03', 'dia')
    expect(s.map((p) => [p.date, p.rate])).toEqual([
      ['2026-11-01', 100],
      ['2026-11-02', 0],
      ['2026-11-03', null],
    ])
  })

  it('serie semanal agrupa de lunes a domingo y recorta al periodo', () => {
    const s = consistencySeries([stat('a')], done(['a', '2026-11-02']), { from: '2026-11-01', to: '2026-11-30' }, '2026-11-10', 'semana')
    expect(s.map((p) => [p.date, p.end, p.scheduled, p.completed])).toEqual([
      ['2026-11-01', '2026-11-01', 1, 0], // domingo 1 (semana iniciada en octubre)
      ['2026-11-02', '2026-11-08', 7, 1],
      ['2026-11-09', '2026-11-10', 1, 0], // hoy (10) pendiente no cuenta
    ])
  })
})

describe('hábitos con mayor y menor constancia', () => {
  it('ordena por constancia y excluye hábitos sin días evaluados', () => {
    const stats = [stat('a'), stat('b'), stat('c', [daily], { startDate: '2026-12-01' })]
    const c = done(['a', '2026-11-01'], ['a', '2026-11-02'], ['b', '2026-11-01'])
    const r = rankHabits([habit('a', 'Leer'), habit('b', 'Correr'), habit('c', 'Futuro')], stats, c, { from: '2026-11-01', to: '2026-11-30' }, '2026-11-03')
    expect(r.map((x) => [x.habit.name, x.consistency.rate])).toEqual([
      ['Leer', 100],
      ['Correr', 50],
    ])
  })
})

describe('racha actual', () => {
  it('cuenta días seguidos con todo completado; hoy pendiente no la rompe', () => {
    const c = done(['a', '2026-11-01'], ['a', '2026-11-02'], ['a', '2026-11-03'])
    expect(currentStreak([stat('a')], c, '2026-11-04', '2026-11-01')).toBe(3)
  })

  it('hoy suma si ya se completó', () => {
    const c = done(['a', '2026-11-03'], ['a', '2026-11-04'])
    expect(currentStreak([stat('a')], c, '2026-11-04', '2026-11-01')).toBe(2)
  })

  it('un día incompleto la rompe', () => {
    const c = done(['a', '2026-11-01'], ['a', '2026-11-03'])
    expect(currentStreak([stat('a')], c, '2026-11-04', '2026-11-01')).toBe(1)
  })

  it('los días sin hábitos programados no la rompen', () => {
    // Lunes y miércoles: el martes no hay nada programado.
    const c = done(['a', '2026-11-02'], ['a', '2026-11-04'])
    expect(currentStreak([stat('a', [weekly([1, 3])])], c, '2026-11-04', '2026-11-01')).toBe(2)
  })

  it('las pausas no la rompen', () => {
    const s = stat('a', [daily], { pauses: [{ startDate: '2026-11-02', endDate: '2026-11-03' }] })
    expect(currentStreak([s], done(['a', '2026-11-01'], ['a', '2026-11-04']), '2026-11-04', '2026-11-01')).toBe(2)
  })

  it('exige todos los hábitos del día', () => {
    const c = done(['a', '2026-11-03'], ['b', '2026-11-03'], ['a', '2026-11-02'])
    expect(currentStreak([stat('a'), stat('b')], c, '2026-11-03', '2026-11-01')).toBe(1)
  })

  it('sin datos es cero', () => {
    expect(currentStreak([stat('a')], done(), '2026-11-04', null)).toBe(0)
  })
})

describe('metas próximas a vencer', () => {
  it('clasifica por días restantes', () => {
    expect(deadlineBucket(-1)).toBe('vencida')
    expect(deadlineBucket(0)).toBe('semana')
    expect(deadlineBucket(7)).toBe('semana')
    expect(deadlineBucket(8)).toBe('mes')
    expect(deadlineBucket(30)).toBe('mes')
    expect(deadlineBucket(31)).toBe('despues')
  })

  it('solo incluye metas activas', () => {
    const goals = [
      { id: '1', status: 'active', deadline: '2026-11-01' },
      { id: '2', status: 'paused', deadline: '2026-11-05' },
      { id: '3', status: 'completed', deadline: '2026-11-05' },
      { id: '4', status: 'active', deadline: '2026-11-08' },
      { id: '5', status: 'active', deadline: '2027-06-01' },
    ] as GoalRow[]
    const b = upcomingDeadlines(goals, '2026-11-04')
    expect(b.vencida.map((x) => x.goal.id)).toEqual(['1'])
    expect(b.semana.map((x) => [x.goal.id, x.daysLeft])).toEqual([['4', 4]])
    expect(b.mes).toEqual([])
    expect(b.despues.map((x) => x.goal.id)).toEqual(['5'])
  })
})
