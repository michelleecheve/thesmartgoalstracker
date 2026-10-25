import { useState, type CSSProperties } from 'react'
import { Link } from 'react-router'
import { CalendarClock, ChevronRight, Coffee, Plus, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { ActionSheet } from '@/components/ui/action-sheet'
import { EmptyState } from '@/components/common/EmptyState'
import type { DayAgenda, ExtraItem } from '@/domain/agenda'
import { accentVar } from '@/domain/labels'
import { routes } from '@/app/routes'
import { HabitCheckItem } from './HabitCheckItem'

interface DayAgendaListProps {
  agenda: DayAgenda
  /** Hábitos que se pueden registrar como extra ese día. */
  extraCandidates: ExtraItem[]
  onToggle: (habitId: string, completed: boolean) => void
}

/** Hábitos del día agrupados por meta, con casillas para marcar. */
export function DayAgendaList({ agenda, extraCandidates, onToggle }: DayAgendaListProps) {
  const [pickerOpen, setPickerOpen] = useState(false)
  const nothingScheduled = agenda.groups.length === 0

  return (
    <div className="flex flex-col gap-3">
      {agenda.isFuture && !nothingScheduled && (
        <p className="flex items-center gap-2 rounded-xl bg-muted px-3 py-2.5 text-sm text-muted-foreground">
          <CalendarClock className="size-4 shrink-0" />
          Este día aún no llega. Podrás marcar tus hábitos cuando sea el día.
        </p>
      )}

      {nothingScheduled && agenda.extras.length === 0 && (
        <EmptyState
          icon={Coffee}
          title="Sin hábitos para este día"
          description="No tienes hábitos programados. ¡Disfruta tu día!"
          className="pt-8 pb-2"
        />
      )}

      {agenda.groups.map((group) => {
        const color = accentVar(group.goal.color)
        return (
          <section key={group.goal.id} className="rounded-2xl border border-card-border bg-card p-2 shadow-soft">
            <div className="px-2 pt-2 pb-1">
              <Link to={routes.meta(group.goal.id)} className="group flex min-h-9 items-center gap-2 text-sm font-semibold">
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
                  <HabitCheckItem item={item} goalColor={group.goal.color} onToggle={(completed) => onToggle(item.habit.id, completed)} />
                </li>
              ))}
            </ul>
          </section>
        )
      })}

      {agenda.extras.length > 0 && (
        <section className="rounded-2xl border border-dashed border-border bg-card/60 p-2" aria-labelledby="extras-titulo">
          <div className="px-2 pt-2 pb-1">
            <p id="extras-titulo" className="flex items-center gap-2 text-sm font-semibold">
              <Sparkles className="size-4 text-warning" /> Extras
            </p>
            <p className="text-xs text-muted-foreground">Hábitos que hiciste aunque no tocaban. No cambian tu porcentaje del día.</p>
          </div>
          <ul>
            {agenda.extras.map(({ habit, goal }) => (
              <li key={habit.id}>
                <HabitCheckItem
                  item={{ habit, completed: true, status: 'completado' }}
                  goalColor={goal.color}
                  subtitle={goal.name}
                  onToggle={(completed) => onToggle(habit.id, completed)}
                />
              </li>
            ))}
          </ul>
        </section>
      )}

      {extraCandidates.length > 0 && (
        <Button variant="ghost" className="self-center text-primary dark:text-muted-foreground" onClick={() => setPickerOpen(true)}>
          <Plus className="size-4" /> Registrar un hábito extra
        </Button>
      )}

      <ActionSheet
        open={pickerOpen}
        onOpenChange={setPickerOpen}
        title="Registrar un hábito extra"
        description="Hábitos que no estaban programados para este día."
        items={extraCandidates.map(({ habit, goal }) => ({
          label: habit.name,
          detail: goal.name,
          icon: Plus,
          onSelect: () => onToggle(habit.id, true),
        }))}
      />
    </div>
  )
}
