import { Outlet } from 'react-router'
import { MobileFrame } from './MobileFrame'

/** Layout sin navegación inferior: autenticación, bienvenida y formularios a pantalla completa. */
export function FullScreenLayout() {
  return (
    <MobileFrame>
      <main className="flex flex-1 flex-col px-5 pt-[calc(var(--safe-top)+1.5rem)] pb-[calc(var(--safe-bottom)+1.5rem)]">
        <Outlet />
      </main>
    </MobileFrame>
  )
}
