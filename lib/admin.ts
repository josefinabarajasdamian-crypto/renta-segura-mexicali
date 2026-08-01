// No hay un rol "admin" en profiles — el panel de revisión de importados
// (/dashboard/revision) y sus rutas de Apify son de un solo operador, así
// que basta con una lista de correos permitidos. NEXT_PUBLIC_ porque el
// dashboard también la usa del lado del cliente para ocultar el botón; no
// es información sensible (conocer el correo no permite iniciar sesión
// como ese usuario, solo el dueño de esa cuenta puede autenticarse).
const ADMIN_EMAILS = (process.env.NEXT_PUBLIC_ADMIN_EMAILS || '')
  .split(',')
  .map((email) => email.trim().toLowerCase())
  .filter(Boolean)

export function isAdminEmail(email: string | null | undefined): boolean {
  if (!email || ADMIN_EMAILS.length === 0) return false
  return ADMIN_EMAILS.includes(email.toLowerCase())
}
