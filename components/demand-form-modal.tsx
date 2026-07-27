'use client'

import { useState, type FormEvent } from 'react'
import { X, Send, Loader2, TriangleAlert } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { mexicaliZones } from '@/lib/data'
import { saveDemand } from '@/lib/store'

export function DemandFormModal({
  onClose,
  onPublished,
}: {
  onClose: () => void
  onPublished: () => void
}) {
  const [name, setName] = useState('')
  const [message, setMessage] = useState('')
  const [budget, setBudget] = useState('')
  const [zone, setZone] = useState('')
  const [tenants, setTenants] = useState('1')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!message.trim() || !budget.trim() || !zone.trim()) return

    setSubmitting(true)
    setError(null)
    try {
      await saveDemand({
        name: name.trim() || 'Usuario Anónimo',
        anonymous: !name.trim(),
        message: message.trim(),
        budget: budget.trim(),
        zone: zone.trim(),
        tenants: tenants.trim() || '1',
      })
      onPublished()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo publicar tu solicitud.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center">
      <div
        className="absolute inset-0 bg-foreground/50 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />
      <div className="relative max-h-[90vh] w-full max-w-md overflow-y-auto rounded-t-3xl border border-border bg-card p-6 shadow-xl sm:rounded-3xl">
        <button
          type="button"
          onClick={onClose}
          aria-label="Cerrar"
          className="absolute right-4 top-4 flex size-8 items-center justify-center rounded-full text-muted-foreground hover:bg-muted hover:text-foreground"
        >
          <X className="size-4" />
        </button>

        <h2 className="font-display text-xl font-extrabold text-foreground">
          Publica lo que buscas
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Los propietarios de Renta Segura verán tu solicitud en el Muro de Demandas.
        </p>

        <form onSubmit={handleSubmit} className="mt-5 flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-semibold text-foreground">
              Tu nombre <span className="font-normal text-muted-foreground">(opcional)</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Déjalo en blanco para publicar anónimo"
              className="h-11 w-full rounded-xl border border-input bg-background px-4 text-sm text-foreground outline-none ring-ring/40 placeholder:text-muted-foreground focus-visible:ring-2"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-semibold text-foreground">¿Qué estás buscando?</label>
            <textarea
              required
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Ej. Busco depa de 2 recámaras, tranquilo, con comprobante de ingresos..."
              rows={3}
              className="w-full resize-none rounded-xl border border-input bg-background px-4 py-2.5 text-sm text-foreground outline-none ring-ring/40 placeholder:text-muted-foreground focus-visible:ring-2"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-semibold text-foreground">Presupuesto máximo</label>
              <input
                required
                type="text"
                value={budget}
                onChange={(e) => setBudget(e.target.value)}
                placeholder="$6,000"
                className="h-11 w-full rounded-xl border border-input bg-background px-4 text-sm text-foreground outline-none ring-ring/40 placeholder:text-muted-foreground focus-visible:ring-2"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-semibold text-foreground">Inquilinos</label>
              <input
                type="number"
                min={1}
                max={10}
                value={tenants}
                onChange={(e) => setTenants(e.target.value)}
                className="h-11 w-full rounded-xl border border-input bg-background px-4 text-sm text-foreground outline-none ring-ring/40 focus-visible:ring-2"
              />
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-semibold text-foreground">Zona de interés</label>
            <input
              required
              type="text"
              list="mexicali-zonas-demanda"
              value={zone}
              onChange={(e) => setZone(e.target.value)}
              placeholder="Ej. UABC Central, Palaco, Prohogar..."
              className="h-11 w-full rounded-xl border border-input bg-background px-4 text-sm text-foreground outline-none ring-ring/40 placeholder:text-muted-foreground focus-visible:ring-2"
            />
            <datalist id="mexicali-zonas-demanda">
              {mexicaliZones.map((z) => (
                <option key={z} value={z} />
              ))}
            </datalist>
          </div>

          {error && (
            <div className="flex items-start gap-2 rounded-xl border border-destructive/30 bg-destructive/10 px-3.5 py-2.5 text-destructive">
              <TriangleAlert className="mt-0.5 size-4 shrink-0" />
              <p className="text-xs font-medium leading-relaxed">{error}</p>
            </div>
          )}

          <Button type="submit" size="lg" className="mt-1 w-full gap-1.5" disabled={submitting}>
            {submitting ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Send className="size-4" />
            )}
            {submitting ? 'Publicando...' : 'Publicar en el Muro'}
          </Button>
        </form>
      </div>
    </div>
  )
}
