import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import { describe, expect, it } from 'vitest'
import { BottomNav } from './BottomNav'

describe('BottomNav', () => {
  it('muestra las cuatro secciones en español y marca la activa', () => {
    render(
      <MemoryRouter initialEntries={['/metas']}>
        <BottomNav />
      </MemoryRouter>,
    )
    expect(screen.getByRole('link', { name: 'Inicio' })).toHaveAttribute('href', '/inicio')
    expect(screen.getByRole('link', { name: 'Mis metas' })).toHaveAttribute('aria-current', 'page')
    expect(screen.getByRole('link', { name: 'Estadísticas' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Tablero de visión' })).toBeInTheDocument()
  })
})
