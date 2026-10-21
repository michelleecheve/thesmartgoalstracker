import { useLocation, useNavigate, useParams } from 'react-router'
import { toast } from 'sonner'
import { Repeat, SearchX } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { EmptyState } from '@/components/common/EmptyState'
import { LoadingScreen } from '@/components/common/LoadingScreen'
import { HabitForm } from '@/features/habits/HabitForm'
import {
  emptyHabitForm,
  formToHabitInput,
  frequencyChanged,
  habitToForm,
  type HabitFormValues,
} from '@/features/habits/schemas'
import { useGoalBundle, useRefreshGoals } from '@/features/goals/queries'
import { toHabitSchedule } from '@/domain/mappers'
import { currentVersion } from '@/domain/schedule'
import { changeHabitSchedule, createHabit, updateHabit } from '@/services/habits'
import { todayLocal } from '@/lib/dates'
import { routes } from '@/app/routes'
import type { NewHabitState } from './MetaFormPage'

export function HabitoFormPage() {
  const { metaId, habitoId } = useParams()
  const location = useLocation()
  const navigate = useNavigate()
  const refresh = useRefreshGoals()
  const bundle = useGoalBundle()
  const afterGoalCreate = Boolean((location.state as NewHabitState | null)?.afterGoalCreate)

  if (bundle.isPending) return <LoadingScreen />
  const data = bundle.data
  const habit = habitoId ? data?.habits.find((h) => h.id === habitoId) : undefined
  const goalId = habit?.goal_id ?? metaId
  const goal = data?.goals.find((g) => g.id === goalId)

  if (!data || !goal || (habitoId && !habit)) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <EmptyState
          icon={SearchX}
          title={habitoId ? 'No encontramos este hábito' : 'No encontramos esta meta'}
          description="Es posible que se haya eliminado."
          action={<Button onClick={() => navigate(routes.metas)}>Ir a Mis metas</Button>}
        />
      </div>
    )
  }

  // Se puede asignar a metas activas o en pausa (y a la meta actual del hábito).
  const goalOptions = data.goals.filter((g) => g.status === 'active' || g.status === 'paused' || g.id === goal.id)
  const today = todayLocal()

  if (habit) {
    const version = currentVersion(toHabitSchedule(habit, data.versions, [], []), today)

    async function handleUpdate(values: HabitFormValues) {
      const input = formToHabitInput(values)
      await updateHabit(habit!.id, {
        goal_id: input.goalId,
        name: input.name,
        description: input.description,
        start_date: input.startDate,
        end_date: input.endDate,
        time_of_day: input.timeOfDay,
        duration_minutes: input.durationMinutes,
        color: input.color,
      })
      if (frequencyChanged(values, version)) await changeHabitSchedule(habit!.id, input)
      await refresh()
      toast.success('Hábito actualizado.')
      navigate(routes.meta(input.goalId), { replace: true })
    }

    return (
      <HabitForm
        mode="edit"
        title="Editar hábito"
        goals={goalOptions}
        initialValues={habitToForm(habit, version)}
        onSubmit={handleUpdate}
        onBack={() => navigate(-1)}
      />
    )
  }

  async function handleCreate(values: HabitFormValues) {
    const created = await createHabit(formToHabitInput(values))
    await refresh()
    if (afterGoalCreate) {
      toast.success('¡Listo! Tu meta y tu primer hábito están guardados.')
      navigate(routes.inicio, { replace: true })
    } else {
      toast.success('Hábito agregado.')
      navigate(routes.meta(created.goal_id), { replace: true })
    }
  }

  const start = goal.start_date > today ? goal.start_date : today
  return (
    <HabitForm
      mode="create"
      title="Nuevo hábito"
      goals={goalOptions}
      initialValues={emptyHabitForm(goal.id, start, goal.deadline >= start ? goal.deadline : '', goal.color ?? 'sage')}
      onSubmit={handleCreate}
      onBack={() => (afterGoalCreate ? navigate(routes.meta(goal.id), { replace: true }) : navigate(-1))}
      intro={
        afterGoalCreate && (
          <div className="flex gap-3 rounded-2xl bg-accent p-4 text-accent-foreground">
            <Repeat className="mt-0.5 size-5 shrink-0" />
            <div className="text-sm">
              <p className="font-semibold">Ahora, tu primer hábito</p>
              <p className="mt-0.5 opacity-90">
                ¿Qué pequeña acción repetida te acercará a «{goal.name}»? Por ejemplo: estudiar 45 minutos los lunes,
                miércoles y viernes.
              </p>
            </div>
          </div>
        )
      }
      secondaryAction={
        afterGoalCreate && (
          <Button type="button" variant="ghost" onClick={() => navigate(routes.meta(goal.id), { replace: true })}>
            Hacerlo después
          </Button>
        )
      }
    />
  )
}
