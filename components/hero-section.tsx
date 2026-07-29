'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Search, MapPin, Wallet, BadgeCheck } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { budgetOptions, zoneOptions } from '@/lib/search-filters'

export function HeroSection() {
  const router = useRouter()

  const [query, setQuery] = useState('')
  const [zone, setZone] = useState(zoneOptions[0])
  const [budget, setBudget] = useState(budgetOptions[0].label)

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const params = new URLSearchParams()
    if (query.trim()) params.set('q', query.trim())
    if (zone !== zoneOptions[0]) params.set('zone', zone)
    if (budget !== budgetOptions[0].label) params.set('budget', budget)

    const search = params.toString()
    router.push(`/${search ? `?${search}` : ''}#directorio`, { scroll: false })
    requestAnimationFrame(() => {
      document.getElementById('directorio')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    })
  }

  return (
    <section className="relative overflow-hidden bg-secondary/50">
      <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6 sm:py-20">
        <div className="mx-auto max-w-3xl text-center">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-background px-3 py-1 text-xs font-medium text-muted-foreground shadow-sm">
            <BadgeCheck className="size-3.5 text-accent" />
            Propiedades verificadas en Mexicali
          </span>
          <h1 className="mt-5 text-balance font-display text-4xl font-extrabold leading-tight tracking-tight text-foreground sm:text-5xl">
            Encuentra tu renta ideal en Mexicali sin estrés ni sorpresas.
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-pretty text-base leading-relaxed text-muted-foreground sm:text-lg">
            Propiedades verificadas y trato directo. Dile adiós a los anuncios falsos.
          </p>
        </div>

        <form
          className="mx-auto mt-8 max-w-3xl rounded-2xl border border-border bg-card p-3 shadow-lg shadow-primary/5"
          onSubmit={handleSubmit}
        >
          <label className="flex items-center gap-2 rounded-xl px-3 py-2 transition-colors hover:bg-muted/60">
            <Search className="size-5 shrink-0 text-primary" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Recámaras, colonia, amenidades... (ej. '2 recámaras UABC')"
              className="w-full bg-transparent text-sm font-medium text-foreground outline-none placeholder:font-normal placeholder:text-muted-foreground"
            />
          </label>

          <div className="mt-1 flex flex-col gap-2 border-t border-border pt-2 sm:flex-row sm:items-center">
            <label className="flex flex-1 items-center gap-2 rounded-xl px-3 py-2 transition-colors hover:bg-muted/60">
              <MapPin className="size-5 shrink-0 text-primary" />
              <span className="flex flex-1 flex-col text-left">
                <span className="text-[0.7rem] font-semibold uppercase tracking-wide text-muted-foreground">
                  Zona
                </span>
                <select
                  value={zone}
                  onChange={(e) => setZone(e.target.value)}
                  className="w-full cursor-pointer bg-transparent text-sm font-medium text-foreground outline-none"
                >
                  {zoneOptions.map((z) => (
                    <option key={z}>{z}</option>
                  ))}
                </select>
              </span>
            </label>

            <span className="hidden h-8 w-px bg-border sm:block" aria-hidden />

            <label className="flex flex-1 items-center gap-2 rounded-xl px-3 py-2 transition-colors hover:bg-muted/60">
              <Wallet className="size-5 shrink-0 text-primary" />
              <span className="flex flex-1 flex-col text-left">
                <span className="text-[0.7rem] font-semibold uppercase tracking-wide text-muted-foreground">
                  Presupuesto máximo
                </span>
                <select
                  value={budget}
                  onChange={(e) => setBudget(e.target.value)}
                  className="w-full cursor-pointer bg-transparent text-sm font-medium text-foreground outline-none"
                >
                  {budgetOptions.map((b) => (
                    <option key={b.label}>{b.label}</option>
                  ))}
                </select>
              </span>
            </label>

            <Button type="submit" size="lg" className="h-12 gap-2 px-6 text-base sm:h-14">
              <Search className="size-5" />
              Buscar
            </Button>
          </div>
        </form>

        <div className="mx-auto mt-6 flex max-w-3xl flex-wrap items-center justify-center gap-x-6 gap-y-2 text-xs text-muted-foreground">
          <span className="inline-flex items-center gap-1.5">
            <BadgeCheck className="size-4 text-accent" /> +240 dueños verificados
          </span>
          <span className="inline-flex items-center gap-1.5">
            <BadgeCheck className="size-4 text-accent" /> Sin comisiones ocultas
          </span>
          <span className="inline-flex items-center gap-1.5">
            <BadgeCheck className="size-4 text-accent" /> Contacto directo por WhatsApp
          </span>
        </div>
      </div>
    </section>
  )
}
