'use client';

import { useT } from '@/lib/i18n/provider';

const CONTENT = {
  en: {
    title: 'Privacy Policy',
    updated: 'Last updated: May 17, 2026',
    sections: [
      { h: '1. Information We Collect', p: 'BankCode Lookup ("we", "our", or "us") operates swiftcode.xin. We collect minimal information necessary to provide our bank routing number lookup service:', items: ['Query Data: The bank routing code you search for. Stored temporarily for caching.', 'Usage Data: Anonymous usage statistics including query counts, code types searched.', 'Technical Data: IP addresses, browser type, and access times for rate limiting and abuse prevention.'] },
      { h: '2. How We Use Information', items: ['To provide and maintain our bank code lookup service', 'To improve our local database accuracy through multi-source data reconciliation', 'To enforce rate limits and prevent API abuse', 'To analyze usage patterns and improve service quality'] },
      { h: '3. Data Storage', p: 'Query data is cached temporarily (1 hour) in server memory. Anonymous usage statistics are stored in local JSON files. We do not maintain user accounts or store personal identification information beyond what is necessary for rate limiting.' },
      { h: '4. Data Sharing', p: 'We do not sell, trade, or transfer your data to third parties. Bank routing numbers you query may be sent to external data sources solely for returning accurate lookup results. These external requests contain only the bank code, with no personal information.' },
      { h: '5. Cookies', p: 'We use minimal cookies: a language preference cookie (bankcode_lang) and an authentication cookie for administrative access. No tracking or advertising cookies are used.' },
      { h: '6. Third-Party Services', p: 'Our service links to third-party payment platforms for user convenience. These third-party sites have separate privacy policies.' },
      { h: '7. Security', p: 'We implement security measures including HTTPS encryption, rate limiting, input sanitization, and Content Security Policy headers.' },
      { h: '8. Contact', p: 'For privacy-related inquiries: privacy@swiftcode.xin' },
    ],
  },
  zh: {
    title: '隐私政策',
    updated: '最后更新：2026年5月17日',
    sections: [
      { h: '1. 我们收集的信息', p: 'BankCode Lookup（"我们"）运营 swiftcode.xin。我们仅收集提供银行路由号查询服务所必需的最少信息：', items: ['查询数据：您搜索的银行路由代码，临时存储用于缓存。', '使用数据：匿名使用统计，包括查询次数、查询的代码类型。', '技术数据：IP 地址、浏览器类型和访问时间，用于频率限制和防滥用。'] },
      { h: '2. 我们如何使用信息', items: ['提供和维护我们的银行代码查询服务', '通过多源数据对账提高本地数据库准确性', '执行频率限制并防止 API 滥用', '分析使用模式并改进服务质量'] },
      { h: '3. 数据存储', p: '查询数据在服务器内存中临时缓存（1 小时）。匿名使用统计存储在本地 JSON 文件中。我们不维护用户账户，也不存储超出频率限制所必需的个人身份信息。' },
      { h: '4. 数据共享', p: '我们不出售、交易或转让您的数据给第三方。您查询的银行路由号可能会发送到外部数据源，仅用于返回准确的查询结果。这些外部请求仅包含银行代码，不含个人信息。' },
      { h: '5. Cookie', p: '我们使用最少的 Cookie：语言偏好 Cookie（bankcode_lang）和管理访问认证 Cookie。不使用跟踪或广告 Cookie。' },
      { h: '6. 第三方服务', p: '我们的服务链接到第三方支付平台以方便用户。这些第三方网站有独立的隐私政策。' },
      { h: '7. 安全', p: '我们实施安全措施，包括 HTTPS 加密、频率限制、输入消毒和内容安全策略标头。' },
      { h: '8. 联系我们', p: '隐私相关咨询：privacy@swiftcode.xin' },
    ],
  },
};

export default function PrivacyPage() {
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
