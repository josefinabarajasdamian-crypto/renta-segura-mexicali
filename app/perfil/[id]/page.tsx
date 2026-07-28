'use client'

import { useParams } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, BadgeCheck, Loader2, TriangleAlert, Home } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { PropertyCard } from '@/components/property-card'
import { useMyProperties } from '@/lib/store'
import { usePublicProfile } from '@/lib/auth'

const roleLabels: Record<string, string> = {
  propietario: 'Propietario',
  agente: 'Agente Inmobiliario',
  inquilino: 'Inquilino',
}

function initials(name: string) {
  return name
    .split(' ')
    .map((w) => w[0])
    .filter(Boolean)
    .slice(0, 2)
    .join('')
    .toUpperCase()
}

export default function PublicProfilePage() {
  const params = useParams<{ id: string }>()
  const { profile, loading: profileLoading, error: profileError } = usePublicProfile(params.id)
  const { properties, loading: propertiesLoading } = useMyProperties(params.id)

  if (profileLoading) {
    return (
      <div className="flex min-h-dvh items-center justify-center gap-2 text-muted-foreground">
        <Loader2 className="size-5 animate-spin" />
        Cargando perfil...
      </div>
    )
  }

  if (profileError || !profile) {
    return (
      <div className="flex min-h-dvh flex-col items-center justify-center gap-4 px-4 text-center">
        <span className="flex size-14 items-center justify-center rounded-full bg-destructive/10 text-destructive">
          <TriangleAlert className="size-7" />
        </span>
        <p className="max-w-sm text-sm text-muted-foreground">
          {profileError?.message || 'No encontramos este perfil.'}
        </p>
        <Button nativeButton={false} render={<Link href="/" />}>
          <ArrowLeft className="size-4" />
          Volver al inicio
        </Button>
      </div>
    )
  }

  return (
    <div className="min-h-dvh bg-muted/40 pb-16">
      <header className="sticky top-0 z-30 border-b border-border bg-background/85 backdrop-blur-md">
        <div className="mx-auto flex max-w-5xl items-center gap-3 px-4 py-4 sm:px-6">
          <Link
            href="/"
            aria-label="Volver al inicio"
            className="flex size-9 shrink-0 items-center justify-center rounded-full border border-border text-foreground transition-colors hover:bg-muted"
          >
            <ArrowLeft className="size-4" />
          </Link>
          <h1 className="font-display text-lg font-extrabold tracking-tight text-foreground">
            Perfil
          </h1>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-6 sm:px-6">
        <div className="flex flex-col items-center gap-3 rounded-2xl border border-border bg-card p-6 text-center shadow-sm sm:flex-row sm:items-center sm:gap-5 sm:text-left">
          <span className="flex size-20 shrink-0 items-center justify-center rounded-full bg-primary/10 font-display text-2xl font-bold text-primary">
            {profile.fullName ? initials(profile.fullName) : '?'}
          </span>
          <div>
            <h2 className="font-display text-xl font-extrabold text-foreground">
              {profile.fullName || 'Usuario de Renta Segura'}
            </h2>
            <p className="mt-1 inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground">
              {profile.isVerified && <BadgeCheck className="size-4 text-accent" />}
              {profile.isVerified ? 'Verificado · ' : ''}
              {roleLabels[profile.role] ?? profile.role}
            </p>
          </div>
        </div>

        <section className="mt-8">
          <div className="mb-3 flex items-center gap-2">
            <span className="flex size-7 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Home className="size-4" />
            </span>
            <h3 className="font-display text-base font-bold text-foreground sm:text-lg">
              Propiedades publicadas
            </h3>
          </div>

          {propertiesLoading ? (
            <div className="flex items-center justify-center gap-2 rounded-2xl border border-dashed border-border bg-card p-8 text-sm text-muted-foreground">
              <Loader2 className="size-4 animate-spin" />
              Cargando propiedades...
            </div>
          ) : properties.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-border bg-card p-8 text-center">
              <p className="text-sm text-muted-foreground">
                Este usuario no tiene propiedades publicadas todavía.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {properties.map((property) => (
                <PropertyCard key={property.id} property={property} owner={profile} />
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  )
}
