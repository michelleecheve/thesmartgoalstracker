import { supabase } from '@/lib/supabase'
import { routes } from '@/app/routes'
import { toAppError } from './errors'

export interface SignUpInput {
  displayName: string
  email: string
  password: string
}

/** Registra al usuario. Devuelve si ya tiene sesión (false si debe confirmar su correo). */
export async function signUp({ displayName, email, password }: SignUpInput): Promise<{ hasSession: boolean }> {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { display_name: displayName },
      emailRedirectTo: `${window.location.origin}${routes.inicio}`,
    },
  })
  if (error) throw toAppError(error)
  return { hasSession: Boolean(data.session) }
}

export async function signIn(email: string, password: string): Promise<void> {
  const { error } = await supabase.auth.signInWithPassword({ email, password })
  if (error) throw toAppError(error)
}

export async function signOut(): Promise<void> {
  const { error } = await supabase.auth.signOut()
  if (error) throw toAppError(error)
}

export async function requestPasswordReset(email: string): Promise<void> {
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${window.location.origin}${routes.restablecerContrasena}`,
  })
  if (error) throw toAppError(error)
}

export async function updatePassword(password: string): Promise<void> {
  const { error } = await supabase.auth.updateUser({ password })
  if (error) throw toAppError(error)
}
