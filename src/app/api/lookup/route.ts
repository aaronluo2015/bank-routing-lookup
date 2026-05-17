import { NextRequest } from 'next/server';
import { sanitizeInput, getClientIp, errorResponse } from '@/lib/security';
import { detectRoutingCodeType, ROUTING_TYPE_INFO, getTypeInfo } from '@/lib/detectors';
import { validateByType } from '@/lib/validators';
import { lookupWithReconciler } from '@/lib/reconciler';
import { checkRateLimit } from '@/lib/rate-limiter';
import { apiKeyStore } from '@/lib/api-key-store';
import { cacheGet, cacheSet } from '@/lib/cache';
import { trackQuery } from '@/lib/analytics';
import { RoutingCodeType, LookupResult } from '@/lib/types';

export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const rawCode = url.searchParams.get('code');
  const typeParam = url.searchParams.get('type') as RoutingCodeType | null;
  const apiKey = url.searchParams.get('api_key');

  if (!rawCode) {
    return errorResponse(400, 'MISSING_PARAM', 'The "code" parameter is required');
  }

  const code = sanitizeInput(rawCode);

  const ip = getClientIp(request);
  let quotaLimit = 100;

  if (apiKey) {
    const keyRecord = apiKeyStore.verifyApiKey(apiKey);
    if (!keyRecord) {
      return errorResponse(401, 'INVALID_API_KEY', 'Invalid or disabled API key');
    }
    quotaLimit = keyRecord.quota;
  }

  const rateKey = apiKey ? `api:${apiKey}` : `ip:${ip}`;
  const rateResult = checkRateLimit(rateKey, quotaLimit, 86400000);

  if (!rateResult.allowed) {
    return Response.json({
      success: false,
      error: 'RATE_LIMITED',
      message: 'Rate limit exceeded. Try again later or upgrade your plan.',
      retryAfter: Math.ceil((rateResult.resetAt - Date.now()) / 1000),
    }, { status: 429 });
  }

  const type: RoutingCodeType = typeParam || detectRoutingCodeType(code)[0];

  const cacheKey = `api:lookup:${type}:${code.toUpperCase()}`;
  const cached = cacheGet<LookupResult>(cacheKey);
  if (cached) {
    cached.queriedAt = new Date().toISOString();
    trackQuery(code, type, true, apiKey ? 'api' : 'web', ip);
    return Response.json(cached);
  }

  const validation = validateByType(code, type);

  if (!validation.valid) {
    trackQuery(code, type, false, apiKey ? 'api' : 'web', ip);
    const detected = detectRoutingCodeType(code).filter(t => t !== type);
    const suggestions = detected.map(t => {
      const info = getTypeInfo(t);
      return info ? `${info.name}: ${info.example}` : t;
    });

    const result: LookupResult = {
      success: false,
      valid: false,
      code,
      type,
      country: validation.country || 'UNKNOWN',
      countryName: validation.countryName || 'Unknown',
      parsed: {},
      parsedParts: [],
      confidence: 0,
      sources: [],
      queriedAt: new Date().toISOString(),
      error: 'INVALID_FORMAT',
      message: `Not a valid ${type} code`,
      suggestions,
    };
    return Response.json(result, { status: 400 });
  }

  let reconciled = await lookupWithReconciler(code, type);

  // Fallback: for 11-char SWIFT codes, try head office (first 8 chars)
  if (!reconciled && type === 'swift' && code.length === 11) {
    const headOfficeCode = code.substring(0, 8);
    reconciled = await lookupWithReconciler(headOfficeCode, 'swift');
    if (reconciled) {
      reconciled.record.code = code;
      reconciled.record.normalizedCode = code;
    }
  }

  if (!reconciled) {
    trackQuery(code, type, false, apiKey ? 'api' : 'web', ip);
    const result: LookupResult = {
      success: true,
      valid: true,
      code,
      type,
      country: validation.country || 'UNKNOWN',
      countryName: validation.countryName || 'Unknown',
      parsed: validation.parsed as Record<string, string | null | boolean>,
      parsedParts: validation.parsedParts,
      confidence: 0,
      sources: [],
      queriedAt: new Date().toISOString(),
      warnings: ['No bank information found. The format is valid but we could not find details.'],
    };
    return Response.json(result);
  }

  const { record, confidence, conflicts } = reconciled;
  const result: LookupResult = {
    success: true,
    valid: true,
    code,
    type,
    country: record.country,
    countryName: record.countryName,
    parsed: validation.parsed as Record<string, string | null | boolean>,
    parsedParts: validation.parsedParts,
    bank: {
      code: record.code,
      normalizedCode: record.normalizedCode,
      type: record.type,
      country: record.country,
      countryName: record.countryName,
      bankName: record.bankName,
      branch: record.branch,
      address: record.address,
      city: record.city,
      zip: record.zip,
      isHeadOffice: record.isHeadOffice,
      isConnected: record.isConnected,
      lastVerified: record.lastVerified,
      confidence: record.confidence,
      sources: record.sources,
    },
    confidence,
    sources: record.sources,
    verifiedAt: record.lastVerified,
    queriedAt: new Date().toISOString(),
    warnings: conflicts.length > 0
      ? conflicts.map(c => `Conflict in ${c.field}: multiple values from different sources`)
      : undefined,
  };

  cacheSet(cacheKey, result, 3600000);
  trackQuery(code, type, true, apiKey ? 'api' : 'web', ip);

  return Response.json(result);
}

export async function OPTIONS() {
  return new Response(null, {
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Access-Control-Max-Age': '86400',
    },
  });
}
