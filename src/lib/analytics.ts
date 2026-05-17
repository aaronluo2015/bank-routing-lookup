import fs from 'fs';
import path from 'path';

const ANALYTICS_PATH = path.join(process.cwd(), 'src/data/analytics.json');

interface QueryLog {
  timestamp: string;
  code: string;
  type: string;
  found: boolean;
  ip?: string;
  source: 'api' | 'web' | 'batch';
}

interface AnalyticsData {
  totalQueries: number;
  apiCalls: number;
  batchCalls: number;
  webQueries: number;
  cacheHits: number;
  dailyCounts: Record<string, number>;
  typeCounts: Record<string, number>;
  recentQueries: QueryLog[];
}

let analytics: AnalyticsData = loadAnalytics();

function loadAnalytics(): AnalyticsData {
  try {
    if (fs.existsSync(ANALYTICS_PATH)) {
      const raw = fs.readFileSync(ANALYTICS_PATH, 'utf-8');
      return JSON.parse(raw);
    }
  } catch { /* ignore */ }
  return {
    totalQueries: 0, apiCalls: 0, batchCalls: 0, webQueries: 0, cacheHits: 0,
    dailyCounts: {}, typeCounts: {}, recentQueries: [],
  };
}

function saveAnalytics(): void {
  try {
    const dir = path.dirname(ANALYTICS_PATH);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    // Keep only last 500 recent queries
    if (analytics.recentQueries.length > 500) {
      analytics.recentQueries = analytics.recentQueries.slice(-500);
    }
    fs.writeFileSync(ANALYTICS_PATH, JSON.stringify(analytics, null, 2), 'utf-8');
  } catch { /* ignore */ }
}

export function trackQuery(code: string, type: string, found: boolean, source: 'api' | 'web' | 'batch', ip?: string): void {
  const today = new Date().toISOString().split('T')[0];

  analytics.totalQueries++;
  if (source === 'api' || source === 'batch') analytics.apiCalls++;
  if (source === 'web') analytics.webQueries++;
  if (source === 'batch') analytics.batchCalls++;

  analytics.dailyCounts[today] = (analytics.dailyCounts[today] || 0) + 1;
  analytics.typeCounts[type] = (analytics.typeCounts[type] || 0) + 1;

  analytics.recentQueries.push({
    timestamp: new Date().toISOString(),
    code, type, found, ip,
    source,
  });

  saveAnalytics();
}

export function trackCacheHit(): void {
  analytics.cacheHits++;
  saveAnalytics();
}

export function getAnalytics(): {
  totalQueries: number; apiCalls: number; cacheHitRate: number;
  queriesByDay: { date: string; count: number }[];
  queriesByType: { type: string; count: number }[];
  recentQueries: QueryLog[];
} {
  const queriesByDay = Object.entries(analytics.dailyCounts)
    .map(([date, count]) => ({ date, count }))
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, 14);

  const queriesByType = Object.entries(analytics.typeCounts)
    .map(([type, count]) => ({ type, count }))
    .sort((a, b) => b.count - a.count);

  return {
    totalQueries: analytics.totalQueries,
    apiCalls: analytics.apiCalls,
    cacheHitRate: analytics.totalQueries > 0
      ? Math.round((analytics.cacheHits / analytics.totalQueries) * 100)
      : 0,
    queriesByDay,
    queriesByType,
    recentQueries: analytics.recentQueries.slice(-50).reverse(),
  };
}
