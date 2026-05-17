import { NextRequest } from 'next/server';
import { SignJWT } from 'jose';

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET || 'b4cd1a8e9f2d7c3b6e5f0a1928374650');

export async function POST(request: NextRequest) {
  try {
    const { username, password } = await request.json();
    const expectedUser = process.env.OPS_USERNAME || 'opsadmin';
    const expectedPass = process.env.OPS_PASSWORD || 'Ops@2026!BankCode';

    if (username === expectedUser && password === expectedPass) {
      const token = await new SignJWT({ username, role: 'admin' })
        .setProtectedHeader({ alg: 'HS256' })
        .setExpirationTime('24h')
        .sign(JWT_SECRET);

      const response = Response.json({ success: true });
      response.headers.set('Set-Cookie', `bank_ops_token=${token}; HttpOnly; Path=/; Max-Age=86400; SameSite=Lax; Secure`);
      return response;
    }

    return Response.json({ success: false, error: 'Invalid credentials' }, { status: 401 });
  } catch {
    return Response.json({ success: false, error: 'Login failed' }, { status: 500 });
  }
}
