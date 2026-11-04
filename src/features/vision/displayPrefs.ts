import { useCallback, useState } from 'react'

export interface BoardDisplay {
  showGoal: boolean
  showCaption: boolean
}

const KEY = 'metas-smart:vision-display'
const defaults: BoardDisplay = { showGoal: true, showCaption: true }

function read(): BoardDisplay {
  try {
    const raw = localStorage.getItem(KEY)
    return raw ? { ...defaults, ...(JSON.parse(raw) as Partial<BoardDisplay>) } : defaults
  } catch {
    return defaults
  }
}

/** Qué se muestra encima de las imágenes del tablero; se recuerda en este dispositivo. */
export function useBoardDisplay() {
  const [display, setDisplay] = useState<BoardDisplay>(read)
  const update = useCallback((patch: Partial<BoardDisplay>) => {
    setDisplay((prev) => {
      const next = { ...prev, ...patch }
      try {
        localStorage.setItem(KEY, JSON.stringify(next))
      } catch {
        // Sin almacenamiento disponible: el cambio solo dura esta sesión.
      }
      return next
    })
  }, [])
  return [display, update] as const
}
