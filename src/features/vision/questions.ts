import type { VisionQuestionKey } from '@/types/database'

export const visionQuestions: { key: VisionQuestionKey; question: string; placeholder: string }[] = [
  {
    key: 'persona',
    question: '¿En qué persona quiero convertirme?',
    placeholder: 'Describe a la persona que quieres ser: cómo piensas, cómo actúas, qué te importa…',
  },
  {
    key: 'importancia',
    question: '¿Por qué estas metas son importantes para mí?',
    placeholder: 'Lo que realmente está en juego para ti…',
  },
  {
    key: 'vida',
    question: '¿Cómo será mi vida cuando las consiga?',
    placeholder: 'Imagina un día normal cuando ya lo hayas logrado…',
  },
  {
    key: 'motivacion',
    question: '¿Qué me motiva a seguir adelante?',
    placeholder: 'Personas, sueños, recuerdos, frases que te impulsan…',
  },
]
