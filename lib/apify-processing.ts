import type { SupabaseClient } from '@supabase/supabase-js'

const GEMINI_MODEL = process.env.GEMINI_MODEL || 'gemini-3.5-flash-lite'
const PROPERTY_IMAGES_BUCKET = 'property-images'

export interface ApifyAttachment {
  thumbnail?: string
  photo_image?: { uri?: string }
  image?: { uri?: string }
}

export interface ApifyPost {
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
const RENTAL_KEYWORDS = ['renta', 'rento', 'arriendo', 'alquiler', 'roomie', 'roomies']

function looksLikeSalePost(text: string | undefined): boolean {
  if (!text) return false
  const lower = text.toLowerCase()
  return SALE_KEYWORDS.some((keyword) => lower.includes(keyword))
}

// Filtro previo a Gemini: si el texto trae palabras de venta y ninguna de
// renta, no vale la pena gastar una llamada a la IA — casi seguro Gemini
// también lo hubiera marcado como "ignore". Si hay ambigüedad (menciona
// ambas, o no menciona ninguna) se deja pasar y que decida Gemini.
function looksLikeSaleOnlyPost(text: string | undefined): boolean {
  if (!text) return false
  const lower = text.toLowerCase()
  const hasSaleWord = SALE_KEYWORDS.some((keyword) => lower.includes(keyword))
  if (!hasSaleWord) return false
  const hasRentalWord = RENTAL_KEYWORDS.some((keyword) => lower.includes(keyword))
  return !hasRentalWord
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

// El tier gratis de Gemini permite solo 15 solicitudes por minuto (para
// gemini-3.5-flash-lite). Con 3 posts en paralelo, mandábamos ráfagas que
// agotaban esas 15 en unos segundos y pasábamos el resto del minuto
// reintentando en vano (los reintentos fallidos también parecen contar
// contra la misma cuota). En vez de reaccionar al 429, este "pacer"
// reparte las llamadas de antemano a un ritmo sostenible — así casi nunca
// se llega a topar con el límite.
const GEMINI_MIN_INTERVAL_MS = 4200 // ~14.3/min, con margen bajo el tope de 15

function createGeminiPacer(deadlineMs?: number) {
  let nextSlot = 0
  return async function waitForSlot() {
    const now = Date.now()
    const wait = Math.max(nextSlot - now, 0)
    if (deadlineMs && now + wait > deadlineMs) {
      throw new Error('Se acabó el tiempo esperando su turno para Gemini, se reintentará después')
    }
    nextSlot = Math.max(nextSlot, now) + GEMINI_MIN_INTERVAL_MS
    if (wait > 0) await sleep(wait)
  }
}

// El tier gratis de Gemini permite solo 15 solicitudes por minuto (para
// gemini-3.5-flash-lite). Si de todos modos nos topamos con el límite
// (HTTP 429) — por ejemplo si el pacer y la ventana real de Google no
// coinciden exacto — esperamos el tiempo que la propia API sugiere y
// reintentamos, como respaldo.
async function parseWithGemini(
  post: ApifyPost,
  apiKey: string,
  firstImage: FetchedImage | null,
  deadlineMs?: number,
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
      // No esperamos más de lo que le queda de vida útil a la función: si
      // el retraso que pide Gemini nos sacaría del tiempo disponible, es
      // mejor fallar este post ahora (se reintenta en el siguiente clic)
      // que arrastrar a toda la tanda a un timeout de la función.
      if (deadlineMs && Date.now() + waitMs > deadlineMs) {
        throw new Error('Se alcanzó el límite de solicitudes de Gemini, se reintentará después')
      }
      await sleep(waitMs)
      return parseWithGemini(post, apiKey, firstImage, deadlineMs, attempt + 1)
    }
    throw new Error(data?.error?.message || 'La API de Gemini rechazó la solicitud')
  }

  const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text
  if (!rawText) throw new Error('La IA no devolvió contenido para esta publicación')
  return JSON.parse(rawText) as ParsedListing
}

