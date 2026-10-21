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
import { PasswordInput } from '@/components/forms/PasswordInput'
import { SubmitButton } from '@/components/forms/SubmitButton'
import { PASSWORD_MIN, registerSchema, type RegisterValues } from '@/features/auth/schemas'
import { signUp } from '@/services/auth'
import { toSpanishMessage } from '@/services/errors'
import { routes } from '@/app/routes'
import { AuthHeader } from './AuthHeader'

export function RegistroPage() {
  const [serverError, setServerError] = useState<string | null>(null)
  const [pendingEmail, setPendingEmail] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: { displayName: '', email: '', password: '', confirmPassword: '' },
  })

  const onSubmit = handleSubmit(async ({ displayName, email, password }) => {
    setServerError(null)
    try {
      const { hasSession } = await signUp({ displayName, email, password })
      // Con sesión, PublicOnly redirige solo; sin sesión, falta confirmar el correo.
      if (!hasSession) setPendingEmail(email)
    } catch (error) {
      setServerError(toSpanishMessage(error))
    }
  })

  // Solo ocurre si en Supabase está activada la confirmación por correo.
  if (pendingEmail) {
    return (
      <div className="flex flex-1 flex-col justify-center animate-fade-up">
        <EmptyState
          icon={MailCheck}
          title="Revisa tu correo"
          description={`Te enviamos un enlace a ${pendingEmail} para confirmar tu cuenta.`}
          action={
            <Button asChild variant="outline">
              <Link to={routes.iniciarSesion}>Ir a iniciar sesión</Link>
            </Button>
          }
        />
      </div>
    )
  }

  return (
    <div className="flex flex-1 flex-col justify-center animate-fade-up">
      <AuthHeader title="Crea tu cuenta" subtitle="Convierte tus metas en pequeñas acciones diarias." />

      <form onSubmit={onSubmit} noValidate className="flex flex-col gap-4">
        <FormError message={serverError} />
        <FormField label="¿Cómo te llamas?" error={errors.displayName?.message}>
          <Input autoComplete="given-name" placeholder="Tu nombre" {...register('displayName')} />
        </FormField>
        <FormField label="Correo electrónico" error={errors.email?.message}>
          <Input type="email" autoComplete="email" inputMode="email" placeholder="tu@correo.com" {...register('email')} />
        </FormField>
        <FormField label="Contraseña" error={errors.password?.message} hint={`Mínimo ${PASSWORD_MIN} caracteres.`}>
          <PasswordInput autoComplete="new-password" placeholder="Crea una contraseña" {...register('password')} />
        </FormField>
        <FormField label="Confirma tu contraseña" error={errors.confirmPassword?.message}>
          <PasswordInput autoComplete="new-password" placeholder="Repite la contraseña" {...register('confirmPassword')} />
        </FormField>
        <SubmitButton loading={isSubmitting} loadingText="Creando cuenta…" className="mt-2 w-full">
          Crear cuenta
        </SubmitButton>
      </form>

      <p className="mt-6 text-center text-sm text-muted-foreground">
        ¿Ya tienes cuenta?{' '}
        <Link to={routes.iniciarSesion} className="inline-flex min-h-11 items-center font-medium text-primary">
          Inicia sesión
        </Link>
      </p>
    </div>
  )
}
