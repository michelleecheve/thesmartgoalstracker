import { z } from 'zod'

export const PASSWORD_MIN = 8

const email = z
  .string()
  .trim()
  .min(1, { error: 'Escribe tu correo electrónico.' })
  .pipe(z.email({ error: 'Escribe un correo electrónico válido.' }))

const newPassword = z
  .string()
  .min(PASSWORD_MIN, { error: `La contraseña debe tener al menos ${PASSWORD_MIN} caracteres.` })
  .max(72, { error: 'La contraseña no puede tener más de 72 caracteres.' })

export const loginSchema = z.object({
  email,
  password: z.string().min(1, { error: 'Escribe tu contraseña.' }),
})

export const registerSchema = z
  .object({
    displayName: z
      .string()
      .trim()
      .min(1, { error: 'Escribe cómo quieres que te llamemos.' })
      .max(60, { error: 'Usa un nombre de máximo 60 caracteres.' }),
    email,
    password: newPassword,
    confirmPassword: z.string(),
  })
  .refine((d) => d.password === d.confirmPassword, {
    error: 'Las contraseñas no coinciden.',
    path: ['confirmPassword'],
  })

export const forgotPasswordSchema = z.object({ email })

export const resetPasswordSchema = z
  .object({
    password: newPassword,
    confirmPassword: z.string(),
  })
  .refine((d) => d.password === d.confirmPassword, {
    error: 'Las contraseñas no coinciden.',
    path: ['confirmPassword'],
  })

export type LoginValues = z.infer<typeof loginSchema>
export type RegisterValues = z.infer<typeof registerSchema>
export type ForgotPasswordValues = z.infer<typeof forgotPasswordSchema>
export type ResetPasswordValues = z.infer<typeof resetPasswordSchema>
