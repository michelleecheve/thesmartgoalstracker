import { z } from 'zod'
import type { GoalCategory, GoalRow } from '@/types/database'
import type { GoalInsert } from '@/services/goals'

const categories = ['educacion', 'carrera', 'salud', 'ejercicio', 'finanzas', 'personal', 'creatividad', 'otra'] as const

const smartText = (message: string) =>
  z.string().trim().min(1, { error: message }).max(1000, { error: 'Usa máximo 1000 caracteres.' })

/** Número positivo escrito en un campo de texto ("12", "7.5" o "7,5"). */
function parseNumber(value: string): number {
  return Number(value.trim().replace(',', '.'))
}

const goalObject = z.object({
    name: z
      .string()
      .trim()
      .min(1, { error: 'Ponle un nombre a tu meta.' })
      .max(120, { error: 'Usa máximo 120 caracteres.' }),
    description: z.string().trim().max(1000, { error: 'Usa máximo 1000 caracteres.' }),
    category: z.enum(categories, { error: 'Elige una categoría.' }),
    color: z.string(),
    specific: smartText('Describe qué quieres lograr exactamente.'),
    measurable: smartText('Describe cómo sabrás que lo lograste.'),
    achievable: smartText('Cuéntanos por qué puedes conseguirlo.'),
    relevant: smartText('Cuéntanos por qué es importante para ti.'),
    startDate: z.string(),
    deadline: z.string().min(1, { error: 'Elige una fecha límite.' }),
    hasMetric: z.boolean(),
    metricName: z.string().trim().max(80, { error: 'Usa máximo 80 caracteres.' }),
    metricUnit: z.string().trim().max(40, { error: 'Usa máximo 40 caracteres.' }),
    metricTarget: z.string(),
    metricCurrent: z.string(),
})

type GoalObject = z.infer<typeof goalObject>

function checkDeadline(v: Pick<GoalObject, 'deadline' | 'startDate'>, ctx: z.RefinementCtx) {
  if (v.deadline && v.deadline < v.startDate) {
    ctx.addIssue({
      code: 'custom',
      path: ['deadline'],
      message: 'La fecha límite no puede ser anterior al inicio de la meta.',
    })
  }
}

function checkMetric(
  v: Pick<GoalObject, 'hasMetric' | 'metricName' | 'metricTarget' | 'metricCurrent'>,
  ctx: z.RefinementCtx,
) {
  if (!v.hasMetric) return
  if (!v.metricName) {
    ctx.addIssue({ code: 'custom', path: ['metricName'], message: 'Escribe qué vas a medir.' })
  }
  const target = parseNumber(v.metricTarget)
  if (!v.metricTarget.trim() || !Number.isFinite(target) || target <= 0) {
    ctx.addIssue({ code: 'custom', path: ['metricTarget'], message: 'Escribe un número mayor que cero.' })
  }
  const current = v.metricCurrent.trim() ? parseNumber(v.metricCurrent) : 0
  if (!Number.isFinite(current) || current < 0) {
    ctx.addIssue({ code: 'custom', path: ['metricCurrent'], message: 'Escribe un número igual o mayor que cero.' })
  }
}

export const goalFormSchema = goalObject.superRefine((v, ctx) => {
  checkDeadline(v, ctx)
  checkMetric(v, ctx)
})

/**
 * Esquemas por paso del asistente. Se validan por separado porque las reglas
 * entre campos (superRefine) no se ejecutan si otros pasos aún están vacíos.
 */
export const goalStepSchemas = {
  info: goalObject.pick({ name: true, description: true, category: true, color: true }),
  specific: goalObject.pick({ specific: true }),
  measurable: goalObject
    .pick({ measurable: true, hasMetric: true, metricName: true, metricUnit: true, metricTarget: true, metricCurrent: true })
    .superRefine(checkMetric),
  achievable: goalObject.pick({ achievable: true }),
  relevant: goalObject.pick({ relevant: true }),
  deadline: goalObject.pick({ startDate: true, deadline: true }).superRefine(checkDeadline),
} as const

export type GoalFormValues = z.infer<typeof goalFormSchema>

export function emptyGoalForm(today: string): GoalFormValues {
  return {
    name: '',
    description: '',
    category: 'educacion',
    color: 'sage',
    specific: '',
    measurable: '',
    achievable: '',
    relevant: '',
    startDate: today,
    deadline: '',
    hasMetric: false,
    metricName: '',
    metricUnit: '',
    metricTarget: '',
    metricCurrent: '',
  }
}

export function goalToForm(goal: GoalRow): GoalFormValues {
  const hasMetric = goal.metric_target !== null
  return {
    name: goal.name,
    description: goal.description ?? '',
    category: goal.category,
    color: goal.color ?? 'sage',
    specific: goal.specific,
    measurable: goal.measurable,
    achievable: goal.achievable,
    relevant: goal.relevant,
    startDate: goal.start_date,
    deadline: goal.deadline,
    hasMetric,
    metricName: goal.metric_name ?? '',
    metricUnit: goal.metric_unit ?? '',
    metricTarget: hasMetric ? String(goal.metric_target) : '',
    metricCurrent: hasMetric ? String(goal.metric_current) : '',
  }
}

/** Convierte el formulario en columnas de la tabla goals. */
export function formToGoal(v: GoalFormValues): GoalInsert {
  return {
    name: v.name,
    description: v.description || null,
    category: v.category as GoalCategory,
    color: v.color || null,
    specific: v.specific,
    measurable: v.measurable,
    achievable: v.achievable,
    relevant: v.relevant,
    start_date: v.startDate,
    deadline: v.deadline,
    metric_name: v.hasMetric ? v.metricName : null,
    metric_unit: v.hasMetric ? v.metricUnit || null : null,
    metric_target: v.hasMetric ? parseNumber(v.metricTarget) : null,
    metric_current: v.hasMetric && v.metricCurrent.trim() ? parseNumber(v.metricCurrent) : 0,
  }
}
