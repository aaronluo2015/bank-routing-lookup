'use client';

import { useEffect, useState } from 'react';

interface SourceInfo {
  name: string;
  status: 'online' | 'offline' | 'degraded';
  lastCheck: string;
  callCount?: number;
  contribution?: number;
}

export default function AdminSourcesPage() {
  const [sources, setSources] = useState<SourceInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [checking, setChecking] = useState(false);

  useEffect(() => {
    loadSources();
  }, []);

  async function loadSources() {
    setLoading(true);
    try {
      const res = await fetch('/api/health');
      if (res.ok) {
        const data = await res.json();
        const list = Object.entries(data.sources || {}).map(([name, info]: [string, unknown]) => ({
          name,
          status: (info as { status: string }).status as SourceInfo['status'],
          lastCheck: (info as { lastCheck: string }).lastCheck,
        }));
        setSources(list);
      }
    } catch { /* ignore */ } finally {
      setLoading(false);
    }
  }

  async function handleTest() {
    setChecking(true);
    await loadSources();
    setChecking(false);
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-lg font-bold text-gray-900">数据源监控</h1>
        <button onClick={handleTest} disabled={checking}
          className="px-3 py-1.5 bg-blue-600 text-white text-xs rounded-lg hover:bg-blue-700 disabled:opacity-50">
          {checking ? '检测中...' : '刷新检测'}
        </button>
      </div>

      {loading ? (
        <p className="text-gray-400 text-sm">加载中...</p>
      ) : (
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-4 py-2 font-medium text-gray-500">数据源</th>
                <th className="text-left px-4 py-2 font-medium text-gray-500">状态</th>
                <th className="text-left px-4 py-2 font-medium text-gray-500">最后检测</th>
              </tr>
            </thead>
            <tbody>
              {sources.map(s => (
                <tr key={s.name} className="border-b border-gray-100">
                  <td className="px-4 py-3 font-medium">{s.name}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      s.status === 'online' ? 'bg-green-100 text-green-700' :
                      s.status === 'degraded' ? 'bg-yellow-100 text-yellow-700' :
                      'bg-red-100 text-red-700'
                    }`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${
                        s.status === 'online' ? 'bg-green-500' :
                        s.status === 'degraded' ? 'bg-yellow-500' : 'bg-red-500'
                      }`} />
                      {s.status === 'online' ? '在线' : s.status === 'degraded' ? '降级' : '离线'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-400">
                    {new Date(s.lastCheck).toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
