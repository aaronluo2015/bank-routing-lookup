import { NextRequest, NextResponse } from 'next/server';

export function middleware(request: NextRequest) {
  const response = NextResponse.next();
  const pathname = request.nextUrl.pathname;

  // Security headers
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-XSS-Protection', '1; mode=block');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');
  response.headers.set('X-DNS-Prefetch-Control', 'off');
  response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=(), interest-cohort=()');
  response.headers.set('Cross-Origin-Opener-Policy', 'same-origin');
  response.headers.set('Cross-Origin-Resource-Policy', 'same-origin');

  // CSP - strict but allows our own assets and external APIs
  if (pathname.startsWith('/api/')) {
    response.headers.set('Content-Security-Policy', "default-src 'none'; frame-ancestors 'none'");
  } else {
    response.headers.set(
      'Content-Security-Policy',
      "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self'; connect-src 'self' https:; frame-ancestors 'none'"
    );
  }

  // Ops route protection
  if (pathname.startsWith('/ops') && pathname !== '/ops/login') {
    const authCookie = request.cookies.get('bank_ops_token');
    if (!authCookie?.value) {
      return NextResponse.redirect(new URL('/ops/login', request.url));
    }
  }

  // API enrichment protection
  if (pathname.startsWith('/api/enrich')) {
    const authHeader = request.headers.get('authorization');
    const expected = process.env.ENRICH_SECRET;
    if (!expected || !authHeader || authHeader !== `Bearer ${expected}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
  }

  // API CORS: allow from anywhere for public APIs
  if (pathname.startsWith('/api/') && !pathname.startsWith('/api/ops/')) {
    response.headers.set('Access-Control-Allow-Origin', '*');
    response.headers.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    response.headers.set('Access-Control-Max-Age', '86400');
  }

  // Block common attack paths
  const blockedPaths = ['/wp-admin', '/wp-login', '/.env', '/.git', '/phpmyadmin', '/adminer', '/xmlrpc.php', '/.htaccess'];
  if (blockedPaths.some(p => pathname.toLowerCase().startsWith(p))) {
    return new NextResponse('Not Found', { status: 404 });
  }

  return response;
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
