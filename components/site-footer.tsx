import { ShieldCheck } from 'lucide-react'

export function SiteFooter() {
  return (
    <footer className="border-t border-border bg-secondary/40">
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-6 px-4 py-8 sm:flex-row sm:px-6">
        <a href="/" className="flex items-center gap-2" aria-label="Renta Segura Mexicali inicio">
          <span className="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <ShieldCheck className="size-4" />
          </span>
          <span className="font-display text-sm font-extrabold tracking-tight text-foreground">
            Renta Segura Mexicali
          </span>
        </a>

        <nav className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm text-muted-foreground">
          <a href="#terminos" className="transition-colors hover:text-foreground">
            Términos de uso
          </a>
          <a href="#privacidad" className="transition-colors hover:text-foreground">
            Aviso de Privacidad
          </a>
          <a href="#ayuda" className="transition-colors hover:text-foreground">
            Ayuda
          </a>
        </nav>
      </div>
      <div className="border-t border-border/60 py-4">
        <p className="text-center text-xs text-muted-foreground">
          {'© '}
          {new Date().getFullYear()} Renta Segura Mexicali. Hecho con confianza en Baja California.
        </p>
      </div>
    </footer>
  )
}
