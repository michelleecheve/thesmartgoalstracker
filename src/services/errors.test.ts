import { describe, expect, it } from 'vitest'
import { AppError, toAppError, toSpanishMessage } from './errors'

describe('mensajes de error en español', () => {
  it('traduce errores de Supabase Auth por código', () => {
    expect(toSpanishMessage({ code: 'invalid_credentials', message: 'Invalid login credentials' })).toBe(
      'El correo o la contraseña no son correctos.',
    )
    expect(toSpanishMessage({ code: 'user_already_exists' })).toMatch(/Ya existe una cuenta/)
  })

  it('traduce errores de Postgres', () => {
    expect(toSpanishMessage({ code: '23505', message: 'duplicate key' })).toBe('Ese registro ya existe.')
  })

  it('detecta problemas de red', () => {
    expect(toSpanishMessage({ name: 'AuthRetryableFetchError', message: 'Failed to fetch' })).toMatch(/conexión/)
    expect(toSpanishMessage(new TypeError('Failed to fetch'))).toMatch(/conexión/)
  })

  it('conserva los mensajes en español de nuestros triggers', () => {
    expect(toSpanishMessage({ code: 'P0001', message: 'No puedes marcar un hábito en una fecha futura' })).toBe(
      'No puedes marcar un hábito en una fecha futura',
    )
  })

  it('nunca muestra mensajes técnicos en inglés', () => {
    expect(toSpanishMessage({ message: 'relation "x" does not exist' })).toBe('Algo salió mal. Inténtalo de nuevo.')
    expect(toSpanishMessage(null)).toBe('Algo salió mal. Inténtalo de nuevo.')
  })

  it('envuelve en AppError conservando la causa', () => {
    const cause = { code: 'invalid_credentials' }
    const err = toAppError(cause)
    expect(err).toBeInstanceOf(AppError)
    expect(err.cause).toBe(cause)
    expect(toAppError(err)).toBe(err)
  })
})
