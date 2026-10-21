import { useMemo, useState } from 'react'
import { Link } from 'react-router'
import { Archive, CheckCircle2, Plus, Target } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { SegmentedControl } from '@/components/ui/segmented-control'
import { PageHeader } from '@/components/layout/PageHeader'
import { PageContent } from '@/components/layout/PageContent'
import { EmptyState } from '@/components/common/EmptyState'
import { GoalCard } from '@/features/goals/GoalCard'
import { buildGoalSummary, filterGoals, type GoalFilter } from '@/features/goals/model'
import { useAllCompletions, useGoalBundle } from '@/features/goals/queries'
import { todayLocal } from '@/lib/dates'
import { routes } from '@/app/routes'
import { QueryError } from '@/components/common/QueryError'

const filterOptions: { value: GoalFilter; label: string }[] = [
  { value: 'activas', label: 'Activas' },
  { value: 'completadas', label: 'Completadas' },
  { value: 'archivadas', label: 'Archivadas' },
]

const emptyStates = {
  completadas: {
    icon: CheckCircle2,
    title: 'Aún no has completado metas',
    description: 'Cuando alcances una meta, márcala como completada y aparecerá aquí.',
  },
  archivadas: {
    icon: Archive,
    title: 'No tienes metas archivadas',
    description: 'Archivar una meta la oculta sin borrar su historial.',
  },
}

export function MisMetasPage() {
  const [filter, setFilter] = useState<GoalFilter>('activas')
  const bundle = useGoalBundle()
  const completions = useAllCompletions(bundle.data)
  const today = todayLocal()

  const summaries = useMemo(() => {
    if (!bundle.data) return []
    return filterGoals(bundle.data.goals, filter).map((g) => buildGoalSummary(bundle.data, g, completions.set, today))
  }, [bundle.data, completions.set, filter, today])

  const hasAnyGoal = (bundle.data?.goals.length ?? 0) > 0

  return (
    <>
      <PageHeader
        title="Mis metas"
        subtitle="Tus metas SMART"
        action={
          <Button asChild size="icon" className="rounded-full" aria-label="Nueva meta">
            <Link to={routes.nuevaMeta}>
              <Plus className="size-5" />
            </Link>
          </Button>
        }
      />
      <PageContent>
        {hasAnyGoal && <SegmentedControl label="Filtrar metas" value={filter} onChange={setFilter} options={filterOptions} />}

        {bundle.isPending ? (
          <div className="flex flex-col gap-3">
            {[0, 1, 2].map((i) => (
              <Skeleton key={i} className="h-36 rounded-2xl" />
            ))}
          </div>
        ) : bundle.isError ? (
          <QueryError onRetry={() => bundle.refetch()} />
        ) : !hasAnyGoal || (filter === 'activas' && summaries.length === 0) ? (
          <EmptyState
            icon={Target}
            title={hasAnyGoal ? 'No tienes metas activas' : 'Aún no tienes metas'}
            description="Define una meta específica, medible, alcanzable, relevante y con fecha límite."
            action={
              <Button asChild>
                <Link to={routes.nuevaMeta}>Crear meta SMART</Link>
              </Button>
            }
          />
        ) : summaries.length === 0 ? (
          <EmptyState {...emptyStates[filter as 'completadas' | 'archivadas']} />
        ) : (
          <ul className="flex flex-col gap-3">
            {summaries.map((s) => (
              <li key={s.goal.id}>
                <GoalCard summary={s} today={today} />
              </li>
            ))}
          </ul>
        )}
      </PageContent>
    </>
  )
}
