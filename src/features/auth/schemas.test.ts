import { describe, expect, it } from 'vitest'
import { loginSchema, registerSchema, resetPasswordSchema } from './schemas'

function firstError(result: { success: boolean; error?: { issues: { message: string; path: PropertyKey[] }[] } }) {
  return result.error?.issues[0]
}

describe('validaciones de autenticación', () => {
  it('pide correo válido en español', () => {
    expect(firstError(loginSchema.safeParse({ email: '', password: 'x' }))?.message).toBe('Escribe tu correo electrónico.')
    expect(firstError(loginSchema.safeParse({ email: 'hola', password: 'x' }))?.message).toBe(
      'Escribe un correo electrónico válido.',
    )
  })

  it('limpia espacios del correo', () => {
    const result = loginSchema.safeParse({ email: '  ana@correo.com ', password: 'x' })
    expect(result.success && result.data.email).toBe('ana@correo.com')
  })

  it('exige contraseña de al menos 8 caracteres al registrarse', () => {
    const result = registerSchema.safeParse({
      displayName: 'Ana',
      email: 'ana@correo.com',
      password: 'corta',
      confirmPassword: 'corta',
    })
    expect(firstError(result)?.message).toBe('La contraseña debe tener al menos 8 caracteres.')
  })

  it('detecta contraseñas que no coinciden', () => {
    const result = resetPasswordSchema.safeParse({ password: 'segura123', confirmPassword: 'segura124' })
    expect(firstError(result)).toMatchObject({ message: 'Las contraseñas no coinciden.', path: ['confirmPassword'] })
  })

  it('acepta un registro válido', () => {
    const result = registerSchema.safeParse({
      displayName: ' Ana ',
      email: 'ana@correo.com',
      password: 'segura123',
      confirmPassword: 'segura123',
    })
    expect(result.success && result.data.displayName).toBe('Ana')
  })
})
