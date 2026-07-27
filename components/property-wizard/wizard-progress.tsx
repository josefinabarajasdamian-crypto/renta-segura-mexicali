import { Check } from 'lucide-react'
import { cn } from '@/lib/utils'
import { wizardSteps } from './types'

export function WizardProgress({ currentStep }: { currentStep: number }) {
  const total = wizardSteps.length
  const activeLabel = wizardSteps.find((s) => s.id === currentStep)?.label

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between text-xs font-medium text-muted-foreground">
        <span>
          Paso {currentStep} de {total}
        </span>
        <span className="text-foreground">{activeLabel}</span>
      </div>

      <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
        <div
          className="h-full rounded-full bg-primary transition-all duration-300"
          style={{ width: `${(currentStep / total) * 100}%` }}
        />
      </div>

      <ol className="hidden items-center gap-2 sm:flex">
        {wizardSteps.map((step, idx) => {
          const isActive = step.id === currentStep
          const isDone = step.id < currentStep
          return (
            <li key={step.id} className="flex flex-1 items-center gap-2">
              <div className="flex items-center gap-2">
                <span
                  className={cn(
                    'flex size-6 shrink-0 items-center justify-center rounded-full text-[0.7rem] font-bold transition-colors',
                    isDone && 'bg-primary text-primary-foreground',
                    isActive && !isDone && 'bg-primary text-primary-foreground',
                    !isActive && !isDone && 'bg-muted text-muted-foreground',
                  )}
                >
                  {isDone ? <Check className="size-3.5" /> : step.id}
                </span>
                <span
                  className={cn(
                    'text-xs font-medium',
                    isActive ? 'text-foreground' : 'text-muted-foreground',
                  )}
                >
                  {step.label}
                </span>
              </div>
              {idx < wizardSteps.length - 1 && <span className="h-px flex-1 bg-border" />}
            </li>
          )
        })}
      </ol>
    </div>
  )
}
