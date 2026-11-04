import type { ReactNode } from 'react'

export function SectionTitle({ children, action, large }: { children: ReactNode; action?: ReactNode; large?: boolean }) {
  return (
    <div className="flex items-center justify-between">
      <h2
        className={
          large ? 'text-xl font-bold tracking-tight' : 'text-[13px] font-semibold tracking-wide text-muted-foreground uppercase'
        }
      >
        {children}
      </h2>
      {action}
    </div>
  )
}
