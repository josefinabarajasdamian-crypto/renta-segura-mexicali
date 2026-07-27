import { notFound } from 'next/navigation'
import Link from 'next/link'
import {
  ArrowLeft,
  BadgeCheck,
  BedDouble,
  CalendarClock,
  Car,
  Clock,
  Droplets,
  FileCheck,
  FileText,
  PawPrint,
  ShieldCheck,
  Snowflake,
  Wallet,
  Wifi,
  Zap,
} from 'lucide-react'
import { propertyDetails } from '@/lib/data'
import { Button } from '@/components/ui/button'
import { PropertyGallery } from '@/components/property-gallery'
import { WhatsAppCta } from '@/components/whatsapp-cta'

export function generateStaticParams() {
  return Object.keys(propertyDetails).map((id) => ({ id }))
}

export default async function PropertyDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const p = propertyDetails[id]
  if (!p) notFound()

  const specs = [
    { icon: Snowflake, label: 'Clima', value: p.specs.climate },
    { icon: Car, label: 'Estacionamiento', value: p.specs.parking },
    { icon: PawPrint, label: 'Mascotas', value: p.specs.pets },
    { icon: BedDouble, label: 'Distribución', value: p.specs.layout },
  ]

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
        <PropertyGallery images={p.gallery} />

        {/* Content grid */}
        <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_360px]">
          <div className="flex flex-col gap-8">
            {/* Specs */}
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
                      <p className="text-sm font-semibold leading-snug text-foreground">{value}</p>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* Security & reputation */}
            <section className="rounded-2xl border border-accent/30 bg-accent/5 p-5 shadow-sm">
              <div className="flex items-start gap-4">
                <span className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-accent/15 text-accent">
                  <ShieldCheck className="size-6" />
                </span>
                <div className="flex flex-col gap-4">
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
                  <div className="flex flex-wrap gap-2">
                    <Button variant="outline" size="sm" className="gap-1.5 bg-card">
                      <FileText className="size-4" />
                      Ver Contrato Modelo
                    </Button>
                    <Button variant="outline" size="sm" className="gap-1.5 bg-card">
                      <FileCheck className="size-4" />
                      Solicitar Certificado de Inquilino
                    </Button>
                  </div>
                </div>
              </div>
            </section>

            {/* Owner */}
            <section>
              <h2 className="mb-4 font-display text-lg font-bold text-foreground">
                Sobre el propietario
              </h2>
              <div className="flex flex-col gap-4 rounded-2xl border border-border bg-card p-5 shadow-sm sm:flex-row sm:items-center">
                <div className="flex items-center gap-3">
                  <span className="flex size-14 shrink-0 items-center justify-center rounded-full bg-primary/10 font-display text-lg font-bold text-primary">
                    {p.owner.name
                      .replace(/^(Ing\.|Lic\.|Arq\.)\s*/, '')
                      .split(' ')
                      .map((n) => n[0])
                      .slice(0, 2)
                      .join('')}
                  </span>
                  <div>
                    <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                      Publicado por
                    </p>
                    <p className="text-sm font-bold text-foreground">{p.owner.name}</p>
                    <p className="text-xs font-medium text-primary">{p.owner.role}</p>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2 sm:ml-auto">
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-accent/30 bg-accent/10 px-3 py-1 text-xs font-medium text-accent">
                    <Clock className="size-3.5" />
                    {p.owner.responseTime}
                  </span>
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-secondary px-3 py-1 text-xs font-medium text-secondary-foreground">
                    <BadgeCheck className="size-3.5" />
                    {p.owner.tenure}
                  </span>
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
                <div className="flex items-center justify-between gap-2">
                  <dt className="inline-flex items-center gap-2 text-muted-foreground">
                    <CalendarClock className="size-4" />
                    Contrato
                  </dt>
                  <dd className="text-right font-semibold text-foreground">{p.contract}</dd>
                </div>
              </dl>

              <div className="flex flex-col gap-2 rounded-xl bg-muted/60 p-3 text-sm">
                <p className="inline-flex items-center gap-2 font-medium text-foreground">
                  <Droplets className="size-4 text-primary" />
                  <Wifi className="-ml-1 size-4 text-primary" />
                  {p.servicesIncluded}
                </p>
                <p className="inline-flex items-center gap-2 font-medium text-foreground">
                  <Zap className="size-4 text-muted-foreground" />
                  {p.servicesIndependent}
                </p>
              </div>

              <div className="mt-4 hidden lg:block">
                <WhatsAppCta phone={p.whatsapp} message={p.whatsappMessage} />
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
            <WhatsAppCta
              phone={p.whatsapp}
              message={p.whatsappMessage}
              label="WhatsApp"
              showPreview={false}
            />
          </div>
        </div>
      </div>
    </div>
  )
}
