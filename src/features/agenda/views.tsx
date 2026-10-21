import { ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { ProgressRing } from '@/components/common/ProgressRing'
import {
  buildDayAgenda,
  dayIndicator,
  periodConsistency,
  type AgendaContext,
  type DayIndicator,
} from '@/domain/agenda'
import { weekdays } from '@/domain/labels'
import { formatPercent } from '@/domain/progress'
import {
  addDaysLocal,
  addMonthsLocal,
  capitalize,
  endOfMonthLocal,
  formatEs,
  formatLongDate,
  isSameMonthLocal,
  monthGridDays,
  startOfMonthLocal,
  weekDays,
  type LocalDate,
} from '@/lib/dates'
import { cn } from '@/lib/utils'
import { DayAgendaList } from './DayAgendaList'
import { DayMark, describeIndicator } from './DayMark'

export interface AgendaViewProps {
  ctx: AgendaContext
  selected: LocalDate
  today: LocalDate
  completions: ReadonlySet<string>
  onSelect: (date: LocalDate) => void
  onToggle: (habitId: string, date: LocalDate, completed: boolean) => void
}

// --- Piezas compartidas ---------------------------------------------------------

function NavHeader({ label, onPrev, onNext, prevLabel, nextLabel }: {
  label: string
  onPrev: () => void
  onNext: () => void
  prevLabel: string
  nextLabel: string
}) {
  return (
    <div className="flex items-center justify-between">
      <Button variant="ghost" size="icon" onClick={onPrev} aria-label={prevLabel} className="-ml-2">
        <ChevronLeft className="size-5" />
      </Button>
      <p className="text-sm font-semibold" aria-live="polite">
        {label}
      </p>
      <Button variant="ghost" size="icon" onClick={onNext} aria-label={nextLabel} className="-mr-2">
        <ChevronRight className="size-5" />
      </Button>
    </div>
  )
}

/** Hábitos del día elegido, con su título y porcentaje. */
function SelectedDay({ ctx, selected, today, completions, onToggle, showSummary }: AgendaViewProps & { showSummary: boolean }) {
  const agenda = buildDayAgenda(ctx, selected, completions, today)
  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-end justify-between gap-3 px-1">
        <h2 className="text-lg font-semibold">
          {selected === today ? 'Hoy' : formatLongDate(selected)}
          {selected === today && (
            <span className="ml-2 text-sm font-normal text-muted-foreground">{formatEs(selected, "d 'de' MMMM")}</span>
          )}
        </h2>
        {showSummary && agenda.percent !== null && !agenda.isFuture && (
          <span className="shrink-0 text-sm text-muted-foreground tabular-nums">
            {agenda.completed} de {agenda.total} · <span className="font-semibold text-foreground">{Math.round(agenda.percent)}%</span>
          </span>
        )}
      </div>
      <DayAgendaList agenda={agenda} onToggle={(habitId, completed) => onToggle(habitId, selected, completed)} />
    </div>
  )
}

function PeriodSummary({ title, rate, completed, scheduled }: { title: string; rate: number | null; completed: number; scheduled: number }) {
  return (
    <Card>
      <CardContent className="flex items-center gap-4 py-4">
        <ProgressRing value={rate ?? 0} size={52} strokeWidth={6} color="var(--success)" label={title}>
          <span className="text-xs font-semibold">{rate === null ? '—' : `${Math.round(rate)}%`}</span>
        </ProgressRing>
        <div className="min-w-0">
          <p className="text-sm font-semibold">{title}</p>
          <p className="text-sm text-muted-foreground">
            {rate === null
              ? 'Aún no hay días para evaluar.'
              : `${completed} de ${scheduled} hábitos completados (${formatPercent(rate)})`}
          </p>
        </div>
      </CardContent>
    </Card>
  )
}

// --- Vista Día ------------------------------------------------------------------

