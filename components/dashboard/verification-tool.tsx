'use client'

import { useState } from 'react'
import { ShieldQuestion, Search, BadgeCheck, CircleCheck, Star } from 'lucide-react'
import { Button } from '@/components/ui/button'

export function VerificationTool() {
  const [query, setQuery] = useState('')
  const [result, setResult] = useState(false)

  function consultar(e: React.FormEvent) {
    e.preventDefault()
    if (!query.trim()) return
    setResult(true)
  }

  return (
    <div className="rounded-2xl border border-primary/20 bg-primary/5 p-5 shadow-sm">
      <div className="flex items-center gap-2">
        <span className="flex size-9 items-center justify-center rounded-xl bg-primary text-primary-foreground">
          <ShieldQuestion className="size-5" />
        </span>
        <div>
          <h3 className="font-display text-base font-bold text-foreground">
            Herramienta de Verificación
          </h3>
          <p className="text-xs text-muted-foreground">Historial de Buen Inquilino</p>
        </div>
      </div>

      <form onSubmit={consultar} className="mt-4 flex flex-col gap-2 sm:flex-row">
        <input
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value)
            setResult(false)
          }}
          placeholder="Ingresa CURP o Nombre del Prospecto"
          aria-label="CURP o Nombre del Prospecto"
          className="h-11 flex-1 rounded-xl border border-input bg-background px-4 text-sm text-foreground outline-none ring-ring/40 placeholder:text-muted-foreground focus-visible:ring-2"
        />
        <Button type="submit" size="lg" className="gap-1.5">
          <Search className="size-4" />
          Consultar Historial
        </Button>
      </form>

      <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
        Verifica puntualidad de pagos anteriores y referencias confirmadas de otros arrendadores.
      </p>

      {result && (
        <div className="mt-4 rounded-xl border border-accent/30 bg-card p-4">
          <div className="flex items-center gap-2">
            <BadgeCheck className="size-5 text-accent" />
            <p className="text-sm font-semibold text-foreground">
              Inquilino con buen historial confirmado
            </p>
          </div>
          <ul className="mt-3 space-y-2 text-sm text-foreground/90">
            <li className="flex items-center gap-2">
              <CircleCheck className="size-4 shrink-0 text-accent" />
              12 de 12 pagos puntuales en contratos anteriores
            </li>
            <li className="flex items-center gap-2">
              <CircleCheck className="size-4 shrink-0 text-accent" />2 referencias confirmadas por
              arrendadores verificados
            </li>
            <li className="flex items-center gap-2">
              <Star className="size-4 shrink-0 fill-accent text-accent" />
              Calificación promedio 4.8 / 5.0
            </li>
          </ul>
        </div>
      )}
    </div>
  )
}
