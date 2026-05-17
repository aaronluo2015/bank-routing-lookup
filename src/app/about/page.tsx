'use client';

import { useT } from '@/lib/i18n/provider';

const CONTENT = {
  en: {
    title: 'About BankCode Lookup',
    mission: 'Our Mission',
    missionText: 'BankCode Lookup is a free, professional-grade bank routing number lookup and validation platform. We aim to provide the most accurate, comprehensive, and accessible bank code database on the web — supporting individuals and businesses worldwide in cross-border payments and international banking.',
    what: 'What We Offer',
    items: [
      { t: '15+ Code Types', d: 'SWIFT/BIC, IBAN, ABA, Sort Code, BSB, IFSC, CNAPS, BLZ, NUBAN, and more.' },
      { t: '200+ Countries', d: 'Covering major financial centers worldwide.' },
      { t: 'Multi-Source Verified', d: 'Data cross-referenced from multiple public sources with confidence scoring.' },
      { t: 'REST API', d: 'Developer-friendly API for integrating bank code validation into your applications.' },
      { t: 'Free to Use', d: '1,000 requests/day free. Paid tiers available for higher volume.' },
      { t: 'Continuously Updated', d: 'Automated daily data enrichment keeps our database current.' },
    ],
    dataSources: 'Data Sources',
    dataSourcesText: 'Our bank routing number database is built from multiple public data sources including myswiftcodes.com, OpenIBAN, Razorpay IFSC API, and publicly available bank code listings. We cross-reference multiple sources to assign confidence scores and continuously improve accuracy.',
    tech: 'Technology',
    techText: 'Built with Next.js and deployed on Vercel\'s global edge network. Our architecture prioritizes speed, reliability, and data quality — with automated daily enrichment workflows keeping our database up to date.',
    contact: 'Contact',
    contactText: 'For business inquiries, API partnerships, or data licensing:',
  },
  zh: {
    title: '关于 BankCode',
    mission: '我们的使命',
    missionText: 'BankCode Lookup 是一个免费的专业级银行路由号查询和验证平台。我们致力于提供网络上最准确、最全面、最易用的银行代码数据库，支持全球个人和企业进行跨境支付和国际银行业务。',
    what: '我们提供',
    items: [
      { t: '15+ 种代码类型', d: 'SWIFT/BIC、IBAN、ABA、Sort Code、BSB、IFSC、CNAPS、BLZ、NUBAN 等。' },
      { t: '200+ 个国家', d: '覆盖全球主要金融中心。' },
      { t: '多源验证', d: '数据来自多个公共来源，交叉比对并标注可信度评分。' },
      { t: 'REST API', d: '开发者友好的 API，可将银行代码验证集成到你的应用中。' },
      { t: '免费使用', d: '每天 1000 次免费请求。付费方案支持更高用量。' },
      { t: '持续更新', d: '自动化每日数据丰富保持数据库最新。' },
    ],
    dataSources: '数据来源',
    dataSourcesText: '我们的银行路由号数据库来自多个公共数据源，包括 myswiftcodes.com、OpenIBAN、Razorpay IFSC API 以及公开可用的银行代码列表。我们交叉比对多个来源以分配可信度评分并持续提高准确性。',
    tech: '技术',
    techText: '使用 Next.js 构建，部署在 Vercel 全球边缘网络上。我们的架构优先考虑速度、可靠性和数据质量，通过自动化每日丰富工作流保持数据库最新。',
    contact: '联系我们',
    contactText: '商务合作、API 对接或数据授权：',
  },
};

export default function AboutPage() {
  const { t, lang } = useT();
  const c = CONTENT[lang] || CONTENT.en;

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-12">
      <h1 className="text-3xl font-light tracking-[-0.5px] text-[#0d253d] mb-8">{c.title}</h1>
      <section className="space-y-8 text-sm leading-relaxed text-[#64748d]">
        <div>
          <h2 className="text-lg font-medium text-[#0d253d] mb-3">{c.mission}</h2>
          <p>{c.missionText}</p>
        </div>
        <div>
          <h2 className="text-lg font-medium text-[#0d253d] mb-3">{c.what}</h2>
          <div className="grid sm:grid-cols-2 gap-4 mt-3">
            {c.items.map(item => (
              <div key={item.t} className="bg-[#f6f9fc] rounded-xl p-4">
                <h3 className="font-medium text-[#0d253d] mb-1">{item.t}</h3>
                <p className="text-xs">{item.d}</p>
              </div>
            ))}
          </div>
        </div>
        <div>
          <h2 className="text-lg font-medium text-[#0d253d] mb-2">{c.dataSources}</h2>
          <p>{c.dataSourcesText}</p>
        </div>
        <div>
          <h2 className="text-lg font-medium text-[#0d253d] mb-2">{c.tech}</h2>
          <p>{c.techText}</p>
        </div>
        <div>
          <h2 className="text-lg font-medium text-[#0d253d] mb-2">{c.contact}</h2>
          <p>{c.contactText} <a href="mailto:hello@swiftcode.xin" className="text-[#635bff] hover:text-[#7b73ff]">hello@swiftcode.xin</a></p>
        </div>
      </section>
    </div>
  );
}
