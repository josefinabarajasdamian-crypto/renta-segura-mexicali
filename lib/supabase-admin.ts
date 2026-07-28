import { createClient, type SupabaseClient } from '@supabase/supabase-js'

// Cliente con privilegios de administrador (service_role): salta RLS por
// completo. Úsalo SOLO en código de servidor (Route Handlers), nunca en
// componentes de cliente ni en nada que se envíe al navegador.
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

export const isSupabaseAdminConfigured = Boolean(supabaseUrl && serviceRoleKey)

export const supabaseAdmin: SupabaseClient | null = isSupabaseAdminConfigured
  ? createClient(supabaseUrl as string, serviceRoleKey as string, {
      auth: { persistSession: false, autoRefreshToken: false },
    })
  : null
