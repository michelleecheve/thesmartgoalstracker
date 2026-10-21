import { Link } from 'react-router'
import { ChevronRight, Clock, MoreHorizontal } from 'lucide-react'
import { routes } from '@/app/routes'
import { HabitStatusBadge } from '@/components/common/StatusBadge'
import { accentVar, describeFrequency } from '@/domain/labels'
import { formatPercent, type Consistency } from '@/domain/progress'
import type { ScheduleVersion } from '@/domain/schedule'
import { formatShortDate, type LocalDate } from '@/lib/dates'
import { cn } from '@/lib/utils'
import type { HabitRow } from '@/types/database'

interface HabitListItemProps {
  habit: HabitRow
  version: ScheduleVersion | null
  consistency: Consistency
  today: LocalDate
  onOpenActions: () => void
}

function dateRangeLabel(habit: HabitRow, today: LocalDate): string {
  if (habit.start_date > today) return `Empieza el ${formatShortDate(habit.start_date)}`
  if (habit.end_date && habit.end_date < today) return `Terminó el ${formatShortDate(habit.end_date)}`
  if (habit.end_date) return `Hasta el ${formatShortDate(habit.end_date)}`
  return `Desde el ${formatShortDate(habit.start_date)}`
}

export function HabitListItem({ habit, version, consistency, today, onOpenActions }: HabitListItemProps) {
  const details = [
    habit.time_of_day ? habit.time_of_day.slice(0, 5) : null,
    habit.duration_minutes ? `${habit.duration_minutes} min` : null,
  ].filter(Boolean)

  return (
    <div
      className={cn(
        'flex items-start rounded-2xl border border-border/60 bg-card transition-shadow hover:shadow-soft',
        habit.status !== 'active' && 'opacity-75',
      )}
    >
      {/* Toda la tarjeta abre el detalle del hábito; el botón ••• abre las opciones. */}
      <Link
        to={routes.habito(habit.id)}
        aria-label={`Ver detalle e historial de ${habit.name}`}
        className="flex min-w-0 flex-1 items-start gap-3 rounded-2xl p-4 pr-1"
      >
        <span className="mt-1.5 size-2.5 shrink-0 rounded-full" style={{ backgroundColor: accentVar(habit.color) }} />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className="font-medium">{habit.name}</p>
            <HabitStatusBadge status={habit.status} />
          </div>
          <p className="mt-0.5 text-sm text-muted-foreground">
            {version ? describeFrequency(version) : 'Sin frecuencia'}
          </p>
          <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
            {details.length > 0 && (
              <span className="inline-flex items-center gap-1">
                <Clock className="size-3.5" />
                {details.join(' · ')}
              </span>
            )}
            <span>{dateRangeLabel(habit, today)}</span>
            {consistency.rate !== null && <span>Constancia {formatPercent(consistency.rate)}</span>}
          </div>
        </div>
        <ChevronRight className="mt-0.5 size-5 shrink-0 self-center text-muted-foreground/50" />
      </Link>
      <button
        type="button"
        onClick={onOpenActions}
        aria-label={`Opciones de ${habit.name}`}
        className="mt-2 mr-2 flex size-11 shrink-0 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted"
      >
        <MoreHorizontal className="size-5" />
      </button>
    </div>
  )
}
