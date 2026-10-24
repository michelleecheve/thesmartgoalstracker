import { useSyncExternalStore } from 'react'

/**
 * Tema de la interfaz: claro, oscuro o el del sistema.
 * Es una preferencia visual de cada dispositivo, por eso se guarda localmente
 * (no en Supabase): así se aplica al instante, antes de dibujar la pantalla.
 * Un script en index.html repite esta lógica para evitar el destello inicial.
 */
export type ThemePreference = 'claro' | 'oscuro' | 'sistema'
export type ResolvedTheme = 'claro' | 'oscuro'

export const THEME_STORAGE_KEY = 'tema'
const CHANGE_EVENT = 'temachange'
const BACKGROUND: Record<ResolvedTheme, string> = { claro: '#f5f7ff', oscuro: '#0e0f2a' }

function systemPrefersDark(): boolean {
  return typeof window.matchMedia === 'function' && window.matchMedia('(prefers-color-scheme: dark)').matches
}

export function getThemePreference(): ThemePreference {
  try {
    const value = localStorage.getItem(THEME_STORAGE_KEY)
    if (value === 'claro' || value === 'oscuro' || value === 'sistema') return value
  } catch {
    // Almacenamiento no disponible (p. ej. navegación privada): se usa el claro.
  }
  return 'claro'
}

export function resolveTheme(preference: ThemePreference): ResolvedTheme {
  if (preference === 'sistema') return systemPrefersDark() ? 'oscuro' : 'claro'
  return preference
}

/** Aplica el tema al documento (clase .dark y color de la barra del sistema). */
export function applyTheme(preference: ThemePreference = getThemePreference()): ResolvedTheme {
  const resolved = resolveTheme(preference)
  document.documentElement.classList.toggle('dark', resolved === 'oscuro')
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', BACKGROUND[resolved])
  return resolved
}

export function setThemePreference(preference: ThemePreference): void {
  try {
    localStorage.setItem(THEME_STORAGE_KEY, preference)
  } catch {
    // Si no se puede guardar, el cambio aplica solo a esta visita.
  }
  applyTheme(preference)
  window.dispatchEvent(new Event(CHANGE_EVENT))
}

function subscribe(onChange: () => void): () => void {
  const media = typeof window.matchMedia === 'function' ? window.matchMedia('(prefers-color-scheme: dark)') : null
  const onSystemChange = () => {
    // Si el usuario eligió "Sistema", sigue los cambios del dispositivo en vivo.
    if (getThemePreference() === 'sistema') applyTheme('sistema')
    onChange()
  }
  window.addEventListener(CHANGE_EVENT, onChange)
  window.addEventListener('storage', onChange) // cambios desde otra pestaña
  media?.addEventListener('change', onSystemChange)
  return () => {
    window.removeEventListener(CHANGE_EVENT, onChange)
    window.removeEventListener('storage', onChange)
    media?.removeEventListener('change', onSystemChange)
  }
}

function snapshot(): string {
  const preference = getThemePreference()
  return `${preference}|${resolveTheme(preference)}`
}

export function useTheme() {
  const value = useSyncExternalStore(subscribe, snapshot, () => 'claro|claro')
  const [preference, resolved] = value.split('|') as [ThemePreference, ResolvedTheme]
  return { preference, resolved, setPreference: setThemePreference }
}
