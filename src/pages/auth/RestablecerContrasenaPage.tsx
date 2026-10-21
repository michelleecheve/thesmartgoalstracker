import { useState } from 'react'
import { Link, useNavigate } from 'react-router'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'sonner'
import { LinkIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { EmptyState } from '@/components/common/EmptyState'
import { LoadingScreen } from '@/components/common/LoadingScreen'
import { FormField } from '@/components/forms/FormField'
import { FormError } from '@/components/forms/FormError'
import { PasswordInput } from '@/components/forms/PasswordInput'
import { SubmitButton } from '@/components/forms/SubmitButton'
import { PASSWORD_MIN, resetPasswordSchema, type ResetPasswordValues } from '@/features/auth/schemas'
import { updatePassword } from '@/services/auth'
import { toSpanishMessage } from '@/services/errors'
import { useAuth } from '@/app/auth/auth-context'
import { routes } from '@/app/routes'
import { AuthHeader } from './AuthHeader'

/** Destino del enlace de recuperación enviado por correo. */
export function RestablecerContrasenaPage() {
  const navigate = useNavigate()
  const { initializing, session } = useAuth()
  const [serverError, setServerError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ResetPasswordValues>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: { password: '', confirmPassword: '' },
  })

  const onSubmit = handleSubmit(async ({ password }) => {
    setServerError(null)
    try {
      await updatePassword(password)
      toast.success('Tu contraseña se actualizó correctamente.')
      navigate(routes.inicio, { replace: true })
    } catch (error) {
      setServerError(toSpanishMessage(error))
    }
  })

  if (initializing) return <LoadingScreen />

  if (!session) {
    return (
      <div className="flex flex-1 flex-col justify-center animate-fade-up">
        <EmptyState
          icon={LinkIcon}
          title="El enlace no es válido"
          description="Es posible que haya expirado o que ya se haya usado. Solicita uno nuevo."
          action={
            <Button asChild>
              <Link to={routes.recuperarContrasena}>Solicitar nuevo enlace</Link>
            </Button>
          }
        />
      </div>
    )
  }

  return (
    <div className="flex flex-1 flex-col justify-center animate-fade-up">
      <AuthHeader title="Nueva contraseña" subtitle="Elige una contraseña que no hayas usado antes." />

      <form onSubmit={onSubmit} noValidate className="flex flex-col gap-4">
        <FormError message={serverError} />
        <FormField label="Nueva contraseña" error={errors.password?.message} hint={`Mínimo ${PASSWORD_MIN} caracteres.`}>
          <PasswordInput autoComplete="new-password" placeholder="Nueva contraseña" {...register('password')} />
        </FormField>
        <FormField label="Confirma tu contraseña" error={errors.confirmPassword?.message}>
          <PasswordInput autoComplete="new-password" placeholder="Repite la contraseña" {...register('confirmPassword')} />
        </FormField>
        <SubmitButton loading={isSubmitting} loadingText="Guardando…">
          Guardar contraseña
        </SubmitButton>
      </form>
    </div>
  )
}
