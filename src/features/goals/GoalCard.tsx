import type { CSSProperties } from 'react'
import { Link } from 'react-router'
import { CalendarClock, ChevronRight, Repeat } from 'lucide-react'
import { Progress } from '@/components/ui/progress'
import { GoalStatusBadge } from '@/components/common/StatusBadge'
import { accentVar, categoryInfo } from '@/domain/labels'
import { deadlineLabel, formatNumber, formatPercent } from '@/domain/progress'
import { formatShortDate, type LocalDate } from '@/lib/dates'
import { cn } from '@/lib/utils'
import { routes } from '@/app/routes'
import type { GoalSummary } from './model'

export function GoalCard({ summary, today }: { summary: GoalSummary; today: LocalDate }) {
  const { goal, habits, metric, consistency } = summary
  const category = categoryInfo(goal.category)
  const color = accentVar(goal.color)
  const overdue = goal.status === 'active' && summary.daysLeft < 0
  const habitCount = habits.length

  return (
    <Link
      to={routes.meta(goal.id)}
      className="group block rounded-2xl border border-border/60 bg-card p-4 shadow-soft transition-all duration-200 hover:shadow-lifted active:scale-[0.99]"
    >
      <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
        <span className="size-2.5 shrink-0 rounded-full" style={{ backgroundColor: color }} />
        <span className="truncate">{category.label}</span>
        <span className="ml-auto">
          <GoalStatusBadge status={goal.status} />
        </span>
      </div>

      <div className="mt-1.5 flex items-start justify-between gap-2">
        <h3 className="text-[17px] leading-snug font-semibold">{goal.name}</h3>
        <ChevronRight className="mt-0.5 size-5 shrink-0 text-muted-foreground/60 transition-transform group-hover:translate-x-0.5" />
      </div>

      <div className="mt-3">
        {metric !== null ? (
          <>
            <div className="mb-1.5 flex items-baseline justify-between text-sm">
              <span className="text-muted-foreground">
                {formatNumber(goal.metric_current)} de {formatNumber(goal.metric_target!)} {goal.metric_unit ?? ''}
              </span>
              <span className="font-semibold">{formatPercent(metric)}</span>
            </div>
            <Progress value={metric} indicatorClassName="bg-(--goal-color)" style={{ '--goal-color': color } as CSSProperties} />
          </>
        ) : (
          <p className="text-sm text-muted-foreground">
            Constancia:{' '}
            <span className="font-semibold text-foreground">
              {consistency.rate === null ? 'sin registros aún' : formatPercent(consistency.rate)}
            </span>
          </p>
        )}
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
        <span className={cn('inline-flex items-center gap-1', overdue && 'font-medium text-destructive')}>
          <CalendarClock className="size-3.5" />
          {formatShortDate(goal.deadline)}
          {goal.status === 'active' || goal.status === 'paused' ? ` · ${deadlineLabel(goal.deadline, today)}` : ''}
        </span>
        <span className="inline-flex items-center gap-1">
          <Repeat className="size-3.5" />
          {habitCount === 1 ? '1 hábito' : `${habitCount} hábitos`}
        </span>
      </div>
    </Link>
  )
}
