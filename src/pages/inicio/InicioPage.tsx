import { useMemo } from 'react'
import { Link, useSearchParams } from 'react-router'
import { CalendarCheck, ListChecks, Settings } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ProgressRing } from '@/components/common/ProgressRing'
import { EmptyState } from '@/components/common/EmptyState'
import { QueryError } from '@/components/common/QueryError'
import { buildDayAgenda } from '@/domain/agenda'
import { DayView, MonthView, WeekView, type AgendaViewProps } from '@/features/agenda/views'
import { useAgendaContext, useMonthCompletions, useTodayCompletions, useToggleCompletion } from '@/features/agenda/hooks'
import { useGoalBundle } from '@/features/goals/queries'
import { formatLongDate, isValidLocalDate, todayLocal, type LocalDate } from '@/lib/dates'
import { greetingFor } from '@/lib/greeting'
import { motivationFor } from '@/lib/motivation'
import { routes } from '@/app/routes'
import { useAuth } from '@/app/auth/auth-context'

type Vista = 'dia' | 'semana' | 'mes'
const vistas: Vista[] = ['dia', 'semana', 'mes']

export function InicioPage() {
  const now = new Date()
  const today = todayLocal()
  const { profile } = useAuth()
  const firstName = profile?.display_name?.split(' ')[0]

  // La vista y la fecha viven en la URL: se conservan al recargar o al volver atrás.
  const [params, setParams] = useSearchParams()
  const vistaParam = params.get('vista') as Vista | null
  const vista: Vista = vistaParam && vistas.includes(vistaParam) ? vistaParam : 'dia'
  const fechaParam = params.get('fecha')
  const selected: LocalDate = isValidLocalDate(fechaParam) ? fechaParam : today

  function update(next: { vista?: Vista; fecha?: LocalDate }) {
    const p = new URLSearchParams(params)
    const v = next.vista ?? vista
    const f = next.fecha ?? selected
    if (v === 'dia') p.delete('vista')
    else p.set('vista', v)
    if (f === today) p.delete('fecha')
    else p.set('fecha', f)
    setParams(p, { replace: true })
  }

  const bundle = useGoalBundle()
  const ctx = useAgendaContext(bundle.data)
  const month = useMonthCompletions(selected)
  const week = useTodayCompletions(today)
  const toggle = useToggleCompletion()

  const todayAgenda = useMemo(() => (ctx ? buildDayAgenda(ctx, today, week.set, today) : null), [ctx, today, week.set])
  const hasGoals = (bundle.data?.goals.length ?? 0) > 0

  const viewProps: AgendaViewProps | null = ctx
    ? {
        ctx,
        selected,
        today,
        completions: month.set,
        onSelect: (fecha) => update({ fecha }),
        onToggle: (habitId, date, completed) => toggle.mutate({ habitId, date, completed }),
      }
    : null

  return (
    <div className="flex flex-col gap-5 px-5 pt-[calc(var(--safe-top)+1rem)] animate-fade-up">
      <header className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm text-muted-foreground">{formatLongDate(now)}</p>
          <h1 className="mt-0.5 truncate text-[28px] font-bold tracking-tight">
            {greetingFor(now)}
            {firstName && `, ${firstName}`}
          </h1>
        </div>
        <Button asChild size="icon" className="rounded-full dark:bg-secondary dark:text-secondary-foreground dark:shadow-none dark:hover:bg-secondary/80" aria-label="Perfil y configuración">
          <Link to={routes.perfil}>
            <Settings className="size-5" />
          </Link>
        </Button>
      </header>

      <TodayCard
        percent={todayAgenda?.percent ?? null}
        completed={todayAgenda?.completed ?? 0}
        total={todayAgenda?.total ?? 0}
        loading={!todayAgenda || week.isPending}
        message={motivationFor(now)}
      />

      {bundle.isError ? (
        <QueryError onRetry={() => bundle.refetch()} />
      ) : bundle.isPending || !viewProps ? (
        <div className="flex flex-col gap-3">
          <Skeleton className="h-11 rounded-xl" />
          <Skeleton className="h-24 rounded-2xl" />
          <Skeleton className="h-40 rounded-2xl" />
        </div>
      ) : !hasGoals ? (
        <EmptyState
          icon={ListChecks}
          title="Aún no tienes hábitos"
          description="Crea tu primera meta SMART y sus hábitos. Aparecerán aquí para que los marques cada día."
          action={
            <Button asChild>
              <Link to={routes.nuevaMeta}>Crear mi primera meta</Link>
            </Button>
          }
        />
      ) : (
        <Tabs value={vista} onValueChange={(v) => update({ vista: v as Vista })}>
          <div className="flex items-center gap-2">
            <TabsList className="flex-1">
              <TabsTrigger value="dia">Día</TabsTrigger>
              <TabsTrigger value="semana">Semana</TabsTrigger>
              <TabsTrigger value="mes">Mes</TabsTrigger>
            </TabsList>
            {selected !== today && (
              <Button variant="secondary" className="h-11 shrink-0 animate-fade-up" onClick={() => update({ fecha: today })}>
                <CalendarCheck className="size-4" /> Hoy
              </Button>
            )}
          </div>
          {month.isError ? (
            <QueryError onRetry={() => month.refetch()} />
          ) : (
            <>
              <TabsContent value="dia">
                <DayView {...viewProps} />
              </TabsContent>
              <TabsContent value="semana">
                <WeekView {...viewProps} />
              </TabsContent>
              <TabsContent value="mes">
                <MonthView {...viewProps} />
              </TabsContent>
            </>
          )}
        </Tabs>
      )}
    </div>
  )
}

function TodayCard({
  percent,
  completed,
  total,
  loading,
  message,
}: {
  percent: number | null
  completed: number
  total: number
  loading: boolean
  message: string
}) {
  const done = percent !== null && percent >= 100
  return (
    <Card className="surface-hero">
      <CardContent className="flex items-center gap-4">
        <ProgressRing
          value={percent ?? 0}
          size={64}
          strokeWidth={7}
          color={done ? 'var(--achievement)' : 'var(--primary)'}
          label="Progreso de hoy"
        >
          <span className="text-sm font-semibold tabular-nums">{loading || percent === null ? '—' : `${Math.round(percent)}%`}</span>
        </ProgressRing>
        <div className="min-w-0">
          <p className="text-sm font-semibold">
            {loading
              ? 'Progreso de hoy'
              : total === 0
                ? 'Hoy no tienes hábitos programados'
                : done
                  ? '¡Completaste todo por hoy!'
                  : `${completed} de ${total} hábitos de hoy`}
          </p>
          <p className="mt-0.5 text-sm leading-snug text-muted-foreground">{message}</p>
        </div>
      </CardContent>
    </Card>
  )
}
