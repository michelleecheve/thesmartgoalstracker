import { Check, Clock, Lock } from 'lucide-react'
import type { AgendaItem } from '@/domain/agenda'
import { accentVar } from '@/domain/labels'
import { cn } from '@/lib/utils'

interface HabitCheckItemProps {
  item: AgendaItem
  goalColor: string | null
  onToggle: (completed: boolean) => void
}

const statusText = {
  no_completado: 'No completado',
  programado: 'Programado',
} as const

export function HabitCheckItem({ item, goalColor, onToggle }: HabitCheckItemProps) {
  const { habit, completed, status } = item
  const future = status === 'programado'
  const color = accentVar(habit.color ?? goalColor)
  const details = [
    habit.time_of_day ? habit.time_of_day.slice(0, 5) : null,
    habit.duration_minutes ? `${habit.duration_minutes} min` : null,
  ].filter(Boolean)

  function handleClick() {
    if (future) return
    if (!completed) navigator.vibrate?.(10)
    onToggle(!completed)
  }

  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={completed}
      aria-disabled={future}
      aria-label={future ? `${habit.name}: programado, podrás marcarlo ese día` : habit.name}
      onClick={handleClick}
      className={cn(
        'flex min-h-14 w-full items-center gap-3 rounded-xl px-2 py-2 text-left transition-colors duration-200',
        future ? 'cursor-default' : 'hover:bg-muted/60 active:bg-muted',
      )}
    >
      <span className="flex size-11 shrink-0 items-center justify-center">
        <span
          className={cn(
            'flex size-7 items-center justify-center rounded-full border-2 transition-all duration-300',
            completed ? 'border-transparent text-white' : future ? 'border-dashed border-input' : 'border-input bg-card',
          )}
          style={completed ? { backgroundColor: color } : undefined}
        >
          {completed && <Check className="size-4 animate-pop" strokeWidth={3} />}
          {future && <Lock className="size-3 text-muted-foreground/70" />}
        </span>
      </span>
      <span className="min-w-0 flex-1">
        <span
          className={cn(
            'block text-[15px] leading-snug transition-colors duration-300',
            completed && 'text-muted-foreground line-through decoration-muted-foreground/40',
            future && 'text-muted-foreground',
          )}
        >
          {habit.name}
        </span>
        {(details.length > 0 || status === 'no_completado' || future) && (
          <span className="mt-0.5 flex flex-wrap items-center gap-x-2 text-xs text-muted-foreground">
            {details.length > 0 && (
              <span className="inline-flex items-center gap-1">
                <Clock className="size-3" />
                {details.join(' · ')}
              </span>
            )}
            {(status === 'no_completado' || future) && (
              <span className={cn(status === 'no_completado' && 'text-destructive/80')}>{statusText[status]}</span>
            )}
          </span>
        )}
      </span>
    </button>
  )
}
