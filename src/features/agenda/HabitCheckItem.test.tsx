import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import type { AgendaItem } from '@/domain/agenda'
import type { HabitRow } from '@/types/database'
import { HabitCheckItem } from './HabitCheckItem'

const habit = { id: 'h', name: 'Estudiar 45 minutos', time_of_day: '07:30:00', duration_minutes: 45, color: null } as HabitRow

function renderItem(item: Partial<AgendaItem>) {
  const onToggle = vi.fn()
  render(<HabitCheckItem item={{ habit, completed: false, status: 'pendiente', ...item }} goalColor="sage" onToggle={onToggle} />)
  return { onToggle, user: userEvent.setup() }
}

describe('casilla de hábito', () => {
  it('marca un hábito pendiente', async () => {
    const { onToggle, user } = renderItem({})
    const box = screen.getByRole('checkbox', { name: 'Estudiar 45 minutos' })
    expect(box).toHaveAttribute('aria-checked', 'false')
    expect(screen.getByText('07:30 · 45 min')).toBeInTheDocument()
    await user.click(box)
    expect(onToggle).toHaveBeenCalledWith(true)
  })

  it('desmarca un hábito completado', async () => {
    const { onToggle, user } = renderItem({ completed: true, status: 'completado' })
    const box = screen.getByRole('checkbox')
    expect(box).toHaveAttribute('aria-checked', 'true')
    await user.click(box)
    expect(onToggle).toHaveBeenCalledWith(false)
  })

  it('permite corregir días anteriores no completados', async () => {
    const { onToggle, user } = renderItem({ status: 'no_completado' })
    expect(screen.getByText('No completado')).toBeInTheDocument()
    await user.click(screen.getByRole('checkbox'))
    expect(onToggle).toHaveBeenCalledWith(true)
  })

  it('no permite marcar días futuros', async () => {
    const { onToggle, user } = renderItem({ status: 'programado' })
    const box = screen.getByRole('checkbox')
    expect(box).toHaveAttribute('aria-disabled', 'true')
    expect(screen.getByText('Programado')).toBeInTheDocument()
    await user.click(box)
    expect(onToggle).not.toHaveBeenCalled()
  })
})
