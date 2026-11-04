import { useState } from 'react'
import { ChevronLeft, ChevronRight, Loader2, Pencil, Save, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { NativeSelect } from '@/components/ui/native-select'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { accentVar } from '@/domain/labels'
import type { GoalRow } from '@/types/database'
import type { VisionImage } from '@/services/vision'

interface ImageDetailDialogProps {
  image: VisionImage | null
  goals: GoalRow[]
  /** Posición de la imagen (1-based) y total, para mostrar «2 de 5». */
  position: number
  total: number
  onPrev: (() => void) | null
  onNext: (() => void) | null
  onClose: () => void
  onSave: (patch: { caption: string | null; goal_id: string | null }) => Promise<void>
  onDelete: () => void
}

export function ImageDetailDialog(props: ImageDetailDialogProps) {
  const { image, onClose } = props
  return (
    <Dialog open={image !== null} onOpenChange={(open) => !open && onClose()}>
      {/* key: reinicia el modo de edición al abrir otra imagen */}
      {image && <DetailContent key={image.id} {...props} image={image} />}
    </Dialog>
  )
}

function DetailContent({ image, goals, position, total, onPrev, onNext, onClose, onSave, onDelete }: ImageDetailDialogProps & { image: VisionImage }) {
  const [caption, setCaption] = useState(image.caption ?? '')
  const [goalId, setGoalId] = useState(image.goal_id ?? '')
  const [editing, setEditing] = useState(false)
  const [busy, setBusy] = useState(false)
  const dirty = caption.trim() !== (image.caption ?? '') || goalId !== (image.goal_id ?? '')
  const linkedGoal = goals.find((g) => g.id === image.goal_id)

  async function handleSave() {
    setBusy(true)
    try {
      await onSave({ caption: caption.trim() || null, goal_id: goalId || null })
      onClose()
    } catch {
      // El error ya se mostró en un aviso; el diálogo sigue abierto para reintentar.
    } finally {
      setBusy(false)
    }
  }

  // Metas disponibles: las no archivadas, más la que ya tenga asociada.
  const options = goals.filter((g) => g.status !== 'archived' || g.id === image.goal_id)
  // Mientras hay cambios sin guardar no se cambia de foto, para no perderlos.
  const lockNav = busy || dirty

  return (
    <DialogContent className="max-h-[calc(100dvh-2rem)] gap-3 overflow-y-auto p-4">
      <DialogHeader className="pr-10">
        <DialogTitle>Tu imagen</DialogTitle>
        <DialogDescription className="sr-only">Consulta la imagen, su descripción y la meta asociada. Puedes editarlos.</DialogDescription>
      </DialogHeader>

      {image.url && (
        <img
          src={image.url}
          alt={image.caption ?? 'Imagen del tablero de visión'}
          className="max-h-[45dvh] w-full rounded-xl bg-muted object-contain"
        />
      )}

      {editing ? (
        <>
          <Textarea
            rows={2}
            maxLength={300}
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
            placeholder="¿Qué representa para ti?"
            aria-label="Descripción (opcional)"
          />
          <NativeSelect value={goalId} onChange={(e) => setGoalId(e.target.value)} aria-label="Meta asociada (opcional)">
            <option value="">Sin meta</option>
            {options.map((g) => (
              <option key={g.id} value={g.id}>
                {g.name}
              </option>
            ))}
          </NativeSelect>
        </>
      ) : (
        <>
          <p className={image.caption ? 'text-[15px] whitespace-pre-line' : 'text-sm text-muted-foreground'}>
            {image.caption || 'Sin descripción.'}
          </p>
          <p className="flex items-center gap-2 text-sm font-medium">
            {linkedGoal ? (
              <>
                <span className="size-2.5 shrink-0 rounded-full" style={{ backgroundColor: accentVar(linkedGoal.color) }} />
                {linkedGoal.name}
              </>
            ) : (
              <span className="font-normal text-muted-foreground">Sin meta asociada.</span>
            )}
          </p>
        </>
      )}

      <div className="flex items-center justify-between">
        <Button variant="ghost" size="icon" aria-label="Foto anterior" disabled={!onPrev || lockNav} onClick={() => onPrev?.()}>
          <ChevronLeft className="size-6" />
        </Button>
        <span className="text-xs text-muted-foreground tabular-nums">
          {position} de {total}
        </span>
        <Button variant="ghost" size="icon" aria-label="Foto siguiente" disabled={!onNext || lockNav} onClick={() => onNext?.()}>
          <ChevronRight className="size-6" />
        </Button>
      </div>

      <div className="grid grid-cols-3 gap-2">
        <Button variant="outline" aria-label="Eliminar imagen" className="text-destructive" onClick={onDelete} disabled={busy}>
          <Trash2 className="size-5" />
        </Button>
        <Button
          variant="outline"
          aria-label={editing ? 'Cancelar edición' : 'Editar'}
          aria-pressed={editing}
          disabled={busy}
          onClick={() => {
            if (editing) {
              setCaption(image.caption ?? '')
              setGoalId(image.goal_id ?? '')
            }
            setEditing(!editing)
          }}
        >
          <Pencil className="size-5" />
        </Button>
        <Button aria-label="Guardar cambios" onClick={handleSave} disabled={!editing || !dirty || busy}>
          {busy ? <Loader2 className="size-5 animate-spin" /> : <Save className="size-5" />}
        </Button>
      </div>
    </DialogContent>
  )
}
