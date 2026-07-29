'use client'

import { useState } from 'react'
import { LayoutGrid, MessagesSquare, Plus, Loader2, TriangleAlert } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { PropertyCard } from '@/components/property-card'
import { DemandCard } from '@/components/demand-card'
import { DemandFormModal } from '@/components/demand-form-modal'
import { Toast, useToast } from '@/components/ui/toast'
import { useProperties, useDemands } from '@/lib/store'
import { usePublicProfiles } from '@/lib/auth'
import { cn } from '@/lib/utils'

type View = 'directorio' | 'muro'

function EmptyState({ icon: Icon, message }: { icon: typeof Loader2; message: string }) {
  return (
    <div className="flex flex-col items-center gap-2 rounded-2xl border border-dashed border-border bg-secondary/30 py-12 text-center text-sm text-muted-foreground">
      <Icon className="size-5" />
      {message}
    </div>
  )
}

export function ListingsSection() {
  const [view, setView] = useState<View>('directorio')
  // Simula si el usuario que mira es un agente/propietario.
  const [isAgent, setIsAgent] = useState(false)
  const [showDemandForm, setShowDemandForm] = useState(false)
  const { properties, loading: propertiesLoading, error: propertiesError } = useProperties()
  const { demands, loading: demandsLoading, error: demandsError } = useDemands()
  const owners = usePublicProfiles(
    properties.map((p) => p.userId).filter((id): id is string => Boolean(id)),
  )
  const toast = useToast()

  return (
    <section id="directorio" className="mx-auto max-w-6xl scroll-mt-20 px-4 py-14 sm:px-6">
      <div className="flex flex-col items-center gap-6">
        <div
          role="tablist"
          aria-label="Cambiar vista"
          className="inline-flex rounded-xl border border-border bg-secondary/60 p-1"
        >
          <button
            role="tab"
            aria-selected={view === 'directorio'}
            onClick={() => setView('directorio')}
            className={cn(
              'inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition-all',
              view === 'directorio'
                ? 'bg-card text-primary shadow-sm'
                : 'text-muted-foreground hover:text-foreground',
            )}
          >
            <LayoutGrid className="size-4" />
            Directorio Verificado
          </button>
          <button
            role="tab"
            aria-selected={view === 'muro'}
            onClick={() => setView('muro')}
            className={cn(
              'inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition-all',
              view === 'muro'
                ? 'bg-card text-primary shadow-sm'
                : 'text-muted-foreground hover:text-foreground',
            )}
          >
            <MessagesSquare className="size-4" />
            Muro de Demandas
          </button>
        </div>
      </div>

      {view === 'directorio' ? (
        <div className="mt-10" id="directorio-panel" role="tabpanel">
          <div className="mb-6 flex flex-col gap-1 text-center sm:text-left">
            <h2 className="font-display text-2xl font-extrabold tracking-tight text-foreground">
              Directorio Verificado
            </h2>
            <p className="text-sm text-muted-foreground">
              Propiedades revisadas una por una. Contacta directo, sin intermediarios.
            </p>
          </div>
          {propertiesError ? (
            <EmptyState icon={TriangleAlert} message={propertiesError.message} />
          ) : propertiesLoading ? (
            <EmptyState icon={Loader2} message="Cargando propiedades..." />
          ) : properties.length === 0 ? (
            <EmptyState icon={TriangleAlert} message="Aún no hay propiedades publicadas." />
          ) : (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {properties.map((property) => (
                <PropertyCard
                  key={property.id}
                  property={property}
                  owner={property.userId ? owners[property.userId] : undefined}
                />
              ))}
            </div>
          )}
        </div>
      ) : (
        <div className="mt-10" id="muro" role="tabpanel">
          <div className="mb-6 flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
            <div className="flex flex-col gap-1">
              <h2 className="font-display text-2xl font-extrabold tracking-tight text-foreground">
                Buscando Renta Hoy
              </h2>
              <p className="text-sm text-muted-foreground">
                Publica lo que necesitas y deja que los propietarios te encuentren.
              </p>
            </div>
            <Button size="lg" className="gap-2" onClick={() => setShowDemandForm(true)}>
              <Plus className="size-4" />
              Publicar mi necesidad
            </Button>
          </div>

          <div className="mb-6 flex items-center justify-center gap-2 rounded-xl border border-dashed border-border bg-secondary/40 px-4 py-2.5 text-xs text-muted-foreground sm:justify-start">
            <span>Vista previa como:</span>
            <button
              onClick={() => setIsAgent(false)}
              className={cn(
                'rounded-md px-2.5 py-1 font-medium transition-colors',
                !isAgent ? 'bg-card text-foreground shadow-sm' : 'hover:text-foreground',
              )}
            >
              Inquilino
            </button>
            <button
              onClick={() => setIsAgent(true)}
              className={cn(
                'rounded-md px-2.5 py-1 font-medium transition-colors',
                isAgent ? 'bg-card text-foreground shadow-sm' : 'hover:text-foreground',
              )}
            >
              Propietario / Agente
            </button>
          </div>

          {demandsError ? (
            <EmptyState icon={TriangleAlert} message={demandsError.message} />
          ) : demandsLoading ? (
            <EmptyState icon={Loader2} message="Cargando el Muro de Demandas..." />
          ) : demands.length === 0 ? (
            <EmptyState icon={TriangleAlert} message="Aún no hay solicitudes en el Muro." />
          ) : (
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {demands.map((demand) => (
                <DemandCard key={demand.id} demand={demand} isAgent={isAgent} />
              ))}
            </div>
          )}
        </div>
      )}

      {showDemandForm && (
        <DemandFormModal
          onClose={() => setShowDemandForm(false)}
          onPublished={() => {
            setShowDemandForm(false)
            toast.show('¡Tu búsqueda ya está en el Muro de Demandas!')
          }}
        />
      )}

      <Toast message={toast.message} />
    </section>
  )
}
