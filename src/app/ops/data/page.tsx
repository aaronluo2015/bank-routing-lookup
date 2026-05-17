'use client';

import { useEffect, useState } from 'react';
import { BankRecord } from '@/lib/types';

const PER_PAGE = 20;

export default function OpsDataPage() {
  const [records, setRecords] = useState<BankRecord[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<BankRecord | null>(null);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);

  useEffect(() => { loadRecords(); }, []);

  async function loadRecords() {
    setLoading(true);
    try {
      const res = await fetch('/api/ops/data');
      if (res.ok) {
        const data = await res.json();
        setRecords(data.records || []);
        setTotal(data.total || data.records?.length || 0);
      }
    } catch { /* */ } finally { setLoading(false); }
  }

  const filtered = records.filter(r =>
    !search || r.code.toLowerCase().includes(search.toLowerCase()) ||
    r.bankName.toLowerCase().includes(search.toLowerCase())
  );

  const totalPages = Math.ceil(filtered.length / PER_PAGE);
  const paged = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE);

  async function handleDelete(code: string, type: string) {
    if (!confirm(`Delete ${code}?`)) return;
    await fetch(`/api/ops/data?code=${encodeURIComponent(code)}&type=${type}`, { method: 'DELETE' });
    loadRecords();
  }

  async function handleEnrich() {
    await fetch('/api/enrich', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ minConfidence: 70 }) });
    alert('Enrichment triggered. Check back later for updated data.');
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-lg font-bold text-gray-900">Data Management</h1>
        <div className="flex gap-2">
          <button onClick={handleEnrich} className="px-3 py-1.5 bg-indigo-600 text-white text-xs rounded-lg hover:bg-indigo-700">Enrich Low Quality</button>
          <button onClick={loadRecords} className="px-3 py-1.5 border border-gray-300 text-gray-600 text-xs rounded-lg hover:bg-gray-50">Refresh</button>
        </div>
      </div>

      <input type="text" placeholder="Search code or bank name..." value={search}
        onChange={e => { setSearch(e.target.value); setPage(1); }}
        className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm mb-3 outline-none focus:border-blue-400" />

      {loading ? <p className="text-gray-400 text-sm">Loading...</p> : (
        <>
          <div className="flex justify-between items-center mb-2">
            <p className="text-xs text-gray-400">{total} records · {filtered.length} filtered · Page {page}/{totalPages || 1}</p>
            <div className="flex gap-1">
              <button disabled={page <= 1} onClick={() => setPage(p => Math.max(1, p - 1))}
                className="px-2 py-1 text-xs border rounded disabled:opacity-30 hover:bg-gray-50">‹ Prev</button>
              {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
                const start = Math.max(1, Math.min(page - 3, totalPages - 6));
                const p = start + i;
                if (p > totalPages) return null;
                return (
                  <button key={p} onClick={() => setPage(p)}
                    className={`px-2 py-1 text-xs rounded ${p === page ? 'bg-blue-600 text-white' : 'border hover:bg-gray-50'}`}>{p}</button>
                );
              })}
              <button disabled={page >= totalPages} onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                className="px-2 py-1 text-xs border rounded disabled:opacity-30 hover:bg-gray-50">Next ›</button>
            </div>
          </div>

          <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left px-4 py-2 font-medium text-gray-500 text-xs">Code</th>
                  <th className="text-left px-4 py-2 font-medium text-gray-500 text-xs">Type</th>
                  <th className="text-left px-4 py-2 font-medium text-gray-500 text-xs">Bank Name</th>
                  <th className="text-left px-4 py-2 font-medium text-gray-500 text-xs">Country</th>
                  <th className="text-left px-4 py-2 font-medium text-gray-500 text-xs">Conf</th>
                  <th className="text-left px-4 py-2 font-medium text-gray-500 text-xs">Actions</th>
                </tr>
              </thead>
              <tbody>
                {paged.map((r, i) => (
                  <tr key={i} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="px-4 py-1.5 font-mono text-xs">{r.code}</td>
                    <td className="px-4 py-1.5 text-xs text-gray-500">{r.type}</td>
                    <td className="px-4 py-1.5 text-xs truncate max-w-[200px]">{r.bankName}</td>
                    <td className="px-4 py-1.5 text-xs text-gray-500">{r.countryName}</td>
                    <td className="px-4 py-1.5">
                      <span className={`text-xs font-medium ${r.confidence >= 80 ? 'text-green-600' : r.confidence >= 50 ? 'text-yellow-600' : 'text-red-500'}`}>
                        {r.confidence}%
                      </span>
                    </td>
                    <td className="px-4 py-1.5 space-x-2">
                      <button onClick={() => setSelected(r)} className="text-blue-600 text-xs hover:text-blue-800">Detail</button>
                      <button onClick={() => handleDelete(r.code, r.type)} className="text-red-500 text-xs hover:text-red-700">Del</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {selected && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50" onClick={() => setSelected(null)}>
          <div className="bg-white rounded-xl p-6 max-w-lg w-full mx-4 max-h-[80vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <h3 className="font-bold text-gray-900 mb-3">Record Detail</h3>
            <div className="space-y-1.5 text-xs">
              {Object.entries(selected).filter(([k]) => !['conflicts', 'sourceLog', 'sources', 'normalizedCode'].includes(k)).map(([key, value]) => (
                <div key={key} className="flex"><span className="text-gray-400 w-28 shrink-0">{key}</span><span className="text-gray-900 font-mono">{String(value ?? '-')}</span></div>
              ))}
            </div>
            {selected.sources?.length > 0 && (
              <div className="mt-3 pt-3 border-t"><p className="text-xs text-gray-400 mb-1">Sources:</p>
                <div className="flex flex-wrap gap-1">{selected.sources.map(s => <span key={s} className="px-2 py-0.5 bg-gray-100 rounded text-[10px]">{s}</span>)}</div>
              </div>
            )}
            {selected.sourceLog?.length > 0 && (
              <div className="mt-3 pt-3 border-t"><p className="text-xs text-gray-400 mb-1">Source Log ({selected.sourceLog.length} entries):</p>
                <div className="space-y-1 max-h-[200px] overflow-y-auto">
                  {selected.sourceLog.slice(-10).map((log: any, i: number) => (
                    <div key={i} className="flex items-center gap-1 text-[10px]">
                      <span className={log.success ? 'text-green-500' : 'text-red-400'}>{log.success ? '✓' : '✗'}</span>
                      <span className="text-gray-500">{log.source}</span>
                      <span className="text-gray-400">{log.data?.bankName || log.error || ''}</span>
                      {log.chosen && <span className="text-blue-500 font-medium">← chosen</span>}
                    </div>
                  ))}
                </div>
              </div>
            )}
            <button onClick={() => setSelected(null)} className="mt-4 w-full py-2 bg-gray-100 text-gray-700 rounded-lg text-sm hover:bg-gray-200">Close</button>
          </div>
        </div>
      )}
    </div>
  );
}
