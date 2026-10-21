import { CloudOff } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { EmptyState } from './EmptyState'

export function QueryError({ onRetry }: { onRetry: () => void }) {
  return (
    <EmptyState
      icon={CloudOff}
      title="No pudimos cargar tus datos"
      description="Revisa tu conexión a internet e inténtalo de nuevo."
      action={
        <Button variant="outline" onClick={onRetry}>
          Reintentar
        </Button>
      }
    />
  )
}
