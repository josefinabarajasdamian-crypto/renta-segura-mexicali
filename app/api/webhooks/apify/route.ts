import { NextResponse } from 'next/server'
import type { SupabaseClient } from '@supabase/supabase-js'
import { supabaseAdmin, isSupabaseAdminConfigured } from '@/lib/supabase-admin'

// Procesar cada post (imagen + Gemini) uno por uno tardaba más de los 10s
// por default de Vercel y Apify nunca recibía respuesta (quedaba "Unknown").
// Le damos más margen y además procesamos los posts en paralelo.
export const maxDuration = 60

const GEMINI_MODEL = process.env.GEMINI_MODEL || 'gemini-3.5-flash-lite'
const PROPERTY_IMAGES_BUCKET = 'property-images'

interface ApifyAttachment {
  thumbnail?: string
  photo_image?: { uri?: string }
  image?: { uri?: string }
}

interface ApifyPost {
  text?: string
  attachments?: ApifyAttachment[]
  url?: string
  time?: string
  groupTitle?: string
  // El scraper de Facebook manda esto como objeto ({id, name, profilePic}),
  // no como texto simple.
  user?: string | { name?: string }
}

function getPostUserName(post: ApifyPost): string | null {
  if (!post.user) return null
  if (typeof post.user === 'string') return post.user
  return post.user.name || null
}

// Filtro determinista extra (además del "ignore" que decide Gemini) para
// no publicar solicitudes de venta en el Muro de Demandas.
const SALE_KEYWORDS = ['venta', 'terreno', 'traspaso', 'compro', 'remate']

function looksLikeSalePost(text: string | undefined): boolean {
  if (!text) return false
  const lower = text.toLowerCase()
  return SALE_KEYWORDS.some((keyword) => lower.includes(keyword))
}

// Nunca guardamos 0 como precio real: si la IA no detectó un precio
// confiable (o dio un número irrisorio), lo dejamos en null.
function cleanPropertyPrice(price: number | null): number | null {
  if (price == null || !Number.isFinite(price) || price < 1000) return null
  return price
}

// Las fotos vienen dentro de "attachments", en distinta forma según el post
// tenga una sola foto (photo_image.uri) o varias (image.uri, con un primer
// elemento "mediaset" que no es una foto en sí).
function extractAttachmentUrls(post: ApifyPost): string[] {
  if (!Array.isArray(post.attachments)) return []
  const urls: string[] = []
  for (const att of post.attachments) {
    const uri = att?.photo_image?.uri || att?.image?.uri || att?.thumbnail
    if (typeof uri === 'string' && !urls.includes(uri)) urls.push(uri)
  }
  return urls.slice(0, 6)
}

