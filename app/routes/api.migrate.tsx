export async function loader() {
  return Response.json({ ok: true, message: 'Run migrations from Supabase Dashboard SQL Editor' })
}
