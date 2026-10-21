import { describe, expect, it } from 'vitest'
import { emptyHabitForm, formToHabitInput, frequencyChanged, habitFormSchema } from './schemas'

const form = { ...emptyHabitForm('g1', '2026-11-01', '2027-03-31', 'sage'), name: 'Estudiar 45 minutos', weekdays: [1, 3, 5] }

function messages(values: unknown) {
  const r = habitFormSchema.safeParse(values)
  return r.success ? [] : r.error.issues.map((i) => i.message)
}

describe('formulario de hábito', () => {
  it('acepta el ejemplo de la especificación', () => {
    expect(messages(form)).toEqual([])
  })

  it('exige al menos un día en la frecuencia semanal', () => {
    expect(messages({ ...form, weekdays: [] })).toEqual(['Elige al menos un día de la semana.'])
  })

  it('valida "cada N días" entre 2 y 365', () => {
    expect(messages({ ...form, frequencyType: 'interval', intervalDays: '1' })).toEqual(['Escribe un número entero entre 2 y 365.'])
    expect(messages({ ...form, frequencyType: 'interval', intervalDays: '2.5' })).toHaveLength(1)
    expect(messages({ ...form, frequencyType: 'interval', intervalDays: '3' })).toEqual([])
  })

  it('no permite terminar antes de empezar', () => {
    expect(messages({ ...form, endDate: '2026-10-01' })).toEqual(['La fecha de fin no puede ser anterior al inicio.'])
  })

  it('permite hábitos sin fecha de fin', () => {
    expect(formToHabitInput({ ...form, endDate: '' }).endDate).toBeNull()
  })

  it('solo envía los datos de la modalidad elegida', () => {
    expect(formToHabitInput({ ...form, frequencyType: 'daily' })).toMatchObject({ weekdays: null, intervalDays: null })
    expect(formToHabitInput({ ...form, frequencyType: 'interval', intervalDays: '4' })).toMatchObject({ weekdays: null, intervalDays: 4 })
  })

  it('detecta cambios de frecuencia', () => {
    const version = { effectiveFrom: '2026-11-01', frequencyType: 'weekly' as const, weekdays: [1, 3, 5], intervalDays: null }
    expect(frequencyChanged({ ...form, weekdays: [5, 3, 1] }, version)).toBe(false)
    expect(frequencyChanged({ ...form, weekdays: [2, 4] }, version)).toBe(true)
    expect(frequencyChanged({ ...form, frequencyType: 'daily' }, version)).toBe(true)
  })
})
