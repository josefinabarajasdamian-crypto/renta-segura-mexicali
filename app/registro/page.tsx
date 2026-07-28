'use client'

import { useState, type FormEvent } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ShieldCheck, Loader2, TriangleAlert, MailCheck } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { signUp, type UserRole } from '@/lib/auth'

const roleOptions: { value: UserRole; label: string }[] = [
  { value: 'inquilino', label: 'Busco renta (Inquilino)' },
  { value: 'propietario', label: 'Tengo propiedades (Propietario/Agente)' },
]

export default function RegistroPage() {
  const router = useRouter()
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [password, setPassword] = useState('')
  const [role, setRole] = useState<UserRole>('inquilino')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [needsConfirmation, setNeedsConfirmation] = useState(false)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    try {
      const data = await signUp({ email, password, fullName, phone, role })
      if (data.session) {
        router.push('/dashboard')
        router.refresh()
      } else {
        setNeedsConfirmation(true)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo crear tu cuenta.')
    } finally {
      setLoading(false)
    }
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
        {needsConfirmation ? (
          <div className="flex flex-col items-center gap-3 py-4 text-center">
            <span className="flex size-14 items-center justify-center rounded-full bg-accent/15 text-accent">
              <MailCheck className="size-7" />
            </span>
            <h1 className="font-display text-lg font-extrabold text-foreground">
              Revisa tu correo
            </h1>
            <p className="text-sm text-muted-foreground">
              Te enviamos un enlace de confirmación a <strong>{email}</strong>. Ábrelo para
              activar tu cuenta y luego inicia sesión.
            </p>
            <Button
              className="mt-2 w-full"
              nativeButton={false}
              render={<Link href="/login" />}
            >
              Ir a Iniciar sesión
            </Button>
          </div>
        ) : (
          <>
            <h1 className="font-display text-xl font-extrabold text-foreground">Crea tu cuenta</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Publica propiedades o busca renta con tu propio panel privado.
            </p>

            <form onSubmit={handleSubmit} className="mt-5 flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-semibold text-foreground">Nombre completo</label>
                <input
                  required
                  type="text"
                  autoComplete="name"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Ej. Fernando Ramírez"
                  className="h-11 w-full rounded-xl border border-input bg-background px-4 text-sm text-foreground outline-none ring-ring/40 placeholder:text-muted-foreground focus-visible:ring-2"
                />
              </div>

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
                <label className="text-sm font-semibold text-foreground">Teléfono</label>
                <input
                  required
                  type="tel"
                  autoComplete="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="686 123 4567"
                  className="h-11 w-full rounded-xl border border-input bg-background px-4 text-sm text-foreground outline-none ring-ring/40 placeholder:text-muted-foreground focus-visible:ring-2"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-semibold text-foreground">Contraseña</label>
                <input
                  required
                  minLength={6}
                  type="password"
                  autoComplete="new-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Mínimo 6 caracteres"
                  className="h-11 w-full rounded-xl border border-input bg-background px-4 text-sm text-foreground outline-none ring-ring/40 placeholder:text-muted-foreground focus-visible:ring-2"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-semibold text-foreground">Quiero</label>
                <div className="flex flex-col gap-2">
                  {roleOptions.map((option) => (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => setRole(option.value)}
                      className={cn(
                        'rounded-xl border px-4 py-2.5 text-left text-sm font-medium transition-colors',
                        role === option.value
                          ? 'border-primary bg-primary/5 text-primary'
                          : 'border-border text-foreground hover:bg-muted',
                      )}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>

              {error && (
                <div className="flex items-start gap-2 rounded-xl border border-destructive/30 bg-destructive/10 px-3.5 py-2.5 text-destructive">
                  <TriangleAlert className="mt-0.5 size-4 shrink-0" />
                  <p className="text-xs font-medium leading-relaxed">{error}</p>
                </div>
              )}

              <Button type="submit" size="lg" className="mt-1 w-full gap-1.5" disabled={loading}>
                {loading && <Loader2 className="size-4 animate-spin" />}
                {loading ? 'Creando cuenta...' : 'Crear cuenta'}
              </Button>
            </form>

            <p className="mt-5 text-center text-sm text-muted-foreground">
              ¿Ya tienes cuenta?{' '}
              <Link href="/login" className="font-semibold text-primary hover:underline">
                Inicia sesión
              </Link>
            </p>
          </>
        )}
      </div>
    </div>
  )
}
