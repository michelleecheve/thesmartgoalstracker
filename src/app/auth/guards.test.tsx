import { render, screen } from '@testing-library/react'
import { createMemoryRouter, RouterProvider } from 'react-router'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { Session } from '@supabase/supabase-js'
import { AuthContext, type AuthState } from './auth-context'
import { PublicOnly, RequireAuth } from './guards'

const hasAnyGoal = vi.fn<() => Promise<boolean>>()
vi.mock('@/services/goals', () => ({ hasAnyGoal: () => hasAnyGoal() }))

let userCounter = 0
function authState(overrides: Partial<AuthState> = {}): AuthState {
  return { initializing: false, session: null, user: null, profile: null, setProfile: () => {}, ...overrides }
}
function sessionFor(id: string): Session {
  return { user: { id } } as Session
}

function renderAt(path: string, auth: AuthState) {
  const router = createMemoryRouter(
    [
      {
        element: <PublicOnly />,
        children: [{ path: '/iniciar-sesion', element: <p>Pantalla de acceso</p> }],
      },
      {
        element: <RequireAuth />,
        children: [
          { path: '/inicio', element: <p>Pantalla de inicio</p> },
          { path: '/metas', element: <p>Pantalla de metas</p> },
          { path: '/bienvenida', element: <p>Pantalla de bienvenida</p> },
        ],
      },
    ],
    { initialEntries: [path] },
  )
  render(
    <AuthContext.Provider value={auth}>
      <RouterProvider router={router} />
    </AuthContext.Provider>,
  )
  return router
}

describe('protección de rutas', () => {
  beforeEach(() => {
    hasAnyGoal.mockReset()
  })

  it('muestra carga mientras se recupera la sesión', () => {
    renderAt('/metas', authState({ initializing: true }))
    expect(screen.getByRole('status')).toHaveTextContent('Cargando')
  })

  it('envía a Iniciar sesión si no hay sesión, recordando el destino', async () => {
    const router = renderAt('/metas', authState())
    expect(await screen.findByText('Pantalla de acceso')).toBeInTheDocument()
    expect(router.state.location.state).toEqual({ from: '/metas' })
  })

  it('con sesión, la pantalla de acceso redirige a Inicio', async () => {
    hasAnyGoal.mockResolvedValue(true)
    renderAt('/iniciar-sesion', authState({ session: sessionFor(`u${++userCounter}`) }))
    expect(await screen.findByText('Pantalla de inicio')).toBeInTheDocument()
  })

  it('un usuario sin metas que llega a Inicio ve la bienvenida', async () => {
    hasAnyGoal.mockResolvedValue(false)
    renderAt('/inicio', authState({ session: sessionFor(`u${++userCounter}`) }))
    expect(await screen.findByText('Pantalla de bienvenida')).toBeInTheDocument()
  })

  it('la bienvenida se muestra una sola vez: después puede volver a Inicio', async () => {
    hasAnyGoal.mockResolvedValue(false)
    const router = renderAt('/inicio', authState({ session: sessionFor(`u${++userCounter}`) }))
    await screen.findByText('Pantalla de bienvenida')
    await router.navigate('/inicio')
    expect(await screen.findByText('Pantalla de inicio')).toBeInTheDocument()
  })

  it('un usuario con metas entra directo a Inicio', async () => {
    hasAnyGoal.mockResolvedValue(true)
    renderAt('/inicio', authState({ session: sessionFor(`u${++userCounter}`) }))
    expect(await screen.findByText('Pantalla de inicio')).toBeInTheDocument()
  })

  it('no consulta metas en pantallas distintas de Inicio', async () => {
    renderAt('/metas', authState({ session: sessionFor(`u${++userCounter}`) }))
    expect(await screen.findByText('Pantalla de metas')).toBeInTheDocument()
    expect(hasAnyGoal).not.toHaveBeenCalled()
  })
})
