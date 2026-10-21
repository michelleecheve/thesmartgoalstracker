import { Link } from 'react-router'
import { Repeat, Sparkles, Target } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { routes } from '@/app/routes'

const steps = [
  { icon: Target, title: 'Define una meta SMART', text: 'Clara, medible y con fecha límite.' },
  { icon: Repeat, title: 'Crea hábitos pequeños', text: 'Acciones recurrentes que te acercan a ella.' },
  { icon: Sparkles, title: 'Mantén la motivación', text: 'Mira tu progreso y tu tablero de visión.' },
]

export function BienvenidaPage() {
  return (
    <div className="flex flex-1 flex-col animate-fade-up">
      <div className="flex flex-1 flex-col justify-center">
        <h1 className="text-[32px] leading-tight font-bold tracking-tight">
          Las grandes metas se logran con pequeñas acciones
        </h1>
        <p className="mt-3 text-muted-foreground">
          Te ayudamos a convertir lo que quieres lograr en hábitos sencillos que puedes cumplir cada día.
        </p>
        <ul className="mt-8 flex flex-col gap-4">
          {steps.map(({ icon: Icon, title, text }) => (
            <li key={title} className="flex items-start gap-4">
              <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-accent text-accent-foreground">
                <Icon className="size-5" />
              </span>
              <div>
                <p className="font-semibold">{title}</p>
                <p className="text-sm text-muted-foreground">{text}</p>
              </div>
            </li>
          ))}
        </ul>
      </div>
      <Button asChild size="lg" className="mt-8 w-full">
        <Link to={routes.nuevaMeta}>Crear mi primera meta</Link>
      </Button>
    </div>
  )
}
