import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { GoalWizard } from './GoalWizard'
import { emptyGoalForm } from './schemas'

function setup() {
  const onSubmit = vi.fn().mockResolvedValue(undefined)
  render(<GoalWizard mode="create" initialValues={emptyGoalForm('2026-11-01')} onSubmit={onSubmit} onCancel={() => {}} />)
  return { user: userEvent.setup(), onSubmit }
}

describe('asistente de meta SMART', () => {
  it('no avanza sin nombre y muestra el error en español', async () => {
    const { user } = setup()
    await user.click(screen.getByRole('button', { name: 'Continuar' }))
    expect(await screen.findByText('Ponle un nombre a tu meta.')).toBeInTheDocument()
    expect(screen.getByText(/Paso 1 de 7/)).toBeInTheDocument()
  })

  it('muestra una pregunta SMART a la vez y conserva lo escrito al regresar', async () => {
    const { user } = setup()
    await user.type(screen.getByLabelText('Nombre de la meta'), 'Completar mi curso')
    await user.click(screen.getByRole('button', { name: 'Continuar' }))

    expect(screen.getByText('¿Qué quieres lograr exactamente?')).toBeInTheDocument()
    expect(screen.queryByText(/¿Cómo sabrás que alcanzaste tu meta/)).not.toBeInTheDocument()
    expect(screen.getByText(/Completar todos los módulos y evaluaciones/)).toBeInTheDocument() // ejemplo

    await user.type(screen.getByLabelText('Tu respuesta'), 'Terminar los 12 módulos')
    await user.click(screen.getByRole('button', { name: 'Paso anterior' }))
    expect(screen.getByLabelText('Nombre de la meta')).toHaveValue('Completar mi curso')
    await user.click(screen.getByRole('button', { name: 'Continuar' }))
    expect(screen.getByLabelText('Tu respuesta')).toHaveValue('Terminar los 12 módulos')
  })

  it('recorre los siete pasos y guarda la meta', async () => {
    const { user, onSubmit } = setup()
    const next = () => user.click(screen.getByRole('button', { name: 'Continuar' }))

    await user.type(screen.getByLabelText('Nombre de la meta'), 'Completar mi curso')
    await next()
    for (const answer of ['Específica', 'Medible', 'Alcanzable', 'Relevante']) {
      await user.type(screen.getByLabelText('Tu respuesta'), answer)
      await next()
    }
    await user.type(screen.getByLabelText('Fecha límite'), '2027-03-31')
    await next()

    expect(screen.getByText('Revisa tu meta')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Guardar meta' }))
    expect(onSubmit).toHaveBeenCalledWith(
      expect.objectContaining({ name: 'Completar mi curso', relevant: 'Relevante', deadline: '2027-03-31' }),
    )
  })
})
