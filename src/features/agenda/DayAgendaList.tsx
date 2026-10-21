import type { CSSProperties } from 'react'
import { Link } from 'react-router'
import { CalendarClock, ChevronRight, Coffee } from 'lucide-react'
import { Progress } from '@/components/ui/progress'
import { EmptyState } from '@/components/common/EmptyState'
import type { DayAgenda } from '@/domain/agenda'
import { accentVar } from '@/domain/labels'
import { routes } from '@/app/routes'
import { HabitCheckItem } from './HabitCheckItem'

interface DayAgendaListProps {
  agenda: DayAgenda
  onToggle: (habitId: string, completed: boolean) => void
}

/** Hábitos del día agrupados por meta, con casillas para marcar. */
export function DayAgendaList({ agenda, onToggle }: DayAgendaListProps) {
  if (agenda.groups.length === 0) {
    return (
      <EmptyState
        icon={Coffee}
        title="Sin hábitos para este día"
        description="No tienes hábitos programados. ¡Disfruta tu día!"
        className="py-8"
      />
    )
  }

  return (
    <div className="flex flex-col gap-3">
      {agenda.isFuture && (
        <p className="flex items-center gap-2 rounded-xl bg-muted px-3 py-2.5 text-sm text-muted-foreground">
          <CalendarClock className="size-4 shrink-0" />
          Este día aún no llega. Podrás marcar tus hábitos cuando sea el día.
        </p>
      )}
      {agenda.groups.map((group) => {
        const color = accentVar(group.goal.color)
        return (
          <section key={group.goal.id} className="rounded-2xl border border-border/60 bg-card p-2 shadow-soft">
            <div className="px-2 pt-2 pb-1">
              <Link
                to={routes.meta(group.goal.id)}
                className="group flex min-h-9 items-center gap-2 text-sm font-semibold"
              >
                <span className="size-2.5 shrink-0 rounded-full" style={{ backgroundColor: color }} />
                <span className="truncate">{group.goal.name}</span>
                <ChevronRight className="size-4 shrink-0 text-muted-foreground/60 transition-transform group-hover:translate-x-0.5" />
                <span className="ml-auto shrink-0 text-xs font-medium text-muted-foreground tabular-nums">
                  {group.completed} de {group.total}
                </span>
              </Link>
              <Progress
                value={(group.completed / group.total) * 100}
                className="mt-1 h-1"
                indicatorClassName="bg-(--goal-color)"
                style={{ '--goal-color': color } as CSSProperties}
                aria-label={`Progreso de ${group.goal.name}`}
              />
            </div>
            <ul>
              {group.items.map((item) => (
                <li key={item.habit.id}>
                  <HabitCheckItem
                    item={item}
                    goalColor={group.goal.color}
                    onToggle={(completed) => onToggle(item.habit.id, completed)}
                  />
                </li>
              ))}
            </ul>
          </section>
        )
      })}
    </div>
  )
}
