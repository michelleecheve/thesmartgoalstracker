import { useState } from 'react'
import { Link } from 'react-router'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Input } from '@/components/ui/input'
import { FormField } from '@/components/forms/FormField'
import { FormError } from '@/components/forms/FormError'
import { PasswordInput } from '@/components/forms/PasswordInput'
import { SubmitButton } from '@/components/forms/SubmitButton'
import { loginSchema, type LoginValues } from '@/features/auth/schemas'
import { signIn } from '@/services/auth'
import { toSpanishMessage } from '@/services/errors'
import { routes } from '@/app/routes'
import { AuthHeader } from './AuthHeader'

export function IniciarSesionPage() {
  const [serverError, setServerError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginValues>({ resolver: zodResolver(loginSchema), defaultValues: { email: '', password: '' } })

  const onSubmit = handleSubmit(async ({ email, password }) => {
    setServerError(null)
    try {
      // Al crearse la sesión, PublicOnly redirige al destino (o a la bienvenida si no hay metas).
      await signIn(email, password)
    } catch (error) {
      setServerError(toSpanishMessage(error))
    }
  })

  return (
    <div className="flex flex-1 flex-col justify-center animate-fade-up">
      <AuthHeader title="Hola de nuevo" subtitle="Inicia sesión para continuar con tus metas." />

      <form onSubmit={onSubmit} noValidate className="flex flex-col gap-4">
        <FormError message={serverError} />
        <FormField label="Correo electrónico" error={errors.email?.message}>
          <Input type="email" autoComplete="email" inputMode="email" placeholder="tu@correo.com" {...register('email')} />
        </FormField>
        <FormField label="Contraseña" error={errors.password?.message}>
          <PasswordInput autoComplete="current-password" placeholder="Tu contraseña" {...register('password')} />
        </FormField>
        <div className="-mt-1 flex justify-end">
          <Link
            to={routes.recuperarContrasena}
            className="inline-flex min-h-11 items-center text-sm text-muted-foreground hover:text-foreground"
          >
            ¿Olvidaste tu contraseña?
          </Link>
        </div>
        <SubmitButton loading={isSubmitting} loadingText="Entrando…">
          Iniciar sesión
        </SubmitButton>
      </form>

      <p className="mt-6 text-center text-sm text-muted-foreground">
        ¿No tienes cuenta?{' '}
        <Link to={routes.registro} className="inline-flex min-h-11 items-center font-medium text-primary">
          Regístrate
        </Link>
      </p>
    </div>
  )
}
