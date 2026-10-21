import { useState } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { habitDayState, type HabitDayState } from '@/domain/habitHistory'
import type { HabitForStats } from '@/domain/progress'
import { weekdays } from '@/domain/labels'
import {
  addMonthsLocal,
  capitalize,
  formatEs,
  formatLongDate,
  isSameMonthLocal,
  monthGridDays,
  startOfMonthLocal,
  type LocalDate,
} from '@/lib/dates'
import { cn } from '@/lib/utils'

const stateClass: Record<HabitDayState, string> = {
  completado: 'bg-success text-success-foreground font-semibold',
  extra: 'ring-2 ring-inset ring-success text-foreground font-semibold',
  no_completado: 'bg-destructive-soft text-foreground',
  pendiente: 'ring-2 ring-inset ring-primary/50 text-primary font-semibold',
  programado: 'text-foreground',
  libre: 'text-muted-foreground/60',
}

const stateLabel: Record<HabitDayState, string> = {
  completado: 'completado',
  extra: 'completado (extra)',
  no_completado: 'no completado',
  pendiente: 'pendiente',
  programado: 'programado',
  libre: 'no programado',
}

interface HabitCalendarProps {
  stat: HabitForStats
  completions: ReadonlySet<string>
  today: LocalDate
  initialMonth: LocalDate
}

/** Calendario mensual de un hábito: qué días tocaba y cuáles se completaron. */
export function HabitCalendar({ stat, completions, today, initialMonth }: HabitCalendarProps) {
  const [month, setMonth] = useState(startOfMonthLocal(initialMonth))
  const days = monthGridDays(month)

  return (
    <div>
      <div className="flex items-center justify-between">
        <Button variant="ghost" size="icon" className="-ml-2" onClick={() => setMonth(addMonthsLocal(month, -1))} aria-label="Mes anterior">
          <ChevronLeft className="size-5" />
        </Button>
        <p className="text-sm font-semibold" aria-live="polite">
          {capitalize(formatEs(month, 'MMMM yyyy'))}
        </p>
        <Button variant="ghost" size="icon" className="-mr-2" onClick={() => setMonth(addMonthsLocal(month, 1))} aria-label="Mes siguiente">
          <ChevronRight className="size-5" />
        </Button>
      </div>

      <div className="grid grid-cols-7 text-center text-[11px] font-medium text-muted-foreground" aria-hidden>
        {weekdays.map((d) => (
          <span key={d.iso} className="py-1">
            {d.short}
          </span>
        ))}
      </div>
      <ul className="grid grid-cols-7 gap-y-1" aria-label={`Días de ${formatEs(month, 'MMMM yyyy')}`}>
        {days.map((day) => {
          const inMonth = isSameMonthLocal(day, month)
          const state = habitDayState(stat, day, completions, today)
          return (
            <li
              key={day}
              className={cn('flex h-10 items-center justify-center', !inMonth && 'opacity-30')}
              aria-label={`${formatLongDate(day)}: ${stateLabel[state]}`}
            >
              <span className={cn('relative flex size-8 items-center justify-center rounded-full text-sm tabular-nums', stateClass[state])}>
                {Number(day.slice(8))}
                {state === 'programado' && <span className="absolute bottom-0.5 size-1 rounded-full bg-muted-foreground/50" aria-hidden />}
              </span>
            </li>
          )
        })}
      </ul>

      <div className="mt-3 flex flex-wrap justify-center gap-x-4 gap-y-1.5 text-[11px] text-muted-foreground" aria-hidden>
        <Legend className="bg-success" label="Completado" />
        <Legend className="ring-2 ring-inset ring-success" label="Extra" />
        <Legend className="bg-destructive-soft" label="No completado" />
        <span className="inline-flex items-center gap-1.5">
          <span className="relative size-3">
            <span className="absolute bottom-0 left-1 size-1 rounded-full bg-muted-foreground/50" />
          </span>
          Programado
        </span>
      </div>
    </div>
  )
}

function Legend({ className, label }: { className: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span className={cn('size-3 rounded-full', className)} />
      {label}
    </span>
  )
}
