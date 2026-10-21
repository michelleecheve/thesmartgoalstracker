import { Outlet } from 'react-router'
import { MobileFrame } from './MobileFrame'
import { BottomNav } from './BottomNav'

/** Layout de las secciones principales: contenido desplazable + navegación inferior fija. */
export function AppLayout() {
  return (
    <MobileFrame>
      <main className="flex flex-1 flex-col pb-[calc(var(--bottom-nav-height)+var(--safe-bottom)+1rem)]">
        <Outlet />
      </main>
      <BottomNav />
    </MobileFrame>
  )
}
