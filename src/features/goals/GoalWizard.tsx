import { useState, type ReactNode } from 'react'
import { Controller, useForm, type FieldPath } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { ChevronLeft, Lightbulb, Pencil, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Progress } from '@/components/ui/progress'
import { Label } from '@/components/ui/label'
import { FormField } from '@/components/forms/FormField'
import { FormError } from '@/components/forms/FormError'
import { SubmitButton } from '@/components/forms/SubmitButton'
import { ColorPicker } from '@/components/forms/ColorPicker'
import { accentVar, categoryInfo, goalCategories } from '@/domain/labels'
import { formatFullDate } from '@/lib/dates'
import { cn } from '@/lib/utils'
import { goalFormSchema, goalStepSchemas, type GoalFormValues } from './schemas'
import { smartGuide, type SmartKey } from './smartGuide'

type StepKey = 'info' | SmartKey | 'review'
const steps: StepKey[] = ['info', 'specific', 'measurable', 'achievable', 'relevant', 'deadline', 'review']

const stepShortLabel: Record<StepKey, string> = {
  info: 'Meta',
  specific: 'S',
  measurable: 'M',
  achievable: 'A',
  relevant: 'R',
  deadline: 'T',
  review: 'Resumen',
}

interface GoalWizardProps {
  mode: 'create' | 'edit'
  initialValues: GoalFormValues
  onSubmit: (values: GoalFormValues) => Promise<void>
  onCancel: () => void
  /** Paso inicial (p. ej. abrir directamente "Medible" para agregar un indicador). */
  initialStep?: StepKey
}

