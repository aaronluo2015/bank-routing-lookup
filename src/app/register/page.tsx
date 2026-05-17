'use client';

import { useState } from 'react';
import { useT } from '@/lib/i18n/provider';

export default function RegisterPage() {
  const { t } = useT();
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ plainKey: string } | null>(null);
  const [error, setError] = useState('');

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/admin/apikeys', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.trim(), tier: 'free' }),
      });
      const data = await res.json();
      if (data.success) {
        setResult({ plainKey: data.plainKey });
      } else {
        setError(data.error || 'Registration failed');
      }
    } catch {
      setError('Network error');
    } finally {
      setLoading(false);
    }
  };

  if (result) {
    return (
      <div className="max-w-lg mx-auto px-4 py-16">
        <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-8 text-center">
          <div className="text-3xl mb-3">🎉</div>
          <h2 className="text-xl font-semibold text-emerald-800 mb-2">API Key Created!</h2>
          <p className="text-emerald-600 text-sm mb-4">Save this key now — it won't be shown again.</p>
          <div className="bg-white border border-emerald-200 rounded-xl p-4 mb-4">
            <code className="text-emerald-800 text-sm break-all font-mono">{result.plainKey}</code>
          </div>
          <button onClick={() => navigator.clipboard.writeText(result.plainKey)}
            className="px-4 py-2 bg-emerald-600 text-white rounded-full text-sm font-medium hover:bg-emerald-700 mb-4">
            Copy Key
          </button>
          <div className="text-xs text-emerald-500 space-y-1">
            <p>Free tier: 100 requests/day</p>
            <p>Use as: <code className="bg-emerald-100 px-1 rounded">?api_key=sk_...your_key...</code></p>
          </div>
          <a href="/docs" className="inline-block mt-4 text-sm text-blue-600 hover:text-blue-800">View API Docs →</a>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto px-4 py-16">
      <h1 className="text-2xl font-light tracking-tight text-gray-900 mb-2">Get Free API Key</h1>
      <p className="text-gray-500 text-sm mb-8">100 requests/day free. No credit card required.</p>
      <form onSubmit={handleRegister} className="space-y-4">
        <input type="text" value={name} onChange={e => setName(e.target.value)}
          placeholder="Your name or project name" required
          className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm outline-none focus:border-indigo-400 focus:bg-white transition-all" />
        <button type="submit" disabled={loading}
          className="w-full py-3 bg-indigo-600 text-white rounded-full font-medium text-sm hover:bg-indigo-700 disabled:opacity-50 transition-colors">
          {loading ? 'Creating...' : 'Generate Free API Key'}
        </button>
      </form>
      {error && <p className="text-red-500 text-sm mt-3">{error}</p>}
      <p className="text-xs text-gray-400 mt-4 text-center">
        By registering you get instant access to lookup and validate endpoints.
      </p>
    </div>
  );
}
