import { NextRequest } from 'next/server';
import { apiKeyStore } from '@/lib/api-key-store';
import { ApiKeyRecord } from '@/lib/types';

export async function GET() {
  const keys = apiKeyStore.getAllKeys();
  return Response.json({ keys });
}

export async function POST(request: NextRequest) {
  try {
    const { name, tier } = await request.json();
    if (!name) {
      return Response.json({ success: false, error: 'Name is required' }, { status: 400 });
    }

    const result = apiKeyStore.createApiKey(name, tier || 'free');
    return Response.json({
      success: true,
      plainKey: result.plainKey,
      record: result.record,
    });
  } catch {
    return Response.json({ success: false, error: 'Invalid request' }, { status: 400 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, ...updates } = body;
    if (!id) {
      return Response.json({ success: false, error: 'ID is required' }, { status: 400 });
    }

    const updated = apiKeyStore.updateKey(id, updates);
    return Response.json({ success: updated });
  } catch {
    return Response.json({ success: false, error: 'Invalid request' }, { status: 400 });
  }
}

export async function DELETE(request: NextRequest) {
  const id = request.nextUrl.searchParams.get('id');
  if (!id) {
    return Response.json({ success: false, error: 'ID is required' }, { status: 400 });
  }

  const deleted = apiKeyStore.deleteKey(id);
  return Response.json({ success: deleted });
}
