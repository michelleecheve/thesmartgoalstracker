import { useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router'
import { toast } from 'sonner'
import {
  Archive,
  ArchiveRestore,
  CalendarClock,
  CheckCircle2,
  ChevronDown,
  ChevronLeft,
  MoreHorizontal,
  Pause,
  Pencil,
  Play,
  Plus,
  Repeat,
  RotateCcw,
  SearchX,
  Trash2,
  TrendingUp,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { ActionSheet, type ActionSheetItem } from '@/components/ui/action-sheet'
import { ConfirmDialog } from '@/components/common/ConfirmDialog'
import { EmptyState } from '@/components/common/EmptyState'
import { ProgressRing } from '@/components/common/ProgressRing'
import { SectionTitle } from '@/components/common/SectionTitle'
import { GoalStatusBadge } from '@/components/common/StatusBadge'
import { QueryError } from '@/components/common/QueryError'
import { HabitListItem } from '@/features/habits/HabitListItem'
import { UpdateMetricDialog } from '@/features/goals/UpdateMetricDialog'
import { buildGoalSummary } from '@/features/goals/model'
import { useAllCompletions, useGoalBundle, useRefreshGoals } from '@/features/goals/queries'
import { smartGuide } from '@/features/goals/smartGuide'
import { accentVar, categoryInfo } from '@/domain/labels'
import { toHabitsForStats, toHabitSchedule } from '@/domain/mappers'
import { consistency, deadlineLabel, formatNumber, formatPercent } from '@/domain/progress'
import { currentVersion } from '@/domain/schedule'
import { deleteGoal, setGoalStatus, updateGoal } from '@/services/goals'
import { deleteHabit, setHabitStatus } from '@/services/habits'
import { toSpanishMessage } from '@/services/errors'
import { formatFullDate, todayLocal } from '@/lib/dates'
import { cn } from '@/lib/utils'
import { routes } from '@/app/routes'
import type { GoalStatus, HabitRow, HabitStatus } from '@/types/database'

type Confirm =
  | { kind: 'complete-goal' }
  | { kind: 'archive-goal' }
  | { kind: 'delete-goal' }
  | { kind: 'delete-habit'; habit: HabitRow }

export function MetaDetallePage() {
  const { metaId } = useParams()
  const navigate = useNavigate()
  const refresh = useRefreshGoals()
  const bundle = useGoalBundle()
  const completions = useAllCompletions(bundle.data)
  const today = todayLocal()

  const [goalSheet, setGoalSheet] = useState(false)
  const [habitSheet, setHabitSheet] = useState<HabitRow | null>(null)
  const [confirm, setConfirm] = useState<Confirm | null>(null)
  const [metricOpen, setMetricOpen] = useState(false)
  const [showArchived, setShowArchived] = useState(false)

  const goal = bundle.data?.goals.find((g) => g.id === metaId)
  const summary = useMemo(
    () => (bundle.data && goal ? buildGoalSummary(bundle.data, goal, completions.set, today) : null),
    [bundle.data, goal, completions.set, today],
  )

  const habitInfo = useMemo(() => {
    const data = bundle.data
    if (!data || !goal) return new Map()
    const stats = toHabitsForStats(data, (h) => h.goal_id === goal.id)
    return new Map(
      data.habits
        .filter((h) => h.goal_id === goal.id)
        .map((h) => {
          const stat = stats.find((s) => s.id === h.id)!
          return [
            h.id,
            {
              version: currentVersion(toHabitSchedule(h, data.versions, [], []), today),
              consistency: consistency([stat], completions.set, h.start_date, today, today),
            },
          ]
        }),
    )
  }, [bundle.data, goal, completions.set, today])

  if (bundle.isPending) {
    return (
      <div className="flex flex-col gap-4 px-5 pt-[calc(var(--safe-top)+4rem)]">
        <Skeleton className="h-32 rounded-2xl" />
        <Skeleton className="h-24 rounded-2xl" />
        <Skeleton className="h-48 rounded-2xl" />
      </div>
    )
  }
  if (bundle.isError) return <QueryError onRetry={() => bundle.refetch()} />
  if (!goal || !summary) {
    return (
      <div className="flex flex-1 items-center justify-center pt-(--safe-top)">
        <EmptyState
          icon={SearchX}
          title="No encontramos esta meta"
          description="Es posible que se haya eliminado."
          action={<Button onClick={() => navigate(routes.metas)}>Ir a Mis metas</Button>}
        />
      </div>
    )
  }

  const category = categoryInfo(goal.category)
  const color = accentVar(goal.color)
  const editable = goal.status !== 'archived'
  const canAddHabits = goal.status === 'active' || goal.status === 'paused'

  /** Ejecuta una acción mostrando confirmación o error. */
  async function run(action: () => Promise<unknown>, success: string) {
    try {
      await action()
      await refresh()
      toast.success(success)
    } catch (error) {
      toast.error(toSpanishMessage(error))
    }
  }

  const changeGoalStatus = (status: GoalStatus, success: string) => run(() => setGoalStatus(goal.id, status), success)
  const changeHabitStatus = (habit: HabitRow, status: HabitStatus, success: string) =>
    run(() => setHabitStatus(habit.id, status), success)

  const goalActions: ActionSheetItem[] = [
    ...(editable ? [{ label: 'Editar meta', icon: Pencil, onSelect: () => navigate(routes.editarMeta(goal.id)) }] : []),
    ...(goal.status === 'active'
      ? [{ label: 'Pausar meta', icon: Pause, onSelect: () => changeGoalStatus('paused', 'Meta en pausa. Sus hábitos no aparecerán en Inicio.') }]
      : []),
    ...(goal.status === 'paused'
      ? [{ label: 'Reanudar meta', icon: Play, onSelect: () => changeGoalStatus('active', 'Meta reanudada.') }]
      : []),
    ...(goal.status === 'active' || goal.status === 'paused'
      ? [{ label: 'Marcar como completada', icon: CheckCircle2, onSelect: () => setConfirm({ kind: 'complete-goal' }) }]
      : []),
    ...(goal.status === 'completed'
      ? [{ label: 'Reabrir meta', icon: RotateCcw, onSelect: () => changeGoalStatus('active', 'Meta reabierta.') }]
      : []),
    ...(goal.status !== 'archived'
      ? [{ label: 'Archivar meta', icon: Archive, onSelect: () => setConfirm({ kind: 'archive-goal' }) }]
      : [
          {
            label: 'Restaurar meta',
            icon: ArchiveRestore,
            onSelect: () => changeGoalStatus(goal.completed_at ? 'completed' : 'active', 'Meta restaurada.'),
          },
        ]),
    { label: 'Eliminar meta', icon: Trash2, destructive: true, onSelect: () => setConfirm({ kind: 'delete-goal' }) },
  ]

  function habitActions(habit: HabitRow): ActionSheetItem[] {
    const items: ActionSheetItem[] = []
    if (habit.status !== 'archived') {
      items.push({ label: 'Editar hábito', icon: Pencil, onSelect: () => navigate(routes.editarHabito(habit.id)) })
    }
    if (habit.status === 'active') {
      items.push({ label: 'Pausar hábito', icon: Pause, onSelect: () => changeHabitStatus(habit, 'paused', 'Hábito en pausa.') })
    }
    if (habit.status === 'paused') {
      items.push({ label: 'Reanudar hábito', icon: Play, onSelect: () => changeHabitStatus(habit, 'active', 'Hábito reanudado.') })
    }
    if (habit.status === 'archived') {
      items.push({ label: 'Restaurar hábito', icon: ArchiveRestore, onSelect: () => changeHabitStatus(habit, 'active', 'Hábito restaurado.') })
    } else {
      items.push({ label: 'Archivar hábito', icon: Archive, onSelect: () => changeHabitStatus(habit, 'archived', 'Hábito archivado. Su historial se conserva.') })
    }
    items.push({ label: 'Eliminar hábito', icon: Trash2, destructive: true, onSelect: () => setConfirm({ kind: 'delete-habit', habit }) })
    return items
  }

  const smartRows = [
    { ...smartGuide.specific, value: goal.specific },
    { ...smartGuide.measurable, value: goal.measurable },
    { ...smartGuide.achievable, value: goal.achievable },
    { ...smartGuide.relevant, value: goal.relevant },
    { ...smartGuide.deadline, value: `Antes del ${formatFullDate(goal.deadline)}` },
  ]

  return (
    <>
      <header className="sticky top-0 z-30 flex items-center justify-between bg-background/85 px-2 pt-[calc(var(--safe-top)+0.5rem)] pb-1 backdrop-blur-xl">
        <Button variant="ghost" size="icon" onClick={() => navigate(routes.metas)} aria-label="Regresar a Mis metas">
          <ChevronLeft className="size-6" />
        </Button>
        <Button variant="ghost" size="icon" onClick={() => setGoalSheet(true)} aria-label="Opciones de la meta">
          <MoreHorizontal className="size-6" />
        </Button>
      </header>

      <div className="flex flex-col gap-6 px-5 pt-1 animate-fade-up">
        {/* Encabezado de la meta */}
        <section>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span className="size-2.5 rounded-full" style={{ backgroundColor: color }} />
            {category.label}
            <GoalStatusBadge status={goal.status} />
          </div>
          <h1 className="mt-1 text-[26px] leading-tight font-bold tracking-tight">{goal.name}</h1>
          {goal.description && <p className="mt-1.5 text-[15px] text-muted-foreground">{goal.description}</p>}
          <p
            className={cn(
              'mt-3 inline-flex items-center gap-1.5 text-sm text-muted-foreground',
              goal.status === 'active' && summary.daysLeft < 0 && 'font-medium text-destructive',
            )}
          >
            <CalendarClock className="size-4" />
            {formatFullDate(goal.deadline)}
            {(goal.status === 'active' || goal.status === 'paused') && ` · ${deadlineLabel(goal.deadline, today)}`}
          </p>
        </section>

        {/* Progreso: avance y constancia por separado */}
        <section className="grid gap-3">
          {summary.metric !== null ? (
            <Card>
              <CardContent className="flex items-center gap-4">
                <ProgressRing value={summary.metric} size={72} strokeWidth={8} color={color} label="Avance hacia la meta">
                  <span className="text-sm font-semibold">{Math.round(summary.metric)}%</span>
                </ProgressRing>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold">Avance hacia la meta</p>
                  <p className="mt-0.5 text-sm text-muted-foreground">
                    {goal.metric_name}: {formatNumber(goal.metric_current)} de {formatNumber(goal.metric_target!)}{' '}
                    {goal.metric_unit ?? ''} ({formatPercent(summary.metric)})
                  </p>
                  {editable && (
                    <Button variant="link" className="mt-1 h-auto min-h-11 px-0" onClick={() => setMetricOpen(true)}>
                      <TrendingUp className="size-4" /> Actualizar avance
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ) : (
            editable && (
              <Link
                to={`${routes.editarMeta(goal.id)}?paso=medible`}
                className="flex min-h-11 items-center gap-2 rounded-2xl border border-dashed border-border px-4 py-3 text-sm text-muted-foreground transition-colors hover:bg-muted"
              >
                <TrendingUp className="size-4 shrink-0" />
                Agrega un indicador numérico para medir tu avance hacia la meta.
              </Link>
            )
          )}

          <Card>
            <CardContent>
              <p className="text-sm font-semibold">Constancia de hábitos</p>
              {summary.consistency.rate === null ? (
                <p className="mt-1 text-sm text-muted-foreground">
                  Aún no hay días registrados. Tu constancia aparecerá cuando empieces a marcar tus hábitos.
                </p>
              ) : (
                <>
                  <div className="mt-1 flex items-baseline gap-2">
                    <span className="text-2xl font-bold">{formatPercent(summary.consistency.rate)}</span>
                    <span className="text-sm text-muted-foreground">
                      {summary.consistency.completed} de {summary.consistency.scheduled} veces completadas
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Cuenta los días programados hasta hoy. Los días en pausa no se toman en cuenta.
                  </p>
                </>
              )}
            </CardContent>
          </Card>
        </section>

        {/* Hábitos */}
        <section className="flex flex-col gap-3">
          <SectionTitle
            action={
              canAddHabits && (
                <Button asChild variant="ghost" size="sm" className="-mr-2 min-h-11 text-primary">
                  <Link to={routes.nuevoHabito(goal.id)}>
                    <Plus className="size-4" /> Agregar
                  </Link>
                </Button>
              )
            }
          >
            Hábitos
          </SectionTitle>

          {summary.habits.length === 0 ? (
            <Card className="border-dashed shadow-none">
              <CardContent className="flex flex-col items-center gap-3 py-6 text-center">
                <Repeat className="size-6 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">
                  Esta meta aún no tiene hábitos. Agrega al menos uno para avanzar día a día.
                </p>
                {canAddHabits && (
                  <Button asChild size="sm">
                    <Link to={routes.nuevoHabito(goal.id)}>Agregar hábito</Link>
                  </Button>
                )}
              </CardContent>
            </Card>
          ) : (
            <ul className="flex flex-col gap-2">
              {summary.habits.map((h) => (
                <li key={h.id}>
                  <HabitListItem
                    habit={h}
                    version={habitInfo.get(h.id)?.version ?? null}
                    consistency={habitInfo.get(h.id)?.consistency ?? { scheduled: 0, completed: 0, rate: null }}
                    today={today}
                    onOpenActions={() => setHabitSheet(h)}
                  />
                </li>
              ))}
            </ul>
          )}

          {summary.archivedHabits.length > 0 && (
            <div>
              <button
                type="button"
                onClick={() => setShowArchived((v) => !v)}
                aria-expanded={showArchived}
                className="flex min-h-11 items-center gap-1 text-sm text-muted-foreground"
              >
                <ChevronDown className={cn('size-4 transition-transform', showArchived && 'rotate-180')} />
                Hábitos archivados ({summary.archivedHabits.length})
              </button>
              {showArchived && (
                <ul className="mt-1 flex flex-col gap-2 animate-fade-up">
                  {summary.archivedHabits.map((h) => (
                    <li key={h.id}>
                      <HabitListItem
                        habit={h}
                        version={habitInfo.get(h.id)?.version ?? null}
                        consistency={habitInfo.get(h.id)?.consistency ?? { scheduled: 0, completed: 0, rate: null }}
                        today={today}
                        onOpenActions={() => setHabitSheet(h)}
                      />
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </section>

        {/* Componentes SMART */}
        <section className="flex flex-col gap-3">
          <SectionTitle>Tu meta SMART</SectionTitle>
          <Card>
            <CardContent className="flex flex-col gap-4">
              {smartRows.map((row) => (
                <div key={row.letter} className="flex gap-3">
                  <span
                    className="flex size-8 shrink-0 items-center justify-center rounded-lg text-sm font-bold text-white"
                    style={{ backgroundColor: color }}
                  >
                    {row.letter}
                  </span>
                  <div className="min-w-0">
                    <p className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">{row.title}</p>
                    <p className="mt-0.5 text-sm whitespace-pre-line">{row.value}</p>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </section>
      </div>

      <ActionSheet open={goalSheet} onOpenChange={setGoalSheet} title={goal.name} items={goalActions} />
      <ActionSheet
        open={habitSheet !== null}
        onOpenChange={(open) => !open && setHabitSheet(null)}
        title={habitSheet?.name ?? ''}
        items={habitSheet ? habitActions(habitSheet) : []}
      />
      {goal.metric_target !== null && (
        <UpdateMetricDialog
          goal={goal}
          open={metricOpen}
          onOpenChange={setMetricOpen}
          onSave={async (value) => {
            await updateGoal(goal.id, { metric_current: value })
            await refresh()
            toast.success('Avance actualizado.')
          }}
        />
      )}

      <ConfirmDialog
        open={confirm?.kind === 'complete-goal'}
        onOpenChange={(open) => !open && setConfirm(null)}
        title="¿Marcar la meta como completada?"
        description="¡Felicidades! Sus hábitos dejarán de aparecer en Inicio. Su historial se conserva y puedes reabrirla cuando quieras."
        confirmLabel="Completar meta"
        onConfirm={() => changeGoalStatus('completed', '¡Meta completada! 🎉')}
      />
      <ConfirmDialog
        open={confirm?.kind === 'archive-goal'}
        onOpenChange={(open) => !open && setConfirm(null)}
        title="¿Archivar esta meta?"
        description="Se ocultará de tus metas activas y sus hábitos dejarán de aparecer en Inicio. No se borra nada: puedes restaurarla después."
        confirmLabel="Archivar"
        onConfirm={() => changeGoalStatus('archived', 'Meta archivada.')}
      />
      <ConfirmDialog
        open={confirm?.kind === 'delete-goal'}
        onOpenChange={(open) => !open && setConfirm(null)}
        title="¿Eliminar esta meta para siempre?"
        description="Se borrarán la meta, sus hábitos y todo su historial. Esta acción no se puede deshacer. Si solo quieres ocultarla, mejor archívala."
        confirmLabel="Eliminar definitivamente"
        destructive
        onConfirm={async () => {
          try {
            await deleteGoal(goal.id)
            navigate(routes.metas, { replace: true })
            await refresh()
            toast.success('Meta eliminada.')
          } catch (error) {
            toast.error(toSpanishMessage(error))
          }
        }}
      />
      <ConfirmDialog
        open={confirm?.kind === 'delete-habit'}
        onOpenChange={(open) => !open && setConfirm(null)}
        title="¿Eliminar este hábito para siempre?"
        description={
          confirm?.kind === 'delete-habit'
            ? `Se borrarán «${confirm.habit.name}» y todos sus registros. Esta acción no se puede deshacer.`
            : ''
        }
        confirmLabel="Eliminar definitivamente"
        destructive
        onConfirm={() =>
          confirm?.kind === 'delete-habit' ? run(() => deleteHabit(confirm.habit.id), 'Hábito eliminado.') : undefined
        }
      />
    </>
  )
}
