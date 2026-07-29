'use client'

import { useState } from 'react'
import Link from 'next/link'
import {
  ArrowLeft,
  BadgeCheck,
  Check,
  Loader2,
  MapPin,
  ScanLine,
  Trash2,
  TriangleAlert,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Toast, useToast } from '@/components/ui/toast'
import {
  usePendingReview,
  approveProperty,
  deleteProperty,
  approveDemand,
  deleteDemand,
  type Property,
  type Demand,
} from '@/lib/store'

function SourceBadge({ source }: { source?: string }) {
  if (source !== 'apify_facebook') return null
  return (
    <span className="inline-flex w-fit items-center gap-1.5 rounded-full bg-primary/10 px-2.5 py-1 text-xs font-semibold text-primary">
      <ScanLine className="size-3.5" />
      Importado de Facebook
    </span>
  )
}

function PendingPropertyCard({
  property,
  onApprove,
  onReject,
}: {
  property: Property
  onApprove: (id: string) => void
  onReject: (id: string) => void
}) {
  const [busy, setBusy] = useState<'approve' | 'reject' | null>(null)

  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-border bg-card p-4 shadow-sm sm:flex-row">
      <img
        src={property.images[0] || '/placeholder.svg'}
        alt={property.title}
        className="h-40 w-full shrink-0 rounded-xl object-cover sm:h-auto sm:w-48"
      />
      <div className="flex flex-1 flex-col gap-2">
        <SourceBadge source={property.source} />
        <p className="font-display text-lg font-extrabold text-foreground">
          {property.price > 0 ? `$${property.price.toLocaleString('es-MX')} MXN / mes` : 'Sin precio detectado'}
        </p>
        <h3 className="text-sm font-semibold text-foreground">{property.title}</h3>
        <p className="inline-flex items-center gap-1 text-xs text-muted-foreground">
          <MapPin className="size-3.5" />
          {property.location || 'Zona no detectada'}
        </p>
        {property.whatsapp && (
          <p className="text-xs text-muted-foreground">WhatsApp: {property.whatsapp}</p>
        )}
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
              await onApprove(property.id)
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
        Presupuesto: {demand.budget} · Zona: {demand.zone || 'No detectada'}
      </p>
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
  const { properties, demands, loading, error } = usePendingReview()
  const toast = useToast()

  async function handleApproveProperty(id: string) {
    try {
      await approveProperty(id)
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
          <div>
            <h1 className="font-display text-lg font-extrabold tracking-tight text-foreground">
              Revisar publicaciones importadas
            </h1>
            <p className="text-xs text-muted-foreground">
              Aprueba o descarta lo que llega de Facebook antes de que aparezca en el sitio
              principal.
            </p>
          </div>
        </div>
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
                <h2 className="mb-3 font-display text-base font-bold text-foreground">
                  Propiedades pendientes ({properties.length})
                </h2>
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
                <h2 className="mb-3 font-display text-base font-bold text-foreground">
                  Solicitudes pendientes ({demands.length})
                </h2>
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
