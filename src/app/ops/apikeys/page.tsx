'use client';

import { useEffect, useState } from 'react';
import { ApiKeyRecord } from '@/lib/types';

export default function OpsApiKeysPage() {
  const [keys, setKeys] = useState<ApiKeyRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [newKey, setNewKey] = useState<{ plainKey: string; record: ApiKeyRecord } | null>(null);
  const [formName, setFormName] = useState('');
  const [formTier, setFormTier] = useState<string>('free');

  useEffect(() => {
    loadKeys();
  }, []);

  async function loadKeys() {
    setLoading(true);
    try {
      const res = await fetch('/api/ops/apikeys');
      if (res.ok) {
        const data = await res.json();
        setKeys(data.keys || []);
      }
    } catch { /* ignore */ } finally {
      setLoading(false);
    }
  }

  async function handleCreate() {
    if (!formName.trim()) return;
    try {
      const res = await fetch('/api/ops/apikeys', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: formName, tier: formTier }),
      });
      if (res.ok) {
        const data = await res.json();
        setNewKey(data);
        setFormName('');
        loadKeys();
      }
    } catch { /* ignore */ }
  }

  async function handleToggle(id: string, enabled: boolean) {
    await fetch('/api/ops/apikeys', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, enabled: !enabled }),
    });
    loadKeys();
  }

  async function handleDelete(id: string) {
    if (!confirm('确定删除此 API Key?')) return;
    await fetch(`/api/ops/apikeys?id=${id}`, { method: 'DELETE' });
    loadKeys();
  }

  return (
    <div>
      <h1 className="text-lg font-bold text-gray-900 mb-6">API Key 管理</h1>

      <div className="bg-white border border-gray-200 rounded-xl p-4 mb-6">
        <h2 className="font-medium text-sm text-gray-900 mb-3">创建新 Key</h2>
        <div className="flex gap-2">
          <input
            type="text" placeholder="Key 名称" value={formName}
            onChange={e => setFormName(e.target.value)}
            className="flex-1 px-3 py-1.5 border border-gray-300 rounded-lg text-sm outline-none focus:border-blue-500"
          />
          <select value={formTier} onChange={e => setFormTier(e.target.value)}
            className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm outline-none">
            <option value="free">Free (100/天)</option>
            <option value="starter">Starter (10,000/月)</option>
            <option value="growth">Growth (100,000/月)</option>
            <option value="business">Business (500,000/月)</option>
          </select>
          <button onClick={handleCreate}
            className="px-4 py-1.5 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700">
            生成
          </button>
        </div>
        {newKey && (
          <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-lg">
            <p className="text-xs text-green-700 font-medium mb-1">新 Key 已生成（仅显示一次）</p>
            <code className="text-xs text-green-800 break-all">{newKey.plainKey}</code>
            <button onClick={() => setNewKey(null)}
              className="block mt-2 text-xs text-green-600 hover:text-green-800">关闭</button>
          </div>
        )}
      </div>

      {loading ? (
        <p className="text-gray-400 text-sm">加载中...</p>
      ) : (
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-4 py-2 font-medium text-gray-500">名称</th>
                <th className="text-left px-4 py-2 font-medium text-gray-500">层级</th>
                <th className="text-left px-4 py-2 font-medium text-gray-500">已用/配额</th>
                <th className="text-left px-4 py-2 font-medium text-gray-500">状态</th>
                <th className="text-left px-4 py-2 font-medium text-gray-500">创建时间</th>
                <th className="text-left px-4 py-2 font-medium text-gray-500">操作</th>
              </tr>
            </thead>
            <tbody>
              {keys.map(k => (
                <tr key={k.id} className="border-b border-gray-100">
                  <td className="px-4 py-2 font-medium">{k.name}</td>
                  <td className="px-4 py-2">
                    <span className="px-2 py-0.5 bg-gray-100 rounded-full text-xs font-medium text-gray-600">
                      {k.tier}
                    </span>
                  </td>
                  <td className="px-4 py-2 text-xs text-gray-500">
                    {k.used} / {k.quota > 0 ? k.quota.toLocaleString() : '∞'}
                  </td>
                  <td className="px-4 py-2">
                    <span className={`text-xs font-medium ${k.enabled ? 'text-green-600' : 'text-red-500'}`}>
                      {k.enabled ? '启用' : '禁用'}
                    </span>
                  </td>
                  <td className="px-4 py-2 text-xs text-gray-400">
                    {new Date(k.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-2 space-x-2">
                    <button onClick={() => handleToggle(k.id, k.enabled)}
                      className={`text-xs ${k.enabled ? 'text-yellow-600 hover:text-yellow-800' : 'text-green-600 hover:text-green-800'}`}>
                      {k.enabled ? '禁用' : '启用'}
                    </button>
                    <button onClick={() => handleDelete(k.id)}
                      className="text-xs text-red-500 hover:text-red-700">
                      删除
                    </button>
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
