import { describe, expect, it } from 'vitest'
import { formatLongDate, fromLocalDate, toLocalDate } from './dates'
import { greetingFor } from './greeting'
import { motivationFor } from './motivation'

describe('fechas locales', () => {
  it('convierte ida y vuelta sin desfase de zona horaria', () => {
    expect(toLocalDate(fromLocalDate('2026-11-01'))).toBe('2026-11-01')
    expect(toLocalDate(fromLocalDate('2027-03-31'))).toBe('2027-03-31')
  })

  it('interpreta yyyy-MM-dd como medianoche local', () => {
    const d = fromLocalDate('2026-11-02')
    expect(d.getFullYear()).toBe(2026)
    expect(d.getMonth()).toBe(10)
    expect(d.getDate()).toBe(2)
    expect(d.getHours()).toBe(0)
  })

  it('formatea en español con mayúscula inicial', () => {
    expect(formatLongDate('2026-11-02')).toBe('Lunes, 2 de noviembre')
  })
})

describe('saludo y motivación', () => {
  it('saluda según la hora', () => {
    expect(greetingFor(new Date(2026, 10, 2, 8))).toBe('Buenos días')
    expect(greetingFor(new Date(2026, 10, 2, 15))).toBe('Buenas tardes')
    expect(greetingFor(new Date(2026, 10, 2, 21))).toBe('Buenas noches')
  })

  it('mantiene el mismo mensaje durante todo el día', () => {
    expect(motivationFor(new Date(2026, 10, 2, 0, 5))).toBe(motivationFor(new Date(2026, 10, 2, 23, 55)))
  })
})
