'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { LookupResult } from '@/lib/types';
import { ROUTING_TYPE_INFO } from '@/lib/detectors';
import { useT } from '@/lib/i18n/provider';

function ConfidenceBadge({ confidence, t }: { confidence: number; t: (k: string, f?: string) => string }) {
  if (confidence >= 90) return (
    <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-50 text-emerald-700 rounded-full text-xs font-semibold border border-emerald-200">
      <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full" />
      {t('lookup.confidence.high')} · {confidence}%
    </span>
  );
  if (confidence >= 70) return (
    <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-xs font-semibold border border-blue-200">
      <span className="w-1.5 h-1.5 bg-blue-500 rounded-full" />
      {t('lookup.confidence.medium')} · {confidence}%
    </span>
  );
  if (confidence >= 40) return (
    <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-50 text-amber-700 rounded-full text-xs font-semibold border border-amber-200">
      <span className="w-1.5 h-1.5 bg-amber-500 rounded-full" />
      {t('lookup.confidence.low')} · {confidence}%
    </span>
  );
  return (
    <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-gray-50 text-gray-500 rounded-full text-xs font-semibold border border-gray-200">
      {t('lookup.confidence.none')}
    </span>
  );
}

export default function LookupPage() {
  const params = useParams();
  const router = useRouter();
  const { t } = useT();
  const code = decodeURIComponent(String(params.code));
  const [result, setResult] = useState<LookupResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [newCode, setNewCode] = useState('');

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      try {
        const searchParams = new URLSearchParams(window.location.search);
        const typeParam = searchParams.get('type') || '';
        const url = `/api/lookup?code=${encodeURIComponent(code)}${typeParam ? `&type=${typeParam}` : ''}`;
        const res = await fetch(url);
        const data = await res.json();
        setResult(data);
        setError(null);
      } catch {
        setError(t('common.error'));
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [code, t]);

  const handleNewSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (newCode.trim()) router.push(`/lookup/${encodeURIComponent(newCode.trim())}`);
  };

  return (
    <div className="max-w-3xl mx-auto px-6 py-8">
      <form onSubmit={handleNewSearch} className="mb-8">
        <div className="flex gap-2">
          <div className="flex-1 relative">
            <input type="text" value={newCode} onChange={e => setNewCode(e.target.value)}
              placeholder={t('lookup.searchPlaceholder')}
              className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm outline-none focus:border-blue-400 focus:bg-white focus:ring-2 focus:ring-blue-100 transition-all" />
          </div>
          <button type="submit"
            className="px-5 py-3 bg-blue-600 text-white rounded-xl text-sm font-medium hover:bg-blue-700 transition-colors">
            {t('lookup.search')}
          </button>
        </div>
      </form>

      {loading && (
        <div className="text-center py-20">
          <div className="inline-flex items-center gap-3">
            <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
            <span className="text-gray-400">{t('lookup.loading')}</span>
          </div>
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-2xl p-6 text-red-700 text-sm">
          {error}
          <button onClick={() => window.location.reload()} className="ml-3 text-red-600 underline">{t('lookup.retry')}</button>
        </div>
      )}

      {result && (
        <div>
          <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl p-8 text-white mb-6">
            <div className="flex items-start justify-between mb-6">
              <span className="text-xs text-slate-400 uppercase tracking-wider bg-white/10 px-3 py-1 rounded-full">
                {ROUTING_TYPE_INFO.find(i => i.type === result.type)?.name || result.type}
              </span>
              {result.confidence > 0 && <ConfidenceBadge confidence={result.confidence} t={t} />}
            </div>
            <div className="text-3xl md:text-4xl font-mono font-bold tracking-tight mb-2 break-all">{result.code}</div>
            {result.bank && <p className="text-xl text-slate-300 font-medium">{result.bank.bankName}</p>}
            {result.parsedParts.length > 0 && (
              <div className="flex flex-wrap gap-3 mt-6">
                {result.parsedParts.map((part, i) => (
                  <div key={i} className="bg-white/10 rounded-xl px-4 py-2 text-center min-w-[80px] backdrop-blur-sm">
                    <div className="text-lg font-mono font-bold text-white">{part.value}</div>
                    <div className="text-[10px] text-slate-400 mt-0.5 uppercase tracking-wider">{part.description}</div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {result.bank && (
            <div className="bg-white border border-gray-200 rounded-2xl p-6 mb-4">
              <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4">{t('lookup.bankInfo')}</h3>
              <div className="grid grid-cols-2 gap-y-4 gap-x-8">
                <D label={t('lookup.bankName')} value={result.bank.bankName} />
                <D label={t('lookup.country')} value={`${result.bank.countryName} (${result.bank.country})`} />
                {result.bank.city && <D label={t('lookup.city')} value={result.bank.city} />}
                {result.bank.address && <D label={t('lookup.address')} value={result.bank.address} />}
                {result.bank.branch && <D label={t('lookup.branch')} value={result.bank.branch} />}
                {result.bank.isHeadOffice && <D label={t('lookup.headOffice')} value={t('lookup.headOfficeYes')} />}
              </div>
            </div>
          )}

          {result.sources.length > 0 && (
            <div className="bg-white border border-gray-200 rounded-2xl p-6 mb-4">
              <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">{t('lookup.dataSources')}</h3>
              <div className="flex flex-wrap gap-2 mb-3">
                {result.sources.map(s => (
                  <span key={s} className="inline-flex items-center gap-1 px-3 py-1.5 bg-emerald-50 text-emerald-700 rounded-lg text-xs font-medium border border-emerald-200">
                    <span className="w-1 h-1 bg-emerald-400 rounded-full" />{s}
                  </span>
                ))}
              </div>
              {result.verifiedAt && (
                <p className="text-xs text-gray-400">{t('lookup.lastVerified')}: {new Date(result.verifiedAt).toLocaleString('zh-CN')}</p>
              )}
            </div>
          )}

          {result.warnings?.length! > 0 && (
            <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5 mb-4">
              <p className="text-amber-800 text-sm">{result.warnings![0]}</p>
            </div>
          )}

          {!result.valid && (
            <div className="bg-red-50 border border-red-200 rounded-2xl p-6 mb-4">
              <p className="text-red-700 font-medium mb-2">{result.message || t('lookup.invalid')}</p>
              {result.suggestions?.length! > 0 && (
                <div className="mt-3 pt-3 border-t border-red-200">
                  <p className="text-xs text-red-400 mb-2">{t('lookup.suggestions')}:</p>
                  <div className="flex flex-wrap gap-2">
                    {result.suggestions!.map((s, i) => (
                      <a key={i} href={`/lookup/${encodeURIComponent(s.split(':')[1]?.trim() || s)}`}
                        className="text-sm text-red-600 bg-red-100 px-3 py-1 rounded-lg hover:bg-red-200 transition-colors">{s}</a>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-2xl p-8 text-white text-center mb-8">
            <h3 className="text-xl font-bold mb-2">{t('lookup.moneyTransfer.title')}</h3>
            <p className="text-blue-100 mb-6 text-sm">{t('lookup.moneyTransfer.subtitle')}</p>
            <div className="flex justify-center">
              <a href="https://www.paytrades.cn/" target="_blank" rel="noopener"
                className="px-8 py-3 bg-white text-blue-700 rounded-xl font-semibold text-sm hover:bg-blue-50 transition-colors shadow-lg">
                {t('lookup.moneyTransfer.paytrades')}
              </a>
            </div>
          </div>

          <div className="text-center">
            <Link href="/" className="text-sm text-gray-500 hover:text-blue-600 transition-colors">
              {t('lookup.back')}
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}

function D({ label, value }: { label: string; value: string }) {
  return <div><div className="text-xs text-gray-400 mb-1">{label}</div><div className="text-sm text-gray-900 font-medium">{value}</div></div>;
}
