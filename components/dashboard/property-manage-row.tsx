'use client'

import { useState } from 'react'
import { Link2, Pencil, Receipt, Check, ChevronDown } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import type { Property } from '@/lib/data'

type Status = 'Disponible' | 'En Trato' | 'Rentado'

const statusStyles: Record<Status, string> = {
  Disponible: 'bg-accent/15 text-accent',
  'En Trato': 'bg-amber-500/15 text-amber-600 dark:text-amber-400',
  Rentado: 'bg-muted text-muted-foreground',
}

const statuses: Status[] = ['Disponible', 'En Trato', 'Rentado']

export function PropertyManageRow({
  property,
  initialStatus,
}: {
  property: Property
  initialStatus: Status
}) {
  const [status, setStatus] = useState<Status>(initialStatus)
  const [open, setOpen] = useState(false)
  const [copied, setCopied] = useState(false)

  function copyLink() {
    const url = `https://rentasegura.mx/propiedad/${property.id}`
    navigator.clipboard?.writeText(url).catch(() => {})
    setCopied(true)
    setTimeout(() => setCopied(false), 1800)
  }

  return (
    <div className="flex flex-col gap-4 rounded-2xl border border-border bg-card p-4 shadow-sm sm:flex-row sm:items-center">
      <img
        src={property.image || '/placeholder.svg'}
        alt={property.title}
        className="h-24 w-full rounded-xl object-cover sm:size-16"
      />

      <div className="min-w-0 flex-1">
        <p className="text-pretty text-sm font-semibold leading-snug text-foreground">
          {property.title}
        </p>
        <p className="mt-0.5 text-sm font-bold text-primary">
          {'$'}
          {property.price.toLocaleString('es-MX')} MXN
          <span className="font-normal text-muted-foreground"> / mes</span>
        </p>
      </div>

      <div className="relative">
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-haspopup="listbox"
          aria-expanded={open}
          className={cn(
            'inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold transition-opacity hover:opacity-80',
            statusStyles[status],
          )}
        >
          <span className="size-1.5 rounded-full bg-current" />
          {status}
          <ChevronDown className="size-3.5" />
        </button>
        {open && (
          <>
            <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} aria-hidden="true" />
            <ul
              role="listbox"
              className="absolute right-0 z-20 mt-1 w-40 overflow-hidden rounded-xl border border-border bg-popover p-1 shadow-lg"
            >
              {statuses.map((s) => (
                <li key={s}>
                  <button
                    type="button"
                    role="option"
                    aria-selected={s === status}
                    onClick={() => {
                      setStatus(s)
                      setOpen(false)
                    }}
                    className="flex w-full items-center justify-between rounded-lg px-2.5 py-2 text-left text-sm hover:bg-muted"
                  >
                    {s}
                    {s === status && <Check className="size-4 text-primary" />}
                  </button>
                </li>
              ))}
            </ul>
          </>
        )}
      </div>

      <div className="flex flex-wrap gap-2 sm:justify-end">
        <Button variant="outline" size="sm" className="gap-1.5" onClick={copyLink}>
          {copied ? <Check className="size-3.5 text-accent" /> : <Link2 className="size-3.5" />}
          {copied ? 'Copiado' : 'Copiar Enlace'}
        </Button>
        <Button variant="outline" size="sm" className="gap-1.5">
          <Pencil className="size-3.5" />
          Editar
        </Button>
        <Button variant="ghost" size="sm" className="gap-1.5">
          <Receipt className="size-3.5" />
          Ver Recibos
        </Button>
      </div>
    </div>
  )
}
