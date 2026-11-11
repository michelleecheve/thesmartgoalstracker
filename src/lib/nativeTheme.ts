import { Capacitor, registerPlugin } from '@capacitor/core'

type NativeThemeStyle = 'claro' | 'oscuro' | 'sistema'

/** Plugin propio de la app iOS (ios/App/App/ThemeBridge.swift). No existe en la web. */
const ThemeBridge = registerPlugin<{
  setStyle(options: { style: NativeThemeStyle }): Promise<void>
  hideSplash(): Promise<void>
}>('ThemeBridge')

/**
 * Avisa a la app nativa del tema elegido, para que la barra de estado, los bordes
 * translúcidos y el fondo de arranque coincidan con la interfaz web.
 */
export function syncNativeTheme(style: NativeThemeStyle): void {
  if (!Capacitor.isNativePlatform()) return
  ThemeBridge.setStyle({ style }).catch(() => {
    // Sin el plugin nativo (versión antigua de la app) el tema web sigue funcionando.
  })
}

/** Quita la pantalla de arranque nativa cuando la web ya dibujó su primera pantalla. */
export function hideNativeSplash(): void {
  if (!Capacitor.isNativePlatform()) return
  ThemeBridge.hideSplash().catch(() => {})
}
