'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ShieldCheck, Menu, X, LogOut } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ThemeToggle } from '@/components/theme-toggle'
import { useAuth, signOut } from '@/lib/auth'

export function SiteHeader() {
  const [open, setOpen] = useState(false)
  const router = useRouter()
  const { user, loading } = useAuth()

  async function handleSignOut() {
    await signOut()
    setOpen(false)
    router.push('/')
    router.refresh()
  }

  const accountHref = user ? '/dashboard' : '/registro'
  const accountLabel = user ? 'Mi Panel' : 'Soy Propietario/Agente'

  return (
    <header className="sticky top-0 z-50 border-b border-border/80 bg-background/85 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
        <a href="/" className="flex items-center gap-2" aria-label="Renta Segura Mexicali inicio">
          <span className="flex size-9 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm">
            <ShieldCheck className="size-5" />
          </span>
          <span className="flex flex-col leading-none">
            <span className="font-display text-base font-extrabold tracking-tight text-foreground">
              Renta Segura
            </span>
            <span className="text-[0.7rem] font-medium text-muted-foreground">Mexicali</span>
          </span>
        </a>

        <nav className="hidden items-center gap-2 md:flex">
          <Button variant="ghost" size="lg" nativeButton={false} render={<a href="#muro" />}>
            Publicar mi Búsqueda
          </Button>
          <Button variant="ghost" size="lg" nativeButton={false} render={<a href={accountHref} />}>
            {accountLabel}
          </Button>
          {!loading && user ? (
            <Button variant="outline" size="lg" className="gap-1.5" onClick={handleSignOut}>
              <LogOut className="size-4" />
              Salir
            </Button>
          ) : (
            <Button size="lg" nativeButton={false} render={<a href="/login" />}>
              Entrar
            </Button>
          )}
          <ThemeToggle />
        </nav>

        <div className="flex items-center gap-2 md:hidden">
          <ThemeToggle />
          <Button
            variant="outline"
            size="icon-lg"
            aria-label={open ? 'Cerrar menú' : 'Abrir menú'}
            aria-expanded={open}
            onClick={() => setOpen((v) => !v)}
          >
            {open ? <X className="size-5" /> : <Menu className="size-5" />}
          </Button>
        </div>
      </div>

      {open && (
        <div className="border-t border-border/80 bg-background px-4 py-3 md:hidden">
          <div className="flex flex-col gap-2">
            <Button
              variant="ghost"
              size="lg"
              className="justify-start"
              nativeButton={false}
              render={<a href="#muro" />}
            >
              Publicar mi Búsqueda
            </Button>
            <Button
              variant="ghost"
              size="lg"
              className="justify-start"
              nativeButton={false}
              render={<a href={accountHref} />}
            >
              {accountLabel}
            </Button>
            {!loading && user ? (
              <Button size="lg" className="gap-1.5" onClick={handleSignOut}>
                <LogOut className="size-4" />
                Salir
              </Button>
            ) : (
              <Button size="lg" nativeButton={false} render={<a href="/login" />}>
                Entrar
              </Button>
            )}
          </div>
        </div>
      )}
    </header>
  )
}
