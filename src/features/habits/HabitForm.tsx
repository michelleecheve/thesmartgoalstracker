import { useState, type ReactNode } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { ChevronLeft, History } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { NativeSelect } from '@/components/ui/native-select'
import { SegmentedControl } from '@/components/ui/segmented-control'
import { FormField } from '@/components/forms/FormField'
import { FormError } from '@/components/forms/FormError'
import { SubmitButton } from '@/components/forms/SubmitButton'
import { ColorPicker } from '@/components/forms/ColorPicker'
import { describeFrequency, weekdays } from '@/domain/labels'
import { cn } from '@/lib/utils'
import type { GoalRow } from '@/types/database'
import { habitFormSchema, type HabitFormValues } from './schemas'

interface HabitFormProps {
  mode: 'create' | 'edit'
  title: string
  intro?: ReactNode
  goals: GoalRow[]
  initialValues: HabitFormValues
  onSubmit: (values: HabitFormValues) => Promise<void>
  onBack: () => void
  /** Acción secundaria opcional bajo el botón principal (p. ej. "Hacerlo después"). */
  secondaryAction?: ReactNode
}

const frequencyOptions = [
  { value: 'daily' as const, label: 'Diario' },
  { value: 'weekly' as const, label: 'Días' },
  { value: 'interval' as const, label: 'Cada N días' },
]

