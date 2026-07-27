import { Wallet, MapPin, Users, Sparkles, Send } from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { Demand } from '@/lib/mockStorage'

function initials(name: string) {
  return name
    .split(' ')
    .map((w) => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()
}

export function ProspectCard({ demand, match }: { demand: Demand; match: string }) {
  return (
    <article className="flex flex-col gap-3 rounded-2xl border border-border bg-card p-4 shadow-sm">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-3">
          <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary">
            {initials(demand.name)}
          </span>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-foreground">{demand.name}</p>
            <p className="text-xs text-muted-foreground">{demand.postedAt}</p>
          </div>
        </div>
        <span className="inline-flex items-center gap-1 rounded-full bg-accent/12 px-2 py-1 text-[0.7rem] font-semibold text-accent">
          <Sparkles className="size-3" />
          {match}
        </span>
      </div>

      <p className="text-pretty text-sm leading-relaxed text-foreground/90">{demand.message}</p>

      <div className="flex flex-wrap gap-1.5">
        <span className="inline-flex items-center gap-1 rounded-full bg-accent/10 px-2.5 py-0.5 text-[0.7rem] font-medium text-accent">
          <Wallet className="size-3" />
          {demand.budget}
        </span>
        <span className="inline-flex items-center gap-1 rounded-full bg-primary/5 px-2.5 py-0.5 text-[0.7rem] font-medium text-primary">
          <MapPin className="size-3" />
          {demand.zone}
        </span>
        <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2.5 py-0.5 text-[0.7rem] font-medium text-muted-foreground">
          <Users className="size-3" />
          {demand.tenants} inquilinos
        </span>
      </div>

      <Button size="sm" className="mt-1 w-full gap-1.5">
        <Send className="size-3.5" />
        Postular mi propiedad a este prospecto
      </Button>
    </article>
  )
}
