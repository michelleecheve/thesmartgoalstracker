import { createContext, useContext } from 'react'
import type { Session, User } from '@supabase/supabase-js'
import type { ProfileRow } from '@/types/database'

export interface AuthState {
  /** true mientras se recupera la sesión guardada al abrir la app. */
  initializing: boolean
  session: Session | null
  user: User | null
  profile: ProfileRow | null
  setProfile: (profile: ProfileRow) => void
}

export const AuthContext = createContext<AuthState | null>(null)

export function useAuth(): AuthState {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth debe usarse dentro de <AuthProvider>')
  return ctx
}

/** Para pantallas protegidas: el usuario siempre existe. */
export function useCurrentUser(): User {
  const { user } = useAuth()
  if (!user) throw new Error('useCurrentUser requiere una sesión activa')
  return user
}
