import type { ReactNode } from 'react'
import { act, renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { CompletionRef } from '@/services/completions'
import { queryKeys } from '@/features/goals/queries'

const markCompleted = vi.fn()
const unmarkCompleted = vi.fn()
vi.mock('@/services/completions', () => ({
  fetchCompletions: vi.fn(),
  markCompleted: (...a: unknown[]) => markCompleted(...a),
  unmarkCompleted: (...a: unknown[]) => unmarkCompleted(...a),
}))
const toastError = vi.fn()
vi.mock('sonner', () => ({ toast: { error: (m: string) => toastError(m), success: vi.fn() } }))

const { useToggleCompletion } = await import('./hooks')

const KEY = queryKeys.completions('2026-10-26', '2026-12-06')

function setup(initial: CompletionRef[]) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false, staleTime: Infinity } } })
  client.setQueryData(KEY, initial)
  const wrapper = ({ children }: { children: ReactNode }) => <QueryClientProvider client={client}>{children}</QueryClientProvider>
  const { result } = renderHook(() => useToggleCompletion(), { wrapper })
  return { client, result, data: () => client.getQueryData<CompletionRef[]>(KEY) }
}

describe('marcar y desmarcar hábitos', () => {
  beforeEach(() => {
    markCompleted.mockReset()
    unmarkCompleted.mockReset()
    toastError.mockReset()
  })

  it('marca al instante, antes de que responda el servidor', async () => {
    let resolve!: () => void
    markCompleted.mockReturnValue(new Promise<void>((r) => (resolve = r)))
    const { result, data } = setup([])
    act(() => result.current.mutate({ habitId: 'h1', date: '2026-11-02', completed: true }))
    await waitFor(() => expect(data()).toEqual([{ habit_id: 'h1', date: '2026-11-02' }]))
    expect(markCompleted).toHaveBeenCalledWith('h1', '2026-11-02')
    resolve()
  })

  it('desmarca al instante', async () => {
    unmarkCompleted.mockResolvedValue(undefined)
    const { result, data } = setup([{ habit_id: 'h1', date: '2026-11-02' }, { habit_id: 'h2', date: '2026-11-02' }])
    act(() => result.current.mutate({ habitId: 'h1', date: '2026-11-02', completed: false }))
    await waitFor(() => expect(data()).toEqual([{ habit_id: 'h2', date: '2026-11-02' }]))
    expect(unmarkCompleted).toHaveBeenCalledWith('h1', '2026-11-02')
  })

  it('si el servidor falla, revierte el cambio y avisa en español', async () => {
    markCompleted.mockRejectedValue({ code: '23514', message: 'check violation' })
    const { result, data } = setup([])
    act(() => result.current.mutate({ habitId: 'h1', date: '2026-11-02', completed: true }))
    await waitFor(() => expect(toastError).toHaveBeenCalledWith('Algunos datos no son válidos.'))
    expect(data()).toEqual([])
  })

  it('nunca duplica un registro aunque se marque dos veces', async () => {
    markCompleted.mockResolvedValue(undefined)
    const { result, data } = setup([{ habit_id: 'h1', date: '2026-11-02' }])
    act(() => result.current.mutate({ habitId: 'h1', date: '2026-11-02', completed: true }))
    await waitFor(() => expect(markCompleted).toHaveBeenCalled())
    expect(data()).toEqual([{ habit_id: 'h1', date: '2026-11-02' }])
  })
})
