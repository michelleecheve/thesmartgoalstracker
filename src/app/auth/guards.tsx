import { useEffect, useReducer } from 'react'
import { Navigate, Outlet, useLocation, useNavigate } from 'react-router'
import { LoadingScreen } from '@/components/common/LoadingScreen'
import { hasAnyGoal } from '@/services/goals'
import { routes } from '@/app/routes'
import { useAuth } from './auth-context'

export interface RedirectState {
  from?: string
}

// Usuarios para los que ya se revisó si necesitan la bienvenida en esta visita.
// La revisión se hace una sola vez: después, el usuario navega libremente.
const onboardingChecked = new Set<string>()

/**
 * Solo para usuarios con sesión; si no, envía a Iniciar sesión recordando el destino.
 * Al llegar a Inicio por primera vez, un usuario sin metas ve la bienvenida.
 */
export function RequireAuth() {
  const { initializing, session } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()
  const [, rerender] = useReducer((n: number) => n + 1, 0)

  const userId = session?.user.id
  const shouldCheck = Boolean(userId) && location.pathname === routes.inicio && !onboardingChecked.has(userId!)

  useEffect(() => {
    if (!shouldCheck || !userId) return
    let cancelled = false
    hasAnyGoal()
      .catch(() => true) // Ante un error, no bloquear: mostrar Inicio.
      .then((hasGoals) => {
        onboardingChecked.add(userId)
        if (cancelled) return
        if (hasGoals) rerender()
        else navigate(routes.bienvenida, { replace: true })
      })
    return () => {
      cancelled = true
    }
  }, [shouldCheck, userId, navigate])

  if (initializing) return <LoadingScreen />
  if (!session) {
    const state: RedirectState = { from: location.pathname + location.search }
    return <Navigate to={routes.iniciarSesion} replace state={state} />
  }
  if (shouldCheck) return <LoadingScreen />
  return <Outlet />
}

/** Pantallas de acceso: si ya hay sesión, ir al destino pendiente o a Inicio. */
export function PublicOnly() {
  const { initializing, session } = useAuth()
  const location = useLocation()
  const from = (location.state as RedirectState | null)?.from

  if (initializing) return <LoadingScreen />
  if (session) return <Navigate to={from ?? routes.inicio} replace />
  return <Outlet />
}
