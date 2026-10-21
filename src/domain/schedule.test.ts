import { describe, expect, it } from 'vitest'
import { eachDay, isoWeekday } from '@/lib/dates'
import { currentVersion, isScheduledOn, scheduledDates, type HabitSchedule, type ScheduleVersion } from './schedule'
import { describeFrequency } from './labels'

const weekly = (effectiveFrom: string, weekdays: number[]): ScheduleVersion => ({
  effectiveFrom,
  frequencyType: 'weekly',
  weekdays,
  intervalDays: null,
})
const daily = (effectiveFrom: string): ScheduleVersion => ({
  effectiveFrom,
  frequencyType: 'daily',
  weekdays: null,
  intervalDays: null,
})
const every = (effectiveFrom: string, n: number): ScheduleVersion => ({
  effectiveFrom,
  frequencyType: 'interval',
  weekdays: null,
  intervalDays: n,
})

function habit(overrides: Partial<HabitSchedule>): HabitSchedule {
  return { startDate: '2026-11-01', endDate: '2027-03-31', versions: [daily('2026-11-01')], pauses: [], ...overrides }
}

describe('fechas locales', () => {
  it('cruza el cambio de horario sin saltar ni repetir días', () => {
    // En Nueva York el horario cambia el 1 de noviembre de 2026 y el 14 de marzo de 2027.
    expect(eachDay('2026-10-31', '2026-11-02')).toEqual(['2026-10-31', '2026-11-01', '2026-11-02'])
    expect(eachDay('2027-03-13', '2027-03-15')).toEqual(['2027-03-13', '2027-03-14', '2027-03-15'])
  })

  it('cruza meses y años', () => {
    expect(eachDay('2026-12-30', '2027-01-02')).toEqual(['2026-12-30', '2026-12-31', '2027-01-01', '2027-01-02'])
    expect(eachDay('2028-02-28', '2028-03-01')).toEqual(['2028-02-28', '2028-02-29', '2028-03-01'])
  })

  it('calcula el día de la semana ISO', () => {
    expect(isoWeekday('2026-11-02')).toBe(1) // lunes
    expect(isoWeekday('2026-11-01')).toBe(7) // domingo
  })
})

describe('programación de hábitos', () => {
  it('ejemplo de la especificación: lunes, miércoles y viernes', () => {
    const h = habit({ versions: [weekly('2026-11-01', [1, 3, 5])] })
    expect(scheduledDates(h, '2026-11-01', '2026-11-08')).toEqual(['2026-11-02', '2026-11-04', '2026-11-06'])
  })

  it('conserva el historial al cambiar la frecuencia (lun/mié → mar/jue en diciembre)', () => {
    const h = habit({ versions: [weekly('2026-12-01', [2, 4]), weekly('2026-11-01', [1, 3])] })
    const nov = scheduledDates(h, '2026-11-01', '2026-11-30')
    const dec = scheduledDates(h, '2026-12-01', '2026-12-31')
    expect(nov.every((d) => [1, 3].includes(isoWeekday(d)))).toBe(true)
    expect(nov).toHaveLength(9)
    expect(dec.every((d) => [2, 4].includes(isoWeekday(d)))).toBe(true)
    expect(dec).toHaveLength(10) // dic. 2026: 5 martes y 5 jueves
  })

  it('respeta las fechas de inicio y fin', () => {
    const h = habit({ startDate: '2026-11-10', endDate: '2026-11-12' })
    expect(scheduledDates(h, '2026-11-01', '2026-11-30')).toEqual(['2026-11-10', '2026-11-11', '2026-11-12'])
    expect(isScheduledOn(h, '2026-11-09')).toBe(false)
    expect(isScheduledOn(h, '2026-11-13')).toBe(false)
  })

  it('un hábito sin fecha de fin sigue ocurriendo', () => {
    const h = habit({ endDate: null })
    expect(isScheduledOn(h, '2030-01-01')).toBe(true)
  })

  it('un hábito que empieza en el futuro no ocurre antes', () => {
    const h = habit({ startDate: '2027-01-01', versions: [daily('2027-01-01')] })
    expect(scheduledDates(h, '2026-11-01', '2026-12-31')).toEqual([])
  })

  it('no programa días en pausa (pausa cerrada y pausa vigente)', () => {
    const h = habit({
      pauses: [
        { startDate: '2026-11-03', endDate: '2026-11-04' },
        { startDate: '2026-11-07', endDate: null },
      ],
    })
    expect(scheduledDates(h, '2026-11-01', '2026-11-09')).toEqual([
      '2026-11-01',
      '2026-11-02',
      '2026-11-05',
      '2026-11-06',
    ])
  })

  it('"cada N días" cuenta desde la fecha de inicio', () => {
    const h = habit({ versions: [every('2026-11-01', 3)] })
    expect(scheduledDates(h, '2026-11-01', '2026-11-10')).toEqual(['2026-11-01', '2026-11-04', '2026-11-07', '2026-11-10'])
  })

  it('"cada N días" a través de cambios de horario y fin de mes', () => {
    const h = habit({ startDate: '2026-10-30', versions: [every('2026-10-30', 2)] })
    expect(scheduledDates(h, '2026-10-30', '2026-11-05')).toEqual(['2026-10-30', '2026-11-01', '2026-11-03', '2026-11-05'])
  })

  it('una versión posterior de "cada N días" cuenta desde su vigencia', () => {
    const h = habit({ versions: [daily('2026-11-01'), every('2026-11-05', 2)] })
    expect(scheduledDates(h, '2026-11-03', '2026-11-09')).toEqual([
      '2026-11-03',
      '2026-11-04',
      '2026-11-05',
      '2026-11-07',
      '2026-11-09',
    ])
  })

  it('si se adelanta la fecha de inicio, usa la primera versión', () => {
    const h = habit({ startDate: '2026-10-26', versions: [weekly('2026-11-01', [1])] })
    expect(scheduledDates(h, '2026-10-26', '2026-11-02')).toEqual(['2026-10-26', '2026-11-02'])
  })

  it('días sin hábitos programados devuelven una lista vacía', () => {
    const h = habit({ versions: [weekly('2026-11-01', [6])] })
    expect(scheduledDates(h, '2026-11-02', '2026-11-06')).toEqual([])
  })

  it('currentVersion muestra la frecuencia vigente o la próxima', () => {
    const h = habit({ versions: [weekly('2026-11-01', [1]), weekly('2026-12-01', [2])] })
    expect(currentVersion(h, '2026-11-15')?.weekdays).toEqual([1])
    expect(currentVersion(h, '2026-12-15')?.weekdays).toEqual([2])
    expect(currentVersion(h, '2026-10-01')?.weekdays).toEqual([1])
  })
})

describe('descripción de frecuencias en español', () => {
  it('describe cada modalidad', () => {
    expect(describeFrequency(daily('x'))).toBe('Todos los días')
    expect(describeFrequency(weekly('x', [1, 3, 5]))).toBe('Lunes, miércoles y viernes')
    expect(describeFrequency(weekly('x', [7]))).toBe('Domingo')
    expect(describeFrequency(weekly('x', [5, 4, 3, 2, 1]))).toBe('De lunes a viernes')
    expect(describeFrequency(weekly('x', [6, 7]))).toBe('Fines de semana')
    expect(describeFrequency(weekly('x', [1, 2, 3, 4, 5, 6, 7]))).toBe('Todos los días')
    expect(describeFrequency(every('x', 3))).toBe('Cada 3 días')
  })
})
