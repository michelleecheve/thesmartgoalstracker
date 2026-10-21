import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

export function PageContent({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn('flex flex-1 flex-col gap-5 px-5 pt-2 animate-fade-up', className)}>{children}</div>
}
