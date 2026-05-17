'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import type { Lang } from '@/lib/i18n';
import enTranslations from '@/lib/i18n/en';
import zhTranslations from '@/lib/i18n/zh';

type I18nContextType = {
  lang: Lang;
  setLang: (l: Lang) => void;
  t: (key: string, fallback?: string) => string;
};

const translationsMap: Record<Lang, Record<string, string>> = {
  en: enTranslations,
  zh: zhTranslations,
};

const I18nContext = createContext<I18nContextType>({
  lang: 'en',
  setLang: () => {},
  t: (k: string, fallback?: string) => translationsMap.en[k] || fallback || k,
});

export function I18nProvider({ children }: { children: ReactNode }) {
  const [lang, setLang] = useState<Lang>('en');

  useEffect(() => {
    const saved = localStorage.getItem('bankcode_lang') as Lang | null;
    if (saved === 'zh' || saved === 'en') {
      setLang(saved);
    }
  }, []);

  const switchLang = (l: Lang) => {
    setLang(l);
    localStorage.setItem('bankcode_lang', l);
  };

  const t = (key: string, fallback?: string): string => {
    return translationsMap[lang]?.[key] || fallback || key;
  };

  return (
    <I18nContext.Provider value={{ lang, setLang: switchLang, t }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useT() {
  return useContext(I18nContext);
}
