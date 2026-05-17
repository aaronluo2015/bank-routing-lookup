import { getLocalDbStats } from '@/lib/local-db';
import { checkAllSourcesHealth } from '@/lib/sources';
import { cacheSize } from '@/lib/cache';

const startTime = Date.now();

export async function GET() {
  const sources = await checkAllSourcesHealth();
  const dbStats = getLocalDbStats();
  const uptimeMs = Date.now() - startTime;

  const days = Math.floor(uptimeMs / 86400000);
  const hours = Math.floor((uptimeMs % 86400000) / 3600000);
  const minutes = Math.floor((uptimeMs % 3600000) / 60000);

  const allOnline = Object.values(sources).every(s => s.status === 'online');
  const anyOnline = Object.values(sources).some(s => s.status === 'online');

  return Response.json({
    status: dbStats.size > 0 ? 'ok' : 'degraded',
    uptime: `${days}d ${hours}h ${minutes}m`,
    version: '1.0.0',
    sources,
    localDb: dbStats,
    cacheSize: cacheSize(),
    timestamp: new Date().toISOString(),
  });
}
