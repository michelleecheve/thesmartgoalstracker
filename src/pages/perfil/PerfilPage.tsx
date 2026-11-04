import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { Loader2, LogOut, Pointer, Save, Smartphone } from 'lucide-react'
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
import { SegmentedControl } from '@/components/ui/segmented-control'
import { useTheme } from '@/lib/theme'
import { useAuth, useCurrentUser } from '@/app/auth/auth-context'
import { signOut } from '@/services/auth'
import { updateDisplayName, updateMotivationPhrase } from '@/services/profile'
import { DEFAULT_MOTIVATION, MAX_MOTIVATION_LENGTH } from '@/lib/motivation'
import { Textarea } from '@/components/ui/textarea'
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
  const theme = useTheme()
  const savedPhrase = profile?.motivation_phrase ?? ''
  const [phrase, setPhrase] = useState<string | null>(null)
  const [savingPhrase, setSavingPhrase] = useState(false)
  const phraseValue = phrase ?? savedPhrase

  async function savePhrase(next: string) {
    setSavingPhrase(true)
    try {
      const updated = await updateMotivationPhrase(user.id, next)
      setProfile(updated)
      setPhrase(null)
      toast.success(updated.motivation_phrase ? 'Tu frase se guardó.' : 'Volvió la frase original.')
    } catch (error) {
      toast.error(toSpanishMessage(error))
    } finally {
      setSavingPhrase(false)
    }
  }

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
      <PageHeader
        title="Perfil"
        subtitle="Configuración de tu cuenta"
        back
        leading={<img src="/icons/logo.png" alt="" className="h-28 w-auto" />}
      />
      <PageContent>
        <section className="flex flex-col gap-3">
          <SectionTitle>Datos personales</SectionTitle>
          <Card>
            <CardContent className="flex flex-col gap-4">
              <form onSubmit={onSaveName} noValidate className="flex items-start gap-2">
                <FormField label="Nombre" error={errors.displayName?.message} className="min-w-0 flex-1">
                  <Input autoComplete="given-name" className="h-10" {...register('displayName')} />
                </FormField>
                {/* mt-[22px]: alinea el botón con el campo (alto de la etiqueta + separación) */}
                <Button
                  type="submit"
                  size="icon"
                  className="mt-[22px] size-10 shrink-0 rounded-full"
                  aria-label="Guardar nombre"
                  disabled={!isDirty || isSubmitting}
                >
                  {isSubmitting ? <Loader2 className="size-[18px] animate-spin" /> : <Save className="size-[18px]" />}
                </Button>
              </form>
              <div className="flex flex-col gap-2">
                <p className="text-sm leading-none font-medium">Correo</p>
                <p className="truncate text-base">{user.email}</p>
              </div>
            </CardContent>
          </Card>
        </section>

        <section className="flex flex-col gap-3">
          <SectionTitle>Frase de Inicio</SectionTitle>
          <Card>
            <CardContent className="flex flex-col gap-3">
              <Textarea
                rows={2}
                maxLength={MAX_MOTIVATION_LENGTH}
                value={phraseValue}
                onChange={(e) => setPhrase(e.target.value)}
                placeholder={DEFAULT_MOTIVATION}
                aria-label="Frase de Inicio"
              />
              <p className="text-xs text-muted-foreground">
                Aparece en la tarjeta amarilla de Inicio. {phraseValue.length}/{MAX_MOTIVATION_LENGTH}
              </p>
              <Button disabled={phraseValue.trim() === savedPhrase || savingPhrase} onClick={() => savePhrase(phraseValue)}>
                {savingPhrase && <Loader2 className="size-[18px] animate-spin" />}
                Guardar frase
              </Button>
              {savedPhrase && (
                <Button variant="ghost" disabled={savingPhrase} onClick={() => savePhrase('')}>
                  Volver a la frase original
                </Button>
              )}
            </CardContent>
          </Card>
        </section>

        <section className="flex flex-col gap-3">
          <SectionTitle>Apariencia</SectionTitle>
          <Card>
            <CardContent className="flex flex-col gap-3">
              <SegmentedControl
                label="Tema"
                value={theme.preference}
                onChange={theme.setPreference}
                options={[
                  { value: 'claro', label: 'Claro' },
                  { value: 'oscuro', label: 'Oscuro' },
                  { value: 'sistema', label: 'Sistema' },
                ]}
              />
              <p className="text-sm text-muted-foreground">
                {theme.preference === 'sistema'
                  ? `Sigue la configuración de tu dispositivo (ahora: ${theme.resolved === 'oscuro' ? 'oscuro' : 'claro'}).`
                  : 'Se guarda en este dispositivo.'}
              </p>
            </CardContent>
          </Card>
        </section>

        <Dialog>
          <DialogTrigger asChild>
            <button
              type="button"
              className="flex min-h-14 w-full items-center gap-3 rounded-2xl border border-card-border bg-card px-4 py-3 text-left text-sm shadow-soft transition-colors hover:bg-muted/60"
            >
              <span className="relative flex size-8 shrink-0 items-center justify-center text-primary" aria-hidden="true">
                <Smartphone className="size-7" />
                <Pointer className="absolute -right-1 -bottom-1 size-4 fill-card" />
              </span>
              Click aquí para conocer cómo guardar esta página como app
            </button>
          </DialogTrigger>
          <DialogContent className="gap-3 p-4">
            <DialogHeader className="pr-10">
              <DialogTitle>Úsala como app</DialogTitle>
              <DialogDescription>Guárdala en tu pantalla de inicio y se abrirá a pantalla completa.</DialogDescription>
            </DialogHeader>
            <div>
              <p className="text-sm font-semibold">iPhone (Safari)</p>
              <ol className="mt-1 list-decimal space-y-0.5 pl-5 text-sm text-muted-foreground">
                <li>Abre la página en Safari.</li>
                <li>Toca el botón Compartir (el cuadrito con la flecha hacia arriba).</li>
                <li>Elige «Agregar a pantalla de inicio» y luego «Agregar».</li>
              </ol>
            </div>
            <div>
              <p className="text-sm font-semibold">Android (Chrome)</p>
              <ol className="mt-1 list-decimal space-y-0.5 pl-5 text-sm text-muted-foreground">
                <li>Abre la página en Chrome.</li>
                <li>Toca el menú de los tres puntos (⋮) arriba a la derecha.</li>
                <li>Elige «Instalar app» o «Agregar a la pantalla principal» y confirma.</li>
              </ol>
            </div>
          </DialogContent>
        </Dialog>

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
