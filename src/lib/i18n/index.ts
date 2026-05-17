export type Lang = 'en' | 'zh';
export type TranslationKey = string;

const translations: Record<Lang, Record<string, string>> = {} as Record<Lang, Record<string, string>>;

export async function loadTranslations(lang: Lang): Promise<Record<string, string>> {
  if (translations[lang]) return translations[lang];

  const mod = lang === 'zh'
    ? (await import('./zh')).default
    : (await import('./en')).default;

  translations[lang] = mod;
  return mod;
}

export function getStaticTranslations(lang: Lang): Record<string, string> {
  if (lang === 'zh') return require('./zh').default;
  return require('./en').default;
}
