import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import { supabaseAdmin, isSupabaseAdminConfigured } from '@/lib/supabase-admin'
import {
  fetchApifyDatasetItems,
  processApifyPosts,
  resolveImportBatch,
  summarizeProcessResult,
} from '@/lib/apify-processing'

// Reprocesa el dataset de la última corrida de Apify ya completada, sin
// volver a raspar Facebook (no gasta presupuesto de scraping de Apify,
// solo cuota de Gemini). Útil cuando el webhook falló al guardar (ej. por
// un cambio de esquema pendiente) pero los posts ya se habían extraído.
export const maxDuration = 60

// Con el límite de 15 solicitudes/minuto de Gemini (tier gratis), un
// dataset grande puede tardar varios minutos en clasificarse por completo
// — mucho más que los 60s que da Vercel. En vez de un tamaño de tanda fijo
// (que igual podía tronar si Gemini ya estaba limitando por intentos
// previos), se le da a la función un presupuesto de tiempo: deja de
// arrancar posts nuevos antes de que se acabe, y siempre responde con lo
// que sí alcanzó a hacer. El botón se puede volver a presionar para seguir
// con el resto (los ya guardados se saltan solos).
//
// El presupuesto deja margen bajo los 60s de maxDuration: el deadline solo
// evita arrancar posts nuevos, pero uno ya en curso sigue hasta terminar
// (con timeout propio de ~8-12s por llamada de red gracias a
// fetchWithTimeout), así que el margen absorbe esa cola.
const TIME_BUDGET_MS = 30_000

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
        // Solo leemos la sesión para verificar quién llama.
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
      { error: 'Falta configurar APIFY_TOKEN y/o APIFY_TASK_ID en las variables de entorno de Vercel.' },
      { status: 500 },
    )
  }

  const geminiKey = process.env.GEMINI_API_KEY
  if (!geminiKey) {
    return NextResponse.json(
      { error: 'Falta configurar GEMINI_API_KEY en las variables de entorno.' },
      { status: 500 },
    )
  }

  if (!isSupabaseAdminConfigured || !supabaseAdmin) {
    return NextResponse.json(
      {
        error:
          'Falta configurar NEXT_PUBLIC_SUPABASE_URL y/o SUPABASE_SERVICE_ROLE_KEY en las variables de entorno.',
      },
      { status: 500 },
    )
  }

  const lastRunRes = await fetch(
    `https://api.apify.com/v2/actor-tasks/${taskId}/runs/last?token=${encodeURIComponent(apifyToken)}&status=SUCCEEDED`,
  )
  if (!lastRunRes.ok) {
    const detail = await lastRunRes.text().catch(() => '')
    return NextResponse.json(
      { error: `No se pudo consultar la última corrida en Apify (HTTP ${lastRunRes.status}): ${detail.slice(0, 300)}` },
      { status: 502 },
    )
  }
  const lastRun = await lastRunRes.json()
  const datasetId = lastRun?.data?.defaultDatasetId as string | undefined
  if (!datasetId) {
    return NextResponse.json(
      { error: 'No hay ninguna corrida completada de Apify todavía.' },
      { status: 404 },
    )
  }

  try {
    const admin = supabaseAdmin
    let posts = await fetchApifyDatasetItems(datasetId, apifyToken)

    if (posts.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'La última extracción no tiene publicaciones que reprocesar',
        saved: 0,
        duplicates: 0,
        ignored: 0,
        errors: [],
      })
    }

    // Se descartan en bloque (una sola consulta, no una por post) los que
    // ya se guardaron en una tanda anterior, para que cada clic avance
    // sobre publicaciones nuevas en vez de repetir siempre las primeras
    // del dataset.
    const texts = posts.map((p) => p.text).filter((t): t is string => Boolean(t))
    if (texts.length > 0) {
      const [{ data: existingProps }, { data: existingDemands }] = await Promise.all([
        admin.from('properties').select('description').in('description', texts),
        admin.from('demands').select('message').in('message', texts),
      ])
      const seen = new Set([
        ...(existingProps ?? []).map((r) => r.description as string),
        ...(existingDemands ?? []).map((r) => r.message as string),
      ])
      posts = posts.filter((p) => !p.text || !seen.has(p.text))
    }

    if (posts.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No hay publicaciones nuevas por reprocesar (ya se habían guardado antes)',
        saved: 0,
        duplicates: 0,
        ignored: 0,
        errors: [],
      })
    }

    const resolved = await resolveImportBatch(admin, posts, { filterByToDate: false })
    posts = resolved.posts
    const candidateCount = posts.length

    const result = await processApifyPosts(posts, resolved.importBatchId, admin, geminiKey, {
      deadlineMs: Date.now() + TIME_BUDGET_MS,
    })
    const remaining = Math.max(candidateCount - result.attempted, 0)

    return NextResponse.json({
      success: true,
      message: summarizeProcessResult(result, remaining),
      ...result,
      remaining,
    })
  } catch (error) {
    console.error('Error reprocesando dataset de Apify:', error)
    return NextResponse.json({ error: 'No se pudo reprocesar la última extracción' }, { status: 500 })
  }
}
