import {
  BookOpen,
  Briefcase,
  Dumbbell,
  HeartPulse,
  Palette,
  PiggyBank,
  Shapes,
  Sprout,
  type LucideIcon,
} from 'lucide-react'
import type { GoalCategory, GoalStatus, HabitStatus } from '@/types/database'
import type { ScheduleVersion } from './schedule'

export const goalCategories: { value: GoalCategory; label: string; icon: LucideIcon }[] = [
  { value: 'educacion', label: 'Educación', icon: BookOpen },
  { value: 'carrera', label: 'Carrera profesional', icon: Briefcase },
  { value: 'salud', label: 'Salud', icon: HeartPulse },
  { value: 'ejercicio', label: 'Ejercicio', icon: Dumbbell },
  { value: 'finanzas', label: 'Finanzas', icon: PiggyBank },
  { value: 'personal', label: 'Personal', icon: Sprout },
  { value: 'creatividad', label: 'Creatividad', icon: Palette },
  { value: 'otra', label: 'Otra', icon: Shapes },
]

export function categoryInfo(value: GoalCategory) {
  return goalCategories.find((c) => c.value === value) ?? goalCategories[goalCategories.length - 1]!
}

export const goalStatusLabels: Record<GoalStatus, string> = {
  active: 'Activa',
  paused: 'En pausa',
  completed: 'Completada',
  archived: 'Archivada',
}

export const habitStatusLabels: Record<HabitStatus, string> = {
  active: 'Activo',
  paused: 'En pausa',
  archived: 'Archivado',
}

/** Colores identificadores (tokens definidos en index.css). */
export const accentColors = [
  { value: 'sage', label: 'Salvia' },
  { value: 'terracotta', label: 'Terracota' },
  { value: 'sky', label: 'Cielo' },
  { value: 'lavender', label: 'Lavanda' },
  { value: 'sand', label: 'Arena' },
  { value: 'rose', label: 'Rosa' },
  { value: 'slate', label: 'Pizarra' },
] as const

export type AccentColor = (typeof accentColors)[number]['value']

/** Color CSS para un valor guardado (o el predeterminado). */
export function accentVar(color: string | null | undefined): string {
  const known = accentColors.some((c) => c.value === color)
  return `var(--goal-${known ? color : 'sage'})`
}

export const weekdays = [
  { iso: 1, short: 'Lu', long: 'lunes' },
  { iso: 2, short: 'Ma', long: 'martes' },
  { iso: 3, short: 'Mi', long: 'miércoles' },
  { iso: 4, short: 'Ju', long: 'jueves' },
  { iso: 5, short: 'Vi', long: 'viernes' },
  { iso: 6, short: 'Sá', long: 'sábado' },
  { iso: 7, short: 'Do', long: 'domingo' },
] as const

function joinSpanish(items: string[]): string {
  if (items.length <= 1) return items.join('')
  return `${items.slice(0, -1).join(', ')} y ${items[items.length - 1]}`
}

/** "Todos los días", "De lunes a viernes", "Lunes, miércoles y viernes", "Cada 3 días". */
export function describeFrequency(version: Pick<ScheduleVersion, 'frequencyType' | 'weekdays' | 'intervalDays'>): string {
  switch (version.frequencyType) {
    case 'daily':
      return 'Todos los días'
    case 'interval':
      return `Cada ${version.intervalDays} días`
    case 'weekly': {
      const days = [...new Set(version.weekdays ?? [])].sort((a, b) => a - b)
      if (days.length === 7) return 'Todos los días'
      if (days.join() === '1,2,3,4,5') return 'De lunes a viernes'
      if (days.join() === '6,7') return 'Fines de semana'
      const names = days.map((d) => weekdays[d - 1]?.long ?? '')
      const text = joinSpanish(names)
      return text.charAt(0).toUpperCase() + text.slice(1)
    }
  }
}
