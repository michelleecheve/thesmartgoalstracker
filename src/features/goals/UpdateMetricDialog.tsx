import { useState, type FormEvent } from 'react'
import { Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { FormField } from '@/components/forms/FormField'
import { formatNumber } from '@/domain/progress'
import type { GoalRow } from '@/types/database'

interface UpdateMetricDialogProps {
  goal: GoalRow
  open: boolean
  onOpenChange: (open: boolean) => void
  onSave: (value: number) => Promise<void>
}

export function UpdateMetricDialog({ goal, open, onOpenChange, onSave }: UpdateMetricDialogProps) {
  const [value, setValue] = useState(String(goal.metric_current))
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  async function handleSave(e: FormEvent) {
    e.preventDefault()
    const n = Number(value.trim().replace(',', '.'))
    if (!value.trim() || !Number.isFinite(n) || n < 0) {
      setError('Escribe un número igual o mayor que cero.')
      return
    }
    setSaving(true)
    try {
      await onSave(n)
      onOpenChange(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo guardar.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (next) {
          setValue(String(goal.metric_current))
          setError(null)
        }
        onOpenChange(next)
      }}
    >
      <DialogContent>
        <form onSubmit={handleSave} noValidate className="grid gap-4">
          <DialogHeader>
            <DialogTitle>Actualizar avance</DialogTitle>
            <DialogDescription>
              {goal.metric_name}: objetivo {formatNumber(goal.metric_target ?? 0)} {goal.metric_unit ?? ''}
            </DialogDescription>
          </DialogHeader>
          <FormField label="Valor actual" error={error ?? undefined}>
            <Input inputMode="decimal" autoFocus value={value} onChange={(e) => setValue(e.target.value)} />
          </FormField>
          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="ghost" disabled={saving}>
                Cancelar
              </Button>
            </DialogClose>
            <Button type="submit" disabled={saving}>
              {saving && <Loader2 className="size-[18px] animate-spin" />}
              Guardar
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
