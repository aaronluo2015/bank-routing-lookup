import { NextRequest, NextResponse } from 'next/server';

const MAX_BODY_SIZE = 1024 * 100; // 100KB max request body

export function sanitizeInput(input: string): string {
  return input
    .replace(/[<>'"`;]/g, '')
    .replace(/[\x00-\x1f\x7f]/g, '')
    .trim()
    .slice(0, 100);
}

export function getClientIp(request: NextRequest): string {
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) return forwarded.split(',')[0].trim().slice(0, 45);
  const realIp = request.headers.get('x-real-ip');
  if (realIp) return realIp.trim().slice(0, 45);
  const cfIp = request.headers.get('cf-connecting-ip');
  if (cfIp) return cfIp.trim().slice(0, 45);
  return 'unknown';
}

export function errorResponse(status: number, error: string, message: string): NextResponse {
  return NextResponse.json({
    success: false,
    error,
    message,
  }, { status });
}

export function validateRequestMethod(request: NextRequest, allowed: string[]): NextResponse | null {
  if (!allowed.includes(request.method)) {
    return errorResponse(405, 'METHOD_NOT_ALLOWED', `Only ${allowed.join(', ')} allowed`);
  }
  return null;
}

export async function validateRequestBody(request: NextRequest): Promise<Record<string, unknown> | null> {
  const contentLength = parseInt(request.headers.get('content-length') || '0', 10);
  if (contentLength > MAX_BODY_SIZE) {
    return null; // too large
  }

  const contentType = request.headers.get('content-type') || '';
  if (!contentType.includes('application/json')) {
    return null;
  }

  try {
    const text = await request.text();
    if (text.length > MAX_BODY_SIZE) return null;
    return JSON.parse(text);
  } catch {
    return null;
  }
}

export function sanitizeUrl(url: string): string {
  try {
    const parsed = new URL(url);
    // Only allow http/https
    if (!['http:', 'https:'].includes(parsed.protocol)) return '';
    // Block local addresses
    if (['localhost', '127.0.0.1', '0.0.0.0', '[::1]'].includes(parsed.hostname)) return '';
    // Block private IP ranges
    if (/^(10\.|172\.(1[6-9]|2\d|3[01])\.|192\.168\.)/.test(parsed.hostname)) return '';
    return parsed.toString();
  } catch {
    return '';
  }
}

export function createSafeJson(data: unknown, status: number = 200): NextResponse {
  const body = JSON.stringify(data);
  // Prevent JSON hijacking
  const response = new NextResponse(body, {
    status,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'X-Content-Type-Options': 'nosniff',
    },
  });
  return response;
}
