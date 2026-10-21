import { describe, expect, it } from 'vitest'
import {
  completionKey,
  consistency,
  deadlineLabel,
  formatPercent,
  metricProgress,
  occurrenceStatus,
  type HabitForStats,
} from './progress'
import type { HabitSchedule } from './schedule'

const schedule = (overrides: Partial<HabitSchedule> = {}): HabitSchedule => ({
  startDate: '2026-11-01',
  endDate: '2027-03-31',
  versions: [{ effectiveFrom: '2026-11-01', frequencyType: 'daily', weekdays: null, intervalDays: null }],
  pauses: [],
  ...overrides,
})

const habit = (id: string, overrides: Partial<HabitSchedule> = {}, cutoff: string | null = null): HabitForStats => ({
  id,
  schedule: schedule(overrides),
  cutoff,
})

const done = (...pairs: [string, string][]) => new Set(pairs.map(([h, d]) => completionKey(h, d)))

describe('avance hacia la meta', () => {
  it('ejemplo de la especificación: 7 de 12 módulos = 58.3%', () => {
    const p = metricProgress({ metricTarget: 12, metricCurrent: 7 })!
    expect(formatPercent(p)).toBe('58.3%')
  })

  it('sin indicador numérico no hay porcentaje de avance', () => {
    expect(metricProgress({ metricTarget: null, metricCurrent: 0 })).toBeNull()
  })

  it('no supera el 100%', () => {
    expect(metricProgress({ metricTarget: 10, metricCurrent: 15 })).toBe(100)
  })
})

describe('estado de cada ocurrencia', () => {
  it('distingue completado, no completado, pendiente y programado', () => {
    expect(occurrenceStatus('2026-11-05', '2026-11-10', true)).toBe('completado')
    expect(occurrenceStatus('2026-11-05', '2026-11-10', false)).toBe('no_completado')
    expect(occurrenceStatus('2026-11-10', '2026-11-10', false)).toBe('pendiente')
    expect(occurrenceStatus('2026-11-11', '2026-11-10', false)).toBe('programado')
  })
})

describe('constancia de hábitos', () => {
  it('cuenta solo días pasados; hoy pendiente no penaliza', () => {
    const c = consistency([habit('a')], done(['a', '2026-11-01'], ['a', '2026-11-02']), '2026-11-01', '2026-11-30', '2026-11-04')
    // Días evaluables: 1, 2, 3 (hoy, día 4, aún pendiente).
    expect(c).toEqual({ scheduled: 3, completed: 2, rate: (2 / 3) * 100 })
  })

  it('hoy cuenta si ya se completó', () => {
    const c = consistency([habit('a')], done(['a', '2026-11-04']), '2026-11-04', '2026-11-04', '2026-11-04')
    expect(c).toEqual({ scheduled: 1, completed: 1, rate: 100 })
  })

  it('no incluye días futuros en el denominador', () => {
    const c = consistency([habit('a')], done(), '2026-11-01', '2026-11-30', '2026-11-01')
    expect(c).toEqual({ scheduled: 0, completed: 0, rate: null })
  })

  it('no penaliza los periodos en pausa', () => {
    const h = habit('a', { pauses: [{ startDate: '2026-11-02', endDate: '2026-11-03' }] })
    const c = consistency([h], done(['a', '2026-11-01'], ['a', '2026-11-04']), '2026-11-01', '2026-11-04', '2026-11-05')
    expect(c).toEqual({ scheduled: 2, completed: 2, rate: 100 })
  })

  it('ignora registros en días no programados', () => {
    const h = habit('a', {
      versions: [{ effectiveFrom: '2026-11-01', frequencyType: 'weekly', weekdays: [1], intervalDays: null }],
    })
    // 2026-11-03 es martes: no está programado.
    const c = consistency([h], done(['a', '2026-11-02'], ['a', '2026-11-03']), '2026-11-01', '2026-11-08', '2026-11-09')
    expect(c).toEqual({ scheduled: 1, completed: 1, rate: 100 })
  })

  it('deja de contar después de archivar o completar', () => {
    const c = consistency([habit('a', {}, '2026-11-03')], done(['a', '2026-11-01']), '2026-11-01', '2026-11-30', '2026-11-20')
    // Días 1 y 2 cuentan; el 3 (día de archivado) no se completó.
    expect(c).toEqual({ scheduled: 2, completed: 1, rate: 50 })
  })

  it('combina varios hábitos', () => {
    const c = consistency(
      [habit('a'), habit('b', { startDate: '2026-11-02' })],
      done(['a', '2026-11-01'], ['b', '2026-11-02']),
      '2026-11-01',
      '2026-11-02',
      '2026-11-03',
    )
    expect(c).toEqual({ scheduled: 3, completed: 2, rate: (2 / 3) * 100 })
  })
})

describe('fecha límite', () => {
  it('describe los días restantes', () => {
    expect(deadlineLabel('2026-11-10', '2026-11-10')).toBe('Vence hoy')
    expect(deadlineLabel('2026-11-11', '2026-11-10')).toBe('Falta 1 día')
    expect(deadlineLabel('2026-12-10', '2026-11-10')).toBe('Faltan 30 días')
    expect(deadlineLabel('2026-11-09', '2026-11-10')).toBe('Venció ayer')
    expect(deadlineLabel('2026-11-01', '2026-11-10')).toBe('Venció hace 9 días')
  })
})
