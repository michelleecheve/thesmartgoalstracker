import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { RouterProvider } from 'react-router'
import { Toaster } from 'sonner'
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClient } from '@/app/queryClient'
import { router } from '@/app/router'
import { AuthProvider } from '@/app/auth/AuthProvider'
import { ConfiguracionPendiente } from '@/pages/ConfiguracionPendiente'
import { isSupabaseConfigured } from '@/lib/supabase'
import { applyTheme, useTheme } from '@/lib/theme'
import '@/styles/index.css'

applyTheme()

function ThemedToaster() {
  const { resolved } = useTheme()
  return (
    <Toaster
      theme={resolved === 'oscuro' ? 'dark' : 'light'}
      position="top-center"
      offset="calc(env(safe-area-inset-top, 0px) + 12px)"
      toastOptions={{ className: 'rounded-xl! shadow-lifted! font-sans!' }}
    />
  )
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    {isSupabaseConfigured ? (
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <RouterProvider router={router} />
          <ThemedToaster />
        </AuthProvider>
      </QueryClientProvider>
    ) : (
      <ConfiguracionPendiente />
    )}
  </StrictMode>,
)
