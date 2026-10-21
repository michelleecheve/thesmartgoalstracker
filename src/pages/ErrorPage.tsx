import { isRouteErrorResponse, useRouteError } from 'react-router'
import { RefreshCw, TriangleAlert } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { MobileFrame } from '@/components/layout/MobileFrame'
import { EmptyState } from '@/components/common/EmptyState'

/** Se muestra si una pantalla falla de forma inesperada (o no carga tras una actualización). */
export function ErrorPage() {
  const error = useRouteError()
  if (import.meta.env.DEV) console.error(error)

  // Tras publicar una nueva versión, una pantalla vieja puede no encontrar sus archivos.
  const isChunkError = error instanceof Error && /dynamically imported module|Importing a module script failed/i.test(error.message)
  const notFound = isRouteErrorResponse(error) && error.status === 404

  return (
    <MobileFrame className="justify-center">
      <EmptyState
        icon={TriangleAlert}
        title={notFound ? 'Página no encontrada' : isChunkError ? 'Hay una nueva versión' : 'Algo salió mal'}
        description={
          notFound
            ? 'La página que buscas no existe.'
            : isChunkError
              ? 'Recarga la app para usar la versión más reciente.'
              : 'Ocurrió un error inesperado. Recarga la página para intentarlo de nuevo. Tus datos están a salvo.'
        }
        action={
          <Button onClick={() => window.location.assign(notFound ? '/inicio' : window.location.href)}>
            <RefreshCw className="size-4" /> {notFound ? 'Ir a Inicio' : 'Recargar'}
          </Button>
        }
      />
    </MobileFrame>
  )
}
