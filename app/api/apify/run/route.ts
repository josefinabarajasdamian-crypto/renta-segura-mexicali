import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

// Dispara la Task de Apify ya configurada (grupo de Facebook, número de
// posts, etc. quedan definidos ahí mismo en el panel de Apify). El webhook
// que ya está configurado en Apify avisa solo cuando la corrida termina, así
// que aquí solo hace falta arrancarla.
export async function POST() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!supabaseUrl || !supabaseAnonKey) {
    return NextResponse.json({ error: 'Supabase no está configurado.' }, { status: 500 })
  }

  const cookieStore = await cookies()
  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll()
      },
      setAll() {
        // Solo leemos la sesión para verificar quién llama; no hace falta
        // refrescar cookies en esta ruta.
      },
    },
  })

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  const apifyToken = process.env.APIFY_TOKEN
  const taskId = process.env.APIFY_TASK_ID
  if (!apifyToken || !taskId) {
    return NextResponse.json(
      {
        error:
          'Falta configurar APIFY_TOKEN y/o APIFY_TASK_ID en las variables de entorno de Vercel.',
      },
      { status: 500 },
    )
  }

  const res = await fetch(
    `https://api.apify.com/v2/actor-tasks/${taskId}/runs?token=${encodeURIComponent(apifyToken)}`,
    { method: 'POST' },
  )

  if (!res.ok) {
    const detail = await res.text().catch(() => '')
    return NextResponse.json(
      { error: `Apify rechazó la solicitud (HTTP ${res.status}): ${detail.slice(0, 300)}` },
      { status: 502 },
    )
  }

  const data = await res.json()
  return NextResponse.json({
    success: true,
    message: 'Extracción iniciada. Puede tardar uno o dos minutos en terminar.',
    runId: data?.data?.id as string | undefined,
  })
}
