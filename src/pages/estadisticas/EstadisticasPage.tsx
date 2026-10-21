import { useMemo, type CSSProperties, type ReactNode } from 'react'
import { Link, useSearchParams } from 'react-router'
import { BarChart3, CalendarClock, Flame, Repeat, Target, TrendingDown, TrendingUp } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Progress } from '@/components/ui/progress'
import { Skeleton } from '@/components/ui/skeleton'
import { SegmentedControl } from '@/components/ui/segmented-control'
import { PageHeader } from '@/components/layout/PageHeader'
import { PageContent } from '@/components/layout/PageContent'
import { EmptyState } from '@/components/common/EmptyState'
import { QueryError } from '@/components/common/QueryError'
import { SectionTitle } from '@/components/common/SectionTitle'
import { FormField } from '@/components/forms/FormField'
import { ConsistencyChart } from '@/features/stats/ConsistencyChart'
import { earliestDate, useAllCompletions, useGoalBundle } from '@/features/goals/queries'
import { toHabitsForStats } from '@/domain/mappers'
import { accentVar } from '@/domain/labels'
import { consistency, deadlineLabel, formatPercent, metricProgress } from '@/domain/progress'
import {
  consistencySeries,
  currentStreak,
  deadlineBucketLabels,
  elapsedPeriod,
  granularityFor,
  rankHabits,
  resolvePeriod,
  upcomingDeadlines,
  type DeadlineBucket,
  type Period,
  type PeriodKind,
} from '@/domain/stats'
import { addDaysLocal, diffDays, formatEs, formatShortDate, isValidLocalDate, todayLocal } from '@/lib/dates'
import { cn } from '@/lib/utils'
import { routes } from '@/app/routes'

const periodOptions: { value: PeriodKind; label: string }[] = [
  { value: 'semana', label: 'Semana' },
  { value: 'mes', label: 'Mes' },
  { value: 'mes_anterior', label: 'Mes ant.' },
  { value: 'rango', label: 'Rango' },
]
const periodTitles: Record<PeriodKind, string> = {
  semana: 'Esta semana',
  mes: 'Este mes',
  mes_anterior: 'Mes anterior',
  rango: 'Rango personalizado',
}
const MAX_RANGE_DAYS = 731

function periodLabel(p: Period): string {
  const sameYear = p.from.slice(0, 4) === p.to.slice(0, 4)
  return `${formatEs(p.from, sameYear ? "d 'de' MMM" : "d 'de' MMM yyyy")} – ${formatEs(p.to, "d 'de' MMM yyyy")}`.replace(/\./g, '')
}

