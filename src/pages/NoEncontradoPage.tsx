import { Link } from 'react-router'
import { Compass } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { EmptyState } from '@/components/common/EmptyState'
import { routes } from '@/app/routes'

export function NoEncontradoPage() {
  return (
    <div className="flex flex-1 items-center justify-center pt-(--safe-top)">
      <EmptyState
        icon={Compass}
        title="Página no encontrada"
        description="La página que buscas no existe o se movió."
        action={
          <Button asChild>
            <Link to={routes.inicio}>Volver a Inicio</Link>
          </Button>
        }
      />
    </div>
  )
}
