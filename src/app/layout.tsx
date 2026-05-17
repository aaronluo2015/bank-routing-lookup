import type { Metadata } from 'next';
import './globals.css';
import { I18nProvider } from '@/lib/i18n/provider';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

export const metadata: Metadata = {
  metadataBase: new URL('https://swiftcode.xin'),
  title: {
    default: 'swiftcode.xin - Free Global Bank Routing Number Lookup',
    template: '%s - swiftcode.xin',
  },
  description: 'Free SWIFT/BIC, IBAN, ABA, Sort Code lookup. Auto-detect type, multi-source verified. 2,433+ bank records across 16 code types, 200+ countries.',
  keywords: ['SWIFT code lookup', 'bank routing number lookup', 'IBAN validator', 'ABA routing number', 'sort code finder', 'BSB number', 'IFSC code', 'bank code', 'CNAPS'],
  alternates: {
    canonical: 'https://swiftcode.xin',
    languages: { en: 'https://swiftcode.xin', zh: 'https://swiftcode.xin' },
  },
  openGraph: {
    title: 'swiftcode.xin - Free Global Bank Routing Number Lookup',
    description: 'Free SWIFT/BIC, IBAN, ABA, Sort Code lookup. Auto-detect, multi-source verified. 16 code types, 200+ countries.',
    url: 'https://swiftcode.xin',
    siteName: 'swiftcode.xin',
    type: 'website',
    locale: 'en_US',
    alternateLocale: 'zh_CN',
  },
  twitter: { card: 'summary_large_image', title: 'swiftcode.xin - Bank Routing Lookup', description: 'Free global bank routing number lookup and validation.' },
  robots: { index: true, follow: true, googleBot: { index: true, follow: true } },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen flex flex-col bg-white antialiased">
        <script async src="https://www.googletagmanager.com/gtag/js?id=G-953P8GE3TW"></script>
        <script
          dangerouslySetInnerHTML={{
            __html: `window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());gtag('config','G-953P8GE3TW');`,
          }}
        />
        <script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-9243049688083631" crossOrigin="anonymous"></script>
        <I18nProvider>
          <Header />
          <main className="flex-1">{children}</main>
          <Footer />
        </I18nProvider>
      </body>
    </html>
  );
}
