import { DndContext, KeyboardSensor, PointerSensor, TouchSensor, closestCenter, useSensor, useSensors, type DragEndEvent } from '@dnd-kit/core'
import { SortableContext, arrayMove, rectSortingStrategy, sortableKeyboardCoordinates, useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { GripVertical } from 'lucide-react'
import type { VisionImage } from '@/services/vision'
import { cn } from '@/lib/utils'

/** Cuadrícula para reordenar el tablero: se arrastra cada imagen a su nuevo lugar. */
export function OrderGrid({ images, onReorder }: { images: VisionImage[]; onReorder: (ordered: VisionImage[]) => void }) {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 150, tolerance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  )

  function handleDragEnd({ active, over }: DragEndEvent) {
    if (!over || active.id === over.id) return
    const from = images.findIndex((i) => i.id === active.id)
    const to = images.findIndex((i) => i.id === over.id)
    if (from < 0 || to < 0) return
    onReorder(arrayMove(images, from, to))
  }

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <SortableContext items={images.map((i) => i.id)} strategy={rectSortingStrategy}>
        <ul className="grid grid-cols-3 gap-2">
          {images.map((image) => (
            <OrderTile key={image.id} image={image} />
          ))}
        </ul>
      </SortableContext>
    </DndContext>
  )
}

function OrderTile({ image }: { image: VisionImage }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: image.id })
  return (
    <li
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      {...attributes}
      {...listeners}
      aria-label={`Arrastrar para reordenar${image.caption ? `: ${image.caption}` : ''}`}
      className={cn(
        'relative aspect-square cursor-grab touch-none overflow-hidden rounded-xl bg-muted shadow-soft active:cursor-grabbing',
        isDragging && 'z-10 opacity-90 drop-shadow-lg',
      )}
    >
      {image.url && <img src={image.url} alt="" draggable={false} className="size-full object-cover" />}
      <span className="absolute top-1 right-1 flex size-6 items-center justify-center rounded-full bg-black/45 text-white">
        <GripVertical className="size-3.5" />
      </span>
    </li>
  )
}
