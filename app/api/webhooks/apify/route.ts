import { NextResponse } from 'next/server'
import { supabaseAdmin, isSupabaseAdminConfigured } from '@/lib/supabase-admin'

// Procesar cada post (imagen + Gemini) uno por uno tardaba más de los 10s
// por default de Vercel y Apify nunca recibía respuesta (quedaba "Unknown").
// Le damos más margen y además procesamos los posts en paralelo.
export const maxDuration = 60

const GEMINI_MODEL = process.env.GEMINI_MODEL || 'gemini-3.5-flash-lite'

interface ApifyPost {
  text?: string
  images?: string[]
  url?: string
  postedAt?: string
  user?: string
}

interface ParsedListing {
  type: 'PROPERTY' | 'DEMAND'
  title: string | null
  price: number | null
  zone: string | null
  AC_type: string | null
  bedrooms: number | null
  bathrooms: number | null
  allowsPets: boolean
  phone: string | null
}

const EXTRACTION_PROMPT = `Analiza este texto de una publicación de Facebook sobre renta de inmuebles en Mexicali, Baja California.
Determina si es una OFERTA de renta (alguien ofrece una propiedad) o una BÚSQUEDA (alguien busca dónde rentar).
Responde ÚNICAMENTE con un objeto JSON estricto (sin markdown, sin texto extra) con esta estructura exacta:
{
  "type": "PROPERTY" | "DEMAND",
  "title": string | null,
  "price": number | null,
  "zone": string | null,
  "AC_type": string | null,
  "bedrooms": number | null,
  "bathrooms": number | null,
  "allowsPets": boolean,
  "phone": string | null
}

Reglas:
- "type" es "PROPERTY" si alguien ofrece una propiedad en renta, "DEMAND" si alguien busca dónde rentar.
- "price" es solo el número en pesos mexicanos, sin símbolos ni comas.
- "zone" es la colonia o fraccionamiento de Mexicali mencionado.
- "AC_type" describe el equipo de clima mencionado (minisplit, aire central, etc.), o null si no se menciona.
- "phone" es el número de WhatsApp o celular visible en el texto, o null si no aparece.
- Si el texto no tiene relación con renta de inmuebles en Mexicali, responde con "type": "DEMAND" y el resto de los campos en null/false.`

async function fetchImageAsBase64(url: string): Promise<{ data: string; mimeType: string } | null> {
  try {
    const res = await fetch(url)
    if (!res.ok) return null
    const buffer = await res.arrayBuffer()
    const mimeType = res.headers.get('content-type') || 'image/jpeg'
    return { data: Buffer.from(buffer).toString('base64'), mimeType }
  } catch {
    return null
  }
}

async function parseWithGemini(post: ApifyPost, apiKey: string): Promise<ParsedListing> {
  const parts: Array<{ text: string } | { inline_data: { mime_type: string; data: string } }> = [
    { text: `${EXTRACTION_PROMPT}\n\nTexto de la publicación:\n"""${post.text ?? ''}"""` },
  ]

  if (post.images?.[0]) {
    const image = await fetchImageAsBase64(post.images[0])
    if (image) parts.push({ inline_data: { mime_type: image.mimeType, data: image.data } })
  }

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts }],
        generationConfig: {
          response_mime_type: 'application/json',
          temperature: 0.1,
          maxOutputTokens: 500,
        },
      }),
    },
  )

  const data = await response.json()
  if (!response.ok) {
    throw new Error(data?.error?.message || 'La API de Gemini rechazó la solicitud')
  }

  const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text
  if (!rawText) throw new Error('La IA no devolvió contenido para esta publicación')
  return JSON.parse(rawText) as ParsedListing
}

async function fetchApifyDatasetItems(datasetId: string, token: string): Promise<ApifyPost[]> {
  const res = await fetch(
    `https://api.apify.com/v2/datasets/${datasetId}/items?token=${encodeURIComponent(token)}`,
  )
  if (!res.ok) throw new Error('No se pudieron obtener los resultados del dataset de Apify')
  return res.json()
}

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

    const results = await Promise.allSettled(
      posts.map(async (post) => {
        const parsed = await parseWithGemini(post, geminiKey)

        if (parsed.type === 'DEMAND') {
          const { error } = await admin.from('demands').insert({
            name: post.user || 'Usuario de Facebook',
            anonymous: !post.user,
            message: post.text || '',
            budget: parsed.price ? `$${parsed.price}` : 'No especificado',
            zone: parsed.zone || 'Mexicali',
            tenants: '1',
            source: 'apify_facebook',
            needs_review: true,
          })
          if (error) throw error
        } else {
          const { error } = await admin.from('properties').insert({
            title: parsed.title || 'Publicación importada de Facebook',
            price: parsed.price || 0,
            zone: parsed.zone || 'Mexicali',
            location: `${parsed.zone || 'Mexicali'}, Mexicali`,
            image: post.images?.[0] || '',
            images: post.images?.length ? post.images : [],
            whatsapp: (parsed.phone || '').replace(/\D/g, ''),
            cooling_type: parsed.AC_type,
            bedrooms: parsed.bedrooms,
            bathrooms: parsed.bathrooms,
            pets_policy: parsed.allowsPets ? 'Cualquier mascota' : 'No acepta',
            tags: [],
            status: 'Disponible',
            source: 'apify_facebook',
            needs_review: true,
            description: post.text || null,
          })
          if (error) throw error
        }
      }),
    )

    let saved = 0
    const errors: string[] = []
    for (const result of results) {
      if (result.status === 'fulfilled') {
        saved++
      } else {
        console.error('Error procesando post de Apify:', result.reason)
        errors.push(result.reason instanceof Error ? result.reason.message : 'Error desconocido')
      }
    }

    return NextResponse.json({
      success: true,
      message: `${saved} publicación(es) procesada(s) y guardada(s) como borrador`,
      saved,
      errors,
    })
  } catch (error) {
    console.error('Error en webhook de Apify:', error)
    return NextResponse.json({ error: 'No se pudo procesar el webhook' }, { status: 500 })
  }
}
