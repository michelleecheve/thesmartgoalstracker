import type { ReactNode } from 'react'
import * as DialogPrimitive from '@radix-ui/react-dialog'
import type { LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface ActionSheetItem {
  label: string
  /** Texto secundario bajo la etiqueta (opcional). */
  detail?: string
  icon?: LucideIcon
  onSelect: () => void
  destructive?: boolean
}

interface ActionSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  description?: ReactNode
  items: ActionSheetItem[]
}

/** Hoja de acciones que aparece desde abajo, como en iOS. */
export function ActionSheet({ open, onOpenChange, title, description, items }: ActionSheetProps) {
  return (
    <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-foreground/25 backdrop-blur-[2px] data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=closed]:animate-out data-[state=closed]:fade-out-0" />
        <DialogPrimitive.Content
          className={cn(
            'fixed inset-x-0 bottom-0 z-50 mx-auto w-full max-w-(--app-max-width) px-3 pb-[calc(var(--safe-bottom)+0.75rem)] outline-none',
            'data-[state=open]:animate-in data-[state=open]:slide-in-from-bottom data-[state=closed]:animate-out data-[state=closed]:slide-out-to-bottom',
          )}
        >
          <div className="overflow-hidden rounded-2xl bg-card shadow-lifted">
            <div className="px-5 pt-4 pb-3 text-center">
              <DialogPrimitive.Title className="truncate text-sm font-semibold">{title}</DialogPrimitive.Title>
              {description ? (
                <DialogPrimitive.Description className="mt-0.5 text-xs text-muted-foreground">{description}</DialogPrimitive.Description>
              ) : (
                <DialogPrimitive.Description className="sr-only">Elige una acción</DialogPrimitive.Description>
              )}
            </div>
            <ul className="max-h-[55dvh] overflow-y-auto border-t border-border">
              {items.map(({ label, detail, icon: Icon, onSelect, destructive }, index) => (
                <li key={`${index}-${label}`} className="border-b border-border last:border-b-0">
                  <button
                    type="button"
                    onClick={() => {
                      onOpenChange(false)
                      onSelect()
                    }}
                    className={cn(
                      'flex min-h-13 w-full items-center gap-3 px-5 text-left text-[15px] transition-colors hover:bg-muted active:bg-muted',
                      destructive && 'text-destructive',
                    )}
                  >
                    {Icon && <Icon className="size-5 shrink-0 opacity-80" />}
                    <span className="min-w-0 py-2">
                      <span className="block truncate">{label}</span>
                      {detail && <span className="block truncate text-xs text-muted-foreground">{detail}</span>}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          </div>
          <DialogPrimitive.Close className="mt-2 flex min-h-13 w-full items-center justify-center rounded-2xl bg-card text-[15px] font-semibold shadow-lifted transition-colors hover:bg-muted">
            Cancelar
          </DialogPrimitive.Close>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  )
}
