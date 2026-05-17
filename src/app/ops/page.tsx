'use client';

import { useEffect, useState } from 'react';

interface Stats {
  totalQueries: number; apiCalls: number; cacheHitRate: number;
  dbSize: number; avgConfidence: number; lastUpdated: string;
  queriesByDay: { date: string; count: number }[];
  queriesByType: { type: string; count: number }[];
  recentQueries: { timestamp: string; code: string; type: string; found: boolean }[];
  sourcesStatus: Record<string, string>;
}

export default function OpsDashboardPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchStats(); }, []);
  async function fetchStats() {
    try {
      const res = await fetch('/api/ops/stats');
      if (res.ok) setStats(await res.json());
    } catch { /* */ } finally { setLoading(false); }
  }

  if (loading) return <div className="text-gray-400 text-sm">Loading...</div>;
  if (!stats) return <div className="text-red-500 text-sm">Failed to load stats</div>;

  const maxDayCount = Math.max(1, ...stats.queriesByDay.map(d => d.count));

  return (
    <div className="space-y-6">
      <h1 className="text-lg font-bold text-gray-900">Dashboard</h1>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        <StatCard label="Total Queries" value={stats.totalQueries.toLocaleString()} color="blue" />
        <StatCard label="API Calls" value={stats.apiCalls.toLocaleString()} color="indigo" />
        <StatCard label="DB Records" value={stats.dbSize.toLocaleString()} color="green" />
        <StatCard label="Avg Confidence" value={`${stats.avgConfidence}%`} color="amber" />
        <StatCard label="Cache Hit" value={`${stats.cacheHitRate}%`} color="purple" />
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Daily trend chart */}
        <div className="bg-white border border-gray-200 rounded-xl p-5">
          <h2 className="text-sm font-semibold text-gray-500 mb-4 uppercase tracking-wider">Daily Queries (14 days)</h2>
          <div className="flex items-end gap-1 h-32">
            {stats.queriesByDay.map(d => (
              <div key={d.date} className="flex-1 flex flex-col items-center gap-1 group">
                <span className="text-[10px] text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity">{d.count}</span>
                <div className="w-full bg-blue-500 rounded-t hover:bg-blue-600 transition-all"
                  style={{ height: `${(d.count / maxDayCount) * 100}%`, minHeight: 2 }} />
                <span className="text-[9px] text-gray-400">{d.date.slice(5)}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Type distribution */}
        <div className="bg-white border border-gray-200 rounded-xl p-5">
          <h2 className="text-sm font-semibold text-gray-500 mb-4 uppercase tracking-wider">By Type</h2>
          <div className="space-y-2">
            {stats.queriesByType.slice(0, 8).map(t => (
              <div key={t.type} className="flex items-center gap-2">
                <span className="text-xs text-gray-600 w-20 shrink-0 truncate">{t.type}</span>
                <div className="flex-1 h-5 bg-gray-100 rounded-full overflow-hidden">
                  <div className="h-full bg-blue-500 rounded-full transition-all"
                    style={{ width: `${Math.max(5, (t.count / (stats.queriesByType[0]?.count || 1)) * 100)}%` }} />
                </div>
                <span className="text-xs text-gray-500 w-10 text-right">{t.count}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent queries */}
      <div className="bg-white border border-gray-200 rounded-xl p-5">
        <h2 className="text-sm font-semibold text-gray-500 mb-4 uppercase tracking-wider">Recent Queries</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-gray-100 text-gray-400">
                <th className="text-left py-2 pr-4">Time</th>
                <th className="text-left py-2 pr-4">Code</th>
                <th className="text-left py-2 pr-4">Type</th>
                <th className="text-left py-2">Status</th>
              </tr>
            </thead>
            <tbody>
              {stats.recentQueries.slice(0, 20).map((q, i) => (
                <tr key={i} className="border-b border-gray-50 hover:bg-gray-50">
                  <td className="py-1.5 pr-4 text-gray-400 font-mono">{new Date(q.timestamp).toLocaleTimeString()}</td>
                  <td className="py-1.5 pr-4 font-mono">{q.code}</td>
                  <td className="py-1.5 pr-4 text-gray-500">{q.type}</td>
                  <td className="py-1.5">
                    <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-medium ${q.found ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-500'}`}>
                      {q.found ? '✓' : '✗'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Source health */}
      <div className="bg-white border border-gray-200 rounded-xl p-5">
        <h2 className="text-sm font-semibold text-gray-500 mb-4 uppercase tracking-wider">Source Health</h2>
        <div className="flex flex-wrap gap-3">
          {Object.entries(stats.sourcesStatus).map(([name, status]) => (
            <span key={name} className={`px-3 py-1.5 rounded-lg text-xs font-medium ${
              status === 'online' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
              'bg-red-50 text-red-500 border border-red-100'
            }`}>
              <span className={`inline-block w-1.5 h-1.5 rounded-full mr-1.5 ${status === 'online' ? 'bg-emerald-500' : 'bg-red-400'}`} />
              {name}: {status}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value, color }: { label: string; value: string; color: string }) {
  const colors: Record<string, string> = {
    blue: 'bg-blue-50 border-blue-200', indigo: 'bg-indigo-50 border-indigo-200',
    green: 'bg-emerald-50 border-emerald-200', amber: 'bg-amber-50 border-amber-200',
    purple: 'bg-purple-50 border-purple-200',
  };
  return (
    <div className={`${colors[color] || 'bg-gray-50 border-gray-200'} border rounded-xl p-4`}>
      <div className="text-xl font-bold text-gray-900">{value}</div>
      <div className="text-[11px] text-gray-500 mt-0.5">{label}</div>
    </div>
  );
}
