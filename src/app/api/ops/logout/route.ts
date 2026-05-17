export async function POST() {
  const response = Response.json({ success: true });
  response.headers.set('Set-Cookie', 'bank_ops_token=; HttpOnly; Path=/; Max-Age=0; SameSite=Lax');
  return response;
}
