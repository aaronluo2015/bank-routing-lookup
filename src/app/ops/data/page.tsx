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

  useEffect(() => { loadPage(1); }, []);

  async function loadPage(pageNum: number) {
    setLoading(true);
    try {
      const q = search ? `&q=${encodeURIComponent(search)}` : '';
      const res = await fetch(`/api/ops/data?page=${pageNum}&perPage=${PER_PAGE}${q}`);
      if (res.ok) {
        const data = await res.json();
        setRecords(data.records || []);
        setTotal(data.total || 0);
        setPage(pageNum);
      }
    } catch { /* */ } finally { setLoading(false); }
  }

  function handleSearch(val: string) {
    setSearch(val);
    loadPage(1);
  }

  const totalPages = Math.ceil(total / PER_PAGE);

  async function handleDelete(code: string, type: string) {
    if (!confirm(`Delete ${code}?`)) return;
    await fetch(`/api/ops/data?code=${encodeURIComponent(code)}&type=${type}`, { method: 'DELETE' });
    loadPage(page);
  }

  async function handleEnrich() {
    await fetch('/api/enrich', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ minConfidence: 70 }) });
    alert('Enrichment triggered.');
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-lg font-bold text-gray-900">Data Management</h1>
        <div className="flex gap-2">
          <button onClick={handleEnrich} className="px-3 py-1.5 bg-indigo-600 text-white text-xs rounded-lg hover:bg-indigo-700">Enrich</button>
          <button onClick={() => loadPage(page)} className="px-3 py-1.5 border border-gray-300 text-gray-600 text-xs rounded-lg hover:bg-gray-50">Refresh</button>
        </div>
      </div>

      <input type="text" placeholder="Search code or bank name..." defaultValue={search}
        onKeyDown={e => { if (e.key === 'Enter') handleSearch((e.target as HTMLInputElement).value); }}
        className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm mb-3 outline-none focus:border-blue-400" />

      {loading ? <p className="text-gray-400 text-sm">Loading...</p> : (
        <>
          <div className="flex justify-between items-center mb-2">
            <p className="text-xs text-gray-400">{total.toLocaleString()} records · Page {page} of {totalPages || 1}</p>
            <div className="flex gap-1">
              <button disabled={page <= 1} onClick={() => loadPage(page - 1)}
                className="px-2 py-1 text-xs border rounded disabled:opacity-30 hover:bg-gray-50">‹</button>
              {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
                const start = Math.max(1, Math.min(page - 3, totalPages - 6));
                const p = start + i;
                if (p > totalPages) return null;
                return (
                  <button key={p} onClick={() => loadPage(p)}
                    className={`px-2 py-1 text-xs rounded ${p === page ? 'bg-blue-600 text-white' : 'border hover:bg-gray-50'}`}>{p}</button>
                );
              })}
              <button disabled={page >= totalPages} onClick={() => loadPage(page + 1)}
                className="px-2 py-1 text-xs border rounded disabled:opacity-30 hover:bg-gray-50">›</button>
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
                  <th className="text-left px-4 py-2 font-medium text-gray-500 text-xs">Act</th>
                </tr>
              </thead>
              <tbody>
                {records.map((r, i) => (
                  <tr key={i} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="px-4 py-1.5 font-mono text-xs">{r.code}</td>
                    <td className="px-4 py-1.5 text-xs text-gray-500">{r.type}</td>
                    <td className="px-4 py-1.5 text-xs truncate max-w-[200px]">{r.bankName}</td>
                    <td className="px-4 py-1.5 text-xs text-gray-500">{r.countryName}</td>
                    <td className="px-4 py-1.5">
                      <span className={`text-xs font-medium ${(r.confidence || 80) >= 80 ? 'text-green-600' : (r.confidence || 80) >= 50 ? 'text-yellow-600' : 'text-red-500'}`}>
                        {r.confidence || 80}%
                      </span>
                    </td>
                    <td className="px-4 py-1.5 space-x-2">
                      <button onClick={() => setSelected(r)} className="text-blue-600 text-xs hover:text-blue-800">View</button>
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
            <button onClick={() => setSelected(null)} className="mt-4 w-full py-2 bg-gray-100 text-gray-700 rounded-lg text-sm hover:bg-gray-200">Close</button>
          </div>
        </div>
      )}
    </div>
  );
}
