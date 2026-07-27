import { NextResponse } from 'next/server'

export const runtime = 'nodejs'

const GEMINI_MODEL = process.env.GEMINI_MODEL || 'gemini-3.5-flash-lite'

const EXTRACTION_PROMPT = `Analiza esta captura de pantalla de un grupo de Facebook de renta de inmuebles en Mexicali, Baja California.
Extrae la información y responde ÚNICAMENTE con un objeto JSON estricto (sin markdown, sin texto extra) con esta estructura exacta:
{
  "titulo": string | null,
  "precio": number | null,
  "zona": string | null,
  "clima": string | null,
  "recamaras": number | null,
  "banos": number | null,
  "mascotas": boolean,
  "serviciosIncluidos": string[],
  "telefono": string | null,
  "descripcion": string | null
}

Reglas:
- "precio" es solo el número en pesos mexicanos, sin símbolos ni comas.
- "zona" debe ser la colonia o fraccionamiento de Mexicali mencionado (ej: UABC Central, Palaco, Prohogar, Villafontana, San Pedro).
- "clima" describe el equipo de refrigeración mencionado (minisplit, aire central, toneladas, etc.), o null si no se menciona.
- "serviciosIncluidos" es un arreglo de strings cortos (ej: ["Agua", "Internet", "Gas"]).
- "telefono" es el número de WhatsApp o celular visible en la imagen, o null si no aparece.
- Si algún dato no aparece en la imagen, usa null (o false para mascotas, o [] para serviciosIncluidos).
- Si la imagen no contiene ninguna publicación de renta reconocible, responde con todos los campos en null/false/[].`

interface GeminiResponse {
  candidates?: {
    content?: {
      parts?: { text?: string }[]
    }
  }[]
  error?: { message?: string }
}

export async function POST(req: Request) {
  let imageBase64: string | undefined

  try {
    const body = await req.json()
    imageBase64 = body?.imageBase64
  } catch {
    return NextResponse.json({ error: 'Cuerpo de la solicitud inválido' }, { status: 400 })
  }

  if (!imageBase64 || typeof imageBase64 !== 'string') {
    return NextResponse.json({ error: 'No se proporcionó ninguna imagen' }, { status: 400 })
  }

  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) {
    return NextResponse.json(
      {
        error:
          'Falta configurar GEMINI_API_KEY en las variables de entorno del proyecto (Vercel → Settings → Environment Variables).',
      },
      { status: 500 },
    )
  }

  const base64Data = imageBase64.includes(',') ? imageBase64.split(',')[1] : imageBase64
  const mimeMatch = imageBase64.match(/^data:(image\/[a-zA-Z+]+);base64,/)
  const mimeType = mimeMatch?.[1] ?? 'image/jpeg'

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                { text: EXTRACTION_PROMPT },
                { inline_data: { mime_type: mimeType, data: base64Data } },
              ],
            },
          ],
          generationConfig: { response_mime_type: 'application/json' },
        }),
      },
    )

    const data: GeminiResponse = await response.json()

    if (!response.ok) {
      return NextResponse.json(
        { error: data.error?.message || 'La API de Gemini rechazó la solicitud' },
        { status: response.status },
      )
    }

    const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text
    if (!rawText) {
      return NextResponse.json(
        { error: 'La IA no devolvió contenido. Intenta con otra imagen.' },
        { status: 502 },
      )
    }

    const extractedData = JSON.parse(rawText)

    return NextResponse.json({ success: true, data: extractedData })
  } catch (error) {
    console.error('Error al procesar la imagen con Gemini:', error)
    return NextResponse.json(
      { error: 'No se pudo analizar la imagen. Intenta de nuevo en unos segundos.' },
      { status: 500 },
    )
  }
}