interface ParsedListing {
  ignore: boolean
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

const EXTRACTION_PROMPT = `Analiza este texto (y la imagen adjunta, si se te proporciona una) de una publicación de Facebook sobre inmuebles en Mexicali, Baja California.

Determina si es una OFERTA de renta (alguien ofrece una propiedad en renta), una BÚSQUEDA (alguien busca dónde rentar), o si no tiene relación con arrendamiento (venta de propiedades, terrenos, locales comerciales, traspasos, u otro tema).

Responde ÚNICAMENTE con un objeto JSON estricto (sin markdown, sin texto extra) con esta estructura exacta:
{
  "ignore": boolean,
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
- "ignore" debe ser true si la publicación es una VENTA de propiedad, terreno o local comercial (no arrendamiento), un traspaso, o no tiene relación con vivienda en renta ni con búsqueda de renta en Mexicali. En ese caso el resto de los campos pueden quedar en null/false.
- "type" es "PROPERTY" si alguien ofrece una propiedad en RENTA, "DEMAND" si alguien busca dónde rentar. Nunca uses "PROPERTY" para una publicación de venta (esa debe llevar "ignore": true).
- "price" es solo el número en pesos mexicanos, sin símbolos ni comas. Si el texto da un rango (ej. "6000 a 7000"), usa el valor más alto del rango.
- Si el precio no aparece claramente en el texto (por ejemplo dice "Inbox", "Precio por privado/inbox", o simplemente no lo menciona), responde "price": null — pero igual genera un "title" limpio y descriptivo con el resto de la información disponible.
- Si se te proporciona una imagen del volante/publicación y el precio no aparece en el texto, revisa si el precio está escrito en la imagen y úsalo.
- "zone" es la colonia o fraccionamiento de Mexicali mencionado.
- "AC_type" describe el equipo de clima mencionado (minisplit, aire central, etc.), o null si no se menciona.
- "phone" es el número de WhatsApp o celular visible en el texto, o null si no aparece.`

interface FetchedImage {
  buffer: Buffer
  mimeType: string
}

async function fetchImageBuffer(url: string): Promise<FetchedImage | null> {
  try {
    const res = await fetch(url)
    if (!res.ok) return null
    const buffer = Buffer.from(await res.arrayBuffer())
    const mimeType = res.headers.get('content-type') || 'image/jpeg'
    return { buffer, mimeType }
  } catch {
    return null
  }
}

function randomStorageFileName(mimeType: string) {
  const ext = mimeType.split('/')[1]?.split('+')[0] || 'jpg'
  const id = `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 10)}`
  return `apify-${id}.${ext}`
}

// Las URLs de Facebook (scontent-...fbcdn.net) traen tokens que expiran a
// los pocos días, así que re-subimos la foto a nuestro propio bucket para
// que la publicación no se quede con una imagen rota más adelante.
async function uploadImageToStorage(
  admin: SupabaseClient,
  image: FetchedImage,
): Promise<string | null> {
  const path = randomStorageFileName(image.mimeType)
  const { error } = await admin.storage
    .from(PROPERTY_IMAGES_BUCKET)
    .upload(path, image.buffer, { contentType: image.mimeType })
  if (error) return null
  const { data } = admin.storage.from(PROPERTY_IMAGES_BUCKET).getPublicUrl(path)
  return data.publicUrl
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

// El tier gratis de Gemini permite pocas solicitudes por minuto (15 para
// gemini-3.5-flash-lite). Si nos topamos con ese límite (HTTP 429),
// esperamos el tiempo que la propia API sugiere y reintentamos.
async function parseWithGemini(
  post: ApifyPost,
  apiKey: string,
  firstImage: FetchedImage | null,
  attempt = 1,
): Promise<ParsedListing> {
  const parts: Array<{ text: string } | { inline_data: { mime_type: string; data: string } }> = [
    { text: `${EXTRACTION_PROMPT}\n\nTexto de la publicación:\n"""${post.text ?? ''}"""` },
  ]

  if (firstImage) {
    parts.push({
      inline_data: { mime_type: firstImage.mimeType, data: firstImage.buffer.toString('base64') },
    })
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
    if (response.status === 429 && attempt <= 3) {
      const retryInfo = (data?.error?.details as Array<Record<string, unknown>> | undefined)?.find(
        (d) => typeof d?.retryDelay === 'string',
      )
      const retryDelaySeconds = retryInfo ? parseFloat(String(retryInfo.retryDelay)) : NaN
      const waitMs = (Number.isFinite(retryDelaySeconds) ? retryDelaySeconds : attempt * 5) * 1000
      await sleep(waitMs)
      return parseWithGemini(post, apiKey, firstImage, attempt + 1)
    }
    throw new Error(data?.error?.message || 'La API de Gemini rechazó la solicitud')
  }

  const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text
  if (!rawText) throw new Error('La IA no devolvió contenido para esta publicación')
  return JSON.parse(rawText) as ParsedListing
}

async function mapWithConcurrency<T, R>(
  items: T[],
  limit: number,
  fn: (item: T) => Promise<R>,
): Promise<PromiseSettledResult<R>[]> {
  const results: PromiseSettledResult<R>[] = new Array(items.length)
  let nextIndex = 0

  async function worker() {
    while (nextIndex < items.length) {
      const current = nextIndex++
      try {
        results[current] = { status: 'fulfilled', value: await fn(items[current]) }
      } catch (reason) {
        results[current] = { status: 'rejected', reason }
      }
    }
  }

  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, worker))
  return results
}

