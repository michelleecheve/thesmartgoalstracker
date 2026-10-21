import { beforeEach, describe, expect, it, vi } from 'vitest'

// Simulación del cliente de Supabase: registra las llamadas a Storage y a la tabla.
const upload = vi.fn()
const remove = vi.fn()
const insertSingle = vi.fn()
vi.mock('@/lib/supabase', () => ({
  supabase: {
    storage: { from: () => ({ upload, remove }) },
    from: () => ({ insert: () => ({ select: () => ({ single: insertSingle }) }) }),
  },
}))

const { uploadVisionImage } = await import('./vision')

const USER = '11111111-1111-1111-1111-111111111111'
const image = { blob: new Blob(['x'], { type: 'image/jpeg' }), width: 1536, height: 2048, contentType: 'image/jpeg', extension: 'jpg' }

describe('subida de imágenes', () => {
  beforeEach(() => {
    upload.mockReset().mockResolvedValue({ error: null })
    remove.mockReset().mockResolvedValue({ error: null })
    insertSingle.mockReset()
  })

  it('sube a la carpeta privada del usuario y guarda las dimensiones', async () => {
    insertSingle.mockResolvedValue({ data: { id: 'img' }, error: null })
    await uploadVisionImage(USER, image, 3)
    const [path, blob, options] = upload.mock.calls[0]!
    expect(path).toMatch(new RegExp(`^${USER}/[0-9a-f-]{36}\\.jpg$`))
    expect(blob).toBe(image.blob)
    expect(options).toMatchObject({ contentType: 'image/jpeg', upsert: false })
    expect(remove).not.toHaveBeenCalled()
  })

  it('si falla el registro, borra el archivo subido', async () => {
    insertSingle.mockResolvedValue({ data: null, error: { code: '42501', message: 'denied' } })
    await expect(uploadVisionImage(USER, image, 0)).rejects.toThrow('No tienes permiso para realizar esta acción.')
    expect(remove).toHaveBeenCalledWith([upload.mock.calls[0]![0]])
  })

  it('si falla la subida, no registra nada', async () => {
    upload.mockResolvedValue({ error: { statusCode: '413', message: 'Payload too large' } })
    await expect(uploadVisionImage(USER, image, 0)).rejects.toThrow('La imagen es demasiado pesada (máximo 10 MB).')
    expect(insertSingle).not.toHaveBeenCalled()
  })
})
