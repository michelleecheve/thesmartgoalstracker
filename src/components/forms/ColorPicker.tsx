import { Check } from 'lucide-react'
import { accentColors, accentVar } from '@/domain/labels'
import { cn } from '@/lib/utils'

interface ColorPickerProps {
  value: string | null
  onChange: (value: string) => void
  label: string
}

export function ColorPicker({ value, onChange, label }: ColorPickerProps) {
  return (
    <div role="radiogroup" aria-label={label} className="flex flex-wrap gap-1">
      {accentColors.map((color) => {
        const selected = value === color.value
        return (
          <button
            key={color.value}
            type="button"
            role="radio"
            aria-checked={selected}
            aria-label={color.label}
            onClick={() => onChange(color.value)}
            className="flex size-11 items-center justify-center rounded-full outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50"
          >
            <span
              className={cn(
                'flex size-8 items-center justify-center rounded-full text-white transition-transform duration-200',
                selected && 'scale-110 ring-2 ring-foreground/20 ring-offset-2 ring-offset-card',
              )}
              style={{ backgroundColor: accentVar(color.value) }}
            >
              {selected && <Check className="size-4 animate-pop" strokeWidth={3} />}
            </span>
          </button>
        )
      })}
    </div>
  )
}
