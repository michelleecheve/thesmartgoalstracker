import type { ReactNode } from 'react'

export function SectionTitle({ children, action }: { children: ReactNode; action?: ReactNode }) {
  return (
    <div className="flex items-center justify-between">
      <h2 className="text-[13px] font-semibold tracking-wide text-muted-foreground uppercase">{children}</h2>
      {action}
    </div>
  )
}
