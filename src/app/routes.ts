/** Rutas centralizadas de la aplicación (en español, como el resto de la interfaz). */
export const routes = {
  iniciarSesion: '/iniciar-sesion',
  registro: '/registro',
  recuperarContrasena: '/recuperar-contrasena',
  restablecerContrasena: '/restablecer-contrasena',
  bienvenida: '/bienvenida',

  inicio: '/inicio',
  metas: '/metas',
  nuevaMeta: '/metas/nueva',
  meta: (id: string) => `/metas/${id}`,
  editarMeta: (id: string) => `/metas/${id}/editar`,
  nuevoHabito: (metaId: string) => `/metas/${metaId}/habitos/nuevo`,
  habito: (habitoId: string) => `/habitos/${habitoId}`,
  editarHabito: (habitoId: string) => `/habitos/${habitoId}/editar`,
  estadisticas: '/estadisticas',
  vision: '/vision',
  perfil: '/perfil',
} as const