export function DayView(props: AgendaViewProps) {
  const { ctx, selected, today, completions, onSelect } = props
  const days = weekDays(selected)

  return (
    <div className="flex flex-col gap-4">
      <div className="rounded-2xl border border-border/60 bg-card px-2 pt-1 pb-2 shadow-soft">
        <NavHeader
          label={capitalize(formatEs(selected, 'MMMM yyyy'))}
          onPrev={() => onSelect(addDaysLocal(selected, -7))}
          onNext={() => onSelect(addDaysLocal(selected, 7))}
          prevLabel="Semana anterior"
          nextLabel="Semana siguiente"
        />
        <div role="listbox" aria-label="Elige un día" className="grid grid-cols-7 gap-0.5">
          {days.map((day, i) => {
            const indicator = dayIndicator(ctx, day, completions, today)
            const isSelected = day === selected
            const isToday = day === today
            return (
              <button
                key={day}
                type="button"
                role="option"
                aria-selected={isSelected}
                aria-label={`${formatLongDate(day)}${isToday ? ' (hoy)' : ''}: ${describeIndicator(indicator)}`}
                onClick={() => onSelect(day)}
                className="flex min-h-16 flex-col items-center justify-center gap-1 rounded-xl transition-colors hover:bg-muted/60"
              >
                <span className={cn('text-[11px] font-medium', isToday ? 'text-primary' : 'text-muted-foreground')}>
                  {weekdays[i]!.short}
                </span>
                <span
                  className={cn(
                    'flex size-9 items-center justify-center rounded-full text-[15px] font-semibold tabular-nums transition-all duration-200',
                    isSelected ? 'bg-foreground text-background' : isToday ? 'text-primary ring-2 ring-primary/40' : '',
                  )}
                >
                  {Number(day.slice(8))}
                </span>
                <DayMark indicator={indicator} />
              </button>
            )
          })}
        </div>
      </div>
      <SelectedDay {...props} showSummary />
    </div>
  )
}

// --- Vista Semana ---------------------------------------------------------------

function WeekRing({ indicator, day, selected, today }: { indicator: DayIndicator; day: LocalDate; selected: boolean; today: boolean }) {
  const value = indicator.kind === 'progress' ? indicator.ratio * 100 : 0
  return (
    <ProgressRing value={value} size={40} strokeWidth={4} color="var(--success)">
      <span
        className={cn(
          'flex size-7 items-center justify-center rounded-full text-sm font-semibold tabular-nums',
          selected ? 'bg-foreground text-background' : today ? 'text-primary' : indicator.kind === 'future' ? 'text-muted-foreground' : '',
        )}
      >
        {Number(day.slice(8))}
      </span>
    </ProgressRing>
  )
}

export function WeekView(props: AgendaViewProps) {
  const { ctx, selected, today, completions, onSelect } = props
  const days = weekDays(selected)
  const from = days[0]!
  const to = days[6]!
  const summary = periodConsistency(ctx, from, to, completions, today)
  const sameMonth = isSameMonthLocal(from, to)
  const label = sameMonth
    ? `${formatEs(from, 'd')} – ${formatEs(to, "d 'de' MMMM")}`
    : `${formatEs(from, "d 'de' MMM")} – ${formatEs(to, "d 'de' MMM")}`

  return (
    <div className="flex flex-col gap-4">
      <div className="rounded-2xl border border-border/60 bg-card px-2 pt-1 pb-3 shadow-soft">
        <NavHeader
          label={label.replace(/\./g, '')}
          onPrev={() => onSelect(addDaysLocal(selected, -7))}
          onNext={() => onSelect(addDaysLocal(selected, 7))}
          prevLabel="Semana anterior"
          nextLabel="Semana siguiente"
        />
        <div role="listbox" aria-label="Elige un día" className="grid grid-cols-7 gap-0.5">
          {days.map((day, i) => {
            const indicator = dayIndicator(ctx, day, completions, today)
            return (
              <button
                key={day}
                type="button"
                role="option"
                aria-selected={day === selected}
                aria-label={`${formatLongDate(day)}${day === today ? ' (hoy)' : ''}: ${describeIndicator(indicator)}`}
                onClick={() => onSelect(day)}
                className="flex flex-col items-center gap-1.5 rounded-xl py-1 transition-colors hover:bg-muted/60"
              >
                <span className={cn('text-[11px] font-medium', day === today ? 'text-primary' : 'text-muted-foreground')}>
                  {weekdays[i]!.short}
                </span>
                <WeekRing indicator={indicator} day={day} selected={day === selected} today={day === today} />
                <span className="h-4 text-[10px] text-muted-foreground tabular-nums">
                  {indicator.kind === 'progress' ? `${indicator.completed}/${indicator.total}` : indicator.kind === 'future' ? indicator.total : ''}
                </span>
              </button>
            )
          })}
        </div>
      </div>
      <PeriodSummary title="Cumplimiento semanal" {...summary} />
      <SelectedDay {...props} showSummary />
    </div>
  )
}

