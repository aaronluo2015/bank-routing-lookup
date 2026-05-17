'use client';

import { useState } from 'react';
import { useT } from '@/lib/i18n/provider';

export default function ApiDocsPage() {
  const { t } = useT();
  const [testCode, setTestCode] = useState('DEUTDEFF');
  const [testResult, setTestResult] = useState<string>('');
  const [testLoading, setTestLoading] = useState(false);

  const testApi = async () => {
    setTestLoading(true);
    try {
      const res = await fetch(`/api/lookup?code=${encodeURIComponent(testCode)}`);
      const data = await res.json();
      setTestResult(JSON.stringify(data, null, 2));
    } catch {
      setTestResult('// Request failed');
    } finally {
      setTestLoading(false);
    }
  };

  const BASE = 'https://swiftcode.xin';

  return (
    <div className="max-w-4xl mx-auto px-6 py-12">
      <div className="mb-12">
        <h1 className="text-4xl font-bold text-gray-900 mb-3">{t('docs.title')}</h1>
        <p className="text-lg text-gray-500">{t('docs.subtitle')}</p>
      </div>

      <section className="mb-14">
        <h2 className="text-xl font-bold text-gray-900 mb-4">{t('docs.quickstart')}</h2>
        <div className="bg-gray-950 text-green-400 rounded-2xl p-6 font-mono text-sm overflow-x-auto">
          <div className="text-gray-500 mb-2">{t('docs.quickstart.desc')}</div>
          <div>curl &quot;{BASE}/api/lookup?code=DEUTDEFF&quot;</div>
        </div>
      </section>

      <section className="space-y-8 mb-14">
        <Endpoint t={t} method="GET" path="/api/lookup" desc={t('docs.endpoint.lookup')}
          params={[
            { n: 'code', t: 'string', r: true, d: 'Bank routing number' },
            { n: 'type', t: 'string', r: false, d: 'Force type (swift/aba/iban/sortcode/bsb/ifsc)' },
            { n: 'api_key', t: 'string', r: false, d: 'API Key for higher limits' },
          ]}
          example={`curl "${BASE}/api/lookup?code=DEUTDEFF"`}
        />
        <Endpoint t={t} method="POST" path="/api/lookup/batch" desc={t('docs.endpoint.batch')}
          params={[{ n: 'codes', t: 'string[]', r: true, d: 'Array of routing numbers' }]}
          example={`curl -X POST ${BASE}/api/lookup/batch \\\n  -H "Content-Type: application/json" \\\n  -d '{"codes":["DEUTDEFF","CHASUS33"]}'`}
        />
        <Endpoint t={t} method="GET" path="/api/validate" desc={t('docs.endpoint.validate')}
          params={[{ n: 'code', t: 'string', r: true, d: 'Bank routing number' }]}
          example={`curl "${BASE}/api/validate?code=DEUTDEFF"`}
        />
        <Endpoint t={t} method="GET" path="/api/health" desc={t('docs.endpoint.health')}
          params={[]}
          example={`curl "${BASE}/api/health"`}
        />
      </section>

      <section className="mb-14">
        <h2 className="text-xl font-bold text-gray-900 mb-4">{t('docs.liveTest')}</h2>
        <div className="bg-white border border-gray-200 rounded-2xl p-6">
          <div className="flex gap-2 mb-4">
            <input type="text" value={testCode} onChange={e => setTestCode(e.target.value)}
              placeholder="DEUTDEFF"
              className="flex-1 px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm font-mono outline-none focus:border-blue-400 focus:bg-white transition-all" />
            <button onClick={testApi} disabled={testLoading}
              className="px-6 py-3 bg-blue-600 text-white rounded-xl text-sm font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors">
              {testLoading ? t('docs.liveTest.sending') : t('docs.liveTest.send')}
            </button>
          </div>
          {testResult && (
            <pre className="bg-gray-950 text-green-400 rounded-xl p-6 text-xs font-mono overflow-x-auto max-h-[500px] overflow-y-auto">{testResult}</pre>
          )}
        </div>
      </section>

      <section className="mb-14">
        <h2 className="text-xl font-bold text-gray-900 mb-4">{t('docs.errorCodes')}</h2>
        <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left px-6 py-3 font-medium text-gray-500">Status</th>
                <th className="text-left px-6 py-3 font-medium text-gray-500">Code</th>
                <th className="text-left px-6 py-3 font-medium text-gray-500">{t('docs.params.desc')}</th>
              </tr>
            </thead>
            <tbody>
              {[
                ['400', 'INVALID_FORMAT', 'Format mismatch'],
                ['400', 'MISSING_PARAM', 'Missing required param'],
                ['404', 'NOT_FOUND', 'Bank info not found'],
                ['429', 'RATE_LIMITED', 'Rate limit exceeded'],
                ['401', 'INVALID_API_KEY', 'Invalid API Key'],
              ].map(([h, c, d]) => (
                <tr key={c} className="border-t border-gray-100">
                  <td className="px-6 py-3"><span className="px-2 py-0.5 bg-red-100 text-red-700 text-xs rounded font-medium">{h}</span></td>
                  <td className="px-6 py-3 font-mono text-xs">{c}</td>
                  <td className="px-6 py-3 text-gray-600">{d}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl p-10 text-center text-white">
        <h3 className="text-2xl font-bold mb-3">{t('docs.cta.title')}</h3>
        <p className="text-blue-100 mb-6 max-w-md mx-auto">{t('docs.cta.subtitle')}</p>
        <div className="flex justify-center gap-3">
          <a href="mailto:api@swiftcode.xin" className="px-8 py-3 bg-white text-blue-700 rounded-xl font-semibold hover:bg-blue-50 transition-colors">{t('docs.cta.apply')}</a>
          <a href="https://github.com/aaronluo2015/bank-routing-lookup" target="_blank" rel="noopener"
            className="px-8 py-3 bg-blue-500/30 text-white rounded-xl font-semibold hover:bg-blue-500/40 transition-colors border border-blue-300/30">{t('docs.cta.github')}</a>
        </div>
      </div>
    </div>
  );
}

function Endpoint({ t, method, path, desc, params, example }: {
  t: (k: string, f?: string) => string;
  method: string; path: string; desc: string;
  params: { n: string; t: string; r: boolean; d: string }[];
  example: string;
}) {
  const colors: Record<string, string> = {
    GET: 'bg-emerald-100 text-emerald-700',
    POST: 'bg-blue-100 text-blue-700',
  };
  return (
    <div className="border border-gray-200 rounded-2xl overflow-hidden">
      <div className="bg-gray-50 px-6 py-4 flex items-center gap-3 border-b border-gray-200">
        <span className={`px-2.5 py-0.5 rounded text-xs font-bold ${colors[method] || 'bg-gray-100'}`}>{method}</span>
        <code className="text-sm font-mono text-gray-800">{path}</code>
      </div>
      <div className="px-6 py-4">
        <p className="text-sm text-gray-500 mb-4">{desc}</p>
        {params.length > 0 && (
          <table className="w-full text-sm mb-4">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="text-left py-2 pr-4 text-gray-400 font-medium text-xs">{t('docs.params.param')}</th>
                <th className="text-left py-2 pr-4 text-gray-400 font-medium text-xs">{t('docs.params.type')}</th>
                <th className="text-left py-2 pr-4 text-gray-400 font-medium text-xs">{t('docs.params.required')}</th>
                <th className="text-left py-2 text-gray-400 font-medium text-xs">{t('docs.params.desc')}</th>
              </tr>
            </thead>
            <tbody>
              {params.map(p => (
                <tr key={p.n} className="border-b border-gray-50">
                  <td className="py-2 font-mono text-xs">{p.n}</td>
                  <td className="py-2 text-xs text-gray-500">{p.t}</td>
                  <td className="py-2">{p.r ? <span className="text-red-500 text-xs">●</span> : <span className="text-gray-300 text-xs">○</span>}</td>
                  <td className="py-2 text-xs text-gray-500">{p.d}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        <div className="bg-gray-950 text-green-400 rounded-xl p-4 font-mono text-xs overflow-x-auto whitespace-pre-wrap">{example}</div>
      </div>
    </div>
  );
}
