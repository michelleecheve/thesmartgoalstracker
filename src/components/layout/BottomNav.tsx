import { NavLink } from 'react-router'
import { BarChart3, CalendarCheck, Sparkles, Target, type LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'
import { routes } from '@/app/routes'

interface NavItem {
  to: string
  label: string
  icon: LucideIcon
}

const items: NavItem[] = [
  { to: routes.inicio, label: 'Inicio', icon: CalendarCheck },
  { to: routes.metas, label: 'Mis metas', icon: Target },
  { to: routes.estadisticas, label: 'Estadísticas', icon: BarChart3 },
  { to: routes.vision, label: 'Visión', icon: Sparkles },
]

export function BottomNav() {
  return (
    <nav
      aria-label="Navegación principal"
      className="fixed inset-x-0 bottom-0 z-40 mx-auto w-full max-w-(--app-max-width) border-t border-border/70 bg-background/85 pb-(--safe-bottom) backdrop-blur-xl"
    >
      <ul className="grid h-(--bottom-nav-height) grid-cols-4 px-2">
        {items.map(({ to, label, icon: Icon }) => (
          <li key={to} className="flex">
            <NavLink
              to={to}
              aria-label={label === 'Visión' ? 'Tablero de visión' : label}
              className={({ isActive }) =>
                cn(
                  'group flex min-h-11 flex-1 flex-col items-center justify-center gap-1 rounded-xl text-[11px] font-medium transition-colors duration-200',
                  isActive ? 'text-primary' : 'text-muted-foreground hover:text-foreground',
                )
              }
            >
              {({ isActive }) => (
                <>
                  <span className="flex h-7 w-12 items-center justify-center rounded-full transition-all duration-300">
                    <Icon className="size-[20px]" strokeWidth={isActive ? 2.25 : 1.75} />
                  </span>
                  <span>{label}</span>
                </>
              )}
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  )
}
