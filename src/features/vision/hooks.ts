import { useCallback, useEffect, useRef, useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { fetchReflections, fetchVisionImages } from '@/services/vision'

export const visionKeys = {
  entries: ['vision-entries'] as const,
  images: ['vision-images'] as const,
}

export function useReflections() {
  return useQuery({ queryKey: visionKeys.entries, queryFn: fetchReflections, staleTime: Infinity })
}

/** Imágenes con enlaces firmados (duran 2 h; se renuevan cada hora). */
export function useVisionImages() {
  return useQuery({
    queryKey: visionKeys.images,
    queryFn: fetchVisionImages,
    staleTime: 45 * 60 * 1000,
    refetchInterval: 60 * 60 * 1000,
    refetchOnWindowFocus: false,
  })
}

export function useRefreshVisionImages() {
  const client = useQueryClient()
  return useCallback(() => client.invalidateQueries({ queryKey: visionKeys.images }), [client])
}

export type SaveStatus = 'idle' | 'pending' | 'saving' | 'saved' | 'error'

/**
 * Guardado automático: guarda `delay` ms después de dejar de escribir
 * (o de inmediato con `flush`, p. ej. al salir del campo).
 */
export function useAutosave(value: string, save: (value: string) => Promise<void>, initial: string, delay = 900) {
  const [status, setStatus] = useState<SaveStatus>('idle')
  const lastSaved = useRef(initial)
  const latest = useRef(value)
  const saveRef = useRef(save)
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)
  latest.current = value
  saveRef.current = save

  const flush = useCallback(async () => {
    if (timer.current) clearTimeout(timer.current)
    timer.current = null
    const current = latest.current
    if (current === lastSaved.current) {
      setStatus((s) => (s === 'pending' ? 'saved' : s))
      return
    }
    setStatus('saving')
    try {
      await saveRef.current(current)
      lastSaved.current = current
      // Si se siguió escribiendo mientras se guardaba, queda pendiente.
      setStatus(latest.current === current ? 'saved' : 'pending')
    } catch {
      setStatus('error')
    }
  }, [])

  useEffect(() => {
    if (value === lastSaved.current) return
    setStatus('pending')
    if (timer.current) clearTimeout(timer.current)
    timer.current = setTimeout(flush, delay)
    return () => {
      if (timer.current) clearTimeout(timer.current)
    }
  }, [value, delay, flush])

  // Avisa antes de cerrar la página si hay cambios sin guardar.
  useEffect(() => {
    if (status !== 'pending' && status !== 'saving' && status !== 'error') return
    const handler = (e: BeforeUnloadEvent) => {
      e.preventDefault()
    }
    window.addEventListener('beforeunload', handler)
    return () => window.removeEventListener('beforeunload', handler)
  }, [status])

  // Al desmontar (cambiar de pantalla), guarda lo pendiente.
  useEffect(
    () => () => {
      if (latest.current !== lastSaved.current) void saveRef.current(latest.current).catch(() => {})
    },
    [],
  )

  return { status, flush }
}