async function fetchApifyDatasetItems(datasetId: string, token: string): Promise<ApifyPost[]> {
  const res = await fetch(
    `https://api.apify.com/v2/datasets/${datasetId}/items?token=${encodeURIComponent(token)}`,
  )
  if (!res.ok) {
    const detail = await res.text().catch(() => '')
    throw new Error(
      `No se pudieron obtener los resultados del dataset de Apify (HTTP ${res.status}): ${detail.slice(0, 300)}`,
    )
  }
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

    // El actor de Apify solo soporta un límite inferior de fecha
    // (onlyPostsNewerThan). Si desde /dashboard/revision se pidió también
    // un límite superior, se guardó en import_requests al lanzar esta
    // corrida — lo leemos aquí (el más reciente y no muy viejo) para
    // recortar los posts más nuevos que ese día.
    if (datasetId) {
      const { data: recentRequest } = await admin
        .from('import_requests')
        .select('to_date, created_at')
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle()

      const isRecent =
        recentRequest?.created_at &&
        Date.now() - new Date(recentRequest.created_at).getTime() < 2 * 60 * 60 * 1000

      if (isRecent && recentRequest?.to_date) {
        const cutoff = new Date(`${recentRequest.to_date}T23:59:59`).getTime()
        posts = posts.filter((post) => !post.time || new Date(post.time).getTime() <= cutoff)
      }
    }

    // Concurrencia limitada para no reventar el límite de 15 solicitudes
    // por minuto del tier gratis de Gemini.
    const results = await mapWithConcurrency(
      posts,
      3,
      async (post) => {
        // Evita volver a importar el mismo post de Facebook si el scraper
        // corre otra vez sobre el mismo grupo (el texto del post es el
        // identificador más confiable que tenemos, ya que guardamos el
        // texto tal cual en description/message).
        if (post.text) {
          const [{ data: dupProperty }, { data: dupDemand }] = await Promise.all([
            admin.from('properties').select('id').eq('description', post.text).limit(1).maybeSingle(),
            admin.from('demands').select('id').eq('message', post.text).limit(1).maybeSingle(),
          ])
          if (dupProperty || dupDemand) return 'duplicate' as const
        }

        const attachmentUrls = extractAttachmentUrls(post)
        const firstImage = attachmentUrls[0] ? await fetchImageBuffer(attachmentUrls[0]) : null

        const parsed = await parseWithGemini(post, geminiKey, firstImage)

        // Ventas, terrenos, traspasos, etc. — no es lo que este directorio
        // publica, así que ni siquiera se guarda como borrador.
        if (parsed.ignore) return 'ignored' as const

        if (parsed.type === 'DEMAND') {
          if (looksLikeSalePost(post.text)) return 'ignored' as const

          const userName = getPostUserName(post)
          const { error } = await admin.from('demands').insert({
            name: userName || 'Usuario de Facebook',
            anonymous: !userName,
            message: post.text || '',
            budget: parsed.price != null ? String(parsed.price) : null,
            zone: parsed.zone || 'Mexicali',
            tenants: '1',
            source: 'apify_facebook',
            needs_review: true,
            source_url: post.url || null,
            posted_at: post.time || null,
            source_group: post.groupTitle || null,
          })
          // 23505 = unique_violation: dos posts idénticos se procesaron al
          // mismo tiempo (concurrencia) y ya se guardó el otro primero.
          if (error) {
            if (error.code === '23505') return 'duplicate' as const
            throw error
          }
        } else {
          // Re-sube las fotos a nuestro propio bucket en vez de guardar los
          // links de Facebook (esos expiran a los pocos días).
          const fetchedImages = await Promise.all(
            attachmentUrls.map((url, i) => (i === 0 ? Promise.resolve(firstImage) : fetchImageBuffer(url))),
          )
          const uploadedUrls = (
            await Promise.all(
              fetchedImages.map((img) => (img ? uploadImageToStorage(admin, img) : Promise.resolve(null))),
            )
          ).filter((url): url is string => Boolean(url))

          const { error } = await admin.from('properties').insert({
            title: parsed.title || 'Publicación importada de Facebook',
            price: cleanPropertyPrice(parsed.price),
            zone: parsed.zone || 'Mexicali',
            location: `${parsed.zone || 'Mexicali'}, Mexicali`,
            image: uploadedUrls[0] || '',
            images: uploadedUrls,
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
            source_url: post.url || null,
            posted_at: post.time || null,
            source_group: post.groupTitle || null,
          })
          if (error) {
            if (error.code === '23505') return 'duplicate' as const
            throw error
          }
        }
        return 'saved' as const
      },
    )

    let saved = 0
    let duplicates = 0
    let ignored = 0
    const errors: string[] = []
    for (const result of results) {
      if (result.status === 'fulfilled') {
        if (result.value === 'duplicate') duplicates++
        else if (result.value === 'ignored') ignored++
        else saved++
      } else {
        console.error('Error procesando post de Apify:', result.reason)
        errors.push(result.reason instanceof Error ? result.reason.message : 'Error desconocido')
      }
    }

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
