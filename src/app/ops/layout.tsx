'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';

export const dynamic = 'force-dynamic';

export default function OpsLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();

  if (pathname === '/ops/login') {
    return <>{children}</>;
  }

  const handleLogout = async () => {
    await fetch('/api/ops/logout', { method: 'POST' });
    router.push('/ops/login');
  };

  const navItems = [
    { href: '/ops', label: 'Dashboard', icon: '📊' },
    { href: '/ops/data', label: 'Data', icon: '🗄️' },
    { href: '/ops/apikeys', label: 'API Keys', icon: '🔑' },
    { href: '/ops/sources', label: 'Sources', icon: '📡' },
  ];

  return (
    <div className="flex min-h-[calc(100vh-3.5rem)]">
      <aside className="w-52 bg-white border-r border-gray-200 py-4 shrink-0">
        <div className="px-4 mb-4">
          <h2 className="font-semibold text-sm text-gray-900">Ops Panel</h2>
        </div>
        <nav className="space-y-0.5 px-2">
          {navItems.map(item => (
            <Link key={item.href} href={item.href}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors ${
                pathname === item.href ? 'bg-blue-50 text-blue-700 font-medium' : 'text-gray-600 hover:bg-gray-50'
              }`}>
              <span>{item.icon}</span>
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="px-2 mt-8">
          <button onClick={handleLogout}
            className="w-full text-left px-3 py-2 text-sm text-gray-400 hover:text-red-500 rounded-lg hover:bg-gray-50 transition-colors">
            Sign Out
          </button>
        </div>
        <div className="px-4 mt-4 pt-4 border-t border-gray-100">
          <Link href="/" className="text-xs text-gray-400 hover:text-blue-500">&larr; Home</Link>
        </div>
      </aside>
      <main className="flex-1 p-6 bg-gray-50">{children}</main>
    </div>
  );
}