export function GoalWizard({ mode, initialValues, onSubmit, onCancel, initialStep }: GoalWizardProps) {
  const [stepIndex, setStepIndex] = useState(() => Math.max(0, steps.indexOf(initialStep ?? 'info')))
  const [serverError, setServerError] = useState<string | null>(null)
  const step = steps[stepIndex]!
  const isLast = stepIndex === steps.length - 1
  const editing = mode === 'edit'

  const form = useForm<GoalFormValues>({
    resolver: zodResolver(goalFormSchema),
    defaultValues: initialValues,
    mode: 'onTouched',
  })
  const {
    register,
    control,
    watch,
    getValues,
    setError,
    clearErrors,
    setFocus,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = form

  /** Valida solo los campos del paso actual. */
  function validateStep(key: StepKey): boolean {
    if (key === 'review') return true
    const schema = goalStepSchemas[key]
    const fields = Object.keys(schema.shape ?? {}) as FieldPath<GoalFormValues>[]
    clearErrors(fields)
    const result = schema.safeParse(getValues())
    if (result.success) return true
    let first: FieldPath<GoalFormValues> | null = null
    for (const issue of result.error.issues) {
      const name = issue.path[0] as FieldPath<GoalFormValues>
      first ??= name
      setError(name, { type: 'manual', message: issue.message })
    }
    if (first) setFocus(first)
    return false
  }

  function goTo(index: number) {
    setStepIndex(index)
    window.scrollTo({ top: 0 })
  }

  function next() {
    if (validateStep(step)) goTo(stepIndex + 1)
  }

  function back() {
    if (stepIndex === 0) onCancel()
    else goTo(stepIndex - 1)
  }

  /** En edición se puede saltar a cualquier paso; al crear, solo hacia atrás. */
  function jumpTo(index: number) {
    if (index === stepIndex) return
    if (index < stepIndex || editing) {
      if (index > stepIndex && !validateStep(step)) return
      goTo(index)
    }
  }

  const submit = handleSubmit(
    async (values) => {
      setServerError(null)
      try {
        await onSubmit(values)
      } catch (error) {
        setServerError(error instanceof Error ? error.message : 'Algo salió mal. Inténtalo de nuevo.')
      }
    },
    (fieldErrors) => {
      // Lleva al primer paso con errores.
      const firstStep = steps.findIndex(
        (key) => key !== 'review' && Object.keys(goalStepSchemas[key].shape ?? {}).some((f) => f in fieldErrors),
      )
      if (firstStep >= 0) goTo(firstStep)
    },
  )

  const color = watch('color')
  const hasMetric = watch('hasMetric')

  return (
    <form onSubmit={(e) => e.preventDefault()} noValidate className="flex flex-1 flex-col">
      {/* Encabezado: navegación y progreso */}
      <div className="sticky top-0 z-20 -mx-5 bg-background/90 px-5 pt-[calc(var(--safe-top)+0.5rem)] pb-3 backdrop-blur-xl">
        <div className="flex items-center justify-between">
          <Button type="button" variant="ghost" size="icon" className="-ml-3" onClick={back} aria-label={stepIndex === 0 ? 'Cancelar' : 'Paso anterior'}>
            {stepIndex === 0 ? <X className="size-6" /> : <ChevronLeft className="size-6" />}
          </Button>
          <p className="text-sm font-medium text-muted-foreground">
            {editing ? 'Editar meta' : 'Nueva meta'} · Paso {stepIndex + 1} de {steps.length}
          </p>
          <span className="size-11" />
        </div>
        <Progress value={((stepIndex + 1) / steps.length) * 100} className="mt-1 h-1.5" />
        <nav aria-label="Pasos" className="mt-3 flex justify-between gap-1">
          {steps.map((key, i) => {
            const reachable = i < stepIndex || editing
            return (
              <button
                key={key}
                type="button"
                onClick={() => jumpTo(i)}
                disabled={!reachable && i !== stepIndex}
                aria-current={i === stepIndex ? 'step' : undefined}
                className={cn(
                  'min-h-9 min-w-9 rounded-full px-2 text-xs font-semibold transition-colors',
                  i === stepIndex
                    ? 'bg-foreground text-background'
                    : i < stepIndex
                      ? 'bg-accent text-accent-foreground'
                      : 'text-muted-foreground disabled:opacity-60',
                )}
              >
                {stepShortLabel[key]}
              </button>
            )
          })}
        </nav>
      </div>

      <div key={step} className="flex flex-1 flex-col gap-5 pt-4 animate-fade-up">
        <FormError message={serverError} />

        {step === 'info' && (
          <>
            <StepIntro
              title={editing ? 'Tu meta' : 'Empecemos por tu meta'}
              subtitle="Dale un nombre corto y fácil de recordar."
            />
            <FormField label="Nombre de la meta" error={errors.name?.message}>
              <Input placeholder="Ej. Completar mi curso de Coursera" {...register('name')} />
            </FormField>
            <div className="flex flex-col gap-2">
              <Label>Categoría</Label>
              <Controller
                control={control}
                name="category"
                render={({ field }) => (
                  <div role="radiogroup" aria-label="Categoría" className="grid grid-cols-2 gap-2">
                    {goalCategories.map(({ value, label, icon: Icon }) => {
                      const selected = field.value === value
                      return (
                        <button
                          key={value}
                          type="button"
                          role="radio"
                          aria-checked={selected}
                          onClick={() => field.onChange(value)}
                          className={cn(
                            'flex min-h-12 items-center gap-2.5 rounded-xl border px-3 text-left text-sm font-medium transition-all duration-200',
                            selected
                              ? 'border-primary bg-accent text-accent-foreground'
                              : 'border-input bg-card hover:bg-muted',
                          )}
                        >
                          <Icon className="size-[18px] shrink-0" />
                          <span className="leading-tight">{label}</span>
                        </button>
                      )
                    })}
                  </div>
                )}
              />
            </div>
            <FormField label="Descripción (opcional)" error={errors.description?.message}>
              <Textarea rows={3} placeholder="Algún detalle que quieras recordar" {...register('description')} />
            </FormField>
            <div className="flex flex-col gap-2">
              <Label>Color identificador</Label>
              <Controller
                control={control}
                name="color"
                render={({ field }) => <ColorPicker label="Color identificador" value={field.value} onChange={field.onChange} />}
              />
            </div>
          </>
        )}

        {(step === 'specific' || step === 'achievable' || step === 'relevant') && (
          <SmartStep guideKey={step} color={color}>
            <FormField label="Tu respuesta" error={errors[step]?.message}>
              <Textarea rows={4} placeholder="Escribe aquí…" {...register(step)} />
            </FormField>
          </SmartStep>
        )}

        {step === 'measurable' && (
          <SmartStep guideKey="measurable" color={color}>
            <FormField label="Tu respuesta" error={errors.measurable?.message}>
              <Textarea rows={3} placeholder="Escribe aquí…" {...register('measurable')} />
            </FormField>
            <div className="rounded-2xl border border-border bg-card p-4">
              <label className="flex min-h-11 cursor-pointer items-center justify-between gap-3">
                <span>
                  <span className="block text-sm font-semibold">Medir mi avance con un número</span>
                  <span className="block text-sm text-muted-foreground">Opcional. Ej. módulos, kilos, páginas, ahorro.</span>
                </span>
                <input type="checkbox" className="size-6 shrink-0 accent-(--primary)" {...register('hasMetric')} />
              </label>
              {hasMetric && (
                <div className="mt-4 grid grid-cols-2 gap-3 animate-fade-up">
                  <FormField label="¿Qué vas a medir?" error={errors.metricName?.message} className="col-span-2">
                    <Input placeholder="Ej. Módulos completados" {...register('metricName')} />
                  </FormField>
                  <FormField label="Valor objetivo" error={errors.metricTarget?.message}>
                    <Input inputMode="decimal" placeholder="12" {...register('metricTarget')} />
                  </FormField>
                  <FormField label="Valor actual" error={errors.metricCurrent?.message}>
                    <Input inputMode="decimal" placeholder="0" {...register('metricCurrent')} />
                  </FormField>
                  <FormField label="Unidad (opcional)" error={errors.metricUnit?.message} className="col-span-2">
                    <Input placeholder="Ej. módulos" {...register('metricUnit')} />
                  </FormField>
                </div>
              )}
            </div>
          </SmartStep>
        )}

        {step === 'deadline' && (
          <SmartStep guideKey="deadline" color={color}>
            <FormField label="Fecha límite" error={errors.deadline?.message}>
              <Input type="date" min={getValues('startDate')} {...register('deadline')} />
            </FormField>
          </SmartStep>
        )}

        {step === 'review' && <Review values={getValues()} onEdit={(key) => goTo(steps.indexOf(key))} />}
      </div>

      {/* Acciones */}
      <div className="sticky bottom-0 -mx-5 mt-6 flex flex-col gap-2 bg-background/90 px-5 pt-3 pb-[calc(var(--safe-bottom)+0.75rem)] backdrop-blur-xl">
        {isLast || editing ? (
          <>
            {!isLast && (
              <Button type="button" variant="secondary" size="lg" onClick={next}>
                Continuar
              </Button>
            )}
            <SubmitButton type="button" onClick={() => validateStep(step) && submit()} loading={isSubmitting} loadingText="Guardando…">
              {editing ? 'Guardar cambios' : 'Guardar meta'}
            </SubmitButton>
          </>
        ) : (
          <Button type="button" size="lg" onClick={next}>
            Continuar
          </Button>
        )}
      </div>
    </form>
  )
}

function StepIntro({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <div>
      <h1 className="text-[26px] leading-tight font-bold tracking-tight">{title}</h1>
      <p className="mt-1.5 text-muted-foreground">{subtitle}</p>
    </div>
  )
}

function SmartStep({ guideKey, color, children }: { guideKey: SmartKey; color: string; children: ReactNode }) {
  const guide = smartGuide[guideKey]
  return (
    <>
      <div className="flex items-start gap-4">
        <span
          className="flex size-14 shrink-0 items-center justify-center rounded-2xl text-2xl font-bold text-white shadow-soft"
          style={{ backgroundColor: accentVar(color) }}
          aria-hidden
        >
          {guide.letter}
        </span>
        <div className="min-w-0">
          <p className="text-sm font-semibold tracking-wide text-muted-foreground uppercase">{guide.title}</p>
          <h1 className="mt-0.5 text-xl leading-snug font-bold">{guide.question}</h1>
        </div>
      </div>
      <p className="text-[15px] leading-relaxed text-muted-foreground">{guide.explanation}</p>
      <div className="flex gap-3 rounded-2xl bg-warning-soft/60 p-4">
        <Lightbulb className="mt-0.5 size-5 shrink-0 text-warning" />
        <div className="text-sm">
          <p className="font-semibold">Ejemplo</p>
          <p className="mt-0.5 text-muted-foreground">{guide.example}</p>
        </div>
      </div>
      {children}
    </>
  )
}

function Review({ values, onEdit }: { values: GoalFormValues; onEdit: (key: StepKey) => void }) {
  const category = categoryInfo(values.category)
  const rows: { key: StepKey; label: string; value: string }[] = [
    { key: 'specific', label: 'Específica', value: values.specific },
    {
      key: 'measurable',
      label: 'Medible',
      value: values.hasMetric
        ? `${values.measurable}\nIndicador: ${values.metricName} — ${values.metricCurrent || 0} de ${values.metricTarget} ${values.metricUnit}`.trim()
        : values.measurable,
    },
    { key: 'achievable', label: 'Alcanzable', value: values.achievable },
    { key: 'relevant', label: 'Relevante', value: values.relevant },
    { key: 'deadline', label: 'Temporal', value: values.deadline ? `Antes del ${formatFullDate(values.deadline)}` : '' },
  ]

  return (
    <>
      <StepIntro title="Revisa tu meta" subtitle="Puedes corregir cualquier parte antes de guardar." />
      <div className="rounded-2xl border border-card-border bg-card p-5 shadow-soft">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <span className="size-2.5 rounded-full" style={{ backgroundColor: accentVar(values.color) }} />
          {category.label}
        </div>
        <div className="mt-1 flex items-start justify-between gap-2">
          <p className="text-lg leading-snug font-semibold">{values.name}</p>
          <EditButton onClick={() => onEdit('info')} label="Editar nombre y categoría" />
        </div>
        {values.description && <p className="mt-1 text-sm text-muted-foreground">{values.description}</p>}
      </div>
      <ul className="flex flex-col gap-2">
        {rows.map((row) => (
          <li key={row.key} className="flex items-start gap-3 rounded-2xl border border-card-border bg-card p-4">
            <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-accent text-sm font-bold text-accent-foreground">
              {smartGuide[row.key as SmartKey].letter}
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">{row.label}</p>
              <p className="mt-0.5 text-sm whitespace-pre-line">{row.value}</p>
            </div>
            <EditButton onClick={() => onEdit(row.key)} label={`Editar ${row.label.toLowerCase()}`} />
          </li>
        ))}
      </ul>
    </>
  )
}

function EditButton({ onClick, label }: { onClick: () => void; label: string }) {
  return (
    <Button type="button" variant="ghost" size="icon" className="-mt-2 -mr-2 shrink-0 text-muted-foreground" onClick={onClick} aria-label={label}>
      <Pencil className="size-4" />
    </Button>
  )
}
