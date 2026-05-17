import { NextRequest } from 'next/server';
import { getAllRecords, deleteFromLocalDb, searchLocalDb } from '@/lib/local-db';
import { RoutingCodeType } from '@/lib/types';

export async function GET(request: NextRequest) {
  const query = request.nextUrl.searchParams.get('q');
  const records = query ? searchLocalDb(query) : getAllRecords();
  return Response.json({ records: records.slice(0, 200), total: records.length });
}

export async function DELETE(request: NextRequest) {
  const code = request.nextUrl.searchParams.get('code');
  const type = request.nextUrl.searchParams.get('type') as RoutingCodeType | null;

  if (!code || !type) {
    return Response.json({ success: false, error: 'Missing code or type' }, { status: 400 });
  }

  const deleted = deleteFromLocalDb(code, type);
  return Response.json({ success: true, deleted });
}
