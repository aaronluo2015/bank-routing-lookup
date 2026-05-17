import { getLocalDbStats } from '@/lib/local-db';
import { checkAllSourcesHealth } from '@/lib/sources';
import { getAnalytics } from '@/lib/analytics';

export async function GET() {
  const sources = await checkAllSourcesHealth();
  const dbStats = getLocalDbStats();
  const analytics = getAnalytics();

  return Response.json({
    ...analytics,
    dbSize: dbStats.size,
    avgConfidence: dbStats.avgConfidence,
    lastUpdated: dbStats.lastUpdated,
    sourcesStatus: Object.fromEntries(
      Object.entries(sources).map(([k, v]) => [k, v.status])
    ),
  });
}
