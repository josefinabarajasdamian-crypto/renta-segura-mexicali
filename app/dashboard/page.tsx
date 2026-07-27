'use client'

import { useState } from 'react'
import { Plus, Menu, X, Target, FileText } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { properties, demands } from '@/lib/data'
import { DashboardSidebar } from '@/components/dashboard/dashboard-sidebar'
import { StatCards } from '@/components/dashboard/stat-cards'
import { PropertyManageRow } from '@/components/dashboard/property-manage-row'
import { ProspectCard } from '@/components/dashboard/prospect-card'
import { VerificationTool } from '@/components/dashboard/verification-tool'
import { ContractTemplates } from '@/components/dashboard/contract-templates'

const statusByProperty = ['Disponible', 'En Trato', 'Rentado'] as const

export default function DashboardPage() {
  const [active, setActive] = useState('resumen')
  const [sidebarOpen, setSidebarOpen] = useState(false)

  function navigate(id: string) {
    setActive(id)
    setSidebarOpen(false)
    const el = document.getElementById(id)
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  return (
    <div className="min-h-screen bg-muted/40">
      {/* Desktop sidebar */}
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 border-r border-sidebar-border bg-sidebar lg:block">
        <DashboardSidebar active={active} onNavigate={navigate} />
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
            <DashboardSidebar active={active} onNavigate={navigate} />
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
                  Panel de Gestión de Propiedades
                </h1>
                <p className="hidden text-xs text-muted-foreground sm:block">
                  Bienvenido de vuelta, Ing. Fernando R.
                </p>
              </div>
            </div>
            <Button size="lg" className="gap-1.5">
              <Plus className="size-4" />
              <span className="hidden sm:inline">Publicar Nueva Propiedad</span>
              <span className="sm:hidden">Publicar</span>
            </Button>
          </div>
        </header>

        <main className="mx-auto max-w-5xl space-y-8 px-4 py-6 sm:px-6">
          {/* Stats */}
          <section id="resumen" className="scroll-mt-24">
            <StatCards />
          </section>

          {/* My properties */}
          <section id="propiedades" className="scroll-mt-24">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="font-display text-base font-bold text-foreground sm:text-lg">
                Mis Propiedades
              </h2>
              <span className="text-xs text-muted-foreground">3 publicadas</span>
            </div>
            <div className="space-y-3">
              {properties.map((property, i) => (
                <PropertyManageRow
                  key={property.id}
                  property={property}
                  initialStatus={statusByProperty[i] ?? 'Disponible'}
                />
              ))}
            </div>
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
              <ProspectCard demand={demands[0]} match="95% match" />
              <ProspectCard demand={demands[2]} match="88% match" />
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
      </div>
    </div>
  )
}
