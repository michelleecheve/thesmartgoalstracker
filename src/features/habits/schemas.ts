import { z } from 'zod'
import type { ScheduleVersion } from '@/domain/schedule'
import type { FrequencyType, HabitRow } from '@/types/database'
import type { HabitInput } from '@/services/habits'

const frequencyTypes = ['daily', 'weekly', 'interval'] as const

function parseInteger(value: string): number {
  const n = Number(value.trim())
  return Number.isInteger(n) ? n : NaN
}

export const habitFormSchema = z
  .object({
    goalId: z.string().min(1, { error: 'Elige la meta a la que pertenece.' }),
    name: z
      .string()
      .trim()
      .min(1, { error: 'Ponle un nombre al hábito.' })
      .max(120, { error: 'Usa máximo 120 caracteres.' }),
    description: z.string().trim().max(1000, { error: 'Usa máximo 1000 caracteres.' }),
    startDate: z.string().min(1, { error: 'Elige la fecha de inicio.' }),
    endDate: z.string(),
    frequencyType: z.enum(frequencyTypes),
    weekdays: z.array(z.number().int().min(1).max(7)),
    intervalDays: z.string(),
    timeOfDay: z.string(),
    durationMinutes: z.string(),
    color: z.string(),
  })
  .superRefine((v, ctx) => {
    if (v.endDate && v.startDate && v.endDate < v.startDate) {
      ctx.addIssue({ code: 'custom', path: ['endDate'], message: 'La fecha de fin no puede ser anterior al inicio.' })
    }
    if (v.frequencyType === 'weekly' && v.weekdays.length === 0) {
      ctx.addIssue({ code: 'custom', path: ['weekdays'], message: 'Elige al menos un día de la semana.' })
    }
    if (v.frequencyType === 'interval') {
      const n = parseInteger(v.intervalDays)
      if (!(n >= 2 && n <= 365)) {
        ctx.addIssue({ code: 'custom', path: ['intervalDays'], message: 'Escribe un número entero entre 2 y 365.' })
      }
    }
    if (v.durationMinutes.trim()) {
      const n = parseInteger(v.durationMinutes)
      if (!(n >= 1 && n <= 1440)) {
        ctx.addIssue({ code: 'custom', path: ['durationMinutes'], message: 'Escribe minutos entre 1 y 1440.' })
      }
    }
  })

export type HabitFormValues = z.infer<typeof habitFormSchema>

export function emptyHabitForm(goalId: string, startDate: string, endDate: string, color: string): HabitFormValues {
  return {
    goalId,
    name: '',
    description: '',
    startDate,
    endDate,
    frequencyType: 'weekly',
    weekdays: [],
    intervalDays: '2',
    timeOfDay: '',
    durationMinutes: '',
    color,
  }
}

export function habitToForm(habit: HabitRow, version: ScheduleVersion | null): HabitFormValues {
  return {
    goalId: habit.goal_id,
    name: habit.name,
    description: habit.description ?? '',
    startDate: habit.start_date,
    endDate: habit.end_date ?? '',
    frequencyType: version?.frequencyType ?? 'daily',
    weekdays: version?.weekdays ?? [],
    intervalDays: String(version?.intervalDays ?? 2),
    timeOfDay: habit.time_of_day?.slice(0, 5) ?? '',
    durationMinutes: habit.duration_minutes ? String(habit.duration_minutes) : '',
    color: habit.color ?? 'sage',
  }
}

export function formToHabitInput(v: HabitFormValues): HabitInput {
  return {
    goalId: v.goalId,
    name: v.name,
    description: v.description || null,
    startDate: v.startDate,
    endDate: v.endDate || null,
    timeOfDay: v.timeOfDay || null,
    durationMinutes: v.durationMinutes.trim() ? parseInteger(v.durationMinutes) : null,
    color: v.color || null,
    frequencyType: v.frequencyType as FrequencyType,
    weekdays: v.frequencyType === 'weekly' ? v.weekdays : null,
    intervalDays: v.frequencyType === 'interval' ? parseInteger(v.intervalDays) : null,
  }
}

/** ¿La frecuencia del formulario es distinta de la versión vigente? */
export function frequencyChanged(v: HabitFormValues, version: ScheduleVersion | null): boolean {
  if (!version) return true
  if (v.frequencyType !== version.frequencyType) return true
  if (v.frequencyType === 'weekly') {
    const a = [...new Set(v.weekdays)].sort().join()
    const b = [...new Set(version.weekdays ?? [])].sort().join()
    return a !== b
  }
  if (v.frequencyType === 'interval') return parseInteger(v.intervalDays) !== version.intervalDays
  return false
}
