import { Outlet } from 'react-router'
import { MobileFrame } from './MobileFrame'

/**
 * Formularios a pantalla completa (crear/editar metas y hábitos):
 * sin navegación inferior; cada pantalla maneja su encabezado y sus acciones fijas.
 */
export function FocusLayout() {
  return (
    <MobileFrame>
      <main className="flex flex-1 flex-col px-5">
        <Outlet />
      </main>
    </MobileFrame>
  )
}
