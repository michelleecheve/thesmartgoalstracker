import { useState } from 'react'
import { Link } from 'react-router'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { MailCheck } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { EmptyState } from '@/components/common/EmptyState'
import { FormField } from '@/components/forms/FormField'
import { FormError } from '@/components/forms/FormError'
import { SubmitButton } from '@/components/forms/SubmitButton'
import { forgotPasswordSchema, type ForgotPasswordValues } from '@/features/auth/schemas'
import { requestPasswordReset } from '@/services/auth'
import { toSpanishMessage } from '@/services/errors'
import { routes } from '@/app/routes'
import { AuthHeader } from './AuthHeader'

export function RecuperarContrasenaPage() {
  const [serverError, setServerError] = useState<string | null>(null)
  const [sentTo, setSentTo] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ForgotPasswordValues>({ resolver: zodResolver(forgotPasswordSchema), defaultValues: { email: '' } })

  const onSubmit = handleSubmit(async ({ email }) => {
    setServerError(null)
    try {
      await requestPasswordReset(email)
      setSentTo(email)
    } catch (error) {
      setServerError(toSpanishMessage(error))
    }
  })

  if (sentTo) {
    return (
      <div className="flex flex-1 flex-col justify-center animate-fade-up">
        <EmptyState
          icon={MailCheck}
          title="Revisa tu correo"
          description={`Si existe una cuenta con ${sentTo}, recibirás un enlace para crear una nueva contraseña.`}
          action={
            <Button asChild variant="outline">
              <Link to={routes.iniciarSesion}>Volver a iniciar sesión</Link>
            </Button>
          }
        />
      </div>
    )
  }

  return (
    <div className="flex flex-1 flex-col justify-center animate-fade-up">
      <AuthHeader title="Recupera tu contraseña" subtitle="Te enviaremos un enlace a tu correo electrónico." />

      <form onSubmit={onSubmit} noValidate className="flex flex-col gap-4">
        <FormError message={serverError} />
        <FormField label="Correo electrónico" error={errors.email?.message}>
          <Input type="email" autoComplete="email" inputMode="email" placeholder="tu@correo.com" {...register('email')} />
        </FormField>
        <SubmitButton loading={isSubmitting} loadingText="Enviando…">
          Enviar enlace
        </SubmitButton>
      </form>

      <p className="mt-6 text-center text-sm">
        <Link to={routes.iniciarSesion} className="inline-flex min-h-11 items-center font-medium text-primary">
          Volver a iniciar sesión
        </Link>
      </p>
    </div>
  )
}
