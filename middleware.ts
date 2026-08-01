import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import { isAdminEmail } from '@/lib/admin'

const PROTECTED_PATHS = ['/dashboard', '/propiedad/nueva', '/importar']

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({ request })

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  const isProtected = PROTECTED_PATHS.some((path) => request.nextUrl.pathname.startsWith(path))

  // Si Supabase no está configurado, no bloqueamos nada (la propia página
  // ya muestra el aviso de configuración faltante).
  if (!supabaseUrl || !supabaseAnonKey) {
    return response
  }

  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll()
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
        response = NextResponse.next({ request })
        cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options))
      },
    },
  })

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (isProtected && !user) {
    const loginUrl = request.nextUrl.clone()
    loginUrl.pathname = '/login'
    loginUrl.searchParams.set('redirect', request.nextUrl.pathname)
    return NextResponse.redirect(loginUrl)
  }

  // /dashboard/revision aprueba o descarta lo que llega de Facebook y
  // puede disparar corridas de Apify (que cuestan presupuesto real) — no
  // hay un rol "admin" en profiles, así que cualquier usuario logueado
  // (propietario o agente) podía entrar. Se restringe a la lista de
  // correos en NEXT_PUBLIC_ADMIN_EMAILS.
  if (request.nextUrl.pathname.startsWith('/dashboard/revision') && !isAdminEmail(user?.email)) {
    const dashboardUrl = request.nextUrl.clone()
    dashboardUrl.pathname = '/dashboard'
    return NextResponse.redirect(dashboardUrl)
  }

  return response
}

export const config = {
  matcher: ['/dashboard/:path*', '/propiedad/nueva', '/importar/:path*'],
}
