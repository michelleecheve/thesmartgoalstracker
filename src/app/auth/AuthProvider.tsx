import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import type { Session } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'
import { getProfile } from '@/services/profile'
import type { ProfileRow } from '@/types/database'
import { AuthContext, type AuthState } from './auth-context'

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null)
  const [initializing, setInitializing] = useState(true)
  const [profile, setProfile] = useState<ProfileRow | null>(null)

  useEffect(() => {
    // Recupera la sesión guardada (persiste al recargar la página).
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session)
      setInitializing(false)
    })

    // Inicio/cierre de sesión, renovación de token y enlaces de recuperación.
    const { data } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession)
      setInitializing(false)
    })
    return () => data.subscription.unsubscribe()
  }, [])

  const userId = session?.user.id
  const queryClient = useQueryClient()
  const previousUserId = useRef(userId)

  // Al cerrar sesión o cambiar de cuenta, se descartan los datos en caché.
  useEffect(() => {
    if (previousUserId.current !== userId) queryClient.clear()
    previousUserId.current = userId
  }, [userId, queryClient])

  // El perfil se carga aparte: no se deben hacer consultas dentro de onAuthStateChange.
  useEffect(() => {
    if (!userId) {
      setProfile(null)
      return
    }
    let cancelled = false
    getProfile(userId)
      .then((p) => {
        if (!cancelled) setProfile(p)
      })
      .catch(() => {
        // Sin perfil la app sigue funcionando (el saludo no muestra el nombre).
      })
    return () => {
      cancelled = true
    }
  }, [userId])

  const value = useMemo<AuthState>(
    () => ({ initializing, session, user: session?.user ?? null, profile, setProfile }),
    [initializing, session, profile],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
