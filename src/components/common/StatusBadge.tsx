import { Archive, CheckCircle2, Pause } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { goalStatusLabels, habitStatusLabels } from '@/domain/labels'
import type { GoalStatus, HabitStatus } from '@/types/database'

/** Etiqueta de estado. No se muestra para "activa" (es el estado normal). */
export function GoalStatusBadge({ status }: { status: GoalStatus }) {
  if (status === 'active') return null
  if (status === 'paused')
    return (
      <Badge variant="warning">
        <Pause /> {goalStatusLabels.paused}
      </Badge>
    )
  if (status === 'completed')
    return (
      <Badge variant="success">
        <CheckCircle2 /> {goalStatusLabels.completed}
      </Badge>
    )
  return (
    <Badge variant="secondary">
      <Archive /> {goalStatusLabels.archived}
    </Badge>
  )
}

export function HabitStatusBadge({ status }: { status: HabitStatus }) {
  if (status === 'active') return null
  return (
    <Badge variant={status === 'paused' ? 'warning' : 'secondary'}>
      {status === 'paused' ? <Pause /> : <Archive />} {habitStatusLabels[status]}
    </Badge>
  )
}
