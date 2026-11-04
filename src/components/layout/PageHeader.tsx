import type { ReactNode } from 'react'
import { useNavigate } from 'react-router'
import { ChevronLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface PageHeaderProps {
  title: string
  subtitle?: ReactNode
  /** Muestra un botón para regresar. Si es una cadena, navega a esa ruta. */
  back?: boolean | string
  action?: ReactNode
  /** Elemento a la izquierda del título (p. ej. una ilustración). */
  leading?: ReactNode
  className?: string
}

export function PageHeader({ title, subtitle, back, action, leading, className }: PageHeaderProps) {
  const navigate = useNavigate()

  return (
    <header
      className={cn(
        'sticky top-0 z-30 bg-background/85 px-5 pt-[calc(var(--safe-top)+0.75rem)] pb-3 backdrop-blur-xl',
        className,
      )}
    >
      {back && (
        <Button
          variant="ghost"
          size="icon"
          className="-ml-3 mb-1 text-muted-foreground"
          aria-label="Regresar"
          onClick={() => (typeof back === 'string' ? navigate(back) : navigate(-1))}
        >
          <ChevronLeft className="size-6" />
        </Button>
      )}
      <div className="flex items-end justify-between gap-3">
        {leading && <div className="shrink-0">{leading}</div>}
        <div className="min-w-0 flex-1">
          <h1 className="truncate text-[28px] font-bold tracking-tight">{title}</h1>
          {subtitle && <p className="mt-0.5 text-sm text-muted-foreground">{subtitle}</p>}
        </div>
        {action && <div className="shrink-0">{action}</div>}
      </div>
    </header>
  )
}
