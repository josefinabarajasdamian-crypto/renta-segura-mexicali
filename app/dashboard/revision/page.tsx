'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import {
  ArrowLeft,
  BadgeCheck,
  Check,
  CheckCheck,
  Clock,
  ExternalLink,
  History,
  Loader2,
  MapPin,
  Pencil,
  PlayCircle,
  RotateCcw,
  ScanLine,
  Trash2,
  TriangleAlert,
  Users2,
  X,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Toast, useToast } from '@/components/ui/toast'
import {
  usePendingReview,
  useImportBatches,
  approveProperty,
  deleteProperty,
  approveDemand,
  deleteDemand,
  formatRelativeTime,
  type Property,
  type Demand,
} from '@/lib/store'
import { cn } from '@/lib/utils'

function SourceBadge({ source }: { source?: string }) {
  if (source !== 'apify_facebook') return null
  return (
    <span className="inline-flex w-fit items-center gap-1.5 rounded-full bg-primary/10 px-2.5 py-1 text-xs font-semibold text-primary">
      <ScanLine className="size-3.5" />
      Importado de Facebook
    </span>
  )
}

function ImportMeta({
  sourceGroup,
  postedAt,
  importedAt,
  sourceUrl,
}: {
  sourceGroup?: string
  postedAt?: string
  importedAt?: string
  sourceUrl?: string
}) {
  if (!sourceGroup && !postedAt && !importedAt && !sourceUrl) return null
  return (
    <p className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
      {sourceGroup && (
        <span className="inline-flex items-center gap-1">
          <Users2 className="size-3.5" />
          {sourceGroup}
        </span>
      )}
      {postedAt && (
        <span className="inline-flex items-center gap-1">
          <Clock className="size-3.5" />
          Publicado {formatRelativeTime(postedAt)}
        </span>
      )}
      {importedAt && (
        <span className="inline-flex items-center gap-1">
          <ScanLine className="size-3.5" />
          Importado {formatRelativeTime(importedAt)}
        </span>
      )}
      {sourceUrl && (
        <a
          href={sourceUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 font-medium text-primary hover:underline"
        >
          <ExternalLink className="size-3.5" />
          Ver original
        </a>
      )}
    </p>
  )
}

const inputClass =
  'h-9 w-full rounded-lg border border-input bg-background px-2.5 text-sm text-foreground outline-none ring-ring/40 placeholder:text-muted-foreground focus-visible:ring-2'

function PendingPropertyCard({
  property,
  onApprove,
  onReject,
}: {
  property: Property
  onApprove: (id: string, overrides: { title: string; price: number | null; zone: string }) => void
  onReject: (id: string) => void
}) {
  const [busy, setBusy] = useState<'approve' | 'reject' | null>(null)
  const [editing, setEditing] = useState(false)
  const [title, setTitle] = useState(property.title)
  const [price, setPrice] = useState(property.price != null ? String(property.price) : '')
  const [zone, setZone] = useState(property.zone)

  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-border bg-card p-4 shadow-sm sm:flex-row">
      <img
        src={property.images[0] || '/placeholder.svg'}
        alt={property.title}
        className="h-40 w-full shrink-0 rounded-xl object-cover sm:h-auto sm:w-48"
      />
      <div className="flex flex-1 flex-col gap-2">
        <div className="flex items-start justify-between gap-2">
          <SourceBadge source={property.source} />
          <button
            type="button"
            onClick={() => setEditing((v) => !v)}
            className="inline-flex shrink-0 items-center gap-1 rounded-full border border-border px-2.5 py-1 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            <Pencil className="size-3.5" />
            {editing ? 'Listo' : 'Editar'}
          </button>
        </div>

        {editing ? (
          <div className="flex flex-col gap-2">
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-muted-foreground">Título</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className={inputClass}
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="flex flex-col gap-1">
                <label className="text-xs font-medium text-muted-foreground">Precio (MXN)</label>
                <input
                  type="number"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  placeholder="Sin precio"
                  className={inputClass}
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs font-medium text-muted-foreground">Zona</label>
                <input
                  type="text"
                  value={zone}
                  onChange={(e) => setZone(e.target.value)}
                  className={inputClass}
                />
              </div>
            </div>
          </div>
        ) : (
          <>
            <p className="font-display text-lg font-extrabold text-foreground">
              {price ? `$${Number(price).toLocaleString('es-MX')} MXN / mes` : 'Sin precio detectado'}
            </p>
            <h3 className="text-sm font-semibold text-foreground">{title}</h3>
            <p className="inline-flex items-center gap-1 text-xs text-muted-foreground">
              <MapPin className="size-3.5" />
              {zone || 'Zona no detectada'}
            </p>
          </>
        )}

        {property.whatsapp && (
          <p className="text-xs text-muted-foreground">WhatsApp: {property.whatsapp}</p>
        )}
        <ImportMeta
          sourceGroup={property.sourceGroup}
          postedAt={property.postedAt}
          importedAt={property.createdAt}
          sourceUrl={property.sourceUrl}
        />
        {property.description && (
          <p className="rounded-lg bg-muted/50 p-2.5 text-xs leading-relaxed text-foreground/80">
            {property.description}
          </p>
        )}
        <div className="mt-1 flex gap-2">
          <Button
            size="sm"
            className="gap-1.5"
            disabled={busy !== null}
            onClick={async () => {
              setBusy('approve')
              const trimmedPrice = price.trim()
              await onApprove(property.id, {
                title: title.trim() || property.title,
                price: trimmedPrice ? Number(trimmedPrice) : null,
                zone: zone.trim(),
              })
            }}
          >
            {busy === 'approve' ? (
              <Loader2 className="size-3.5 animate-spin" />
            ) : (
              <Check className="size-3.5" />
            )}
            Publicar
          </Button>
          <Button
            variant="destructive"
            size="sm"
            className="gap-1.5"
            disabled={busy !== null}
            onClick={async () => {
              setBusy('reject')
              await onReject(property.id)
            }}
          >
            {busy === 'reject' ? (
              <Loader2 className="size-3.5 animate-spin" />
            ) : (
              <Trash2 className="size-3.5" />
            )}
            Descartar
          </Button>
        </div>
      </div>
    </div>
  )
}

