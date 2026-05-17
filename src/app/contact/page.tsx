'use client';

import { useT } from '@/lib/i18n/provider';

const CONTENT = {
  en: {
    title: 'Contact Us',
    cards: [
      { h: 'Business & API', d: 'Partnerships, API sales, data licensing', e: 'hello@swiftcode.xin' },
      { h: 'Support', d: 'Technical issues, bug reports', e: 'support@swiftcode.xin' },
      { h: 'Privacy', d: 'Privacy concerns, data removal', e: 'privacy@swiftcode.xin' },
    ],
    faqTitle: 'Frequently Asked',
    faqs: [
      { q: 'How do I get an API key?', a: 'Visit our registration page to get a free API key instantly. No credit card required.' },
      { q: 'How accurate is the data?', a: 'We cross-reference multiple public data sources. Records with 90%+ confidence are verified by multiple sources.' },
      { q: 'Can I contribute data corrections?', a: 'Yes! Email support@swiftcode.xin with the code and correction. We verify within 24 hours.' },
      { q: 'Do you offer enterprise plans?', a: 'Yes, custom enterprise plans with dedicated support and higher limits. Contact hello@swiftcode.xin.' },
    ],
  },
  zh: {
    title: '联系我们',
    cards: [
      { h: '商务与 API', d: '合作、API 销售、数据授权', e: 'hello@swiftcode.xin' },
      { h: '技术支持', d: '技术问题、Bug 报告', e: 'support@swiftcode.xin' },
      { h: '隐私', d: '隐私问题、数据删除', e: 'privacy@swiftcode.xin' },
    ],
    faqTitle: '常见问题',
    faqs: [
      { q: '如何获取 API Key？', a: '访问我们的注册页面即可即时获取免费 API Key，无需信用卡。' },
      { q: '数据有多准确？', a: '我们交叉比对多个公共数据源。可信度 90%+ 的记录经多个来源验证。' },
      { q: '我可以贡献数据修正吗？', a: '可以！发送邮件至 support@swiftcode.xin，附上代码和修正内容。我们会在 24 小时内核实。' },
      { q: '提供企业方案吗？', a: '是的，提供定制企业方案，包含专属支持和更高限额。请联系 hello@swiftcode.xin。' },
    ],
  },
};

export default function ContactPage() {
  const { lang } = useT();
  const c = CONTENT[lang] || CONTENT.en;

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-12">
      <h1 className="text-3xl font-light tracking-[-0.5px] text-[#0d253d] mb-8">{c.title}</h1>
      <div className="grid sm:grid-cols-3 gap-6 mb-12">
        {c.cards.map(item => (
          <div key={item.h} className="bg-white border border-[#e3e8ee] rounded-xl p-6 text-center shadow-[0_1px_3px_rgba(0,55,112,0.06)]">
            <h3 className="font-medium text-[#0d253d] mb-1">{item.h}</h3>
            <p className="text-xs text-[#64748d] mb-3">{item.d}</p>
            <a href={`mailto:${item.e}`} className="text-sm text-[#635bff] hover:text-[#7b73ff] font-medium break-all">{item.e}</a>
          </div>
        ))}
      </div>
      <div className="bg-[#f6f9fc] rounded-xl p-6 sm:p-8">
        <h2 className="text-lg font-medium text-[#0d253d] mb-4">{c.faqTitle}</h2>
        <div className="space-y-4 text-sm text-[#64748d]">
          {c.faqs.map((faq, i) => (
            <div key={i}>
              <h3 className="font-medium text-[#0d253d] mb-1">{faq.q}</h3>
              <p>{faq.a}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
