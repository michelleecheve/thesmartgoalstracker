import { useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router'
import { CheckCircle2, ChevronLeft, Clock, Flame, Pencil, Repeat, SearchX, Sparkles, Target } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { EmptyState } from '@/components/common/EmptyState'
import { QueryError } from '@/components/common/QueryError'
import { SectionTitle } from '@/components/common/SectionTitle'
import { HabitStatusBadge } from '@/components/common/StatusBadge'
import { HabitCalendar } from '@/features/habits/HabitCalendar'
import { useAllCompletions, useGoalBundle } from '@/features/goals/queries'
import { toHabitsForStats } from '@/domain/mappers'
import { frequencyTimeline, summarizeHabit } from '@/domain/habitHistory'
import { accentVar, describeFrequency } from '@/domain/labels'
import { formatPercent } from '@/domain/progress'
import { capitalize, formatEs, formatShortDate, todayLocal } from '@/lib/dates'
import { routes } from '@/app/routes'

const HISTORY_PAGE = 15

export function HabitoDetallePage() {
  const { habitoId } = useParams()
  const navigate = useNavigate()
  const bundle = useGoalBundle()
  const completions = useAllCompletions(bundle.data)
  const today = todayLocal()
  const [visible, setVisible] = useState(HISTORY_PAGE)

  const habit = bundle.data?.habits.find((h) => h.id === habitoId)
  const goal = habit ? bundle.data?.goals.find((g) => g.id === habit.goal_id) : undefined

  const view = useMemo(() => {
    if (!bundle.data || !habit) return null
    const stat = toHabitsForStats(bundle.data, (h) => h.id === habit.id)[0]!
    const dates = (completions.data ?? []).filter((c) => c.habit_id === habit.id).map((c) => c.date)
    return {
      stat,
      summary: summarizeHabit(stat, dates, completions.set, today),
      timeline: frequencyTimeline(stat.schedule.versions, habit.start_date),
    }
  }, [bundle.data, habit, completions.data, completions.set, today])

  if (bundle.isPending || (bundle.data && completions.isPending)) {
    return (
      <div className="flex flex-col gap-4 px-5 pt-[calc(var(--safe-top)+4rem)]">
        <Skeleton className="h-24 rounded-2xl" />
        <Skeleton className="h-20 rounded-2xl" />
        <Skeleton className="h-80 rounded-2xl" />
      </div>
    )
  }
  if (bundle.isError || completions.isError) {
    return <QueryError onRetry={() => (bundle.isError ? bundle.refetch() : completions.refetch())} />
  }
  if (!habit || !goal || !view) {
    return (
      <div className="flex flex-1 items-center justify-center pt-(--safe-top)">
        <EmptyState
          icon={SearchX}
          title="No encontramos este hábito"
          description="Es posible que se haya eliminado."
          action={<Button onClick={() => navigate(routes.metas)}>Ir a Mis metas</Button>}
        />
      </div>
    )
  }

  const { summary, stat, timeline } = view
  const current = timeline[0]?.version
  const details = [
    habit.time_of_day ? habit.time_of_day.slice(0, 5) : null,
    habit.duration_minutes ? `${habit.duration_minutes} min` : null,
  ].filter(Boolean)
  const dateRange = habit.end_date
    ? `Del ${formatShortDate(habit.start_date)} al ${formatShortDate(habit.end_date)}`
    : `Desde el ${formatShortDate(habit.start_date)}`

  return (
    <>
      <header className="sticky top-0 z-30 flex items-center justify-between bg-background/85 px-2 pt-[calc(var(--safe-top)+0.5rem)] pb-1 backdrop-blur-xl">
        <Button variant="ghost" size="icon" onClick={() => navigate(routes.meta(goal.id))} aria-label={`Regresar a ${goal.name}`}>
          <ChevronLeft className="size-6" />
        </Button>
        {habit.status !== 'archived' && (
          <Button asChild variant="ghost" size="icon" aria-label="Editar hábito">
            <Link to={routes.editarHabito(habit.id)}>
              <Pencil className="size-5" />
            </Link>
          </Button>
        )}
      </header>

      <div className="flex flex-col gap-6 px-5 pt-1 animate-fade-up">
        {/* Encabezado */}
        <section>
          <Link to={routes.meta(goal.id)} className="inline-flex min-h-8 items-center gap-2 text-sm text-muted-foreground">
            <span className="size-2.5 rounded-full" style={{ backgroundColor: accentVar(goal.color) }} />
            {goal.name}
          </Link>
          <div className="mt-0.5 flex flex-wrap items-center gap-2">
            <h1 className="text-[26px] leading-tight font-bold tracking-tight">{habit.name}</h1>
            <HabitStatusBadge status={habit.status} />
          </div>
          {habit.description && <p className="mt-1.5 text-[15px] text-muted-foreground">{habit.description}</p>}
          <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
            {current && (
              <span className="inline-flex items-center gap-1.5">
                <Repeat className="size-4" /> {describeFrequency(current)}
              </span>
            )}
            {details.length > 0 && (
              <span className="inline-flex items-center gap-1.5">
                <Clock className="size-4" /> {details.join(' · ')}
              </span>
            )}
            <span>{dateRange}</span>
          </div>
        </section>

        {/* Indicadores */}
        <section className="grid grid-cols-3 gap-2">
          <Stat icon={CheckCircle2} value={String(summary.totalCompleted)} label={summary.totalCompleted === 1 ? 'Vez completado' : 'Veces completado'} />
          <Stat
            icon={Target}
            value={summary.consistency.rate === null ? '—' : formatPercent(summary.consistency.rate)}
            label={summary.consistency.rate === null ? 'Constancia' : `Constancia (${summary.consistency.completed} de ${summary.consistency.scheduled})`}
          />
          <Stat icon={Flame} value={String(summary.streak)} label={summary.streak === 1 ? 'Día de racha' : 'Días de racha'} />
        </section>
        {summary.extras > 0 && (
          <p className="-mt-4 text-xs text-muted-foreground">
            Incluye {summary.extras} {summary.extras === 1 ? 'vez extra' : 'veces extra'} (días no programados), que no cuentan en la constancia.
          </p>
        )}

        {/* Calendario */}
        <section className="flex flex-col gap-3">
          <SectionTitle>Calendario</SectionTitle>
          <Card>
            <CardContent className="px-3 pt-2 pb-4">
              <HabitCalendar
                stat={stat}
                completions={completions.set}
                today={today}
                initialMonth={habit.start_date > today ? habit.start_date : today}
              />
            </CardContent>
          </Card>
        </section>

        {/* Historial */}
        <section className="flex flex-col gap-3">
          <SectionTitle>Historial</SectionTitle>
          {summary.history.length === 0 ? (
            <p className="text-sm text-muted-foreground">Aún no has completado este hábito. Márcalo en Inicio cuando lo hagas.</p>
          ) : (
            <Card>
              <CardContent className="py-2">
                <ul className="divide-y divide-border">
                  {summary.history.slice(0, visible).map((entry) => (
                    <li key={entry.date} className="flex min-h-12 items-center gap-3 py-2">
                      <CheckCircle2 className="size-5 shrink-0 text-success" />
                      <span className="flex-1 text-sm">{capitalize(formatEs(entry.date, "EEEE, d 'de' MMMM yyyy"))}</span>
                      {entry.extra && (
                        <Badge variant="warning">
                          <Sparkles /> Extra
                        </Badge>
                      )}
                    </li>
                  ))}
                </ul>
                {summary.history.length > visible && (
                  <Button variant="ghost" className="mt-1 w-full text-muted-foreground" onClick={() => setVisible((v) => v + HISTORY_PAGE)}>
                    Ver más ({summary.history.length - visible})
                  </Button>
                )}
              </CardContent>
            </Card>
          )}
        </section>

        {/* Cambios de frecuencia */}
        {timeline.length > 0 && (
          <section className="flex flex-col gap-3 pb-2">
            <SectionTitle>Frecuencia</SectionTitle>
            <Card>
              <CardContent className="flex flex-col gap-3">
                {timeline.map(({ from, version }, i) => (
                  <div key={from} className="flex items-start justify-between gap-3 text-sm">
                    <div>
                      <p className="font-medium">{describeFrequency(version)}</p>
                      <p className="text-xs text-muted-foreground">Desde el {formatShortDate(from)}</p>
                    </div>
                    {i === 0 && <Badge variant="success">Actual</Badge>}
                  </div>
                ))}
                {timeline.length > 1 && (
                  <p className="text-xs text-muted-foreground">Los días anteriores a cada cambio conservan la frecuencia que tenían.</p>
                )}
              </CardContent>
            </Card>
          </section>
        )}
      </div>
    </>
  )
}

function Stat({ icon: Icon, value, label }: { icon: typeof Flame; value: string; label: string }) {
  return (
    <Card>
      <CardContent className="flex flex-col gap-1 p-3">
        <Icon className="size-4 text-muted-foreground" />
        <p className="text-2xl font-semibold">{value}</p>
        <p className="text-xs leading-tight text-muted-foreground">{label}</p>
      </CardContent>
    </Card>
  )
}