// Si se pasa deadlineMs, deja de arrancar posts nuevos una vez que se
// cumple (los que ya estaban en curso sí terminan) — así una función con
// límite de tiempo siempre alcanza a responder, en vez de quedar cortada a
// medias. Las posiciones que nunca se llegaron a intentar quedan
// "undefined" en el resultado.
async function mapWithConcurrency<T, R>(
  items: T[],
  limit: number,
  fn: (item: T) => Promise<R>,
  deadlineMs?: number,
): Promise<Array<PromiseSettledResult<R> | undefined>> {
  const results: Array<PromiseSettledResult<R> | undefined> = new Array(items.length)
  let nextIndex = 0

  async function worker() {
    while (nextIndex < items.length) {
      if (deadlineMs && Date.now() >= deadlineMs) return
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

export async function fetchApifyDatasetItems(datasetId: string, token: string): Promise<ApifyPost[]> {
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

export interface ProcessResult {
  saved: number
  duplicates: number
  ignored: number
  errors: string[]
  // Cuántos posts se llegaron a intentar de verdad (los demás quedaron
  // pendientes por el límite de tiempo, si se pasó deadlineMs).
  attempted: number
}

// Núcleo compartido: clasifica cada post con Gemini y lo guarda como
// propiedad/solicitud pendiente de revisión. Lo usan tanto el webhook de
// Apify (posts recién raspados) como la ruta de reprocesamiento (posts de
// un dataset que ya se había raspado antes, sin gastar cuota de scraping
// de nuevo).
export async function processApifyPosts(
  posts: ApifyPost[],
  importBatchId: string | null,
  admin: SupabaseClient,
  geminiKey: string,
  options: { deadlineMs?: number } = {},
): Promise<ProcessResult> {
  const { deadlineMs } = options
  const waitForGeminiSlot = createGeminiPacer(deadlineMs)

  // La concurrencia es solo para las partes que no son Gemini (chequeo de
  // duplicados, bajar imágenes, subirlas a Storage) — el pacer de arriba
  // serializa las llamadas a Gemini entre los workers para no reventar el
  // límite de 15 solicitudes por minuto del tier gratis.
  const results = await mapWithConcurrency(
    posts,
    3,
    async (post) => {
      // Evita volver a importar el mismo post de Facebook si el scraper corre
      // otra vez sobre el mismo grupo (el texto del post es el identificador
      // más confiable que tenemos, ya que guardamos el texto tal cual en
      // description/message).
      if (post.text) {
        const [{ data: dupProperty }, { data: dupDemand }] = await Promise.all([
          admin.from('properties').select('id').eq('description', post.text).limit(1).maybeSingle(),
          admin.from('demands').select('id').eq('message', post.text).limit(1).maybeSingle(),
        ])
        if (dupProperty || dupDemand) return 'duplicate' as const
      }

      const attachmentUrls = extractAttachmentUrls(post)

      // Filtros deterministas antes de gastar una llamada a Gemini: sin
      // texto ni imagen no hay nada que extraer, y un post que solo habla
      // de venta (sin mencionar renta) casi seguro Gemini lo hubiera
      // marcado "ignore" de todos modos.
      if (!post.text && attachmentUrls.length === 0) return 'ignored' as const
      if (looksLikeSaleOnlyPost(post.text)) return 'ignored' as const

      const firstImage = attachmentUrls[0] ? await fetchImageBuffer(attachmentUrls[0]) : null

      await waitForGeminiSlot()
      const parsed = await parseWithGemini(post, geminiKey, firstImage, deadlineMs)

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
          import_batch_id: importBatchId,
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
          import_batch_id: importBatchId,
        })
        if (error) {
          if (error.code === '23505') return 'duplicate' as const
          throw error
        }
      }
      return 'saved' as const
    },
    deadlineMs,
  )

  let saved = 0
  let duplicates = 0
  let ignored = 0
  let attempted = 0
  const errors: string[] = []
  for (const result of results) {
    if (!result) continue // no se alcanzó a intentar por el límite de tiempo
    attempted++
    if (result.status === 'fulfilled') {
      if (result.value === 'duplicate') duplicates++
      else if (result.value === 'ignored') ignored++
      else saved++
    } else {
      console.error('Error procesando post de Apify:', result.reason)
      errors.push(result.reason instanceof Error ? result.reason.message : 'Error desconocido')
    }
  }

  return { saved, duplicates, ignored, errors, attempted }
}

// Arma el texto que ve el admin en el dashboard/logs. Sin esto, los posts
// que fallaron (ej. por la cuota de Gemini agotada) desaparecían del
// mensaje sin dejar rastro — se veían igual que si nunca se hubiera
// llamado a la IA, lo que hacía imposible saber si una corrida realmente
// probó una nueva clave de Gemini o si todo se resolvió antes de llegar
// a la IA (duplicados o posts de venta filtrados).
export function summarizeProcessResult(result: ProcessResult, remaining = 0): string {
  const { saved, duplicates, ignored, errors } = result
  const quotaErrors = errors.filter((e) => /quota|límite de solicitudes/i.test(e)).length

  let message = `${saved} publicación(es) guardada(s) como borrador, ${duplicates} ya existían, ${ignored} ignoradas (venta u otro)`
  if (errors.length > 0) {
    message += `, ${errors.length} con error`
    if (quotaErrors > 0) message += ' (parece ser el límite de Gemini)'
  }
  if (remaining > 0) message += `. Quedan ${remaining} más — dale clic otra vez para seguir.`
  return message
}

// El actor de Apify solo soporta un límite inferior de fecha
// (onlyPostsNewerThan). Si desde /dashboard/revision se pidió también un
// límite superior, se guardó en import_requests al lanzar la corrida — lo
// leemos aquí (el más reciente) para recortar los posts más nuevos que ese
// día, y para etiquetar cada propiedad/solicitud con a qué extracción
// pertenece.
export async function resolveImportBatch(
  admin: SupabaseClient,
  posts: ApifyPost[],
  options: { filterByToDate?: boolean } = {},
): Promise<{ importBatchId: string | null; posts: ApifyPost[] }> {
  const { filterByToDate = true } = options

  const { data: recentRequest } = await admin
    .from('import_requests')
    .select('id, to_date, created_at')
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  const isRecent =
    recentRequest?.created_at &&
    Date.now() - new Date(recentRequest.created_at).getTime() < 2 * 60 * 60 * 1000

  if (!isRecent) return { importBatchId: null, posts }

  let filteredPosts = posts
  // El recorte por "Hasta" solo tiene sentido en el webhook en vivo, donde
  // la corrida que se está procesando es justo la que disparó esa misma
  // solicitud (segundos antes). Al reprocesar una corrida ya vieja, la
  // solicitud más reciente en import_requests puede ser de otro rango de
  // fechas por completo y filtraría todo — ahí solo interesa etiquetar el
  // lote, no recortar por fecha.
  if (filterByToDate && recentRequest?.to_date) {
    const cutoff = new Date(`${recentRequest.to_date}T23:59:59`).getTime()
    filteredPosts = posts.filter((post) => !post.time || new Date(post.time).getTime() <= cutoff)
  }

  return { importBatchId: recentRequest?.id ?? null, posts: filteredPosts }
}
