'use client'

import {
  ShieldCheck,
  LayoutDashboard,
  Home,
  Target,
  ShieldQuestion,
  FileText,
  BadgeCheck,
} from 'lucide-react'
import { cn } from '@/lib/utils'

const nav = [
  { id: 'resumen', label: 'Inicio / Resumen', icon: LayoutDashboard },
  { id: 'propiedades', label: 'Mis Propiedades', icon: Home },
  { id: 'leads', label: 'Solicitudes del Muro', icon: Target },
  { id: 'verificar', label: 'Consultar Inquilino', icon: ShieldQuestion },
  { id: 'contratos', label: 'Plantillas de Contratos', icon: FileText },
]

export function DashboardSidebar({
  active,
  onNavigate,
}: {
  active: string
  onNavigate?: (id: string) => void
}) {
  return (
    <div className="flex h-full flex-col">
      <a href="/" className="flex items-center gap-2 px-5 py-5" aria-label="Renta Segura inicio">
        <span className="flex size-9 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm">
          <ShieldCheck className="size-5" />
        </span>
        <span className="flex flex-col leading-none">
          <span className="font-display text-base font-extrabold tracking-tight text-sidebar-foreground">
            Renta Segura
          </span>
          <span className="text-[0.7rem] font-medium text-muted-foreground">Panel de gestión</span>
        </span>
      </a>

      <nav className="flex-1 space-y-1 px-3 py-2">
        {nav.map((item) => {
          const Icon = item.icon
          const isActive = active === item.id
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onNavigate?.(item.id)}
              aria-current={isActive ? 'page' : undefined}
              className={cn(
                'flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors',
                isActive
                  ? 'bg-primary text-primary-foreground shadow-sm'
                  : 'text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-foreground',
              )}
            >
              <Icon className="size-[18px] shrink-0" />
              <span className="truncate">{item.label}</span>
            </button>
          )
        })}
      </nav>

      <div className="border-t border-sidebar-border p-3">
        <div className="flex items-center gap-3 rounded-xl px-2 py-2">
          <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary">
            FR
          </span>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-sidebar-foreground">Ing. Fernando R.</p>
            <p className="inline-flex items-center gap-1 text-[0.7rem] font-medium text-accent">
              <BadgeCheck className="size-3" />
              Dueño Verificado
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
