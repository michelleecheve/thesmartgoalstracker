/**
 * Reparte elementos en columnas tipo Pinterest conservando el orden de lectura:
 * cada elemento va a la columna más corta (según su proporción alto/ancho).
 */
export function distributeColumns<T>(
  items: T[],
  columns: number,
  ratio: (item: T) => number,
): { item: T; index: number }[][] {
  const result: { item: T; index: number }[][] = Array.from({ length: columns }, () => [])
  const heights = new Array<number>(columns).fill(0)
  items.forEach((item, index) => {
    let shortest = 0
    for (let c = 1; c < columns; c++) if (heights[c]! < heights[shortest]! - 0.01) shortest = c
    result[shortest]!.push({ item, index })
    heights[shortest]! += ratio(item)
  })
  return result
}

/** Proporción alto/ancho, acotada para que ninguna imagen sea absurdamente alta o plana. */
export function aspectRatio(width: number | null, height: number | null): number {
  if (!width || !height) return 1
  return Math.min(2.2, Math.max(0.45, height / width))
}