// --- Vista Mes ------------------------------------------------------------------

function monthCellClass(indicator: DayIndicator): string {
  if (indicator.kind !== 'progress') return ''
  if (indicator.ratio >= 1) return 'bg-success text-success-foreground'
  if (indicator.ratio > 0) return 'bg-success-soft text-accent-foreground'
  return indicator.isToday ? '' : 'bg-destructive-soft/70'
}

export function MonthView(props: AgendaViewProps) {
  const { ctx, selected, today, completions, onSelect } = props
  const days = monthGridDays(selected)
  const monthStart = startOfMonthLocal(selected)
  const summary = periodConsistency(ctx, monthStart, endOfMonthLocal(selected), completions, today)

  /** Al cambiar de mes, selecciona hoy si está en ese mes; si no, el día 1. */
  function changeMonth(delta: number) {
    const target = addMonthsLocal(monthStart, delta)
    onSelect(isSameMonthLocal(target, today) ? today : target)
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="rounded-2xl border border-border/60 bg-card px-2 pt-1 pb-3 shadow-soft">
        <NavHeader
          label={capitalize(formatEs(selected, 'MMMM yyyy'))}
          onPrev={() => changeMonth(-1)}
          onNext={() => changeMonth(1)}
          prevLabel="Mes anterior"
          nextLabel="Mes siguiente"
        />
        <div className="grid grid-cols-7 text-center text-[11px] font-medium text-muted-foreground" aria-hidden>
          {weekdays.map((d) => (
            <span key={d.iso} className="py-1">
              {d.short}
            </span>
          ))}
        </div>
        <div role="grid" aria-label="Calendario del mes" className="grid grid-cols-7 gap-y-1">
          {days.map((day) => {
            const inMonth = isSameMonthLocal(day, selected)
            const indicator = dayIndicator(ctx, day, completions, today)
            const isSelected = day === selected
            const isToday = day === today
            return (
              <button
                key={day}
                type="button"
                role="gridcell"
                aria-selected={isSelected}
                aria-label={`${formatLongDate(day)}${isToday ? ' (hoy)' : ''}: ${describeIndicator(indicator)}`}
                onClick={() => onSelect(day)}
                className={cn('flex h-11 items-center justify-center', !inMonth && 'opacity-35')}
              >
                <span
                  className={cn(
                    'relative flex size-9 items-center justify-center rounded-full text-sm font-medium tabular-nums transition-all duration-200',
                    monthCellClass(indicator),
                    isSelected && 'ring-2 ring-foreground ring-offset-2 ring-offset-card',
                    isToday && !isSelected && 'font-bold text-primary ring-2 ring-primary/50',
                  )}
                >
                  {Number(day.slice(8))}
                  {indicator.kind === 'future' && (
                    <span className="absolute bottom-0.5 size-1 rounded-full bg-muted-foreground/40" aria-hidden />
                  )}
                </span>
              </button>
            )
          })}
        </div>
        <div className="mt-3 flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-[11px] text-muted-foreground" aria-hidden>
          <Legend className="bg-success" label="Completo" />
          <Legend className="bg-success-soft" label="Parcial" />
          <Legend className="bg-destructive-soft" label="Sin completar" />
        </div>
      </div>
      <PeriodSummary title="Cumplimiento del mes" {...summary} />
      <SelectedDay {...props} showSummary />
    </div>
  )
}

function Legend({ className, label }: { className: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span className={cn('size-2.5 rounded-full', className)} />
      {label}
    </span>
  )
}
