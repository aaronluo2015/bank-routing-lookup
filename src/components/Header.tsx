'use client';

import { useT } from '@/lib/i18n/provider';

export default function Header() {
  const { t, lang, setLang } = useT();
  const nextLang = lang === 'en' ? 'zh' : 'en';

  return (
    <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-[#e3e8ee]">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
        <a href="/" className="flex items-center gap-2.5">
          <div className="w-7 h-7 bg-[#635bff] rounded-md flex items-center justify-center">
            <span className="text-white font-bold text-[10px] tracking-tight">SC</span>
          </div>
          <span className="font-semibold text-sm text-[#0d253d]">swiftcode<span className="text-[#64748d] font-normal">.xin</span></span>
        </a>
        <nav className="flex items-center gap-4 text-sm">
          <button onClick={() => setLang(nextLang)} className="text-[#64748d] hover:text-[#0d253d] text-xs transition-colors">
            {t('lang.switch', '中文')}
          </button>
          <a href="/docs" className="text-[#64748d] hover:text-[#0d253d] transition-colors">API</a>
          <a href="/register" className="px-4 py-2 bg-[#0d253d] text-white rounded-full text-xs font-medium hover:bg-[#273951] transition-colors">
            Get API Key
          </a>
        </nav>
      </div>
    </header>
  );
}
