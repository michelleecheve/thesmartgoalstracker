import type { PostgrestError } from '@supabase/supabase-js'
import { toAppError } from './errors'

const PAGE_SIZE = 1000

/**
 * Supabase devuelve como máximo 1000 filas por consulta.
 * Esta función pide páginas sucesivas hasta obtener todas.
 * `query(from, to)` debe aplicar `.range(from, to)` y un orden estable.
 */
export async function fetchAll<T>(
  query: (from: number, to: number) => PromiseLike<{ data: T[] | null; error: PostgrestError | null }>,
): Promise<T[]> {
  const rows: T[] = []
  for (let from = 0; ; from += PAGE_SIZE) {
    const { data, error } = await query(from, from + PAGE_SIZE - 1)
    if (error) throw toAppError(error)
    rows.push(...(data ?? []))
    if (!data || data.length < PAGE_SIZE) return rows
  }
}