export function EstadisticasPage() {
  const today = todayLocal()
  const [params, setParams] = useSearchParams()
  const kindParam = params.get('periodo') as PeriodKind | null
  const kind: PeriodKind = periodOptions.some((o) => o.value === kindParam) ? kindParam! : 'semana'

  // Rango personalizado (por defecto, los últimos 30 días).
  const desde = params.get('desde')
  const hasta = params.get('hasta')
  const customFrom = isValidLocalDate(desde) ? desde : addDaysLocal(today, -29)
  const customTo = isValidLocalDate(hasta) ? hasta : today
  const rangeError =
    customFrom > customTo
      ? 'La fecha inicial debe ser anterior a la final.'
      : diffDays(customTo, customFrom) + 1 > MAX_RANGE_DAYS
        ? 'Elige un rango de máximo dos años.'
        : null

  function setParam(changes: Record<string, string | null>) {
    const p = new URLSearchParams(params)
    for (const [k, v] of Object.entries(changes)) {
      if (v === null) p.delete(k)
      else p.set(k, v)
    }
    setParams(p, { replace: true })
  }

  const period = resolvePeriod(kind, today, kind === 'rango' && !rangeError ? { from: customFrom, to: customTo } : undefined)
  const elapsed = elapsedPeriod(period, today)

  const bundle = useGoalBundle()
  const completions = useAllCompletions(bundle.data)

  const data = useMemo(() => {
    const b = bundle.data
    if (!b) return null
    const stats = toHabitsForStats(b)
    const total = consistency(stats, completions.set, period.from, period.to, today)
    const granularity = granularityFor(elapsed ?? period)
    const series = consistencySeries(stats, completions.set, period, today, granularity)
    const ranking = rankHabits(b.habits, stats, completions.set, period, today)
    const activeGoals = b.goals.filter((g) => g.status === 'active')
    const activeGoalIds = new Set(activeGoals.map((g) => g.id))
    const activeHabits = b.habits.filter((h) => h.status === 'active' && activeGoalIds.has(h.goal_id))
    const goalRows = activeGoals
      .map((goal) => ({
        goal,
        metric: metricProgress({ metricTarget: goal.metric_target, metricCurrent: goal.metric_current }),
        consistency: consistency(
          stats.filter((s) => b.habits.find((h) => h.id === s.id)?.goal_id === goal.id),
          completions.set,
          period.from,
          period.to,
          today,
        ),
      }))
      .sort((a, b2) => (a.goal.deadline < b2.goal.deadline ? -1 : 1))
    return {
      total,
      granularity,
      series,
      ranking,
      streak: currentStreak(stats, completions.set, today, earliestDate(b)),
      activeGoals: activeGoals.length,
      activeHabits: activeHabits.length,
      goalRows,
      deadlines: upcomingDeadlines(b.goals, today),
    }
  }, [bundle.data, completions.set, period.from, period.to, today, elapsed?.to])

  const loading = bundle.isPending || (Boolean(bundle.data?.goals.length) && completions.isPending)
  const hasGoals = (bundle.data?.goals.length ?? 0) > 0

  return (
    <>
      <PageHeader title="Estadísticas" subtitle="Tu constancia y el avance de tus metas" />
      <PageContent>
        <SegmentedControl
          label="Periodo"
          value={kind}
          onChange={(v) => setParam({ periodo: v === 'semana' ? null : v })}
          options={periodOptions}
        />

        {kind === 'rango' && (
          <div className="grid grid-cols-2 gap-3 animate-fade-up">
            <FormField label="Desde" error={rangeError ?? undefined}>
              <Input type="date" value={customFrom} max={today} onChange={(e) => setParam({ desde: e.target.value || null })} />
            </FormField>
            <FormField label="Hasta">
              <Input type="date" value={customTo} onChange={(e) => setParam({ hasta: e.target.value || null })} />
            </FormField>
          </div>
        )}

        <p className="-mt-2 text-sm text-muted-foreground">
          {periodTitles[kind]} · {periodLabel(period)}
          {period.to > today && period.from <= today && ' (hasta hoy)'}
        </p>

        {bundle.isError || completions.isError ? (
          <QueryError onRetry={() => (bundle.isError ? bundle.refetch() : completions.refetch())} />
        ) : loading || !data ? (
          <div className="flex flex-col gap-3">
            <Skeleton className="h-32 rounded-2xl" />
            <Skeleton className="h-64 rounded-2xl" />
            <Skeleton className="h-28 rounded-2xl" />
          </div>
        ) : !hasGoals ? (
          <EmptyState
            icon={BarChart3}
            title="Todavía no hay datos"
            description="Crea una meta con hábitos y empieza a marcarlos. Tus estadísticas aparecerán aquí."
          />
        ) : (
          <>
            {/* Cumplimiento de hábitos */}
            <Card>
              <CardContent>
                <p className="text-sm font-semibold">Cumplimiento de hábitos</p>
                {data.total.rate === null ? (
                  <p className="mt-2 text-sm text-muted-foreground">
                    {elapsed ? 'Aún no hay hábitos que evaluar en este periodo.' : 'Este periodo aún no comienza.'}
                  </p>
                ) : (
                  <>
                    <p className="mt-1 text-5xl font-semibold tracking-tight">{formatPercent(data.total.rate)}</p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {data.total.completed} de {data.total.scheduled} hábitos completados
                    </p>
                    <Progress value={data.total.rate} className="mt-3" indicatorClassName="bg-chart-line" />
                  </>
                )}
              </CardContent>
            </Card>

            {/* Constancia a lo largo del tiempo */}
            <Card>
              <CardContent className="pb-3">
                <p className="text-sm font-semibold">Constancia a lo largo del tiempo</p>
                <p className="text-xs text-muted-foreground">
                  Porcentaje de cumplimiento {data.granularity === 'dia' ? 'por día' : 'por semana'}
                </p>
                {data.series.some((p) => p.rate !== null) ? (
                  <ConsistencyChart series={data.series} granularity={data.granularity} />
                ) : (
                  <p className="py-8 text-center text-sm text-muted-foreground">Aún no hay datos suficientes para el gráfico.</p>
                )}
              </CardContent>
            </Card>

            {/* Indicadores rápidos */}
            <div className="grid grid-cols-3 gap-2">
              <StatTile icon={Flame} label="Racha actual" value={String(data.streak)} unit={data.streak === 1 ? 'día' : 'días'} />
              <StatTile icon={Target} label="Metas activas" value={String(data.activeGoals)} />
              <StatTile icon={Repeat} label="Hábitos activos" value={String(data.activeHabits)} />
            </div>
            <p className="-mt-3 text-xs text-muted-foreground">
              La racha cuenta los días seguidos en que completaste todos tus hábitos programados.
            </p>

            {/* Hábitos con mayor y menor constancia */}
            {data.ranking.length > 0 && (
              <section className="flex flex-col gap-3">
                <SectionTitle>Tus hábitos en este periodo</SectionTitle>
                <Card>
                  <CardContent className="flex flex-col gap-4">
                    <HabitRankRow icon={TrendingUp} title="Mayor constancia" rank={data.ranking[0]!} />
                    {data.ranking.length > 1 && (
                      <HabitRankRow icon={TrendingDown} title="Menor constancia" rank={data.ranking[data.ranking.length - 1]!} />
                    )}
                  </CardContent>
                </Card>
              </section>
            )}

            {/* Progreso de metas */}
            <section className="flex flex-col gap-3">
              <SectionTitle>Progreso de metas activas</SectionTitle>
              {data.goalRows.length === 0 ? (
                <p className="text-sm text-muted-foreground">No tienes metas activas.</p>
              ) : (
                <ul className="flex flex-col gap-2">
                  {data.goalRows.map(({ goal, metric, consistency: c }) => (
                    <li key={goal.id}>
                      <Link to={routes.meta(goal.id)} className="block rounded-2xl border border-border/60 bg-card p-4 shadow-soft transition-shadow hover:shadow-lifted">
                        <div className="flex items-center gap-2">
                          <span className="size-2.5 shrink-0 rounded-full" style={{ backgroundColor: accentVar(goal.color) }} />
                          <p className="truncate font-medium">{goal.name}</p>
                        </div>
                        {metric !== null && (
                          <div className="mt-3">
                            <div className="mb-1 flex justify-between text-xs text-muted-foreground">
                              <span>Avance hacia la meta</span>
                              <span className="font-semibold text-foreground">{formatPercent(metric)}</span>
                            </div>
                            <Progress
                              value={metric}
                              indicatorClassName="bg-(--goal-color)"
                              style={{ '--goal-color': accentVar(goal.color) } as CSSProperties}
                            />
                          </div>
                        )}
                        <div className="mt-2 flex flex-wrap justify-between gap-x-3 gap-y-1 text-xs text-muted-foreground">
                          <span>
                            Constancia:{' '}
                            <span className="font-semibold text-foreground">
                              {c.rate === null ? 'sin días evaluados' : `${formatPercent(c.rate)} (${c.completed} de ${c.scheduled})`}
                            </span>
                          </span>
                          <span className="inline-flex items-center gap-1">
                            <CalendarClock className="size-3.5" />
                            {formatShortDate(goal.deadline)}
                          </span>
                        </div>
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </section>

            {/* Metas próximas a vencer */}
            <section className="flex flex-col gap-3">
              <SectionTitle>Fechas límite</SectionTitle>
              {data.activeGoals === 0 ? (
                <p className="text-sm text-muted-foreground">No tienes metas activas con fecha límite.</p>
              ) : (
                <Card>
                  <CardContent className="flex flex-col gap-4">
                    {(Object.keys(deadlineBucketLabels) as DeadlineBucket[])
                      .filter((bucket) => data.deadlines[bucket].length > 0)
                      .map((bucket) => (
                        <div key={bucket}>
                          <p className={cn('text-xs font-semibold tracking-wide uppercase', bucket === 'vencida' ? 'text-destructive' : bucket === 'semana' ? 'text-warning' : 'text-muted-foreground')}>
                            {deadlineBucketLabels[bucket]}
                          </p>
                          <ul className="mt-2 flex flex-col gap-2">
                            {data.deadlines[bucket].map(({ goal }) => {
                              const row = data.goalRows.find((r) => r.goal.id === goal.id)
                              const progress =
                                row?.metric != null
                                  ? `${formatPercent(row.metric)} de avance`
                                  : row?.consistency.rate != null
                                    ? `${formatPercent(row.consistency.rate)} de constancia`
                                    : 'Sin datos aún'
                              return (
                                <li key={goal.id}>
                                  <Link to={routes.meta(goal.id)} className="flex min-h-11 items-center gap-3">
                                    <span className="size-2.5 shrink-0 rounded-full" style={{ backgroundColor: accentVar(goal.color) }} />
                                    <span className="min-w-0 flex-1">
                                      <span className="block truncate text-sm font-medium">{goal.name}</span>
                                      <span className="block text-xs text-muted-foreground">
                                        {formatShortDate(goal.deadline)} · {progress}
                                      </span>
                                    </span>
                                    <span className={cn('shrink-0 text-xs font-medium', bucket === 'vencida' ? 'text-destructive' : 'text-muted-foreground')}>
                                      {deadlineLabel(goal.deadline, today)}
                                    </span>
                                  </Link>
                                </li>
                              )
                            })}
                          </ul>
                        </div>
                      ))}
                  </CardContent>
                </Card>
              )}
            </section>

            <p className="pb-2 text-xs leading-relaxed text-muted-foreground">
              Cómo se calcula: se cuentan solo los días ya transcurridos; un hábito de hoy aún pendiente no cuenta como
              incumplido. Los días en pausa no se toman en cuenta. Las metas completadas o archivadas aportan su historial
              hasta el día en que cambiaron de estado.
            </p>
          </>
        )}
      </PageContent>
    </>
  )
}

function StatTile({ icon: Icon, label, value, unit }: { icon: typeof Flame; label: string; value: string; unit?: string }) {
  return (
    <Card>
      <CardContent className="flex flex-col gap-1 p-3">
        <Icon className="size-4 text-muted-foreground" />
        <p className="text-2xl font-semibold">
          {value}
          {unit && <span className="ml-1 text-xs font-normal text-muted-foreground">{unit}</span>}
        </p>
        <p className="text-xs leading-tight text-muted-foreground">{label}</p>
      </CardContent>
    </Card>
  )
}

function HabitRankRow({
  icon: Icon,
  title,
  rank,
}: {
  icon: typeof Flame
  title: string
  rank: { habit: { name: string; color: string | null }; consistency: { rate: number | null; completed: number; scheduled: number } }
}): ReactNode {
  return (
    <div className="flex items-start gap-3">
      <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-muted text-muted-foreground">
        <Icon className="size-4" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-xs text-muted-foreground">{title}</p>
        <p className="truncate font-medium">{rank.habit.name}</p>
      </div>
      <div className="shrink-0 text-right">
        <p className="font-semibold">{formatPercent(rank.consistency.rate ?? 0)}</p>
        <p className="text-xs text-muted-foreground">
          {rank.consistency.completed} de {rank.consistency.scheduled}
        </p>
      </div>
    </div>
  )
}
