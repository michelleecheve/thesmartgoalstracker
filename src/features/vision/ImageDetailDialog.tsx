import { useState } from 'react'
import { ArrowLeft, ArrowRight, Loader2, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { NativeSelect } from '@/components/ui/native-select'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { FormField } from '@/components/forms/FormField'
import type { GoalRow } from '@/types/database'
import type { VisionImage } from '@/services/vision'

interface ImageDetailDialogProps {
  image: VisionImage | null
  goals: GoalRow[]
  canMoveBefore: boolean
  canMoveAfter: boolean
  onClose: () => void
  onSave: (patch: { caption: string | null; goal_id: string | null }) => Promise<void>
  onMove: (delta: -1 | 1) => Promise<void>
  onDelete: () => void
}

export function ImageDetailDialog(props: ImageDetailDialogProps) {
  const { image, onClose } = props
  return (
    <Dialog open={image !== null} onOpenChange={(open) => !open && onClose()}>
      {/* key: reinicia el formulario al abrir otra imagen */}
      {image && <DetailContent key={image.id} {...props} image={image} />}
    </Dialog>
  )
}

function DetailContent({ image, goals, canMoveBefore, canMoveAfter, onClose, onSave, onMove, onDelete }: ImageDetailDialogProps & { image: VisionImage }) {
  const [caption, setCaption] = useState(image.caption ?? '')
  const [goalId, setGoalId] = useState(image.goal_id ?? '')
  const [busy, setBusy] = useState<'save' | 'move' | null>(null)
  const dirty = caption.trim() !== (image.caption ?? '') || goalId !== (image.goal_id ?? '')

  async function handleSave() {
    setBusy('save')
    try {
      await onSave({ caption: caption.trim() || null, goal_id: goalId || null })
      onClose()
    } catch {
      // El error ya se mostró en un aviso; el diálogo sigue abierto para reintentar.
    } finally {
      setBusy(null)
    }
  }

  async function handleMove(delta: -1 | 1) {
    setBusy('move')
    try {
      await onMove(delta)
    } catch {
      // El error ya se mostró en un aviso.
    } finally {
      setBusy(null)
    }
  }

  // Metas disponibles: las no archivadas, más la que ya tenga asociada.
  const options = goals.filter((g) => g.status !== 'archived' || g.id === image.goal_id)

  return (
    <DialogContent className="max-h-[calc(100dvh-2rem)] gap-3 overflow-y-auto p-4">
      <DialogHeader className="pr-10">
        <DialogTitle>Tu imagen</DialogTitle>
        <DialogDescription className="sr-only">Edita la descripción, la meta asociada o el orden de la imagen.</DialogDescription>
      </DialogHeader>

      {image.url && (
        <img
          src={image.url}
          alt={image.caption ?? 'Imagen del tablero de visión'}
          className="max-h-[45dvh] w-full rounded-xl bg-muted object-contain"
        />
      )}

      <FormField label="Descripción (opcional)" hint={`${caption.length}/300`}>
        <Textarea rows={2} maxLength={300} value={caption} onChange={(e) => setCaption(e.target.value)} placeholder="¿Qué representa para ti?" />
      </FormField>

      <FormField label="Meta asociada (opcional)">
        <NativeSelect value={goalId} onChange={(e) => setGoalId(e.target.value)}>
          <option value="">Sin meta</option>
          {options.map((g) => (
            <option key={g.id} value={g.id}>
              {g.name}
            </option>
          ))}
        </NativeSelect>
      </FormField>

      <div className="grid grid-cols-2 gap-2">
        <Button variant="outline" disabled={!canMoveBefore || busy !== null} onClick={() => handleMove(-1)}>
          <ArrowLeft className="size-4" /> Mover antes
        </Button>
        <Button variant="outline" disabled={!canMoveAfter || busy !== null} onClick={() => handleMove(1)}>
          Mover después <ArrowRight className="size-4" />
        </Button>
      </div>

      <Button onClick={handleSave} disabled={!dirty || busy !== null}>
        {busy === 'save' && <Loader2 className="size-[18px] animate-spin" />}
        Guardar cambios
      </Button>
      <Button variant="ghost" className="text-destructive" onClick={onDelete} disabled={busy !== null}>
        <Trash2 className="size-4" /> Eliminar imagen
      </Button>
    </DialogContent>
  )
}