function PendingDemandCard({
  demand,
  onApprove,
  onReject,
}: {
  demand: Demand
  onApprove: (id: string) => void
  onReject: (id: string) => void
}) {
  const [busy, setBusy] = useState<'approve' | 'reject' | null>(null)

  return (
    <div className="flex flex-col gap-2 rounded-2xl border border-border bg-card p-4 shadow-sm">
      <SourceBadge source={demand.source} />
      <p className="text-sm font-semibold text-foreground">{demand.name}</p>
      <p className="rounded-lg bg-muted/50 p-2.5 text-xs leading-relaxed text-foreground/80">
        {demand.message}
      </p>
      <p className="text-xs text-muted-foreground">
        Presupuesto: {demand.budget ? `$${demand.budget}` : 'No especificado'} · Zona:{' '}
        {demand.zone || 'No detectada'}
      </p>
      <ImportMeta
        sourceGroup={demand.sourceGroup}
        postedAt={demand.postedAt}
        importedAt={demand.createdAt}
        sourceUrl={demand.sourceUrl}
      />
      <div className="mt-1 flex gap-2">
        <Button
          size="sm"
          className="gap-1.5"
          disabled={busy !== null}
          onClick={async () => {
            setBusy('approve')
            await onApprove(demand.id)
          }}
        >
          {busy === 'approve' ? (
            <Loader2 className="size-3.5 animate-spin" />
          ) : (
            <Check className="size-3.5" />
          )}
          Publicar
        </Button>
        <Button
          variant="destructive"
          size="sm"
          className="gap-1.5"
          disabled={busy !== null}
          onClick={async () => {
            setBusy('reject')
            await onReject(demand.id)
          }}
        >
          {busy === 'reject' ? (
            <Loader2 className="size-3.5 animate-spin" />
          ) : (
            <Trash2 className="size-3.5" />
          )}
          Descartar
        </Button>
      </div>
    </div>
  )
}

