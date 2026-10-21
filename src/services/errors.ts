/** Traduce errores de Supabase (Auth y PostgREST) a mensajes claros en español. */

const authMessages: Record<string, string> = {
  invalid_credentials: 'El correo o la contraseña no son correctos.',
  user_already_exists: 'Ya existe una cuenta con este correo. Intenta iniciar sesión.',
  email_exists: 'Ya existe una cuenta con este correo. Intenta iniciar sesión.',
  weak_password: 'La contraseña es demasiado débil. Usa al menos 8 caracteres.',
  same_password: 'La nueva contraseña debe ser diferente a la anterior.',
  email_not_confirmed: 'Confirma tu correo electrónico antes de iniciar sesión.',
  email_address_invalid: 'Ese correo electrónico no es válido.',
  signup_disabled: 'El registro de nuevas cuentas está desactivado.',
  over_email_send_rate_limit: 'Enviamos demasiados correos. Espera unos minutos e inténtalo de nuevo.',
  over_request_rate_limit: 'Demasiados intentos. Espera un momento e inténtalo de nuevo.',
  session_not_found: 'Tu sesión expiró. Vuelve a iniciar sesión.',
  refresh_token_not_found: 'Tu sesión expiró. Vuelve a iniciar sesión.',
  otp_expired: 'El enlace expiró o ya se usó. Solicita uno nuevo.',
}

const postgresMessages: Record<string, string> = {
  '23505': 'Ese registro ya existe.',
  '23503': 'El elemento relacionado ya no existe.',
  '23514': 'Algunos datos no son válidos.',
  '42501': 'No tienes permiso para realizar esta acción.',
  PGRST301: 'Tu sesión expiró. Vuelve a iniciar sesión.',
}

const GENERIC = 'Algo salió mal. Inténtalo de nuevo.'
const NETWORK = 'No pudimos conectarnos. Revisa tu conexión a internet.'

interface ErrorLike {
  code?: unknown
  message?: unknown
  name?: unknown
}

export function toSpanishMessage(error: unknown): string {
  if (error instanceof AppError) return error.message
  if (!error || typeof error !== 'object') return GENERIC
  const { code, message, name } = error as ErrorLike

  if (typeof code === 'string') {
    // P0001 = `raise exception` de nuestras funciones SQL: el mensaje ya está en español.
    if (code === 'P0001' && typeof message === 'string' && message) return message
    if (authMessages[code]) return authMessages[code]
    if (postgresMessages[code]) return postgresMessages[code]
  }

  // Errores de Supabase Storage (subida de imágenes).
  const status = String((error as { statusCode?: unknown; status?: unknown }).statusCode ?? (error as { status?: unknown }).status ?? '')
  if (status === '413' || (typeof message === 'string' && /exceeded the maximum allowed size|payload too large/i.test(message))) {
    return 'La imagen es demasiado pesada (máximo 10 MB).'
  }
  if (status === '415' || (typeof message === 'string' && /mime type .* not supported/i.test(message))) {
    return 'Ese tipo de archivo no está permitido. Usa JPG, PNG, WebP o GIF.'
  }

  if (typeof message === 'string') {
    if (name === 'AuthRetryableFetchError' || /failed to fetch|network/i.test(message)) return NETWORK
    // Los errores lanzados por nuestros triggers ya vienen en español.
    if (/^No puedes /.test(message)) return message
  }

  return GENERIC
}

/** Error de la app con mensaje listo para mostrar al usuario. */
export class AppError extends Error {
  constructor(
    message: string,
    readonly cause?: unknown,
  ) {
    super(message)
    this.name = 'AppError'
  }
}

/** Convierte cualquier error en un AppError con mensaje en español. */
export function toAppError(error: unknown): AppError {
  if (error instanceof AppError) return error
  return new AppError(toSpanishMessage(error), error)
}
