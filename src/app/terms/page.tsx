'use client';

import { useT } from '@/lib/i18n/provider';

const CONTENT = {
  en: {
    title: 'Terms of Service',
    updated: 'Last updated: May 17, 2026',
    sections: [
      { h: '1. Acceptance', p: 'By accessing swiftcode.xin, you agree to these Terms. If you do not agree, please do not use our service.' },
      { h: '2. Service', p: 'BankCode Lookup provides a free bank routing number lookup and validation service. Results are for informational purposes only.' },
      { h: '3. Disclaimer', p: 'While we strive for accuracy through multi-source verification, we cannot guarantee 100% accuracy. Verify routing numbers with the receiving bank before initiating financial transactions.' },
      { h: '4. API Usage', items: ['Free tier: 1,000 requests/day without registration', 'Registered users: 100 requests/day with free API key', 'Paid tiers available for higher volume', 'Rate limits enforced per IP and API key'] },
      { h: '5. Intellectual Property', p: 'Bank routing data is derived from publicly available sources. The service, code, and methodology are protected by copyright.' },
      { h: '6. Liability', p: 'BankCode Lookup is provided "as is" without warranties. We are not liable for damages arising from use of our service.' },
      { h: '7. Changes', p: 'We reserve the right to modify these terms. Continued use constitutes acceptance.' },
      { h: '8. Contact', p: 'Questions: terms@swiftcode.xin' },
    ],
  },
  zh: {
    title: '服务条款',
    updated: '最后更新：2026年5月17日',
    sections: [
      { h: '1. 接受条款', p: '访问 swiftcode.xin 即表示您同意本条款。如果您不同意，请勿使用我们的服务。' },
      { h: '2. 服务说明', p: 'BankCode Lookup 提供免费的银行路由号查询和验证服务。结果仅供参考。' },
      { h: '3. 免责声明', p: '虽然我们通过多源验证力求准确性，但无法保证 100% 准确。在进行金融交易前，请先向收款银行核实路由号码。' },
      { h: '4. API 使用', items: ['免费层：无需注册，1000 次/天', '注册用户：免费 API Key，100 次/天', '付费方案支持更高用量', '按 IP 和 API Key 执行频率限制'] },
      { h: '5. 知识产权', p: '银行路由数据来自公开可用的来源。服务、代码和方法受版权保护。' },
      { h: '6. 责任限制', p: 'BankCode Lookup 按"原样"提供，不提供任何保证。我们对使用服务产生的损害不承担责任。' },
      { h: '7. 条款变更', p: '我们保留修改本条款的权利。继续使用即表示接受。' },
      { h: '8. 联系我们', p: '咨询：terms@swiftcode.xin' },
    ],
  },
};

export default function TermsPage() {
  const { lang } = useT();
  const c = CONTENT[lang] || CONTENT.en;

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-12">
      <h1 className="text-3xl font-light tracking-[-0.5px] text-[#0d253d] mb-8">{c.title}</h1>
      <p className="text-sm text-[#64748d] mb-6">{c.updated}</p>
      <section className="space-y-6 text-sm leading-relaxed text-[#64748d]">
        {c.sections.map((s, i) => (
          <div key={i}>
            <h2 className="text-lg font-medium text-[#0d253d] mb-2">{s.h}</h2>
            {s.p && <p>{s.p}</p>}
            {s.items && <ul className="list-disc pl-5 mt-1 space-y-1">{s.items.map((item, j) => <li key={j}>{item}</li>)}</ul>}
          </div>
        ))}
      </section>
    </div>
  );
}