export default function RevisionPage() {
  const { properties: allProperties, demands: allDemands, loading, error } = usePendingReview()
  const importBatches = useImportBatches()
  const toast = useToast()
  const [bulkBusy, setBulkBusy] = useState<'properties' | 'demands' | null>(null)
  const [runningExtraction, setRunningExtraction] = useState(false)
  const [reprocessing, setReprocessing] = useState(false)
  const [fromDate, setFromDate] = useState('')
  const [toDate, setToDate] = useState('')
  const [selectedBatchId, setSelectedBatchId] = useState<string | null>(null)

  const batchCounts = useMemo(() => {
    const counts = new Map<string, number>()
    for (const p of allProperties) {
      if (p.importBatchId) counts.set(p.importBatchId, (counts.get(p.importBatchId) ?? 0) + 1)
    }
    for (const d of allDemands) {
      if (d.importBatchId) counts.set(d.importBatchId, (counts.get(d.importBatchId) ?? 0) + 1)
    }
    return counts
  }, [allProperties, allDemands])

  const batchesWithPending = useMemo(
    () => importBatches.filter((b) => (batchCounts.get(b.id) ?? 0) > 0),
    [importBatches, batchCounts],
  )

  const properties = useMemo(
    () =>
      selectedBatchId ? allProperties.filter((p) => p.importBatchId === selectedBatchId) : allProperties,
    [allProperties, selectedBatchId],
  )
  const demands = useMemo(
    () => (selectedBatchId ? allDemands.filter((d) => d.importBatchId === selectedBatchId) : allDemands),
    [allDemands, selectedBatchId],
  )

  async function handleRunExtraction() {
    setRunningExtraction(true)
    try {
      const res = await fetch('/api/apify/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ from: fromDate || undefined, to: toDate || undefined }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data?.error || 'No se pudo iniciar la extracción')
      toast.show(data.message || 'Extracción iniciada')
    } catch (err) {
      toast.show(err instanceof Error ? err.message : 'No se pudo iniciar la extracción')
    } finally {
      setRunningExtraction(false)
    }
  }

  async function handleReprocess() {
    setReprocessing(true)
    try {
      const res = await fetch('/api/apify/reprocess', { method: 'POST' })
      const data = await res.json()
      if (!res.ok) throw new Error(data?.error || 'No se pudo reprocesar la última extracción')
      toast.show(data.message || 'Extracción reprocesada')
    } catch (err) {
      toast.show(err instanceof Error ? err.message : 'No se pudo reprocesar la última extracción')
    } finally {
      setReprocessing(false)
    }
  }

  async function handleApproveProperty(
    id: string,
    overrides: { title: string; price: number | null; zone: string },
  ) {
    try {
      await approveProperty(id, overrides)
      toast.show('Propiedad publicada en el Directorio')
    } catch (err) {
      toast.show(err instanceof Error ? err.message : 'No se pudo publicar')
    }
  }

  async function handleRejectProperty(id: string) {
    try {
      await deleteProperty(id)
      toast.show('Propiedad descartada')
    } catch (err) {
      toast.show(err instanceof Error ? err.message : 'No se pudo descartar')
    }
  }

  async function handleApproveDemand(id: string) {
    try {
      await approveDemand(id)
      toast.show('Solicitud publicada en el Muro de Demandas')
    } catch (err) {
      toast.show(err instanceof Error ? err.message : 'No se pudo publicar')
    }
  }

  async function handleRejectDemand(id: string) {
    try {
      await deleteDemand(id)
      toast.show('Solicitud descartada')
    } catch (err) {
      toast.show(err instanceof Error ? err.message : 'No se pudo descartar')
    }
  }

  async function handleApproveAllProperties() {
    setBulkBusy('properties')
    const results = await Promise.allSettled(
      properties.map((p) =>
        approveProperty(p.id, { title: p.title, price: p.price, zone: p.zone }),
      ),
    )
    setBulkBusy(null)
    const failed = results.filter((r) => r.status === 'rejected').length
    toast.show(
      failed === 0
        ? `${results.length} propiedad(es) publicada(s)`
        : `${results.length - failed} publicada(s), ${failed} con error`,
    )
  }

  async function handleApproveAllDemands() {
    setBulkBusy('demands')
    const results = await Promise.allSettled(demands.map((d) => approveDemand(d.id)))
    setBulkBusy(null)
    const failed = results.filter((r) => r.status === 'rejected').length
    toast.show(
      failed === 0
        ? `${results.length} solicitud(es) publicada(s)`
        : `${results.length - failed} publicada(s), ${failed} con error`,
    )
  }

  const totalPending = properties.length + demands.length

  return (
    <div className="min-h-dvh bg-muted/40 pb-16">
      <header className="sticky top-0 z-30 border-b border-border bg-background/85 backdrop-blur-md">
        <div className="mx-auto flex max-w-4xl items-center gap-3 px-4 py-4 sm:px-6">
          <Link
            href="/dashboard"
            aria-label="Volver al panel"
            className="flex size-9 shrink-0 items-center justify-center rounded-full border border-border text-foreground transition-colors hover:bg-muted"
          >
            <ArrowLeft className="size-4" />
          </Link>
          <div className="min-w-0 flex-1">
            <h1 className="font-display text-lg font-extrabold tracking-tight text-foreground">
              Revisar publicaciones importadas
            </h1>
            <p className="text-xs text-muted-foreground">
              Aprueba o descarta lo que llega de Facebook antes de que aparezca en el sitio
              principal.
            </p>
          </div>
        </div>
        <div className="mx-auto flex max-w-4xl flex-wrap items-end gap-2 px-4 pb-4 sm:px-6">
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-muted-foreground">Desde (opcional)</label>
            <input
              type="date"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
              className={cn(inputClass, 'w-36')}
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-muted-foreground">Hasta (opcional)</label>
            <input
              type="date"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
              className={cn(inputClass, 'w-36')}
            />
          </div>
          <Button
            size="sm"
            className="gap-1.5"
            disabled={runningExtraction}
            onClick={handleRunExtraction}
          >
            {runningExtraction ? (
              <Loader2 className="size-3.5 animate-spin" />
            ) : (
              <PlayCircle className="size-3.5" />
            )}
            Ejecutar extracción
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="gap-1.5"
            disabled={reprocessing}
            onClick={handleReprocess}
            title="Vuelve a procesar los posts de la última extracción sin volver a raspar Facebook (no gasta presupuesto de Apify)"
          >
            {reprocessing ? (
              <Loader2 className="size-3.5 animate-spin" />
            ) : (
              <RotateCcw className="size-3.5" />
            )}
            Reprocesar última extracción
          </Button>
        </div>
        {batchesWithPending.length > 0 && (
          <div className="mx-auto flex max-w-4xl flex-wrap items-center gap-2 px-4 pb-4 sm:px-6">
            <span className="inline-flex items-center gap-1 text-xs font-medium text-muted-foreground">
              <History className="size-3.5" />
              Extracciones:
            </span>
            {batchesWithPending.map((batch) => {
              const active = selectedBatchId === batch.id
              const label = batch.fromDate
                ? `${batch.fromDate}${batch.toDate ? ` a ${batch.toDate}` : ' +'}`
                : formatRelativeTime(batch.createdAt)
              return (
                <button
                  key={batch.id}
                  type="button"
                  onClick={() => setSelectedBatchId(active ? null : batch.id)}
                  className={cn(
                    'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium transition-colors',
                    active
                      ? 'border-primary bg-primary text-primary-foreground'
                      : 'border-border bg-background text-muted-foreground hover:bg-muted hover:text-foreground',
                  )}
                >
                  {label}
                  <span
                    className={cn(
                      'rounded-full px-1.5 text-[0.65rem]',
                      active ? 'bg-primary-foreground/20' : 'bg-muted',
                    )}
                  >
                    {batchCounts.get(batch.id) ?? 0}
                  </span>
                </button>
              )
            })}
            {selectedBatchId && (
              <button
                type="button"
                onClick={() => setSelectedBatchId(null)}
                className="inline-flex items-center gap-1 rounded-full border border-border bg-background px-2.5 py-1 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              >
                <X className="size-3.5" />
                Ver todas
              </button>
            )}
          </div>
        )}
      </header>

      <main className="mx-auto max-w-4xl px-4 py-6 sm:px-6">
        {error ? (
          <div className="flex flex-col items-center gap-2 rounded-2xl border border-dashed border-border bg-card py-12 text-center text-sm text-muted-foreground">
            <TriangleAlert className="size-5" />
            {error.message}
          </div>
        ) : loading ? (
          <div className="flex items-center justify-center gap-2 rounded-2xl border border-dashed border-border bg-card py-12 text-sm text-muted-foreground">
            <Loader2 className="size-4 animate-spin" />
            Cargando pendientes...
          </div>
        ) : totalPending === 0 ? (
          <div className="flex flex-col items-center gap-2 rounded-2xl border border-dashed border-border bg-card py-12 text-center">
            <BadgeCheck className="size-6 text-accent" />
            <p className="text-sm text-muted-foreground">
              No hay publicaciones pendientes de revisión por ahora.
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-8">
            {properties.length > 0 && (
              <section>
                <div className="mb-3 flex items-center justify-between gap-2">
                  <h2 className="font-display text-base font-bold text-foreground">
                    Propiedades pendientes ({properties.length})
                  </h2>
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-1.5"
                    disabled={bulkBusy !== null}
                    onClick={handleApproveAllProperties}
                  >
                    {bulkBusy === 'properties' ? (
                      <Loader2 className="size-3.5 animate-spin" />
                    ) : (
                      <CheckCheck className="size-3.5" />
                    )}
                    Publicar todo
                  </Button>
                </div>
                <div className="flex flex-col gap-4">
                  {properties.map((property) => (
                    <PendingPropertyCard
                      key={property.id}
                      property={property}
                      onApprove={handleApproveProperty}
                      onReject={handleRejectProperty}
                    />
                  ))}
                </div>
              </section>
            )}

            {demands.length > 0 && (
              <section>
                <div className="mb-3 flex items-center justify-between gap-2">
                  <h2 className="font-display text-base font-bold text-foreground">
                    Solicitudes pendientes ({demands.length})
                  </h2>
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-1.5"
                    disabled={bulkBusy !== null}
                    onClick={handleApproveAllDemands}
                  >
                    {bulkBusy === 'demands' ? (
                      <Loader2 className="size-3.5 animate-spin" />
                    ) : (
                      <CheckCheck className="size-3.5" />
                    )}
                    Publicar todo
                  </Button>
                </div>
                <div className="flex flex-col gap-4">
                  {demands.map((demand) => (
                    <PendingDemandCard
                      key={demand.id}
                      demand={demand}
                      onApprove={handleApproveDemand}
                      onReject={handleRejectDemand}
                    />
                  ))}
                </div>
              </section>
            )}
          </div>
        )}
      </main>

      <Toast message={toast.message} />
    </div>
  )
}
