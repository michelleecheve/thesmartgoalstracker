/** Textos guía de cada componente SMART (pregunta, explicación y ejemplo). */
export const smartGuide = {
  specific: {
    letter: 'S',
    title: 'Específica',
    question: '¿Qué quieres lograr exactamente?',
    explanation: 'Una meta clara es más fácil de cumplir. Evita frases generales como "estudiar más".',
    example: 'Completar todos los módulos y evaluaciones de mi curso de Coursera.',
  },
  measurable: {
    letter: 'M',
    title: 'Medible',
    question: '¿Cómo sabrás que alcanzaste tu meta? ¿Qué resultado concreto puedes medir?',
    explanation: 'Define una señal clara de éxito. Si puedes contarla con un número, mejor: así verás tu avance.',
    example: 'Finalizar el 100% de los módulos y obtener el certificado.',
  },
  achievable: {
    letter: 'A',
    title: 'Alcanzable',
    question: '¿Por qué consideras que puedes conseguir esta meta? ¿Con qué recursos, tiempo o capacidades cuentas?',
    explanation: 'Una buena meta es un reto, pero posible con lo que tienes hoy.',
    example: 'Puedo dedicar 45 minutos por sesión de estudio, tres veces por semana.',
  },
  relevant: {
    letter: 'R',
    title: 'Relevante',
    question: '¿Por qué es importante esta meta para ti? ¿Cómo contribuirá a tus objetivos personales o profesionales?',
    explanation: 'Recordar tu "para qué" te ayudará a mantener la motivación en los días difíciles.',
    example: 'Mejorar mis habilidades profesionales y abrirme a nuevas oportunidades.',
  },
  deadline: {
    letter: 'T',
    title: 'Temporal',
    question: '¿Cuál es la fecha límite para lograrla?',
    explanation: 'Una fecha concreta te da un horizonte y te ayuda a organizar tus hábitos.',
    example: 'Completar el curso antes del 31 de marzo de 2027.',
  },
} as const

export type SmartKey = keyof typeof smartGuide
