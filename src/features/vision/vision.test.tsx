import { act, renderHook } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { fitWithin, randomId, validateImageFile } from '@/lib/images'
import { moveItem } from '@/services/vision'
import { AppError, toSpanishMessage } from '@/services/errors'
import { aspectRatio, distributeColumns } from './masonry'
import { useAutosave } from './hooks'

const file = (name: string, type: string, size = 1000) => {
  const f = new File(['x'], name, { type })
  Object.defineProperty(f, 'size', { value: size })
  return f
}

describe('validación de imágenes', () => {
  it('acepta imágenes comunes y fotos del iPhone', () => {
    expect(() => validateImageFile(file('a.jpg', 'image/jpeg'))).not.toThrow()
    expect(() => validateImageFile(file('a.png', 'image/png'))).not.toThrow()
    expect(() => validateImageFile(file('IMG_1.HEIC', 'image/heic'))).not.toThrow()
    expect(() => validateImageFile(file('IMG_2.heic', ''))).not.toThrow()
  })

  it('rechaza otros archivos con un mensaje claro', () => {
    expect(() => validateImageFile(file('notas.pdf', 'application/pdf'))).toThrow('«notas.pdf» no es una imagen compatible')
  })

  it('rechaza archivos de más de 25 MB', () => {
    expect(() => validateImageFile(file('enorme.jpg', 'image/jpeg', 30 * 1024 * 1024))).toThrow('pesa demasiado')
  })

  it('reduce conservando la proporción', () => {
    expect(fitWithin(4032, 3024, 2048)).toEqual({ width: 2048, height: 1536 })
    expect(fitWithin(3024, 4032, 2048)).toEqual({ width: 1536, height: 2048 })
    expect(fitWithin(800, 600, 2048)).toEqual({ width: 800, height: 600 })
  })

  it('genera identificadores únicos con formato UUID', () => {
    const a = randomId()
    expect(a).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/)
    expect(randomId()).not.toBe(a)
  })

  it('muestra en español los errores de almacenamiento', () => {
    expect(toSpanishMessage({ statusCode: '413', message: 'Payload too large' })).toBe('La imagen es demasiado pesada (máximo 10 MB).')
    expect(toSpanishMessage(new AppError('«x» no es una imagen compatible.'))).toBe('«x» no es una imagen compatible.')
  })
})

describe('collage', () => {
  it('reparte en dos columnas equilibradas conservando el orden', () => {
    // Alto/ancho: 1.5 (vertical), 0.5 (horizontal), 0.5, 1
    const items = [
      { id: 'a', r: 1.5 },
      { id: 'b', r: 0.5 },
      { id: 'c', r: 0.5 },
      { id: 'd', r: 1 },
    ]
    const cols = distributeColumns(items, 2, (i) => i.r)
    expect(cols.map((c) => c.map((x) => x.item.id))).toEqual([['a'], ['b', 'c', 'd']])
  })

  it('acota proporciones extremas solo para equilibrar columnas', () => {
    expect(aspectRatio(1000, 100)).toBe(0.45)
    expect(aspectRatio(100, 1000)).toBe(2.2)
    expect(aspectRatio(null, null)).toBe(1)
  })

  it('mueve imágenes antes o después', () => {
    expect(moveItem(['a', 'b', 'c'], 1, -1)).toEqual(['b', 'a', 'c'])
    expect(moveItem(['a', 'b', 'c'], 1, 1)).toEqual(['a', 'c', 'b'])
    expect(moveItem(['a', 'b', 'c'], 0, -1)).toEqual(['a', 'b', 'c'])
  })
})

describe('guardado automático de reflexiones', () => {
  beforeEach(() => vi.useFakeTimers())
  afterEach(() => vi.useRealTimers())

  it('guarda al dejar de escribir, no en cada tecla', async () => {
    const save = vi.fn().mockResolvedValue(undefined)
    const { result, rerender } = renderHook(({ v }) => useAutosave(v, save, ''), { initialProps: { v: '' } })
    rerender({ v: 'Q' })
    rerender({ v: 'Quiero' })
    expect(result.current.status).toBe('pending')
    expect(save).not.toHaveBeenCalled()
    await act(async () => {
      await vi.advanceTimersByTimeAsync(1000)
    })
    expect(save).toHaveBeenCalledTimes(1)
    expect(save).toHaveBeenCalledWith('Quiero')
    expect(result.current.status).toBe('saved')
  })

  it('guarda de inmediato al salir del campo', async () => {
    const save = vi.fn().mockResolvedValue(undefined)
    const { result, rerender } = renderHook(({ v }) => useAutosave(v, save, 'Hola'), { initialProps: { v: 'Hola' } })
    rerender({ v: 'Hola mundo' })
    await act(() => result.current.flush())
    expect(save).toHaveBeenCalledWith('Hola mundo')
  })

  it('muestra error si falla y permite reintentar', async () => {
    const save = vi.fn().mockRejectedValueOnce(new Error('red')).mockResolvedValue(undefined)
    const { result, rerender } = renderHook(({ v }) => useAutosave(v, save, ''), { initialProps: { v: '' } })
    rerender({ v: 'Texto' })
    await act(() => result.current.flush())
    expect(result.current.status).toBe('error')
    await act(() => result.current.flush())
    expect(result.current.status).toBe('saved')
    expect(save).toHaveBeenCalledTimes(2)
  })

  it('no guarda si el texto no cambió', async () => {
    const save = vi.fn().mockResolvedValue(undefined)
    const { result } = renderHook(() => useAutosave('igual', save, 'igual'))
    await act(() => result.current.flush())
    expect(save).not.toHaveBeenCalled()
  })
})
