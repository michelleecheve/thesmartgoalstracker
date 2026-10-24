import { act, renderHook } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { applyTheme, getThemePreference, resolveTheme, setThemePreference, THEME_STORAGE_KEY, useTheme } from './theme'

let systemDark = false
const mediaListeners = new Set<() => void>()

beforeEach(() => {
  localStorage.clear()
  document.documentElement.classList.remove('dark')
  document.head.innerHTML = '<meta name="theme-color" content="#f5f7ff" />'
  systemDark = false
  mediaListeners.clear()
  vi.stubGlobal('matchMedia', (query: string) => ({
    get matches() {
      return query.includes('dark') && systemDark
    },
    addEventListener: (_: string, fn: () => void) => mediaListeners.add(fn),
    removeEventListener: (_: string, fn: () => void) => mediaListeners.delete(fn),
  }))
})
afterEach(() => vi.unstubAllGlobals())

const themeColor = () => document.querySelector('meta[name="theme-color"]')!.getAttribute('content')

describe('tema de la interfaz', () => {
  it('por defecto es claro', () => {
    expect(getThemePreference()).toBe('claro')
    expect(applyTheme()).toBe('claro')
    expect(document.documentElement).not.toHaveClass('dark')
  })

  it('el modo oscuro agrega la clase y cambia el color de la barra del sistema', () => {
    setThemePreference('oscuro')
    expect(localStorage.getItem(THEME_STORAGE_KEY)).toBe('oscuro')
    expect(document.documentElement).toHaveClass('dark')
    expect(themeColor()).toBe('#0e0f2a')
    setThemePreference('claro')
    expect(document.documentElement).not.toHaveClass('dark')
    expect(themeColor()).toBe('#f5f7ff')
  })

  it('"Sistema" sigue la preferencia del dispositivo', () => {
    systemDark = true
    expect(resolveTheme('sistema')).toBe('oscuro')
    systemDark = false
    expect(resolveTheme('sistema')).toBe('claro')
  })

  it('ignora valores guardados inválidos', () => {
    localStorage.setItem(THEME_STORAGE_KEY, 'morado')
    expect(getThemePreference()).toBe('claro')
  })

  it('el hook se actualiza al elegir un tema y al cambiar el sistema en vivo', () => {
    const { result } = renderHook(() => useTheme())
    expect(result.current).toMatchObject({ preference: 'claro', resolved: 'claro' })

    act(() => result.current.setPreference('sistema'))
    expect(result.current).toMatchObject({ preference: 'sistema', resolved: 'claro' })

    // El iPhone pasa a modo oscuro al anochecer.
    act(() => {
      systemDark = true
      mediaListeners.forEach((fn) => fn())
    })
    expect(result.current.resolved).toBe('oscuro')
    expect(document.documentElement).toHaveClass('dark')
  })
})
