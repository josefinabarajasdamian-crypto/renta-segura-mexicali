import type { Landmark, Property } from '@/lib/store'

export interface BudgetOption {
  label: string
  minPrice?: number
  maxPrice?: number
}

export const budgetOptions: BudgetOption[] = [
  { label: 'Sin límite' },
  { label: 'Hasta $4,000', maxPrice: 4000 },
  { label: 'Hasta $6,000', maxPrice: 6000 },
  { label: 'Hasta $8,000', maxPrice: 8000 },
  { label: 'Hasta $10,000', maxPrice: 10000 },
  { label: 'Más de $10,000', minPrice: 10000 },
]

// Lista curada (no depende de datos en vivo, así el buscador no necesita
// conectarse a Supabase por su cuenta). Zonas que no estén aquí se pueden
// encontrar de todos modos con el campo de texto libre.
export const zoneOptions = [
  'Cualquier zona',
  'UABC',
  'Palaco',
  'Prohogar',
  'Zona Industrial',
  'Nueva',
  'Centro Cívico',
  'Villafontana',
]

// Quita acentos y pasa a minúsculas, para que "recamara"/"recámara" o
// "zona rio"/"Zona Río" hagan match igual — muy común al escribir rápido
// desde el celular.
function normalize(text: string): string {
  return text
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
}

export function getBudgetOption(label: string | null): BudgetOption {
  return budgetOptions.find((b) => b.label === label) ?? budgetOptions[0]
}

export function matchesZone(property: Property, zone: string | null): boolean {
  if (!zone || zone === 'Cualquier zona') return true
  const haystack = normalize(`${property.zone} ${property.location}`)
  return haystack.includes(normalize(zone))
}

export function matchesBudget(property: Property, budgetLabel: string | null): boolean {
  const { minPrice, maxPrice } = getBudgetOption(budgetLabel)
  if (minPrice == null && maxPrice == null) return true
  // Si no sabemos el precio (importado sin precio detectado), lo dejamos
  // fuera cuando hay un tope o mínimo específico — no podemos confirmar
  // que cumpla.
  if (property.price == null) return false
  if (minPrice != null && property.price < minPrice) return false
  if (maxPrice != null && property.price > maxPrice) return false
  return true
}

const NUMBER_WORDS: Record<string, number> = {
  un: 1,
  uno: 1,
  una: 1,
  dos: 2,
  tres: 3,
  cuatro: 4,
  cinco: 5,
  seis: 6,
}

function wordToNumber(raw: string): number | null {
  if (/^\d+$/.test(raw)) return parseInt(raw, 10)
  return NUMBER_WORDS[raw.toLowerCase()] ?? null
}

const NUM_TOKEN = '(\\d+|un|uno|una|dos|tres|cuatro|cinco|seis)'

// Espera texto ya normalizado (sin acentos, minúsculas).
function extractCount(text: string, unitPattern: string): { value: number | null; rest: string } {
  const match = text.match(new RegExp(`\\b${NUM_TOKEN}\\s*${unitPattern}\\b`, 'i'))
  if (!match || match.index == null) return { value: null, rest: text }
  const rest = (text.slice(0, match.index) + text.slice(match.index + match[0].length))
    .replace(/\s+/g, ' ')
    .trim()
  return { value: wordToNumber(match[1]), rest }
}

// Traduce referencias como "cerca del Hospital General" a la zona real
// que hay que buscar (Landmark.zoneKeyword), quitando esa frase del resto
// del texto libre. Usa el alias más largo que aparezca, para que un
// alias más específico no quede opacado por uno más corto contenido en él.
// Espera texto ya normalizado.
function extractLandmark(
  text: string,
  landmarks: Landmark[],
): { zoneKeyword: string | null; rest: string } {
  const sorted = [...landmarks].sort((a, b) => b.alias.length - a.alias.length)
  for (const lm of sorted) {
    const alias = normalize(lm.alias)
    const idx = text.indexOf(alias)
    if (idx !== -1) {
      const rest = (text.slice(0, idx) + text.slice(idx + alias.length)).replace(/\s+/g, ' ').trim()
      return { zoneKeyword: lm.zoneKeyword, rest }
    }
  }
  return { zoneKeyword: null, rest: text }
}

// "2 recámaras" y "una recámara" deben filtrar distinto — un simple
// "el texto contiene 'recámara'" hace match con ambos (recámara es
// substring de recámaras) sin importar la cantidad. Se detecta la
// cantidad mencionada y se compara contra el dato real (bedrooms/
// bathrooms) en vez de solo buscarla como texto.
export function parseSmartQuery(
  query: string,
  landmarks: Landmark[] = [],
): {
  bedrooms: number | null
  bathrooms: number | null
  zoneKeyword: string | null
  text: string
} {
  const normalized = normalize(query)
  const bedroomsResult = extractCount(normalized, 'recamaras?')
  const bathroomsResult = extractCount(bedroomsResult.rest, 'banos?')
  const landmarkResult = extractLandmark(bathroomsResult.rest, landmarks)
  return {
    bedrooms: bedroomsResult.value,
    bathrooms: bathroomsResult.value,
    zoneKeyword: landmarkResult.zoneKeyword,
    text: landmarkResult.rest,
  }
}

export function matchesQuery(property: Property, query: string | null): boolean {
  const q = query?.trim()
  if (!q) return true
  const haystack = normalize(
    [property.title, property.description, property.location, property.zone, ...property.tags]
      .filter(Boolean)
      .join(' '),
  )
  return normalize(q)
    .split(/\s+/)
    .every((word) => haystack.includes(word))
}

export function filterProperties(
  properties: Property[],
  filters: { q?: string | null; zone?: string | null; budget?: string | null },
  landmarks: Landmark[] = [],
): Property[] {
  const { bedrooms, bathrooms, zoneKeyword, text } = parseSmartQuery(
    filters.q?.trim() ?? '',
    landmarks,
  )
  return properties.filter((p) => {
    if (bedrooms != null && p.bedrooms !== bedrooms) return false
    if (bathrooms != null && p.bathrooms !== bathrooms) return false
    if (zoneKeyword && !matchesZone(p, zoneKeyword)) return false
    return matchesQuery(p, text) && matchesZone(p, filters.zone ?? null) && matchesBudget(p, filters.budget ?? null)
  })
}
