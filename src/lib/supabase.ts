import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database'
import { env, isSupabaseConfigured } from './env'

/**
 * Cliente único de Supabase. Solo usa la clave pública (anon/publishable):
 * la seguridad real la imponen las políticas RLS en la base de datos.
 */
export const supabase: SupabaseClient<Database> = createClient<Database>(
  // Valores de reserva para que la app pueda mostrar la pantalla de configuración
  // en lugar de fallar al importar este módulo.
  env.supabaseUrl ?? 'http://localhost',
  env.supabaseAnonKey ?? 'sin-configurar',
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
  },
)

export { isSupabaseConfigured }
