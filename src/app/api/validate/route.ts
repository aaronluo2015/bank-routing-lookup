import { NextRequest } from 'next/server';
import { sanitizeInput, errorResponse } from '@/lib/security';
import { detectRoutingCodeType } from '@/lib/detectors';
import { validateByType } from '@/lib/validators';
import { RoutingCodeType } from '@/lib/types';

export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const rawCode = url.searchParams.get('code');
  const typeParam = url.searchParams.get('type') as RoutingCodeType | null;

  if (!rawCode) {
    return errorResponse(400, 'MISSING_PARAM', 'The "code" parameter is required');
  }

  const code = sanitizeInput(rawCode);
  const detected = detectRoutingCodeType(code);

  if (typeParam && !detected.includes(typeParam)) {
    detected.unshift(typeParam);
  }

  const results = detected.map(type => {
    const validation = validateByType(code, type);
    return {
      type,
      valid: validation.valid,
      country: validation.country,
      countryName: validation.countryName,
      parsed: validation.parsed,
      parsedParts: validation.parsedParts,
    };
  });

  const best = results.find(r => r.valid) || results[0];

  return Response.json({
    success: true,
    valid: best.valid,
    code,
    type: best.type,
    country: best.country,
    parsed: best.parsed,
    parsedParts: best.parsedParts,
    alternatives: results.filter(r => r.type !== best.type),
  });
}

export async function OPTIONS() {
  return new Response(null, {
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}
