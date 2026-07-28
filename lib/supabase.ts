import { createClient, type SupabaseClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey)

export const supabase: SupabaseClient | null = isSupabaseConfigured
  ? createClient(supabaseUrl as string, supabaseAnonKey as string)
  : null

const PROPERTY_IMAGES_BUCKET = 'property-images'

function randomFileName(originalName: string) {
  const ext = originalName.includes('.') ? originalName.split('.').pop() : 'jpg'
  const id = `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`
  return `${id}.${ext}`
}

export async function uploadPropertyImage(file: Blob, fileName = 'photo.jpg'): Promise<string> {
  if (!supabase) throw new Error('Supabase no está configurado.')

  const path = randomFileName(fileName)
  const { error } = await supabase.storage
    .from(PROPERTY_IMAGES_BUCKET)
    .upload(path, file, { contentType: file.type || 'image/jpeg' })
  if (error) throw error

  const { data } = supabase.storage.from(PROPERTY_IMAGES_BUCKET).getPublicUrl(path)
  return data.publicUrl
}

export async function uploadPropertyImages(files: (File | Blob)[]): Promise<string[]> {
  const uploads = files.map((file) =>
    uploadPropertyImage(file, file instanceof File ? file.name : 'photo.jpg'),
  )
  return Promise.all(uploads)
}
