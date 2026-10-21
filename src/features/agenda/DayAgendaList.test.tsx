import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router'
import { describe, expect, it, vi } from 'vitest'
import type { DayAgenda, ExtraItem } from '@/domain/agenda'
import type { GoalRow, HabitRow } from '@/types/database'
import { DayAgendaList } from './DayAgendaList'

const goal = { id: 'g', name: 'Mejorar mi condición física', color: 'sage' } as GoalRow
const habit = (id: string, name: string) => ({ id, name, color: null, time_of_day: null, duration_minutes: null }) as HabitRow

const emptyDay: DayAgenda = { date: '2026-11-07', groups: [], extras: [], completed: 0, total: 0, percent: null, isFuture: false }

function renderList(agenda: DayAgenda, candidates: ExtraItem[]) {
  const onToggle = vi.fn()
  render(
    <MemoryRouter>
      <DayAgendaList agenda={agenda} extraCandidates={candidates} onToggle={onToggle} />
    </MemoryRouter>,
  )
  return { onToggle, user: userEvent.setup() }
}

describe('hábitos extra en la agenda', () => {
  it('permite registrar un hábito que no estaba programado', async () => {
    const { onToggle, user } = renderList(emptyDay, [{ habit: habit('correr', 'Correr 20 minutos'), goal }])
    expect(screen.getByText('Sin hábitos para este día')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Registrar un hábito extra' }))
    const sheet = screen.getByRole('dialog', { name: 'Registrar un hábito extra' })
    expect(within(sheet).getByText('Mejorar mi condición física')).toBeInTheDocument()
    await user.click(within(sheet).getByRole('button', { name: /Correr 20 minutos/ }))
    expect(onToggle).toHaveBeenCalledWith('correr', true)
  })

  it('muestra los extras marcados y permite quitarlos', async () => {
    const { onToggle, user } = renderList({ ...emptyDay, extras: [{ habit: habit('correr', 'Correr 20 minutos'), goal }] }, [])
    expect(screen.queryByText('Sin hábitos para este día')).not.toBeInTheDocument()
    expect(screen.getByText('Extras')).toBeInTheDocument()
    expect(screen.getByText(/No cambian tu porcentaje del día/)).toBeInTheDocument()
    const box = screen.getByRole('checkbox', { name: 'Correr 20 minutos' })
    expect(box).toHaveAttribute('aria-checked', 'true')
    await user.click(box)
    expect(onToggle).toHaveBeenCalledWith('correr', false)
  })

  it('no muestra el botón si no hay hábitos que registrar', () => {
    renderList(emptyDay, [])
    expect(screen.queryByRole('button', { name: 'Registrar un hábito extra' })).not.toBeInTheDocument()
  })
})
