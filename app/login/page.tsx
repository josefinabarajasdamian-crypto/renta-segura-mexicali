'use client'

import { useEffect, useState, type FormEvent } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ShieldCheck, Loader2, TriangleAlert } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { signIn, useAuth } from '@/lib/auth'

export default function LoginPage() {
  const router = useRouter()
  const { user, loading: authLoading } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!authLoading && user) {
      router.replace('/dashboard')
    }
  }, [authLoading, user, router])

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    try {
      await signIn({ email, password })
      const redirect = new URLSearchParams(window.location.search).get('redirect') || '/dashboard'
      router.push(redirect)
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo iniciar sesión.')
    } finally {
      setLoading(false)
    }
  }

  if (authLoading || user) {
    return (
      <div className="flex min-h-dvh items-center justify-center gap-2 text-muted-foreground">
        <Loader2 className="size-5 animate-spin" />
        Cargando...
      </div>
    )
  }

  return (
    <div className="flex min-h-dvh flex-col items-center justify-center bg-muted/40 px-4 py-10">
      <Link href="/" className="mb-6 flex items-center gap-2" aria-label="Renta Segura inicio">
        <span className="flex size-10 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm">
          <ShieldCheck className="size-5" />
        </span>
        <span className="flex flex-col leading-none">
          <span className="font-display text-base font-extrabold tracking-tight text-foreground">
            Renta Segura
          </span>
          <span className="text-[0.7rem] font-medium text-muted-foreground">Mexicali</span>
        </span>
      </Link>

      <div className="w-full max-w-sm rounded-2xl border border-border bg-card p-6 shadow-sm">
        <h1 className="font-display text-xl font-extrabold text-foreground">Inicia sesión</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Entra a tu cuenta para gestionar tus propiedades y solicitudes.
        </p>

        <form onSubmit={handleSubmit} className="mt-5 flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-semibold text-foreground">Correo</label>
            <input
              required
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="tucorreo@ejemplo.com"
              className="h-11 w-full rounded-xl border border-input bg-background px-4 text-sm text-foreground outline-none ring-ring/40 placeholder:text-muted-foreground focus-visible:ring-2"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-semibold text-foreground">Contraseña</label>
            <input
              required
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="h-11 w-full rounded-xl border border-input bg-background px-4 text-sm text-foreground outline-none ring-ring/40 placeholder:text-muted-foreground focus-visible:ring-2"
            />
          </div>

          {error && (
            <div className="flex items-start gap-2 rounded-xl border border-destructive/30 bg-destructive/10 px-3.5 py-2.5 text-destructive">
              <TriangleAlert className="mt-0.5 size-4 shrink-0" />
              <p className="text-xs font-medium leading-relaxed">{error}</p>
            </div>
          )}

          <Button type="submit" size="lg" className="mt-1 w-full gap-1.5" disabled={loading}>
            {loading && <Loader2 className="size-4 animate-spin" />}
            {loading ? 'Entrando...' : 'Entrar'}
          </Button>
        </form>

        <p className="mt-5 text-center text-sm text-muted-foreground">
          ¿No tienes cuenta?{' '}
          <Link href="/registro" className="font-semibold text-primary hover:underline">
            Regístrate
          </Link>
        </p>
      </div>
    </div>
  )
}
