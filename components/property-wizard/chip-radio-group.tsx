import { cn } from '@/lib/utils'

export function ChipRadioGroup({
  value,
  onChange,
  options,
  name,
}: {
  value: string
  onChange: (value: string) => void
  options: string[]
  name: string
}) {
  return (
    <div role="radiogroup" aria-label={name} className="flex flex-wrap gap-2">
      {options.map((option) => {
        const isActive = value === option
        return (
          <button
            key={option}
            type="button"
            role="radio"
            aria-checked={isActive}
            onClick={() => onChange(option)}
            className={cn(
              'rounded-full border px-3.5 py-2 text-sm font-medium transition-colors',
              isActive
                ? 'border-primary bg-primary text-primary-foreground shadow-sm'
                : 'border-border bg-background text-foreground hover:bg-muted',
            )}
          >
            {option}
          </button>
        )
      })}
    </div>
  )
}
