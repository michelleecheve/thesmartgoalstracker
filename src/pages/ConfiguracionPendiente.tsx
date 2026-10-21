import { Settings } from 'lucide-react'
import { MobileFrame } from '@/components/layout/MobileFrame'
import { EmptyState } from '@/components/common/EmptyState'

/** Se muestra si faltan las variables de entorno de Supabase. */
export function ConfiguracionPendiente() {
  return (
    <MobileFrame className="justify-center">
      <EmptyState
        icon={Settings}
        title="Falta configurar Supabase"
        description="Crea el archivo .env.local con VITE_SUPABASE_URL y VITE_SUPABASE_ANON_KEY (puedes copiar .env.example) y reinicia npm run dev."
      />
    </MobileFrame>
  )
}
