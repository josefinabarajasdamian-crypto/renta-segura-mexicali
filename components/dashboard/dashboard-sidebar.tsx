'use client'

import {
  ShieldCheck,
  LayoutDashboard,
  Home,
  Target,
  ShieldQuestion,
  FileText,
  BadgeCheck,
  LogOut,
  type LucideIcon,
} from 'lucide-react'
import { cn } from '@/lib/utils'

export type NavItem = { id: string; label: string; icon: LucideIcon }

export const ownerNav: NavItem[] = [
  { id: 'resumen', label: 'Inicio / Resumen', icon: LayoutDashboard },
  { id: 'propiedades', label: 'Mis Propiedades', icon: Home },
  { id: 'leads', label: 'Solicitudes del Muro', icon: Target },
  { id: 'verificar', label: 'Consultar Inquilino', icon: ShieldQuestion },
  { id: 'contratos', label: 'Plantillas de Contratos', icon: FileText },
]

export const tenantNav: NavItem[] = [
  { id: 'resumen', label: 'Inicio / Resumen', icon: LayoutDashboard },
  { id: 'busquedas', label: 'Mis Búsquedas', icon: Target },
]

export function DashboardSidebar({
  active,
  onNavigate,
  nav = ownerNav,
  name,
  roleLabel,
  isVerified,
  onSignOut,
}: {
  active: string
  onNavigate?: (id: string) => void
  nav?: NavItem[]
  name: string
  roleLabel: string
  isVerified?: boolean
  onSignOut?: () => void
}) {
  const initials = name
    .split(' ')
    .map((n) => n[0])
    .filter(Boolean)
    .slice(0, 2)
    .join('')
    .toUpperCase()

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
            {initials || '?'}
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-sidebar-foreground">{name}</p>
            <p className="inline-flex items-center gap-1 text-[0.7rem] font-medium text-accent">
              {isVerified && <BadgeCheck className="size-3" />}
              {roleLabel}
            </p>
          </div>
          <button
            type="button"
            onClick={onSignOut}
            aria-label="Cerrar sesión"
            className="flex size-8 shrink-0 items-center justify-center rounded-lg text-sidebar-foreground/60 hover:bg-sidebar-accent hover:text-sidebar-foreground"
          >
            <LogOut className="size-4" />
          </button>
        </div>
      </div>
    </div>
  )
}
