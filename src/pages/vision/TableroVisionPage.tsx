import { useMemo, useRef, useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { ImagePlus, Images } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { PageHeader } from '@/components/layout/PageHeader'
import { PageContent } from '@/components/layout/PageContent'
import { ConfirmDialog } from '@/components/common/ConfirmDialog'
import { EmptyState } from '@/components/common/EmptyState'
import { QueryError } from '@/components/common/QueryError'
import { SectionTitle } from '@/components/common/SectionTitle'
import { ReflectionField } from '@/features/vision/ReflectionField'
import { ImageTile, PendingTile } from '@/features/vision/ImageTile'
import { ImageDetailDialog } from '@/features/vision/ImageDetailDialog'
import { visionQuestions } from '@/features/vision/questions'
import { aspectRatio, distributeColumns } from '@/features/vision/masonry'
import { useReflections, useRefreshVisionImages, useVisionImages, visionKeys } from '@/features/vision/hooks'
import { useGoalBundle } from '@/features/goals/queries'
import { useCurrentUser } from '@/app/auth/auth-context'
import { processImageFile } from '@/lib/images'
import {
  deleteVisionImage,
  moveItem,
  saveImageOrder,
  saveReflection,
  updateVisionImage,
  uploadVisionImage,
} from '@/services/vision'
import { toSpanishMessage } from '@/services/errors'
import type { VisionBoardEntryRow, VisionQuestionKey } from '@/types/database'

interface Pending {
  id: string
  previewUrl: string
  ratio: number
}

export function TableroVisionPage() {
  const user = useCurrentUser()
  const client = useQueryClient()
  const reflections = useReflections()
  const images = useVisionImages()
  const refreshImages = useRefreshVisionImages()
  const goals = useGoalBundle().data?.goals ?? []

  const fileInput = useRef<HTMLInputElement>(null)
  const [pending, setPending] = useState<Pending[]>([])
  const [openId, setOpenId] = useState<string | null>(null)
  const [confirmDelete, setConfirmDelete] = useState(false)

  const list = useMemo(() => images.data ?? [], [images.data])
  const openIndex = list.findIndex((i) => i.id === openId)
  const openImage = openIndex >= 0 ? list[openIndex]! : null
  const goalsById = useMemo(() => new Map(goals.map((g) => [g.id, g])), [goals])
  const columns = useMemo(() => distributeColumns(list, 2, (i) => aspectRatio(i.width, i.height)), [list])

  async function handleSaveReflection(key: VisionQuestionKey, answer: string) {
    await saveReflection(user.id, key, answer)
    // Mantiene la caché al día para que, al volver a esta pantalla, se vea lo último escrito.
    client.setQueryData<VisionBoardEntryRow[]>(visionKeys.entries, (old = []) =>
      old.some((e) => e.question_key === key)
        ? old.map((e) => (e.question_key === key ? { ...e, answer } : e))
        : [...old, { id: '', user_id: user.id, question_key: key, answer, created_at: '', updated_at: '' }],
    )
  }

  async function handleFiles(files: FileList | null) {
    if (!files || files.length === 0) return
    let position = list.reduce((max, i) => Math.max(max, i.position), -1) + 1
    let uploaded = 0

    // Una a la vez, para no saturar la conexión del teléfono.
    for (const file of Array.from(files)) {
      const id = `${file.name}-${file.lastModified}-${Math.random()}`
      const previewUrl = URL.createObjectURL(file)
      setPending((p) => [...p, { id, previewUrl, ratio: 1 }])
      try {
        const processed = await processImageFile(file)
        setPending((p) => p.map((x) => (x.id === id ? { ...x, ratio: processed.height / processed.width } : x)))
        await uploadVisionImage(user.id, processed, position++)
        uploaded++
        await refreshImages()
      } catch (error) {
        toast.error(toSpanishMessage(error))
      } finally {
        URL.revokeObjectURL(previewUrl)
        setPending((p) => p.filter((x) => x.id !== id))
      }
    }
    if (uploaded > 0) toast.success(uploaded === 1 ? 'Imagen agregada a tu tablero.' : `${uploaded} imágenes agregadas.`)
    if (fileInput.current) fileInput.current.value = ''
  }

  async function handleSaveImage(patch: { caption: string | null; goal_id: string | null }) {
    if (!openImage) return
    try {
      await updateVisionImage(openImage.id, patch)
      await refreshImages()
      toast.success('Cambios guardados.')
    } catch (error) {
      toast.error(toSpanishMessage(error))
      throw error
    }
  }

  async function handleMove(delta: -1 | 1) {
    if (openIndex < 0) return
    const reordered = moveItem(list, openIndex, delta)
    // Actualización inmediata en pantalla; si falla, se recarga el orden real.
    client.setQueryData(visionKeys.images, reordered.map((img, position) => ({ ...img, position })))
    try {
      await saveImageOrder(reordered)
    } catch (error) {
      toast.error(toSpanishMessage(error))
      await refreshImages()
      throw error
    }
  }

  async function handleDelete() {
    if (!openImage) return
    try {
      await deleteVisionImage(openImage)
      setOpenId(null)
      await refreshImages()
      toast.success('Imagen eliminada.')
    } catch (error) {
      toast.error(toSpanishMessage(error))
    }
  }

  const answers = new Map((reflections.data ?? []).map((e) => [e.question_key, e.answer]))

  return (
    <>
      <PageHeader title="Tablero de visión" subtitle="La motivación detrás de tus metas" />
      <PageContent className="gap-7">
        {/* Reflexión escrita */}
        <section className="flex flex-col gap-3">
          <SectionTitle>Reflexión</SectionTitle>
          <p className="-mt-1 text-sm text-muted-foreground">Escribe con calma. Tus respuestas se guardan automáticamente.</p>
          {reflections.isPending ? (
            [0, 1].map((i) => <Skeleton key={i} className="h-40 rounded-2xl" />)
          ) : reflections.isError ? (
            <QueryError onRetry={() => reflections.refetch()} />
          ) : (
            visionQuestions.map((q) => (
              <ReflectionField
                key={q.key}
                question={q.question}
                placeholder={q.placeholder}
                initialValue={answers.get(q.key) ?? ''}
                onSave={(answer) => handleSaveReflection(q.key, answer)}
              />
            ))
          )}
        </section>

        {/* Tablero visual */}
        <section className="flex flex-col gap-3">
          <SectionTitle
            action={
              list.length > 0 && (
                <Button variant="ghost" size="sm" className="-mr-2 min-h-11 text-primary" onClick={() => fileInput.current?.click()}>
                  <ImagePlus className="size-4" /> Agregar
                </Button>
              )
            }
          >
            Tablero visual
          </SectionTitle>

          <input
            ref={fileInput}
            type="file"
            accept="image/*"
            multiple
            className="sr-only"
            aria-label="Elegir imágenes"
            onChange={(e) => void handleFiles(e.target.files)}
          />

          {images.isPending ? (
            <div className="grid grid-cols-2 gap-2">
              <Skeleton className="aspect-[3/4] rounded-2xl" />
              <Skeleton className="aspect-square rounded-2xl" />
            </div>
          ) : images.isError ? (
            <QueryError onRetry={() => images.refetch()} />
          ) : list.length === 0 && pending.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-border bg-card/50">
              <EmptyState
                icon={Images}
                title="Crea tu collage de inspiración"
                description="Sube fotos que representen la vida que quieres construir. Solo tú puedes verlas."
                action={
                  <Button onClick={() => fileInput.current?.click()}>
                    <ImagePlus className="size-4" /> Agregar imágenes
                  </Button>
                }
              />
            </div>
          ) : (
            <div className="grid grid-cols-2 items-start gap-2">
              {columns.map((column, c) => (
                <div key={c} className="flex flex-col gap-2">
                  {column.map(({ item }) => (
                    <ImageTile key={item.id} image={item} goal={item.goal_id ? goalsById.get(item.goal_id) : undefined} onOpen={() => setOpenId(item.id)} />
                  ))}
                  {/* Las imágenes en subida aparecen al final de la columna más corta */}
                  {c === (columns[0]!.length <= columns[1]!.length ? 0 : 1) &&
                    pending.map((p) => <PendingTile key={p.id} previewUrl={p.previewUrl} ratio={p.ratio} />)}
                </div>
              ))}
            </div>
          )}
          {list.length > 0 && (
            <p className="text-xs text-muted-foreground">Toca una imagen para agregar una descripción, asociarla a una meta o cambiar su orden.</p>
          )}
        </section>
      </PageContent>

      <ImageDetailDialog
        image={confirmDelete ? null : openImage}
        goals={goals}
        canMoveBefore={openIndex > 0}
        canMoveAfter={openIndex >= 0 && openIndex < list.length - 1}
        onClose={() => setOpenId(null)}
        onSave={handleSaveImage}
        onMove={handleMove}
        onDelete={() => setConfirmDelete(true)}
      />
      <ConfirmDialog
        open={confirmDelete}
        onOpenChange={(open) => !open && setConfirmDelete(false)}
        title="¿Eliminar esta imagen?"
        description="Se borrará de tu tablero de forma permanente."
        confirmLabel="Eliminar"
        destructive
        onConfirm={handleDelete}
      />
    </>
  )
}
