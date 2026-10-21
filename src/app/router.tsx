import type { ComponentType } from 'react'
import { createBrowserRouter, Navigate, type RouteObject } from 'react-router'
import { AppLayout } from '@/components/layout/AppLayout'
import { FullScreenLayout } from '@/components/layout/FullScreenLayout'
import { FocusLayout } from '@/components/layout/FocusLayout'
import { LoadingScreen } from '@/components/common/LoadingScreen'
import { ErrorPage } from '@/pages/ErrorPage'
import { PublicOnly, RequireAuth } from './auth/guards'
import { routes } from './routes'

/**
 * Carga diferida: cada pantalla se descarga solo al visitarla,
 * así la app abre más rápido en el teléfono.
 */
function page<K extends string>(path: string, load: () => Promise<Record<K, ComponentType>>, name: K): RouteObject {
  return {
    path,
    lazy: () => load().then((m) => ({ Component: m[name] })),
  }
}

export const router = createBrowserRouter([
  {
    errorElement: <ErrorPage />,
    hydrateFallbackElement: <LoadingScreen />,
    children: [
      { path: '/', element: <Navigate to={routes.inicio} replace /> },

      // Acceso público (si ya hay sesión, redirige a Inicio).
      {
        element: <PublicOnly />,
        children: [
          {
            element: <FullScreenLayout />,
            children: [
              page(routes.iniciarSesion, () => import('@/pages/auth/IniciarSesionPage'), 'IniciarSesionPage'),
              page(routes.registro, () => import('@/pages/auth/RegistroPage'), 'RegistroPage'),
              page(routes.recuperarContrasena, () => import('@/pages/auth/RecuperarContrasenaPage'), 'RecuperarContrasenaPage'),
            ],
          },
        ],
      },

      // Destino del enlace de recuperación: la sesión llega en la URL del correo.
      {
        element: <FullScreenLayout />,
        children: [
          page(routes.restablecerContrasena, () => import('@/pages/auth/RestablecerContrasenaPage'), 'RestablecerContrasenaPage'),
        ],
      },

      // Requiere sesión.
      {
        element: <RequireAuth />,
        children: [
          {
            element: <FullScreenLayout />,
            children: [page(routes.bienvenida, () => import('@/pages/onboarding/BienvenidaPage'), 'BienvenidaPage')],
          },
          {
            // Formularios a pantalla completa, sin navegación inferior.
            element: <FocusLayout />,
            children: [
              page(routes.nuevaMeta, () => import('@/pages/metas/MetaFormPage'), 'MetaFormPage'),
              page('/metas/:metaId/editar', () => import('@/pages/metas/MetaFormPage'), 'MetaFormPage'),
              page('/metas/:metaId/habitos/nuevo', () => import('@/pages/metas/HabitoFormPage'), 'HabitoFormPage'),
              page('/habitos/:habitoId/editar', () => import('@/pages/metas/HabitoFormPage'), 'HabitoFormPage'),
            ],
          },
          {
            element: <AppLayout />,
            children: [
              page(routes.inicio, () => import('@/pages/inicio/InicioPage'), 'InicioPage'),
              page(routes.metas, () => import('@/pages/metas/MisMetasPage'), 'MisMetasPage'),
              page('/metas/:metaId', () => import('@/pages/metas/MetaDetallePage'), 'MetaDetallePage'),
              page('/habitos/:habitoId', () => import('@/pages/metas/HabitoDetallePage'), 'HabitoDetallePage'),
              page(routes.estadisticas, () => import('@/pages/estadisticas/EstadisticasPage'), 'EstadisticasPage'),
              page(routes.vision, () => import('@/pages/vision/TableroVisionPage'), 'TableroVisionPage'),
              page(routes.perfil, () => import('@/pages/perfil/PerfilPage'), 'PerfilPage'),
              page('*', () => import('@/pages/NoEncontradoPage'), 'NoEncontradoPage'),
            ],
          },
        ],
      },
    ],
  },
])
