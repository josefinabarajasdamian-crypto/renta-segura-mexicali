'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import {
  ArrowLeft,
  BadgeCheck,
  BedDouble,
  Bath,
  CalendarClock,
  Car,
  ChevronRight,
  Loader2,
  PawPrint,
  ShieldCheck,
  Snowflake,
  TriangleAlert,
  Wallet,
  Zap,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { PropertyGallery } from '@/components/property-gallery'
import { WhatsAppCta } from '@/components/whatsapp-cta'
import { getPropertyById, type Property } from '@/lib/store'
import { SupabaseNotConfiguredError } from '@/lib/store'
import { usePublicProfile } from '@/lib/auth'

const ownerRoleLabels: Record<string, string> = {
  propietario: 'Propietario',
  agente: 'Agente Inmobiliario',
  inquilino: 'Inquilino',
}

function ownerInitials(name: string) {
  return name
    .split(' ')
    .map((w) => w[0])
    .filter(Boolean)
    .slice(0, 2)
    .join('')
    .toUpperCase()
}

export default function PropertyDetailPage() {
  const params = useParams<{ id: string }>()
  const [property, setProperty] = useState<Property | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { profile: owner } = usePublicProfile(property?.userId)

  useEffect(() => {
    let active = true
    setLoading(true)
    setError(null)

    getPropertyById(params.id)
      .then((data) => {
        if (!active) return
        if (!data) {
          setError('No encontramos esta propiedad. Puede que ya no esté disponible.')
        } else {
          setProperty(data)
        }
      })
      .catch((err) => {
        if (!active) return
        setError(
          err instanceof SupabaseNotConfiguredError
            ? err.message
            : 'No se pudo cargar esta propiedad. Intenta de nuevo.',
        )
      })
      .finally(() => {
        if (active) setLoading(false)
      })

    return () => {
      active = false
    }
  }, [params.id])

  if (loading) {
    return (
      <div className="flex min-h-dvh flex-col items-center justify-center gap-2 text-muted-foreground">
        <Loader2 className="size-6 animate-spin" />
        Cargando propiedad...
      </div>
    )
  }

  if (error || !property) {
    return (
      <div className="flex min-h-dvh flex-col items-center justify-center gap-4 px-4 text-center">
        <span className="flex size-14 items-center justify-center rounded-full bg-destructive/10 text-destructive">
          <TriangleAlert className="size-7" />
        </span>
        <p className="max-w-sm text-sm text-muted-foreground">{error}</p>
        <Button nativeButton={false} render={<Link href="/" />}>
          <ArrowLeft className="size-4" />
          Volver a la búsqueda
        </Button>
      </div>
    )
  }

  const p = property
  const whatsappMessage = `Hola, vi tu propiedad "${p.title}" en Renta Segura Mexicali y me interesa. ¿Sigue disponible?`

  const specs = [
    p.coolingType && { icon: Snowflake, label: 'Clima', value: p.coolingType },
    p.parking && { icon: Car, label: 'Estacionamiento', value: p.parking },
    p.petsPolicy && { icon: PawPrint, label: 'Mascotas', value: p.petsPolicy },
    (p.bedrooms || p.bathrooms) && {
      icon: BedDouble,
      label: 'Distribución',
      value: `${p.bedrooms ?? 0} Recámaras, ${p.bathrooms ?? 0} Baños`,
    },
  ].filter(Boolean) as { icon: typeof Snowflake; label: string; value: string }[]

  return (
    <div className="min-h-dvh bg-background pb-28 lg:pb-0">
      {/* Top nav */}
      <header className="sticky top-0 z-30 border-b border-border bg-background/80 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center gap-3 px-4 py-3">
          <Button
            variant="ghost"
            size="sm"
            className="gap-1.5 px-2 text-sm font-medium"
            nativeButton={false}
            render={<Link href="/" />}
          >
            <ArrowLeft className="size-4" />
            Volver a la búsqueda
          </Button>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-6">
        {/* Title block */}
        <div className="mb-5 flex flex-col gap-3">
          <span className="inline-flex w-fit items-center gap-1.5 rounded-full bg-accent px-3 py-1 text-xs font-semibold text-accent-foreground shadow-sm">
            <BadgeCheck className="size-4" />
            Dueño Verificado con Renta Segura
          </span>
          <h1 className="text-balance font-display text-2xl font-extrabold tracking-tight text-foreground sm:text-3xl">
            {p.title}
          </h1>
          <p className="text-sm text-muted-foreground">{p.location}</p>
        </div>

        {/* Gallery */}
        <PropertyGallery
          images={
            p.images.length > 0
              ? p.images.map((src) => ({ src, alt: p.title }))
              : [{ src: '/images/depto-uabc.png', alt: p.title }]
          }
        />

        {/* Content grid */}
        <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_360px]">
          <div className="flex flex-col gap-8">
            {/* Specs */}
            {specs.length > 0 && (
              <section>
                <h2 className="mb-4 font-display text-lg font-bold text-foreground">
                  Especificaciones clave
                </h2>
                <div className="grid gap-3 sm:grid-cols-2">
                  {specs.map(({ icon: Icon, label, value }) => (
                    <div
                      key={label}
                      className="flex items-start gap-3 rounded-xl border border-border bg-card p-4 shadow-sm transition-shadow hover:shadow-md"
                    >
                      <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                        <Icon className="size-5" />
                      </span>
                      <div>
                        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                          {label}
                        </p>
                        <p className="text-sm font-semibold leading-snug text-foreground">
                          {value}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {p.tags.length > 0 && (
              <section>
                <h2 className="mb-3 font-display text-lg font-bold text-foreground">
                  Amenidades
                </h2>
                <div className="flex flex-wrap gap-2">
                  {p.tags.map((tag) => (
                    <span
                      key={tag}
                      className="rounded-full border border-primary/15 bg-primary/5 px-3 py-1 text-xs font-medium text-primary"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </section>
            )}

            {p.description && (
              <section>
                <h2 className="mb-3 font-display text-lg font-bold text-foreground">
                  Descripción
                </h2>
                <p className="text-pretty text-sm leading-relaxed text-foreground/90">
                  {p.description}
                </p>
              </section>
            )}

            {owner?.fullName && (
              <section>
                <h2 className="mb-3 font-display text-lg font-bold text-foreground">
                  Sobre el propietario
                </h2>
                <Link
                  href={`/perfil/${owner.id}`}
                  className="group/owner flex items-center gap-3 rounded-2xl border border-border bg-card p-4 shadow-sm transition-shadow hover:shadow-md"
                >
                  <span className="flex size-12 shrink-0 items-center justify-center rounded-full bg-primary/10 font-display text-base font-bold text-primary">
                    {ownerInitials(owner.fullName)}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-foreground">
                      {owner.fullName}
                    </p>
                    <p className="mt-0.5 inline-flex items-center gap-1 text-xs text-muted-foreground">
                      {owner.isVerified && <BadgeCheck className="size-3.5 text-accent" />}
                      {ownerRoleLabels[owner.role] ?? owner.role}
                      {' · Ver perfil y otras propiedades'}
                    </p>
                  </div>
                  <ChevronRight className="size-4 shrink-0 text-muted-foreground transition-transform group-hover/owner:translate-x-0.5" />
                </Link>
              </section>
            )}

            {/* Security & reputation */}
            <section className="rounded-2xl border border-accent/30 bg-accent/5 p-5 shadow-sm">
              <div className="flex items-start gap-4">
                <span className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-accent/15 text-accent">
                  <ShieldCheck className="size-6" />
                </span>
                <div>
                  <h2 className="font-display text-lg font-bold text-foreground">
                    Seguridad y reputación
                  </h2>
                  <p className="mt-1 text-pretty text-sm leading-relaxed text-muted-foreground">
                    Esta propiedad fue validada por el equipo de Renta Segura. Identidad del
                    propietario confirmada y sin antecedentes de retención injustificada de
                    depósitos.
                  </p>
                </div>
              </div>
            </section>
          </div>

          {/* Financial sidebar */}
          <aside className="lg:sticky lg:top-20 lg:h-fit">
            <div className="rounded-2xl border border-border bg-card p-5 shadow-md">
              <div className="flex items-end justify-between border-b border-border pb-4">
                <div>
                  <p className="font-display text-3xl font-extrabold tracking-tight text-foreground">
                    {'$'}
                    {p.price.toLocaleString('es-MX')}
                  </p>
                  <p className="text-sm font-medium text-muted-foreground">MXN / mes</p>
                </div>
                <span className="inline-flex items-center gap-1 rounded-full bg-accent/10 px-2.5 py-1 text-xs font-semibold text-accent">
                  <BadgeCheck className="size-3.5" />
                  Verificado
                </span>
              </div>

              <dl className="flex flex-col gap-3 py-4 text-sm">
                {p.deposit != null && (
                  <div className="flex items-center justify-between gap-2">
                    <dt className="inline-flex items-center gap-2 text-muted-foreground">
                      <Wallet className="size-4" />
                      Fianza / Depósito
                    </dt>
                    <dd className="font-semibold text-foreground">
                      {'$'}
                      {p.deposit.toLocaleString('es-MX')} MXN
                    </dd>
                  </div>
                )}
                {p.contractDuration && (
                  <div className="flex items-center justify-between gap-2">
                    <dt className="inline-flex items-center gap-2 text-muted-foreground">
                      <CalendarClock className="size-4" />
                      Contrato
                    </dt>
                    <dd className="text-right font-semibold text-foreground">
                      {p.contractDuration}
                    </dd>
                  </div>
                )}
                {p.electricityRate && (
                  <div className="flex items-center justify-between gap-2">
                    <dt className="inline-flex items-center gap-2 text-muted-foreground">
                      <Zap className="size-4" />
                      Luz
                    </dt>
                    <dd className="text-right font-semibold text-foreground">
                      {p.electricityRate}
                    </dd>
                  </div>
                )}
              </dl>

              <div className="mt-4 hidden lg:block">
                <WhatsAppCta phone={p.whatsapp} message={whatsappMessage} />
              </div>
              <p className="mt-3 hidden text-center text-xs text-muted-foreground lg:block">
                Trato directo, sin intermediarios ni comisiones ocultas.
              </p>
            </div>
          </aside>
        </div>
      </main>

      {/* Sticky mobile bottom bar */}
      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-background/95 p-3 shadow-[0_-4px_20px_rgba(0,0,0,0.08)] backdrop-blur lg:hidden">
        <div className="mx-auto flex max-w-6xl items-center gap-3">
          <div className="shrink-0">
            <p className="font-display text-lg font-extrabold leading-none text-foreground">
              {'$'}
              {p.price.toLocaleString('es-MX')}
            </p>
            <p className="text-xs text-muted-foreground">MXN / mes</p>
          </div>
          <div className="flex-1">
            <WhatsAppCta phone={p.whatsapp} message={whatsappMessage} label="WhatsApp" showPreview={false} />
          </div>
        </div>
      </div>
    </div>
  )
}
