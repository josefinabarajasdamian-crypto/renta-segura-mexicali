import { NextResponse } from 'next/server'
import { supabaseAdmin, isSupabaseAdminConfigured } from '@/lib/supabase-admin'
import {
  fetchApifyDatasetItems,
  processApifyPosts,
  resolveImportBatch,
  type ApifyPost,
} from '@/lib/apify-processing'

// Procesar cada post (imagen + Gemini) uno por uno tardaba más de los 10s
// por default de Vercel y Apify nunca recibía respuesta (quedaba "Unknown").
// Le damos más margen y además procesamos los posts en paralelo.
export const maxDuration = 60

export async function POST(req: Request) {
  const secret = req.headers.get('x-apify-secret')
  if (!secret || secret !== process.env.APIFY_WEBHOOK_SECRET) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
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

  let body: Record<string, unknown>
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Cuerpo de la solicitud inválido' }, { status: 400 })
  }

  try {
    let posts: ApifyPost[] = []

    // Webhook real de Apify (evento RUN.SUCCEEDED): solo trae metadata del
    // run, hay que ir a buscar los items al Dataset API.
    const datasetId = (body?.resource as { defaultDatasetId?: string } | undefined)
      ?.defaultDatasetId
    if (datasetId) {
      const apifyToken = process.env.APIFY_TOKEN
      if (!apifyToken) {
        return NextResponse.json(
          { error: 'Falta configurar APIFY_TOKEN para leer el dataset de Apify.' },
          { status: 500 },
        )
      }
      posts = await fetchApifyDatasetItems(datasetId, apifyToken)
    } else if (Array.isArray(body?.items)) {
      // Modo de prueba manual: { "items": [ {text, images, ...}, ... ] }
      posts = body.items as ApifyPost[]
    } else if (typeof body?.text === 'string') {
      // Modo de prueba manual: un solo post directo en el body.
      posts = [body as ApifyPost]
    }

    if (posts.length === 0) {
      return NextResponse.json({ success: true, message: 'No hay publicaciones que procesar', saved: 0 })
    }

    const admin = supabaseAdmin

    // El actor de Apify solo soporta un límite inferior de fecha
    // (onlyPostsNewerThan). Si desde /dashboard/revision se pidió también
    // un límite superior, se guardó en import_requests al lanzar esta
    // corrida — lo leemos aquí (el más reciente y no muy viejo) para
    // recortar los posts más nuevos que ese día, y para etiquetar cada
    // propiedad/solicitud con a qué extracción pertenece.
    let importBatchId: string | null = null
    if (datasetId) {
      const resolved = await resolveImportBatch(admin, posts)
      importBatchId = resolved.importBatchId
      posts = resolved.posts
    }

    const { saved, duplicates, ignored, errors } = await processApifyPosts(
      posts,
      importBatchId,
      admin,
      geminiKey,
    )

    return NextResponse.json({
      success: true,
      message: `${saved} publicación(es) guardada(s) como borrador, ${duplicates} ya existían, ${ignored} ignoradas (venta u otro)`,
      saved,
      duplicates,
      ignored,
      errors,
    })
  } catch (error) {
    console.error('Error en webhook de Apify:', error)
    return NextResponse.json({ error: 'No se pudo procesar el webhook' }, { status: 500 })
  }
}
