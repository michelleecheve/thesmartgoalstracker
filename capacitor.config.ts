import type { CapacitorConfig } from '@capacitor/cli'

const config: CapacitorConfig = {
  appId: 'com.michelleechevarria.metassmart',
  appName: 'Smart Habits',
  webDir: 'dist',
  // Fondo de la ventana nativa mientras carga la web (evita el negro inicial en modo oscuro).
  backgroundColor: '#ffffff',
}

export default config
