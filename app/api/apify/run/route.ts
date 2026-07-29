import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/

// Dispara la Task de Apify ya configurada (grupo de Facebook, número de
// posts, etc. quedan definidos ahí mismo en el panel de Apify). El webhook
// que ya está configurado en Apify avisa solo cuando la corrida termina, así
// que aquí solo hace falta arrancarla.
//
// Si se manda "from"/"to" (YYYY-MM-DD), se le pide a Apify solo lo posterior
// a "from" (onlyPostsNewerThan, el único límite que el actor soporta de
// forma nativa) y se guarda el rango en import_requests para que el webhook
// recorte también el límite superior al procesar los resultados.
export async function POST(req: Request) {
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

  let body: { from?: string; to?: string } = {}
  try {
    body = await req.json()
  } catch {
    // Sin body también es válido: corre con la configuración por default de la Task.
  }

  const from = body.from && DATE_RE.test(body.from) ? body.from : undefined
  const to = body.to && DATE_RE.test(body.to) ? body.to : undefined

  // Siempre se registra la corrida (aunque no se hayan puesto fechas), para
  // llevar un historial de extracciones y poder marcar qué propiedades
  // vinieron de cuál. El webhook la lee (la más reciente) para etiquetar
  // cada propiedad/solicitud con import_batch_id.
  if (supabaseAdmin) {
    const { error } = await supabaseAdmin
      .from('import_requests')
      .insert({ from_date: from ?? null, to_date: to ?? null })
    if (error) console.error('No se pudo registrar la extracción:', error)
  }

  const runInput = from ? { onlyPostsNewerThan: from, resultsLimit: 100 } : null

  const res = await fetch(
    `https://api.apify.com/v2/actor-tasks/${taskId}/runs?token=${encodeURIComponent(apifyToken)}`,
    runInput
      ? {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(runInput),
        }
      : { method: 'POST' },
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
