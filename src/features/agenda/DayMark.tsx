import type { DayIndicator } from '@/domain/agenda'
import { cn } from '@/lib/utils'

/** Indicador compacto de cumplimiento bajo el número del día. */
export function DayMark({ indicator, className }: { indicator: DayIndicator; className?: string }) {
  const base = cn('h-1.5 rounded-full', className)
  switch (indicator.kind) {
    case 'empty':
      return <span className={cn(base, 'w-1.5')} aria-hidden />
    case 'future':
      return <span className={cn(base, 'w-1.5 bg-muted-foreground/30')} aria-hidden />
    case 'progress': {
      if (indicator.ratio >= 1) return <span className={cn(base, 'w-4 bg-success')} aria-hidden />
      if (indicator.ratio > 0)
        return (
          <span className={cn(base, 'relative w-4 overflow-hidden bg-success-soft')} aria-hidden>
            <span className="absolute inset-y-0 left-0 bg-success" style={{ width: `${indicator.ratio * 100}%` }} />
          </span>
        )
      return (
        <span
          className={cn(base, 'w-1.5', indicator.isToday ? 'bg-primary/40' : 'bg-destructive/40')}
          aria-hidden
        />
      )
    }
  }
}

/** Descripción accesible del indicador. */
export function describeIndicator(indicator: DayIndicator): string {
  switch (indicator.kind) {
    case 'empty':
      return 'sin hábitos'
    case 'future':
      return `${indicator.total} ${indicator.total === 1 ? 'hábito programado' : 'hábitos programados'}`
    case 'progress':
      return `${indicator.completed} de ${indicator.total} completados`
  }
}
