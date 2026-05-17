'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function OpsLoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      const res = await fetch('/api/ops/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });
      if (res.ok) {
        router.push('/ops');
      } else {
        setError('Invalid credentials');
      }
    } catch {
      setError('Network error');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 w-full max-w-sm">
        <h1 className="text-lg font-semibold text-center mb-6">Ops Panel</h1>
        <form onSubmit={handleLogin} className="space-y-4">
          <input type="text" value={username} onChange={e => setUsername(e.target.value)}
            placeholder="Username" autoFocus
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-200 outline-none" />
          <input type="password" value={password} onChange={e => setPassword(e.target.value)}
            placeholder="Password"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-200 outline-none" />
          {error && <p className="text-red-500 text-xs">{error}</p>}
          <button type="submit"
            className="w-full py-2 bg-gray-900 text-white rounded-lg text-sm font-medium hover:bg-gray-800 transition-colors">
            Sign In
          </button>
        </form>
      </div>
    </div>
  );
}
