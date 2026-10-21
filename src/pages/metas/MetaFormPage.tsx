import { useNavigate, useParams, useSearchParams } from 'react-router'
import { toast } from 'sonner'
import { SearchX } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { EmptyState } from '@/components/common/EmptyState'
import { LoadingScreen } from '@/components/common/LoadingScreen'
import { GoalWizard } from '@/features/goals/GoalWizard'
import { emptyGoalForm, formToGoal, goalToForm, type GoalFormValues } from '@/features/goals/schemas'
import { useGoalBundle, useRefreshGoals } from '@/features/goals/queries'
import { createGoal, updateGoal } from '@/services/goals'
import { todayLocal } from '@/lib/dates'
import { routes } from '@/app/routes'

export interface NewHabitState {
  /** Venimos de crear la meta: pedir el primer hábito. */
  afterGoalCreate?: boolean
}

export function MetaFormPage() {
  const { metaId } = useParams()
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const refresh = useRefreshGoals()
  const bundle = useGoalBundle()

  if (!metaId) {
    async function handleCreate(values: GoalFormValues) {
      const goal = await createGoal(formToGoal(values))
      await refresh()
      toast.success('¡Tu meta quedó guardada!')
      const state: NewHabitState = { afterGoalCreate: true }
      navigate(routes.nuevoHabito(goal.id), { replace: true, state })
    }
    return (
      <GoalWizard
        mode="create"
        initialValues={emptyGoalForm(todayLocal())}
        onSubmit={handleCreate}
        onCancel={() => navigate(-1)}
      />
    )
  }

  if (bundle.isPending) return <LoadingScreen />
  const goal = bundle.data?.goals.find((g) => g.id === metaId)
  if (!goal) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <EmptyState
          icon={SearchX}
          title="No encontramos esta meta"
          description="Es posible que se haya eliminado."
          action={<Button onClick={() => navigate(routes.metas)}>Ir a Mis metas</Button>}
        />
      </div>
    )
  }

  async function handleUpdate(values: GoalFormValues) {
    await updateGoal(goal!.id, formToGoal(values))
    await refresh()
    toast.success('Cambios guardados.')
    navigate(routes.meta(goal!.id), { replace: true })
  }

  const paso = searchParams.get('paso')
  return (
    <GoalWizard
      mode="edit"
      initialValues={goalToForm(goal)}
      initialStep={paso === 'medible' ? 'measurable' : 'info'}
      onSubmit={handleUpdate}
      onCancel={() => navigate(-1)}
    />
  )
}
