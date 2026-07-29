'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  Plus,
  Menu,
  X,
  Target,
  FileText,
  ScanLine,
  ClipboardCheck,
  Loader2,
  TriangleAlert,
  MessagesSquare,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  useMyProperties,
  useMyDemands,
  useDemands,
  usePendingReview,
  updatePropertyStatus,
  deleteProperty,
  type Property,
  type PropertyStatus,
} from '@/lib/store'
import { useAuth, signOut } from '@/lib/auth'
import { Toast, useToast } from '@/components/ui/toast'
import { ThemeToggle } from '@/components/theme-toggle'
import { DashboardSidebar, ownerNav, tenantNav } from '@/components/dashboard/dashboard-sidebar'
import { StatCards } from '@/components/dashboard/stat-cards'
import { PropertyManageRow } from '@/components/dashboard/property-manage-row'
import { ProspectCard } from '@/components/dashboard/prospect-card'
import { DemandCard } from '@/components/demand-card'
import { VerificationTool } from '@/components/dashboard/verification-tool'
import { ContractTemplates } from '@/components/dashboard/contract-templates'

const roleLabels: Record<string, string> = {
  propietario: 'Dueño Verificado',
  agente: 'Agente Verificado',
  inquilino: 'Inquilino',
}

export default function DashboardPage() {
  const router = useRouter()
  const [active, setActive] = useState('resumen')
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const { user, profile, loading: authLoading } = useAuth()
  const isTenant = profile?.role === 'inquilino'

  const {
    properties,
    loading: propertiesLoading,
    error: propertiesError,
  } = useMyProperties(!isTenant ? user?.id : undefined)
  const { demands: myDemands, loading: myDemandsLoading } = useMyDemands(
    isTenant ? user?.id : undefined,
  )
  const { demands: wallDemands } = useDemands()
  const { properties: pendingProperties, demands: pendingDemands } = usePendingReview()
  const pendingCount = pendingProperties.length + pendingDemands.length
  const toast = useToast()

  function navigate(id: string) {
    setActive(id)
    setSidebarOpen(false)
    const el = document.getElementById(id)
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  async function handleSignOut() {
    await signOut()
    router.push('/')
    router.refresh()
  }

  async function handleStatusChange(id: string, status: PropertyStatus) {
    try {
      await updatePropertyStatus(id, status)
      toast.show(`Estatus actualizado a "${status}"`)
    } catch (err) {
      toast.show(err instanceof Error ? err.message : 'No se pudo actualizar el estatus')
    }
  }

  async function handleDelete(id: string) {
    try {
      await deleteProperty(id)
      toast.show('Propiedad eliminada')
    } catch (err) {
      toast.show(err instanceof Error ? err.message : 'No se pudo eliminar la propiedad')
    }
  }

  function handleCopyLink(property: Property) {
    toast.show('¡Enlace copiado! Pégalo en tu publicación de Facebook')
  }

  if (authLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center gap-2 text-muted-foreground">
        <Loader2 className="size-5 animate-spin" />
        Cargando tu panel...
      </div>
    )
  }

  const displayName = profile?.fullName || user?.email || 'Usuario'
  const roleLabel = roleLabels[profile?.role ?? 'inquilino']
  const nav = isTenant ? tenantNav : ownerNav

  return (
    <div className="min-h-screen bg-muted/40">
      {/* Desktop sidebar */}
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 border-r border-sidebar-border bg-sidebar lg:block">
        <DashboardSidebar
          active={active}
          onNavigate={navigate}
          nav={nav}
          name={displayName}
          roleLabel={roleLabel}
          isVerified={profile?.isVerified}
          onSignOut={handleSignOut}
        />
      </aside>

      {/* Mobile sidebar drawer */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="absolute inset-0 bg-foreground/40 backdrop-blur-sm"
            onClick={() => setSidebarOpen(false)}
            aria-hidden="true"
          />
          <aside className="absolute inset-y-0 left-0 w-72 border-r border-sidebar-border bg-sidebar shadow-xl">
            <div className="flex justify-end p-3">
              <Button
                variant="ghost"
                size="icon"
                aria-label="Cerrar menú"
                onClick={() => setSidebarOpen(false)}
              >
                <X className="size-5" />
              </Button>
            </div>
            <DashboardSidebar
              active={active}
              onNavigate={navigate}
              nav={nav}
              name={displayName}
              roleLabel={roleLabel}
              isVerified={profile?.isVerified}
              onSignOut={handleSignOut}
            />
          </aside>
        </div>
      )}

      <div className="lg:pl-64">
        {/* Header */}
        <header className="sticky top-0 z-30 border-b border-border bg-background/85 backdrop-blur-md">
          <div className="flex items-center justify-between gap-3 px-4 py-4 sm:px-6">
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                size="icon"
                className="lg:hidden"
                aria-label="Abrir menú"
                onClick={() => setSidebarOpen(true)}
              >
                <Menu className="size-5" />
              </Button>
              <div>
                <h1 className="text-pretty font-display text-lg font-extrabold tracking-tight text-foreground sm:text-xl">
                  {isTenant ? 'Panel de Búsqueda' : 'Panel de Gestión de Propiedades'}
                </h1>
                <p className="hidden text-xs text-muted-foreground sm:block">
                  Bienvenido de vuelta, {displayName}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <ThemeToggle />
              {!isTenant && (
                <>
                  <Button
                    variant="outline"
                    size="lg"
                    className="relative gap-1.5"
                    nativeButton={false}
                    render={<Link href="/dashboard/revision" />}
                  >
                    <ClipboardCheck className="size-4" />
                    <span className="hidden sm:inline">Revisar importados</span>
                    {pendingCount > 0 && (
                      <span className="absolute -right-1.5 -top-1.5 flex size-5 items-center justify-center rounded-full bg-destructive text-[0.65rem] font-bold text-white">
                        {pendingCount}
                      </span>
                    )}
                  </Button>
                  <Button
                    variant="outline"
                    size="lg"
                    className="gap-1.5"
                    nativeButton={false}
                    render={<Link href="/importar" />}
                  >
                    <ScanLine className="size-4" />
                    <span className="hidden sm:inline">Importar de Facebook</span>
                  </Button>
                  <Button
                    size="lg"
                    className="gap-1.5"
                    nativeButton={false}
                    render={<Link href="/propiedad/nueva" />}
                  >
                    <Plus className="size-4" />
                    <span className="hidden sm:inline">Publicar Nueva Propiedad</span>
                    <span className="sm:hidden">Publicar</span>
                  </Button>
                </>
              )}
            </div>
          </div>
        </header>

        {isTenant ? (
          <main className="mx-auto max-w-5xl space-y-8 px-4 py-6 sm:px-6">
            <section id="resumen" className="scroll-mt-24">
              <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
                <p className="text-sm text-muted-foreground">
                  Desde aquí puedes ver tus solicitudes publicadas en el Muro de Demandas y
                  explorar el directorio de propiedades verificadas.
                </p>
                <Button
                  className="mt-4 gap-1.5"
                  nativeButton={false}
                  render={<Link href="/#directorio" />}
                >
                  Ver Directorio Verificado
                </Button>
              </div>
            </section>

            <section id="busquedas" className="scroll-mt-24">
              <div className="mb-1 flex items-center gap-2">
                <span className="flex size-7 items-center justify-center rounded-lg bg-accent/12 text-accent">
                  <MessagesSquare className="size-4" />
                </span>
                <h2 className="font-display text-base font-bold text-foreground sm:text-lg">
                  Mis Búsquedas en el Muro de Demandas
                </h2>
              </div>
              <p className="mb-3 text-sm text-muted-foreground">
                Solicitudes que has publicado para que los propietarios te encuentren.
              </p>
              {myDemandsLoading ? (
                <div className="flex items-center justify-center gap-2 rounded-2xl border border-dashed border-border bg-card p-8 text-sm text-muted-foreground">
                  <Loader2 className="size-4 animate-spin" />
                  Cargando tus búsquedas...
                </div>
              ) : myDemands.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-border bg-card p-8 text-center">
                  <p className="text-sm text-muted-foreground">
                    Aún no has publicado ninguna búsqueda en el Muro de Demandas.
                  </p>
                  <Button
                    className="mt-4 gap-1.5"
                    variant="outline"
                    nativeButton={false}
                    render={<Link href="/#muro" />}
                  >
                    Publicar mi búsqueda
                  </Button>
                </div>
              ) : (
                <div className="grid gap-3 sm:grid-cols-2">
                  {myDemands.map((demand) => (
                    <DemandCard key={demand.id} demand={demand} />
                  ))}
                </div>
              )}
            </section>
          </main>
        ) : (
          <main className="mx-auto max-w-5xl space-y-8 px-4 py-6 sm:px-6">
            {/* Stats */}
            <section id="resumen" className="scroll-mt-24">
              <StatCards propertiesCount={properties.length} />
            </section>

            {/* My properties */}
            <section id="propiedades" className="scroll-mt-24">
              <div className="mb-3 flex items-center justify-between">
                <h2 className="font-display text-base font-bold text-foreground sm:text-lg">
                  Mis Propiedades
                </h2>
                <span className="text-xs text-muted-foreground">
                  {properties.length} publicadas
                </span>
              </div>
              {propertiesError ? (
                <div className="flex items-start gap-2 rounded-2xl border border-destructive/30 bg-destructive/10 p-4 text-destructive">
                  <TriangleAlert className="mt-0.5 size-4 shrink-0" />
                  <p className="text-sm font-medium leading-relaxed">{propertiesError.message}</p>
                </div>
              ) : propertiesLoading ? (
                <div className="flex items-center justify-center gap-2 rounded-2xl border border-dashed border-border bg-card p-8 text-sm text-muted-foreground">
                  <Loader2 className="size-4 animate-spin" />
                  Cargando propiedades...
                </div>
              ) : properties.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-border bg-card p-8 text-center">
                  <p className="text-sm text-muted-foreground">
                    Aún no tienes propiedades publicadas.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {properties.map((property) => (
                    <PropertyManageRow
                      key={property.id}
                      property={property}
                      onStatusChange={handleStatusChange}
                      onDelete={handleDelete}
                      onCopyLink={handleCopyLink}
                    />
                  ))}
                </div>
              )}
            </section>

            {/* Prospects matchmaking */}
            <section id="leads" className="scroll-mt-24">
              <div className="mb-1 flex items-center gap-2">
                <span className="flex size-7 items-center justify-center rounded-lg bg-accent/12 text-accent">
                  <Target className="size-4" />
                </span>
                <h2 className="font-display text-base font-bold text-foreground sm:text-lg">
                  Prospectos Recomendados del Muro
                </h2>
              </div>
              <p className="mb-3 text-sm text-muted-foreground">
                Personas buscando renta que coinciden con tus propiedades hoy en Mexicali.
              </p>
              <div className="grid gap-3 md:grid-cols-2">
                {wallDemands.slice(0, 2).map((demand, i) => (
                  <ProspectCard
                    key={demand.id}
                    demand={demand}
                    match={i === 0 ? '95% match' : '88% match'}
                  />
                ))}
              </div>
            </section>

            {/* Verification */}
            <section id="verificar" className="scroll-mt-24">
              <VerificationTool />
            </section>

            {/* Contract templates */}
            <section id="contratos" className="scroll-mt-24">
              <div className="mb-1 flex items-center gap-2">
                <span className="flex size-7 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <FileText className="size-4" />
                </span>
                <h2 className="font-display text-base font-bold text-foreground sm:text-lg">
                  Plantillas de Contratos
                </h2>
              </div>
              <p className="mb-3 text-sm text-muted-foreground">
                Formatos listos para usar en tus arrendamientos, revisados y actualizados.
              </p>
              <ContractTemplates />
            </section>
          </main>
        )}
      </div>

      <Toast message={toast.message} />
    </div>
  )
}
