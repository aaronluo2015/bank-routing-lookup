import { NextRequest } from 'next/server';
import { sanitizeInput, errorResponse } from '@/lib/security';
import { detectRoutingCodeType } from '@/lib/detectors';
import { lookupWithReconciler } from '@/lib/reconciler';
import { RoutingCodeType, BatchLookupRequest } from '@/lib/types';

export async function POST(request: NextRequest) {
  let body: BatchLookupRequest;

  try {
    body = await request.json();
  } catch {
    return errorResponse(400, 'INVALID_JSON', 'Request body must be valid JSON');
  }

  if (!body.codes || !Array.isArray(body.codes) || body.codes.length === 0) {
    return errorResponse(400, 'MISSING_CODES', 'The "codes" array is required');
  }

  if (body.codes.length > 100) {
    return errorResponse(400, 'TOO_MANY_CODES', 'Maximum 100 codes per batch request');
  }

  const codes = body.codes.map(c => sanitizeInput(String(c)));
  const type = body.type as RoutingCodeType | undefined;

  const results = await Promise.all(
    codes.map(async (code) => {
      const detectedType = type || detectRoutingCodeType(code)[0];
      const reconciled = await lookupWithReconciler(code, detectedType);

      if (!reconciled) {
        return {
          success: false,
          valid: false,
          code,
          type: detectedType,
          country: 'UNKNOWN',
          countryName: 'Unknown',
          parsed: {},
          parsedParts: [],
          confidence: 0,
          sources: [],
          queriedAt: new Date().toISOString(),
          error: 'NOT_FOUND',
          message: 'Could not find or validate this code',
        };
      }

      return {
        success: true,
        valid: true,
        code,
        type: detectedType,
        country: reconciled.record.country,
        countryName: reconciled.record.countryName,
        bankName: reconciled.record.bankName,
        confidence: reconciled.confidence,
        sources: reconciled.record.sources,
        queriedAt: new Date().toISOString(),
      };
    })
  );

  const found = results.filter(r => r.success).length;

  return Response.json({
    success: true,
    results,
    total: results.length,
    found,
  });
}

export async function OPTIONS() {
  return new Response(null, {
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Access-Control-Max-Age': '86400',
    },
  });
}
