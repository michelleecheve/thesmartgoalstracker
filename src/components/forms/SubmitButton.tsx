import type { ComponentProps } from 'react'
import { Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface SubmitButtonProps extends ComponentProps<typeof Button> {
  loading?: boolean
  loadingText?: string
}

export function SubmitButton({ loading, loadingText, children, disabled, ...props }: SubmitButtonProps) {
  return (
    <Button type="submit" size="lg" className="w-full" disabled={disabled || loading} aria-busy={loading} {...props}>
      {loading ? (
        <>
          <Loader2 className="size-[18px] animate-spin" />
          {loadingText ?? children}
        </>
      ) : (
        children
      )}
    </Button>
  )
}
