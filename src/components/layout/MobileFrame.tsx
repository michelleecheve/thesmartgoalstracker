import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

/**
 * Contenedor raíz con formato de app móvil.
 * En iPhone ocupa todo el ancho; en computadora se centra con un máximo de 428px.
 */
export function MobileFrame({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className="min-h-dvh w-full bg-background sm:bg-secondary/60">
      <div
        className={cn(
          'relative mx-auto flex min-h-dvh w-full max-w-(--app-max-width) flex-col overflow-x-clip bg-background',
          'sm:shadow-lifted',
          className,
        )}
      >
        {children}
      </div>
    </div>
  )
}
