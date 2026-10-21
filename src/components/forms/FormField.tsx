import { useId, type ReactElement, cloneElement } from 'react'
import { CircleAlert } from 'lucide-react'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'

interface FormFieldProps {
  label: string
  error?: string
  hint?: string
  className?: string
  /** El control (Input, Textarea…). Recibe id y atributos de accesibilidad. */
  children: ReactElement<Record<string, unknown>>
}

export function FormField({ label, error, hint, className, children }: FormFieldProps) {
  const id = useId()
  const messageId = `${id}-mensaje`

  return (
    <div className={cn('flex flex-col gap-2', className)}>
      <Label htmlFor={id}>{label}</Label>
      {cloneElement(children, {
        id,
        'aria-invalid': error ? true : undefined,
        'aria-describedby': error || hint ? messageId : undefined,
      })}
      {error ? (
        <p id={messageId} role="alert" className="flex items-center gap-1.5 text-sm text-destructive animate-fade-up">
          <CircleAlert className="size-4 shrink-0" />
          {error}
        </p>
      ) : (
        hint && (
          <p id={messageId} className="text-sm text-muted-foreground">
            {hint}
          </p>
        )
      )}
    </div>
  )
}
