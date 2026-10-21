import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import type { SeriesPoint } from '@/domain/stats'
import { ConsistencyChart } from './ConsistencyChart'

const series: SeriesPoint[] = [
  { date: '2026-11-02', end: '2026-11-02', scheduled: 4, completed: 3, rate: 75 },
  { date: '2026-11-03', end: '2026-11-03', scheduled: 0, completed: 0, rate: null },
  { date: '2026-11-04', end: '2026-11-04', scheduled: 2, completed: 2, rate: 100 },
]

describe('gráfico de constancia', () => {
  it('describe los datos para lectores de pantalla', () => {
    render(<ConsistencyChart series={series} granularity="dia" />)
    expect(screen.getByRole('img')).toHaveAccessibleName(/Lunes 2 de noviembre 75%; Miércoles 4 de noviembre 100%/)
  })

  it('ofrece una vista de tabla en español', async () => {
    const user = userEvent.setup()
    render(<ConsistencyChart series={series} granularity="dia" />)
    await user.click(screen.getByRole('button', { name: 'Ver tabla' }))
    const rows = screen.getAllByRole('row')
    expect(rows).toHaveLength(4)
    expect(rows[1]).toHaveTextContent('Lunes 2 de noviembre3 de 475%')
    expect(rows[2]).toHaveTextContent('Martes 3 de noviembre——')
    expect(screen.getByRole('button', { name: 'Ver gráfico' })).toBeInTheDocument()
  })
})
