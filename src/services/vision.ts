import { supabase } from '@/lib/supabase'
import { randomId, type ProcessedImage } from '@/lib/images'
import type { VisionBoardEntryRow, VisionBoardImageRow, VisionQuestionKey } from '@/types/database'
import { toAppError } from './errors'

const BUCKET = 'vision-board'
/** Los enlaces firmados duran 2 horas; la app los renueva antes. */
const SIGNED_URL_SECONDS = 2 * 60 * 60

// --- Reflexiones -------------------------------------------------------------

export async function fetchReflections(): Promise<VisionBoardEntryRow[]> {
  const { data, error } = await supabase.from('vision_board_entries').select('*')
  if (error) throw toAppError(error)
  return data
}

/** Guarda (crea o actualiza) la respuesta a una pregunta. */
export async function saveReflection(userId: string, questionKey: VisionQuestionKey, answer: string): Promise<void> {
  const { error } = await supabase
    .from('vision_board_entries')
    .upsert({ user_id: userId, question_key: questionKey, answer }, { onConflict: 'user_id,question_key' })
  if (error) throw toAppError(error)
}

// --- Imágenes ----------------------------------------------------------------

export interface VisionImage extends VisionBoardImageRow {
  /** Enlace temporal firmado (el bucket es privado). */
  url: string | null
}

export async function fetchVisionImages(): Promise<VisionImage[]> {
  const { data, error } = await supabase
    .from('vision_board_images')
    .select('*')
    .order('position')
    .order('created_at')
  if (error) throw toAppError(error)
  if (data.length === 0) return []

  const { data: signed, error: signError } = await supabase.storage
    .from(BUCKET)
    .createSignedUrls(
      data.map((r) => r.storage_path),
      SIGNED_URL_SECONDS,
    )
  if (signError) throw toAppError(signError)
  const urls = new Map(signed.map((s) => [s.path, s.signedUrl]))
  return data.map((row) => ({ ...row, url: urls.get(row.storage_path) ?? null }))
}

/**
 * Sube el archivo a la carpeta privada del usuario y registra la imagen.
 * Si el registro falla, borra el archivo para no dejar basura.
 */
export async function uploadVisionImage(userId: string, image: ProcessedImage, position: number): Promise<VisionBoardImageRow> {
  const path = `${userId}/${randomId()}.${image.extension}`
  const { error: uploadError } = await supabase.storage
    .from(BUCKET)
    .upload(path, image.blob, { contentType: image.contentType, cacheControl: '31536000', upsert: false })
  if (uploadError) throw toAppError(uploadError)

  const { data, error } = await supabase
    .from('vision_board_images')
    .insert({ storage_path: path, width: image.width, height: image.height, position })
    .select('*')
    .single()
  if (error) {
    await supabase.storage.from(BUCKET).remove([path])
    throw toAppError(error)
  }
  return data
}

export async function updateVisionImage(
  id: string,
  patch: { caption?: string | null; goal_id?: string | null },
): Promise<void> {
  const { error } = await supabase.from('vision_board_images').update(patch).eq('id', id)
  if (error) throw toAppError(error)
}

/**
 * Guarda un nuevo orden: numera las imágenes 0, 1, 2… según la lista recibida
 * y actualiza solo las que cambiaron de posición.
 */
export async function saveImageOrder(ordered: VisionBoardImageRow[]): Promise<void> {
  const changes = ordered
    .map((img, index) => ({ id: img.id, from: img.position, to: index }))
    .filter((c) => c.from !== c.to)
  const results = await Promise.all(
    changes.map((c) => supabase.from('vision_board_images').update({ position: c.to }).eq('id', c.id)),
  )
  const failed = results.find((r) => r.error)
  if (failed?.error) throw toAppError(failed.error)
}

/** Mueve un elemento de la lista una posición (−1 antes, +1 después). */
export function moveItem<T>(list: T[], index: number, delta: -1 | 1): T[] {
  const target = index + delta
  if (target < 0 || target >= list.length) return list
  const next = [...list]
  ;[next[index], next[target]] = [next[target]!, next[index]!]
  return next
}

/** Elimina el registro y luego el archivo. */
export async function deleteVisionImage(image: VisionBoardImageRow): Promise<void> {
  const { error } = await supabase.from('vision_board_images').delete().eq('id', image.id)
  if (error) throw toAppError(error)
  // Si falla borrar el archivo, la imagen ya no aparece; queda un archivo huérfano privado.
  await supabase.storage.from(BUCKET).remove([image.storage_path])
}
