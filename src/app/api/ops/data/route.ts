import { NextRequest } from 'next/server';
import { getAllRecords, deleteFromLocalDb, searchLocalDb } from '@/lib/local-db';
import { RoutingCodeType } from '@/lib/types';

export async function GET(request: NextRequest) {
  const query = request.nextUrl.searchParams.get('q') || '';
  const page = Math.max(1, parseInt(request.nextUrl.searchParams.get('page') || '1'));
  const perPage = Math.min(100, Math.max(10, parseInt(request.nextUrl.searchParams.get('perPage') || '20')));

  const all = query ? searchLocalDb(query) : getAllRecords();
  const total = all.length;
  const start = (page - 1) * perPage;
  const records = all.slice(start, start + perPage);

  return Response.json({ records, total, page, perPage });
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
