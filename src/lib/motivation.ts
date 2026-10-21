const messages = [
  'Las pequeñas acciones de hoy construyen las grandes metas de mañana.',
  'No tiene que ser perfecto, solo constante.',
  'Un paso a la vez también es avanzar.',
  'Lo que haces cada día importa más que lo que haces de vez en cuando.',
  'Tu yo del futuro te lo va a agradecer.',
  'La constancia vence al talento cuando el talento no es constante.',
  'Empieza donde estás, con lo que tienes.',
]

/** Mensaje motivacional estable durante todo el día (cambia de un día a otro). */
export function motivationFor(date: Date): string {
  const dayIndex = Math.floor(
    Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()) / 86_400_000,
  )
  return messages[dayIndex % messages.length]!
}
