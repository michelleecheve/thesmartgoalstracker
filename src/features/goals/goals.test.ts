import { describe, expect, it } from 'vitest'
import type { GoalRow } from '@/types/database'
import type { GoalBundleData } from '@/domain/mappers'
import { completionKey } from '@/domain/progress'
import { emptyGoalForm, formToGoal, goalFormSchema, goalStepSchemas, goalToForm } from './schemas'
import { buildGoalSummary, filterGoals } from './model'

const baseForm = {
  ...emptyGoalForm('2026-11-01'),
  name: 'Completar mi curso de Coursera',
  specific: 'Completar todos los módulos',
  measurable: 'Obtener el certificado',
  achievable: '45 minutos por sesión',
  relevant: 'Mejorar profesionalmente',
  deadline: '2027-03-31',
}

function goal(overrides: Partial<GoalRow> = {}): GoalRow {
  return {
    id: 'g1',
    user_id: 'u',
    name: 'Meta',
    description: null,
    category: 'educacion',
    color: 'sage',
    status: 'active',
    specific: '',
    measurable: '',
    achievable: '',
    relevant: '',
    start_date: '2026-11-01',
    deadline: '2027-03-31',
    metric_name: null,
    metric_unit: null,
    metric_target: null,
    metric_current: 0,
    completed_at: null,
    archived_at: null,
    created_at: '2026-11-01T12:00:00Z',
    updated_at: '2026-11-01T12:00:00Z',
    ...overrides,
  }
}

describe('formulario de meta', () => {
  it('acepta una meta completa sin indicador', () => {
    expect(goalFormSchema.safeParse(baseForm).success).toBe(true)
  })

  it('valida cada paso por separado con mensajes en español', () => {
    const r = goalStepSchemas.specific.safeParse({ ...baseForm, specific: '  ' })
    expect(r.success).toBe(false)
    expect(r.error?.issues[0]?.message).toBe('Describe qué quieres lograr exactamente.')
  })

  it('valida el indicador aunque los pasos siguientes estén vacíos', () => {
    const r = goalStepSchemas.measurable.safeParse({
      ...emptyGoalForm('2026-11-01'),
      measurable: 'Certificado',
      hasMetric: true,
      metricName: 'Módulos',
      metricTarget: '0',
    })
    expect(r.error?.issues.map((i) => i.message)).toEqual(['Escribe un número mayor que cero.'])
  })

  it('no permite una fecha límite anterior al inicio', () => {
    const r = goalStepSchemas.deadline.safeParse({ startDate: '2026-11-01', deadline: '2026-10-01' })
    expect(r.error?.issues[0]?.message).toBe('La fecha límite no puede ser anterior al inicio de la meta.')
  })

  it('convierte el formulario a columnas (con indicador y coma decimal)', () => {
    const row = formToGoal({ ...baseForm, hasMetric: true, metricName: 'Módulos', metricTarget: '12', metricCurrent: '7,5', metricUnit: 'módulos' })
    expect(row).toMatchObject({ metric_name: 'Módulos', metric_target: 12, metric_current: 7.5, metric_unit: 'módulos', description: null })
  })

  it('sin indicador guarda los campos del indicador vacíos', () => {
    const row = formToGoal({ ...baseForm, hasMetric: false, metricName: 'x', metricTarget: '5' })
    expect(row).toMatchObject({ metric_name: null, metric_target: null, metric_current: 0 })
  })

  it('ida y vuelta entre fila y formulario', () => {
    const g = goal({ metric_name: 'Módulos', metric_target: 12, metric_current: 7 })
    expect(formToGoal(goalToForm(g))).toMatchObject({ metric_target: 12, metric_current: 7, start_date: '2026-11-01' })
  })
})

describe('resumen de metas', () => {
  it('filtra y ordena: activas antes que pausadas, luego por fecha límite', () => {
    const goals = [
      goal({ id: 'a', status: 'paused', deadline: '2026-12-01' }),
      goal({ id: 'b', status: 'active', deadline: '2027-01-01' }),
      goal({ id: 'c', status: 'active', deadline: '2026-12-15' }),
      goal({ id: 'd', status: 'archived' }),
      goal({ id: 'e', status: 'completed' }),
    ]
    expect(filterGoals(goals, 'activas').map((g) => g.id)).toEqual(['c', 'b', 'a'])
    expect(filterGoals(goals, 'completadas').map((g) => g.id)).toEqual(['e'])
    expect(filterGoals(goals, 'archivadas').map((g) => g.id)).toEqual(['d'])
  })

  it('calcula avance y constancia por separado', () => {
    const g = goal({ metric_name: 'Módulos', metric_target: 12, metric_current: 7 })
    const bundle: GoalBundleData = {
      goals: [g],
      habits: [
        {
          id: 'h1',
          user_id: 'u',
          goal_id: 'g1',
          name: 'Estudiar',
          description: null,
          start_date: '2026-11-01',
          end_date: null,
          time_of_day: null,
          duration_minutes: null,
          icon: null,
          color: null,
          status: 'active',
          archived_at: null,
          created_at: '',
          updated_at: '',
        },
      ],
      versions: [
        { id: 'v', habit_id: 'h1', user_id: 'u', effective_from: '2026-11-01', frequency_type: 'daily', weekdays: null, interval_days: null, created_at: '' },
      ],
      habitPauses: [],
      goalPauses: [],
    }
    const s = buildGoalSummary(bundle, g, new Set([completionKey('h1', '2026-11-01')]), '2026-11-03')
    expect(s.metric).toBeCloseTo(58.33, 1)
    expect(s.consistency).toEqual({ scheduled: 2, completed: 1, rate: 50 })
    expect(s.habits).toHaveLength(1)
    expect(s.daysLeft).toBe(148)
  })
})
