import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { cn } from '@/lib/utils'
import type { BoardDisplay } from './displayPrefs'

interface DisplaySettingsDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  display: BoardDisplay
  onChange: (patch: Partial<BoardDisplay>) => void
}

export function DisplaySettingsDialog({ open, onOpenChange, display, onChange }: DisplaySettingsDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="gap-3 p-4">
        <DialogHeader className="pr-10">
          <DialogTitle>Qué ver en el tablero</DialogTitle>
          <DialogDescription>Elige lo que aparece encima de las imágenes.</DialogDescription>
        </DialogHeader>
        <SwitchRow label="Título de la meta asociada" checked={display.showGoal} onChange={(showGoal) => onChange({ showGoal })} />
        <SwitchRow label="Descripción" checked={display.showCaption} onChange={(showCaption) => onChange({ showCaption })} />
      </DialogContent>
    </Dialog>
  )
}

function SwitchRow({ label, checked, onChange }: { label: string; checked: boolean; onChange: (checked: boolean) => void }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className="flex min-h-12 w-full items-center justify-between gap-3 rounded-xl px-1 text-left text-[15px]"
    >
      {label}
      <span className={cn('flex h-7 w-12 shrink-0 items-center rounded-full p-0.5 transition-colors', checked ? 'bg-primary' : 'bg-input')}>
        <span className={cn('size-6 rounded-full bg-white shadow transition-transform', checked && 'translate-x-5')} />
      </span>
    </button>
  )
}
