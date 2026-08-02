'use client'

import { useState } from 'react'
import { ShieldQuestion, Search, Star, Plus, Loader2, TriangleAlert } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { searchTenantReviews, submitTenantReview, type TenantReview } from '@/lib/tenant-reviews'

const inputClass =
  'h-11 flex-1 rounded-xl border border-input bg-background px-4 text-sm text-foreground outline-none ring-ring/40 placeholder:text-muted-foreground focus-visible:ring-2'

function Stars({ value }: { value: number }) {
  return (
    <span className="inline-flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((n) => (
        <Star
          key={n}
          className={cn('size-3.5', n <= value ? 'fill-accent text-accent' : 'text-muted-foreground/40')}
        />
      ))}
    </span>
  )
}

function RateTenantForm({
  onClose,
  onSubmitted,
}: {
  onClose: () => void
  onSubmitted: () => void
}) {
  const [tenantIdentifier, setTenantIdentifier] = useState('')
  const [rating, setRating] = useState(5)
  const [comment, setComment] = useState('')
  const [contractEnded, setContractEnded] = useState(true)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!tenantIdentifier.trim()) return
    setBusy(true)
    setError(null)
    try {
      await submitTenantReview({ tenantIdentifier, rating, comment, contractEnded })
      onSubmitted()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo guardar la calificación')
    } finally {
      setBusy(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="mt-4 flex flex-col gap-3 rounded-xl border border-border bg-card p-4">
      <div className="flex flex-col gap-1">
        <label className="text-xs font-medium text-muted-foreground">CURP o nombre del inquilino</label>
        <input
          type="text"
          value={tenantIdentifier}
          onChange={(e) => setTenantIdentifier(e.target.value)}
          placeholder="Ej. Juan Pérez López"
          className={inputClass}
          required
        />
      </div>

      <div className="flex flex-col gap-1">
        <label className="text-xs font-medium text-muted-foreground">Calificación</label>
        <div className="flex items-center gap-1">
          {[1, 2, 3, 4, 5].map((n) => (
            <button
              key={n}
              type="button"
              onClick={() => setRating(n)}
              aria-label={`${n} estrellas`}
              className="p-0.5"
            >
              <Star className={cn('size-6', n <= rating ? 'fill-accent text-accent' : 'text-muted-foreground/40')} />
            </button>
          ))}
        </div>
      </div>

      <div className="flex flex-col gap-1">
        <label className="text-xs font-medium text-muted-foreground">Comentario (opcional)</label>
        <textarea
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          rows={3}
          placeholder="Puntualidad, cuidado del inmueble, etc."
          className="w-full resize-none rounded-xl border border-input bg-background px-4 py-2.5 text-sm text-foreground outline-none ring-ring/40 placeholder:text-muted-foreground focus-visible:ring-2"
        />
      </div>

      <label className="flex items-center gap-2 text-xs text-muted-foreground">
        <input
          type="checkbox"
          checked={contractEnded}
          onChange={(e) => setContractEnded(e.target.checked)}
          className="size-4 rounded border-input"
        />
        Confirmo que el arrendamiento con este inquilino ya terminó
      </label>

      {error && (
        <p className="flex items-center gap-1.5 text-xs text-destructive">
          <TriangleAlert className="size-3.5" />
          {error}
        </p>
      )}

      <div className="flex gap-2 pt-1">
        <Button type="submit" size="sm" className="gap-1.5" disabled={busy || !contractEnded}>
          {busy ? <Loader2 className="size-3.5 animate-spin" /> : null}
          Guardar calificación
        </Button>
        <Button type="button" variant="outline" size="sm" onClick={onClose} disabled={busy}>
          Cancelar
        </Button>
      </div>
      {!contractEnded && (
        <p className="text-[0.7rem] text-muted-foreground">
          Solo se pueden registrar calificaciones de arrendamientos que ya terminaron.
        </p>
      )}
    </form>
  )
}

export function VerificationTool() {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<TenantReview[] | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showRateForm, setShowRateForm] = useState(false)

  async function consultar(e: React.FormEvent) {
    e.preventDefault()
    if (!query.trim()) return
    setLoading(true)
    setError(null)
    try {
      const data = await searchTenantReviews(query)
      setResults(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo consultar el historial')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="rounded-2xl border border-primary/20 bg-primary/5 p-5 shadow-sm">
      <div className="flex items-center justify-between gap-2">
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
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="gap-1.5"
          onClick={() => setShowRateForm((v) => !v)}
        >
          <Plus className="size-3.5" />
          Calificar inquilino
        </Button>
      </div>

      <p className="mt-3 text-xs leading-relaxed text-muted-foreground">
        Consulta calificaciones que otros propietarios hayan registrado para un inquilino, o
        registra la tuya después de que termine un arrendamiento. Esta información la declaran
        los propios propietarios — no está verificada contra un contrato ni un CURP oficial.
      </p>

      {showRateForm && (
        <RateTenantForm
          onClose={() => setShowRateForm(false)}
          onSubmitted={() => {
            setShowRateForm(false)
          }}
        />
      )}

      <form onSubmit={consultar} className="mt-4 flex flex-col gap-2 sm:flex-row">
        <input
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value)
            setResults(null)
          }}
          placeholder="Ingresa CURP o Nombre del Prospecto"
          aria-label="CURP o Nombre del Prospecto"
          className={inputClass}
        />
        <Button type="submit" size="lg" className="gap-1.5" disabled={loading}>
          {loading ? <Loader2 className="size-4 animate-spin" /> : <Search className="size-4" />}
          Consultar Historial
        </Button>
      </form>

      {error && (
        <p className="mt-3 flex items-center gap-1.5 text-xs text-destructive">
          <TriangleAlert className="size-3.5" />
          {error}
        </p>
      )}

      {results && results.length === 0 && !error && (
        <div className="mt-4 rounded-xl border border-dashed border-border bg-card p-4 text-center text-sm text-muted-foreground">
          No hay calificaciones registradas para "{query}" todavía.
        </div>
      )}

      {results && results.length > 0 && (
        <div className="mt-4 flex flex-col gap-2">
          {results.map((review) => (
            <div key={review.id} className="rounded-xl border border-accent/30 bg-card p-4">
              <div className="flex items-center justify-between gap-2">
                <Stars value={review.rating} />
                <span className="text-[0.7rem] text-muted-foreground">
                  {new Date(review.createdAt).toLocaleDateString('es-MX')}
                </span>
              </div>
              {review.comment && (
                <p className="mt-2 text-sm text-foreground/90">{review.comment}</p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
