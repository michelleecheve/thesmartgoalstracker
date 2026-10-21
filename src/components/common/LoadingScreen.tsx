import { Loader2 } from 'lucide-react'

export function LoadingScreen({ message = 'Cargando…' }: { message?: string }) {
  return (
    <div role="status" className="flex min-h-dvh flex-col items-center justify-center gap-3 text-muted-foreground">
      <Loader2 className="size-6 animate-spin" />
      <span className="text-sm">{message}</span>
    </div>
  )
}