export function HabitForm({ mode, title, intro, goals, initialValues, onSubmit, onBack, secondaryAction }: HabitFormProps) {
  const [serverError, setServerError] = useState<string | null>(null)
  const {
    register,
    control,
    watch,
    handleSubmit,
    formState: { errors, isSubmitting, dirtyFields },
  } = useForm<HabitFormValues>({
    resolver: zodResolver(habitFormSchema),
    defaultValues: initialValues,
    mode: 'onTouched',
  })

  const frequencyType = watch('frequencyType')
  const selectedDays = watch('weekdays')
  const intervalDays = watch('intervalDays')
  const scheduleTouched = Boolean(dirtyFields.frequencyType || dirtyFields.weekdays || dirtyFields.intervalDays)

  const submit = handleSubmit(async (values) => {
    setServerError(null)
    try {
      await onSubmit(values)
    } catch (error) {
      setServerError(error instanceof Error ? error.message : 'Algo salió mal. Inténtalo de nuevo.')
    }
  })

  const preview =
    frequencyType === 'weekly' && selectedDays.length === 0
      ? null
      : describeFrequency({
          frequencyType,
          weekdays: selectedDays,
          intervalDays: Number(intervalDays) || null,
        })

  return (
    <form onSubmit={submit} noValidate className="flex flex-1 flex-col">
      <div className="sticky top-0 z-20 -mx-5 flex items-center gap-1 bg-background/90 px-5 pt-[calc(var(--safe-top)+0.5rem)] pb-2 backdrop-blur-xl">
        <Button type="button" variant="ghost" size="icon" className="-ml-3" onClick={onBack} aria-label="Regresar">
          <ChevronLeft className="size-6" />
        </Button>
        <h1 className="truncate text-lg font-semibold">{title}</h1>
      </div>

      <div className="flex flex-1 flex-col gap-5 pt-2 animate-fade-up">
        {intro}
        <FormError message={serverError} />

        <FormField label="Nombre del hábito" error={errors.name?.message}>
          <Input placeholder="Ej. Estudiar 45 minutos" {...register('name')} />
        </FormField>

        <FormField label="Meta a la que pertenece" error={errors.goalId?.message}>
          <NativeSelect {...register('goalId')}>
            <option value="" disabled>
              Elige una meta
            </option>
            {goals.map((g) => (
              <option key={g.id} value={g.id}>
                {g.name}
              </option>
            ))}
          </NativeSelect>
        </FormField>

        <section className="flex flex-col gap-3 rounded-2xl border border-border/60 bg-card p-4 shadow-soft">
          <Label>¿Cada cuánto?</Label>
          <Controller
            control={control}
            name="frequencyType"
            render={({ field }) => (
              <SegmentedControl label="Frecuencia" value={field.value} onChange={field.onChange} options={frequencyOptions} />
            )}
          />

          {frequencyType === 'weekly' && (
            <Controller
              control={control}
              name="weekdays"
              render={({ field }) => (
                <div className="flex flex-col gap-2 animate-fade-up">
                  <div role="group" aria-label="Días de la semana" className="grid grid-cols-7 gap-1">
                    {weekdays.map((day) => {
                      const selected = field.value.includes(day.iso)
                      return (
                        <button
                          key={day.iso}
                          type="button"
                          aria-pressed={selected}
                          aria-label={day.long}
                          onClick={() =>
                            field.onChange(
                              selected ? field.value.filter((d) => d !== day.iso) : [...field.value, day.iso].sort(),
                            )
                          }
                          className={cn(
                            'flex h-11 items-center justify-center rounded-xl text-sm font-semibold transition-all duration-200',
                            selected ? 'bg-primary text-primary-foreground shadow-soft' : 'bg-muted text-muted-foreground hover:text-foreground',
                          )}
                        >
                          {day.short}
                        </button>
                      )
                    })}
                  </div>
                  {errors.weekdays?.message && (
                    <p role="alert" className="text-sm text-destructive">
                      {errors.weekdays.message}
                    </p>
                  )}
                </div>
              )}
            />
          )}

          {frequencyType === 'interval' && (
            <FormField label="Repetir cada (días)" error={errors.intervalDays?.message} hint="Se cuenta a partir de la fecha de inicio.">
              <Input inputMode="numeric" {...register('intervalDays')} />
            </FormField>
          )}

          {preview && <p className="text-sm text-muted-foreground">Se repetirá: <span className="font-medium text-foreground">{preview}</span></p>}

          {mode === 'edit' && scheduleTouched && (
            <div className="flex gap-2.5 rounded-xl bg-accent p-3 text-sm text-accent-foreground animate-fade-up">
              <History className="mt-0.5 size-4 shrink-0" />
              <span>El cambio aplica desde hoy. Tus días anteriores y sus estadísticas se conservan tal como estaban.</span>
            </div>
          )}
        </section>

        <div className="grid grid-cols-2 gap-3">
          <FormField label="Fecha de inicio" error={errors.startDate?.message}>
            <Input type="date" {...register('startDate')} />
          </FormField>
          <FormField label="Fecha de fin" error={errors.endDate?.message}>
            <Input type="date" {...register('endDate')} />
          </FormField>
        </div>
        <p className="-mt-3 text-sm text-muted-foreground">Deja la fecha de fin vacía si el hábito no tiene fin.</p>

        <div className="grid grid-cols-2 gap-3">
          <FormField label="Hora (opcional)">
            <Input type="time" {...register('timeOfDay')} />
          </FormField>
          <FormField label="Duración (min)" error={errors.durationMinutes?.message}>
            <Input inputMode="numeric" placeholder="Opcional" {...register('durationMinutes')} />
          </FormField>
        </div>

        <FormField label="Descripción (opcional)" error={errors.description?.message}>
          <Textarea rows={2} placeholder="Algún detalle para recordar" {...register('description')} />
        </FormField>

        <div className="flex flex-col gap-2">
          <Label>Color</Label>
          <Controller
            control={control}
            name="color"
            render={({ field }) => <ColorPicker label="Color del hábito" value={field.value} onChange={field.onChange} />}
          />
        </div>
      </div>

      <div className="sticky bottom-0 -mx-5 mt-6 flex flex-col gap-1 bg-background/90 px-5 pt-3 pb-[calc(var(--safe-bottom)+0.75rem)] backdrop-blur-xl">
        <SubmitButton loading={isSubmitting} loadingText="Guardando…">
          {mode === 'edit' ? 'Guardar cambios' : 'Guardar hábito'}
        </SubmitButton>
        {secondaryAction}
      </div>
    </form>
  )
}
