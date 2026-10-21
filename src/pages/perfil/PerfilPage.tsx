import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { Loader2, LogOut, UserRound } from 'lucide-react'
import { PageHeader } from '@/components/layout/PageHeader'
import { PageContent } from '@/components/layout/PageContent'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { FormField } from '@/components/forms/FormField'
import { SectionTitle } from '@/components/common/SectionTitle'
import { useAuth, useCurrentUser } from '@/app/auth/auth-context'
import { signOut } from '@/services/auth'
import { updateDisplayName } from '@/services/profile'
import { toSpanishMessage } from '@/services/errors'

const nameSchema = z.object({
  displayName: z
    .string()
    .trim()
    .min(1, { error: 'Escribe tu nombre.' })
    .max(60, { error: 'Usa un nombre de máximo 60 caracteres.' }),
})
type NameValues = z.infer<typeof nameSchema>

export function PerfilPage() {
  const user = useCurrentUser()
  const { profile, setProfile } = useAuth()
  const [signingOut, setSigningOut] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting, isDirty },
    reset,
  } = useForm<NameValues>({
    resolver: zodResolver(nameSchema),
    values: { displayName: profile?.display_name ?? '' },
  })

  const onSaveName = handleSubmit(async ({ displayName }) => {
    try {
      const updated = await updateDisplayName(user.id, displayName)
      setProfile(updated)
      reset({ displayName: updated.display_name ?? '' })
      toast.success('Tu nombre se guardó.')
    } catch (error) {
      toast.error(toSpanishMessage(error))
    }
  })

  async function handleSignOut() {
    setSigningOut(true)
    try {
      // Al cerrar sesión, RequireAuth redirige a Iniciar sesión.
      await signOut()
    } catch (error) {
      toast.error(toSpanishMessage(error))
      setSigningOut(false)
    }
  }

  return (
    <>
      <PageHeader title="Perfil" subtitle="Configuración de tu cuenta" back />
      <PageContent>
        <Card>
          <CardContent className="flex items-center gap-4">
            <div className="flex size-14 shrink-0 items-center justify-center rounded-full bg-accent text-accent-foreground">
              <UserRound className="size-6" />
            </div>
            <div className="min-w-0">
              <p className="truncate font-semibold">{profile?.display_name || 'Tu cuenta'}</p>
              <p className="truncate text-sm text-muted-foreground">{user.email}</p>
            </div>
          </CardContent>
        </Card>

        <section className="flex flex-col gap-3">
          <SectionTitle>Datos personales</SectionTitle>
          <Card>
            <CardContent>
              <form onSubmit={onSaveName} noValidate className="flex flex-col gap-4">
                <FormField label="Nombre" error={errors.displayName?.message}>
                  <Input autoComplete="given-name" {...register('displayName')} />
                </FormField>
                <Button type="submit" variant="secondary" disabled={!isDirty || isSubmitting}>
                  {isSubmitting && <Loader2 className="size-[18px] animate-spin" />}
                  Guardar nombre
                </Button>
              </form>
            </CardContent>
          </Card>
        </section>

        <Dialog>
          <DialogTrigger asChild>
            <Button variant="outline" className="text-destructive">
              <LogOut className="size-[18px]" />
              Cerrar sesión
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>¿Cerrar sesión?</DialogTitle>
              <DialogDescription>Tus metas y hábitos seguirán guardados en tu cuenta.</DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <DialogClose asChild>
                <Button variant="ghost">Cancelar</Button>
              </DialogClose>
              <Button variant="destructive" onClick={handleSignOut} disabled={signingOut}>
                {signingOut && <Loader2 className="size-[18px] animate-spin" />}
                Cerrar sesión
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </PageContent>
    </>
  )
}
