import { CircleAlert } from 'lucide-react'

/** Error general de un formulario (por ejemplo, respuesta del servidor). */
export function FormError({ message }: { message?: string | null }) {
  if (!message) return null
  return (
    <div
      role="alert"
      className="flex items-start gap-2.5 rounded-xl bg-destructive-soft px-4 py-3 text-sm text-destructive animate-fade-up"
    >
      <CircleAlert className="mt-0.5 size-4 shrink-0" />
      <span>{message}</span>
    </div>
  )
}
