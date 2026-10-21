import { useId, useLayoutEffect, useRef, useState } from 'react'
import { Check, CircleAlert, Loader2 } from 'lucide-react'
import { Textarea } from '@/components/ui/textarea'
import { useAutosave, type SaveStatus } from './hooks'

interface ReflectionFieldProps {
  question: string
  placeholder: string
  initialValue: string
  onSave: (value: string) => Promise<void>
}

function StatusLabel({ status, onRetry }: { status: SaveStatus; onRetry: () => void }) {
  switch (status) {
    case 'saving':
      return (
        <span className="inline-flex items-center gap-1">
          <Loader2 className="size-3 animate-spin" /> Guardando…
        </span>
      )
    case 'saved':
      return (
        <span className="inline-flex items-center gap-1 text-success">
          <Check className="size-3" /> Guardado
        </span>
      )
    case 'error':
      return (
        <span className="inline-flex items-center gap-1 text-destructive">
          <CircleAlert className="size-3" /> No se pudo guardar.
          <button type="button" onClick={onRetry} className="min-h-8 font-medium underline underline-offset-2">
            Reintentar
          </button>
        </span>
      )
    case 'pending':
      return <span>Cambios sin guardar…</span>
    default:
      return null
  }
}

export function ReflectionField({ question, placeholder, initialValue, onSave }: ReflectionFieldProps) {
  const id = useId()
  const [value, setValue] = useState(initialValue)
  const { status, flush } = useAutosave(value, onSave, initialValue)
  const ref = useRef<HTMLTextAreaElement>(null)

  // El campo crece con el texto.
  useLayoutEffect(() => {
    const el = ref.current
    if (!el) return
    el.style.height = 'auto'
    el.style.height = `${Math.max(el.scrollHeight, 96)}px`
  }, [value])

  return (
    <div className="rounded-2xl border border-border/60 bg-card p-4 shadow-soft">
      <label htmlFor={id} className="block text-[15px] leading-snug font-semibold">
        {question}
      </label>
      <Textarea
        ref={ref}
        id={id}
        value={value}
        maxLength={5000}
        placeholder={placeholder}
        onChange={(e) => setValue(e.target.value)}
        onBlur={() => void flush()}
        className="mt-3 resize-none overflow-hidden border-transparent bg-muted/50 shadow-none focus-visible:bg-card"
      />
      <p className="mt-2 flex min-h-5 justify-end text-xs text-muted-foreground" aria-live="polite">
        <StatusLabel status={status} onRetry={() => void flush()} />
      </p>
    </div>
  )
}
