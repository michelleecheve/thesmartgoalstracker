import { useState } from 'react'
import { ImageOff, Loader2 } from 'lucide-react'
import { accentVar } from '@/domain/labels'
import type { GoalRow } from '@/types/database'
import type { VisionImage } from '@/services/vision'
import { cn } from '@/lib/utils'

/** Proporción real de la imagen (se respeta tal cual). */
function ratioStyle(width: number | null, height: number | null) {
  return { aspectRatio: width && height ? `${width} / ${height}` : '1 / 1' }
}

export function ImageTile({ image, goal, onOpen }: { image: VisionImage; goal: GoalRow | undefined; onOpen: () => void }) {
  const [failed, setFailed] = useState(false)
  const [loaded, setLoaded] = useState(false)
  const label = image.caption || (goal ? `Imagen de la meta ${goal.name}` : 'Imagen del tablero de visión')

  return (
    <button
      type="button"
      onClick={onOpen}
      aria-label={`${label}. Abrir opciones`}
      className="group relative block w-full overflow-hidden rounded-2xl bg-muted shadow-soft outline-none transition-transform duration-200 focus-visible:ring-[3px] focus-visible:ring-ring/50 active:scale-[0.98]"
      style={ratioStyle(image.width, image.height)}
    >
      {image.url && !failed ? (
        <img
          src={image.url}
          alt={label}
          width={image.width ?? undefined}
          height={image.height ?? undefined}
          loading="lazy"
          decoding="async"
          onLoad={() => setLoaded(true)}
          onError={() => setFailed(true)}
          className={cn('size-full object-cover transition-opacity duration-500', loaded ? 'opacity-100' : 'opacity-0')}
        />
      ) : (
        <span className="flex size-full flex-col items-center justify-center gap-1 text-xs text-muted-foreground">
          <ImageOff className="size-5" /> No se pudo cargar
        </span>
      )}
      {goal && (
        <span className="absolute top-2 left-2 inline-flex max-w-[85%] items-center gap-1.5 rounded-full bg-black/40 px-2 py-0.5 text-[11px] font-medium text-white backdrop-blur-sm">
          <span className="size-2 shrink-0 rounded-full" style={{ backgroundColor: accentVar(goal.color) }} />
          <span className="truncate">{goal.name}</span>
        </span>
      )}
      {image.caption && (
        <span className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/60 to-transparent px-3 pt-8 pb-2.5 text-left text-xs leading-snug font-medium text-white">
          {image.caption}
        </span>
      )}
    </button>
  )
}

/** Imagen que se está subiendo (vista previa local). */
export function PendingTile({ previewUrl, ratio }: { previewUrl: string; ratio: number }) {
  return (
    <div className="relative overflow-hidden rounded-2xl bg-muted" style={{ aspectRatio: `1 / ${ratio}` }} role="status">
      <img src={previewUrl} alt="" className="size-full object-cover opacity-50" />
      <span className="absolute inset-0 flex items-center justify-center gap-2 text-xs font-medium text-foreground">
        <Loader2 className="size-4 animate-spin" /> Subiendo…
      </span>
    </div>
  )
}
