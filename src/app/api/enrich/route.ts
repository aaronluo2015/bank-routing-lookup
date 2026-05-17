import { NextRequest } from 'next/server';
import { errorResponse } from '@/lib/security';
import { getLowConfidenceRecords, saveManyToLocalDb } from '@/lib/local-db';
import { lookupWithReconciler } from '@/lib/reconciler';
import { EnrichRequest } from '@/lib/types';
import { detectRoutingCodeType } from '@/lib/detectors';

export async function POST(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  const expectedSecret = process.env.ENRICH_SECRET;

  if (!expectedSecret || authHeader !== `Bearer ${expectedSecret}`) {
    return errorResponse(401, 'UNAUTHORIZED', 'Invalid enrichment secret');
  }

  let body: EnrichRequest = {};
  try {
    const text = await request.text();
    if (text) body = JSON.parse(text);
  } catch {
    // use defaults
  }

  const minConfidence = body.minConfidence || 70;
  const records = getLowConfidenceRecords(minConfidence);
  const targetRecords = records.slice(0, 50);

  const results = await Promise.allSettled(
    targetRecords.map(async (record) => {
      const reconciled = await lookupWithReconciler(record.code, record.type);
      return reconciled?.record || null;
    })
  );

  const updated: typeof targetRecords = [];
  const errors: string[] = [];

  for (const r of results) {
    if (r.status === 'fulfilled' && r.value) {
      updated.push(r.value);
    } else if (r.status === 'rejected') {
      errors.push(String(r.reason));
    }
  }

  if (updated.length > 0) {
    saveManyToLocalDb(updated);
  }

  return Response.json({
    success: true,
    processed: targetRecords.length,
    updated: updated.length,
    created: 0,
    errors,
  });
}
