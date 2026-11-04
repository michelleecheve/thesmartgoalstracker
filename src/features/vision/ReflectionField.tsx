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

/** Líneas visibles antes de que el campo deje de crecer y se desplace. */
const MAX_LINES = 10

export function ReflectionField({ question, placeholder, initialValue, onSave }: ReflectionFieldProps) {
  const id = useId()
  const [value, setValue] = useState(initialValue)
  const { status, flush } = useAutosave(value, onSave, initialValue)
  const ref = useRef<HTMLTextAreaElement>(null)

  // El campo crece con el texto hasta MAX_LINES líneas; después aparece una barra de desplazamiento.
  useLayoutEffect(() => {
    const el = ref.current
    if (!el) return
    const style = getComputedStyle(el)
    const lineHeight = parseFloat(style.lineHeight) || 24
    const chrome = parseFloat(style.paddingTop) + parseFloat(style.paddingBottom) + parseFloat(style.borderTopWidth) + parseFloat(style.borderBottomWidth)
    const max = lineHeight * MAX_LINES + chrome
    el.style.height = 'auto'
    el.style.height = `${Math.min(Math.max(el.scrollHeight, 96), max)}px`
    el.style.overflowY = el.scrollHeight > max ? 'auto' : 'hidden'
  }, [value])

  return (
    <div>
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
        className="mt-2 resize-none border-card-border bg-card shadow-soft"
      />
      <p className="mt-1 flex min-h-5 justify-end text-xs text-muted-foreground" aria-live="polite">
        <StatusLabel status={status} onRetry={() => void flush()} />
      </p>
    </div>
  )
}
