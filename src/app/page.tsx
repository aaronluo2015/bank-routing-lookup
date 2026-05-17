'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Script from 'next/script';
import { useT } from '@/lib/i18n/provider';
import { ROUTING_TYPE_INFO } from '@/lib/detectors';

const structuredData = {
  '@context': 'https://schema.org',
  '@type': 'WebApplication',
  name: 'swiftcode.xin',
  description: 'Free global bank routing number lookup and validation tool. SWIFT, IBAN, ABA, Sort Code and more.',
  applicationCategory: 'FinanceApplication',
  operatingSystem: 'All',
  offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
  author: { '@type': 'Organization', name: 'swiftcode.xin' },
};

const DISPLAY_TYPES = ['swift','iban','aba','sortcode','bsb','ifsc','transit','blz','cnaps'];
const DEMO = [
  { code: 'DEUTDEFF', type: 'swift' },
  { code: 'CHASUS33', type: 'swift' },
  { code: 'BKCHCNBJ', type: 'swift' },
  { code: '021000021', type: 'aba' },
  { code: '082-902', type: 'bsb' },
  { code: 'SBIN0005944', type: 'ifsc' },
];

export default function HomePage() {
  const { t } = useT();
  const [code, setCode] = useState('');
  const router = useRouter();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (code.trim()) router.push(`/lookup/${encodeURIComponent(code.trim())}`);
  };

  return (
    <div>
      <Script id="json-ld" type="application/ld+json" strategy="afterInteractive">
        {JSON.stringify(structuredData)}
      </Script>
      <section className="relative overflow-hidden" style={{ background: 'linear-gradient(150deg, #f5e9d4 0%, #f0e6fa 30%, #dbeafe 60%, #fce7f3 100%)' }}>
        <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: 'radial-gradient(circle at 20% 30%, #635bff 0%, transparent 40%), radial-gradient(circle at 80% 70%, #ea2261 0%, transparent 40%)' }} />
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-24 sm:py-36 relative z-10">
          <div className="text-center">
            <h1 className="text-4xl sm:text-6xl font-light tracking-[-1.4px] text-[#0d253d] mb-5 leading-[1.08]">
              {t('hero.title1')}<br />
              <span className="text-[#635bff]">{t('hero.title2')}</span>
            </h1>
            <p className="text-base text-[#64748d] mb-10 max-w-lg mx-auto leading-relaxed">{t('hero.subtitle')}</p>
            <form onSubmit={handleSubmit} className="max-w-lg mx-auto mb-8">
              <div className="flex gap-2 bg-white rounded-2xl p-1.5 shadow-[0_2px_12px_rgba(0,0,0,0.06)] border border-gray-100">
                <input type="text" value={code} onChange={e => setCode(e.target.value)}
                  placeholder={t('hero.placeholder')}
                  className="flex-1 px-5 py-3.5 bg-transparent outline-none text-sm text-[#0d253d] placeholder:text-[#a8c3de] min-w-0" autoFocus />
                <button type="submit"
                  className="px-6 py-3.5 bg-[#635bff] text-white rounded-xl text-sm font-medium hover:bg-[#7b73ff] transition-colors shadow-[0_2px_8px_rgba(99,91,255,0.3)]">
                  {t('hero.search')}
                </button>
              </div>
            </form>
            <div className="flex flex-wrap justify-center gap-2">
              {DEMO.map(d => (
                <button key={d.code}
                  onClick={() => router.push(`/lookup/${encodeURIComponent(d.code)}?type=${d.type}`)}
                  className="px-3 py-1.5 text-xs font-mono text-[#64748d] bg-white/60 border border-white/80 rounded-full hover:bg-white hover:text-[#635bff] hover:border-[#635bff]/20 transition-all backdrop-blur-sm">
                  {d.code}
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="py-10 bg-white border-b border-[#e3e8ee]">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            {[
              ['2,433', t('stats.verified')],
              ['200+', t('stats.countries')],
              ['16', t('stats.types')],
              ['99.9%', t('stats.uptime')],
            ].map(([v, l]) => (
              <div key={l}><div className="text-2xl font-normal tracking-[-0.5px] text-[#0d253d]">{v}</div><div className="text-sm text-[#64748d] mt-1">{l}</div></div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-24 bg-[#f6f9fc]">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <h2 className="text-3xl font-light tracking-[-0.5px] text-[#0d253d] text-center mb-4">{t('features.title')}</h2>
          <p className="text-[#64748d] text-center mb-14 max-w-md mx-auto">{t('features.subtitle')}</p>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              { k: 'smart', icon: '🔍' },
              { k: 'verify', icon: '🛡️' },
              { k: 'api', icon: '⚡' },
            ].map(f => (
              <div key={f.k} className="bg-white border border-[#e3e8ee] rounded-xl p-8 shadow-[0_1px_3px_rgba(0,55,112,0.08)] hover:shadow-[0_8px_24px_rgba(0,55,112,0.08)] transition-shadow">
                <div className="text-2xl mb-4">{f.icon}</div>
                <h3 className="font-medium text-[#0d253d] mb-2">{t(`features.${f.k}.title`)}</h3>
                <p className="text-sm text-[#64748d] leading-relaxed">{t(`features.${f.k}.desc`)}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-24 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <h2 className="text-3xl font-light tracking-[-0.5px] text-[#0d253d] text-center mb-4">{t('types.title')}</h2>
          <p className="text-[#64748d] text-center mb-14">{t('types.subtitle')}</p>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
            {ROUTING_TYPE_INFO.filter(i => DISPLAY_TYPES.includes(i.type)).slice(0, 10).map(info => (
              <button key={info.type}
                onClick={() => router.push(`/lookup/${encodeURIComponent(info.example)}?type=${info.type}`)}
                className="p-5 bg-white border border-[#e3e8ee] rounded-xl text-left hover:border-[#635bff]/30 hover:shadow-[0_1px_3px_rgba(0,55,112,0.08)] transition-all group">
                <div className="text-sm font-medium text-[#0d253d] group-hover:text-[#635bff] transition-colors">{t(`type.${info.type}`, info.name)}</div>
                <div className="text-xs text-[#64748d] mt-1">{info.country}</div>
                <div className="text-xs text-[#a8c3de] mt-2 font-mono bg-[#f6f9fc] px-2 py-0.5 rounded truncate group-hover:bg-[#f0e6fa]/50">{info.example}</div>
              </button>
            ))}
          </div>
        </div>
      </section>

      <section className="py-24" style={{ backgroundColor: '#f5e9d4' }}>
        <div className="max-w-xl mx-auto px-4 sm:px-6">
          <h2 className="text-3xl font-light tracking-[-0.5px] text-[#0d253d] text-center mb-4">{t('faq.title')}</h2>
          <p className="text-[#9b6829] text-center mb-12">{t('faq.subtitle')}</p>
          <div className="space-y-3">
            {['q1','q2','q3','q4'].map((q, i) => (
              <details key={i} className="group bg-white/80 border border-white/60 rounded-xl backdrop-blur-sm">
                <summary className="px-6 py-4 text-sm font-medium text-[#0d253d] cursor-pointer hover:text-[#635bff] marker:content-none flex items-center justify-between">
                  {t(`faq.${q}`)}
                  <span className="text-[#64748d] group-open:rotate-180 transition-transform">▾</span>
                </summary>
                <p className="px-6 pb-4 text-sm text-[#64748d] leading-relaxed">{t(`faq.a${i+1}`)}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      <section className="py-24 bg-[#0d253d] text-white">
        <div className="max-w-xl mx-auto px-4 sm:px-6 text-center">
          <h2 className="text-3xl font-light tracking-[-0.5px] mb-4">{t('cta.title')}</h2>
          <p className="text-[#64748d] mb-10 max-w-md mx-auto">{t('cta.subtitle')}</p>
          <div className="flex flex-col sm:flex-row justify-center gap-3">
            <a href="/docs" className="px-6 py-3 bg-[#635bff] text-white rounded-full text-sm font-medium hover:bg-[#7b73ff] transition-colors shadow-[0_2px_8px_rgba(99,91,255,0.4)]">{t('cta.docs')}</a>
            <a href="/register" className="px-6 py-3 border border-white/20 text-white rounded-full text-sm font-medium hover:bg-white/10 transition-colors">{t('cta.apiKey')}</a>
          </div>
        </div>
      </section>
    </div>
  );
}
