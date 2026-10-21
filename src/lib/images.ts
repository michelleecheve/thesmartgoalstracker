import { AppError } from '@/services/errors'

/** Tipos que acepta el bucket (ver migración). */
export const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'] as const
/** Fotos del iPhone: se intentan convertir a JPEG en el navegador. */
const CONVERTIBLE_TYPES = ['image/heic', 'image/heif']
export const MAX_INPUT_BYTES = 25 * 1024 * 1024
export const MAX_UPLOAD_BYTES = 10 * 1024 * 1024
export const MAX_DIMENSION = 2048
/** Por debajo de este peso y tamaño, la imagen se sube tal cual. */
const KEEP_ORIGINAL_BYTES = 1.5 * 1024 * 1024

export interface ProcessedImage {
  blob: Blob
  width: number
  height: number
  contentType: string
  extension: string
}

/** Reduce proporcionalmente para que el lado mayor no supere `max`. */
export function fitWithin(width: number, height: number, max: number): { width: number; height: number } {
  const scale = Math.min(1, max / Math.max(width, height))
  return { width: Math.round(width * scale), height: Math.round(height * scale) }
}

function isImageLike(file: File): boolean {
  return (
    (ALLOWED_TYPES as readonly string[]).includes(file.type) ||
    CONVERTIBLE_TYPES.includes(file.type) ||
    /\.(heic|heif)$/i.test(file.name)
  )
}

/** Valida tipo y peso antes de procesar. Lanza AppError con mensaje en español. */
export function validateImageFile(file: File): void {
  if (!isImageLike(file)) {
    throw new AppError(`«${file.name}» no es una imagen compatible. Usa JPG, PNG, WebP, GIF o fotos del iPhone.`)
  }
  if (file.size > MAX_INPUT_BYTES) {
    throw new AppError(`«${file.name}» pesa demasiado (máximo 25 MB).`)
  }
}

function loadImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file)
    const img = new Image()
    img.onload = () => {
      URL.revokeObjectURL(url)
      resolve(img)
    }
    img.onerror = () => {
      URL.revokeObjectURL(url)
      reject(new AppError(`No pudimos leer «${file.name}». Prueba con otra imagen o conviértela a JPG.`))
    }
    img.src = url
  })
}

function canvasToBlob(canvas: HTMLCanvasElement, type: string, quality: number): Promise<Blob> {
  return new Promise((resolve, reject) =>
    canvas.toBlob((b) => (b ? resolve(b) : reject(new AppError('No pudimos procesar la imagen.'))), type, quality),
  )
}

const extensionFor: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'image/gif': 'gif',
}

/**
 * Prepara una imagen para subirla:
 *  - Obtiene sus dimensiones (para mostrarla con su proporción original).
 *  - Si es grande, pesada o HEIC, la redimensiona a 2048 px y la guarda como JPEG
 *    (o PNG si tiene transparencia). Los GIF se suben tal cual para conservar la animación.
 */
export async function processImageFile(file: File): Promise<ProcessedImage> {
  validateImageFile(file)
  const img = await loadImage(file)
  const { naturalWidth: w, naturalHeight: h } = img
  if (!w || !h) throw new AppError(`No pudimos leer «${file.name}».`)

  const allowed = (ALLOWED_TYPES as readonly string[]).includes(file.type)
  const keepOriginal =
    allowed && (file.type === 'image/gif' || (file.size <= KEEP_ORIGINAL_BYTES && Math.max(w, h) <= MAX_DIMENSION))

  if (keepOriginal) {
    if (file.size > MAX_UPLOAD_BYTES) throw new AppError(`«${file.name}» pesa más de 10 MB.`)
    return { blob: file, width: w, height: h, contentType: file.type, extension: extensionFor[file.type]! }
  }

  const size = fitWithin(w, h, MAX_DIMENSION)
  const canvas = document.createElement('canvas')
  canvas.width = size.width
  canvas.height = size.height
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new AppError('Tu navegador no pudo procesar la imagen.')
  ctx.drawImage(img, 0, 0, size.width, size.height)

  // PNG conserva la transparencia; el resto se guarda como JPEG.
  const type = file.type === 'image/png' ? 'image/png' : 'image/jpeg'
  let blob = await canvasToBlob(canvas, type, 0.86)
  if (blob.size > MAX_UPLOAD_BYTES && type === 'image/png') blob = await canvasToBlob(canvas, 'image/jpeg', 0.86)
  if (blob.size > MAX_UPLOAD_BYTES) throw new AppError(`«${file.name}» sigue pesando más de 10 MB después de reducirla.`)

  return { blob, width: size.width, height: size.height, contentType: blob.type, extension: extensionFor[blob.type] ?? 'jpg' }
}

/** UUID v4 que funciona también fuera de HTTPS (crypto.randomUUID requiere contexto seguro). */
export function randomId(): string {
  if (typeof crypto.randomUUID === 'function' && window.isSecureContext) return crypto.randomUUID()
  const b = crypto.getRandomValues(new Uint8Array(16))
  b[6] = (b[6]! & 0x0f) | 0x40
  b[8] = (b[8]! & 0x3f) | 0x80
  const hex = [...b].map((x) => x.toString(16).padStart(2, '0')).join('')
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`
}
