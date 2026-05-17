import { ParsedParts } from '../types';

const IBAN_LENGTHS: Record<string, number> = {
  AL: 28, AD: 24, AT: 20, AZ: 28, BH: 22, BY: 28, BE: 16, BA: 20, BR: 29,
  BG: 22, CR: 22, HR: 21, CY: 28, CZ: 24, DK: 18, DO: 28, EE: 20, FO: 18,
  FI: 18, FR: 27, GE: 22, DE: 22, GI: 23, GR: 27, GL: 18, GT: 28, HU: 28,
  IS: 26, IE: 22, IL: 23, IT: 27, JO: 30, KZ: 20, KW: 30, LV: 21, LB: 28,
  LI: 21, LT: 20, LU: 20, MK: 19, MT: 31, MR: 27, MU: 30, MC: 27, MD: 24,
  ME: 22, NL: 18, NO: 15, PK: 24, PS: 29, PL: 28, PT: 25, QA: 29, RO: 24,
  SM: 27, SA: 24, RS: 22, SK: 24, SI: 19, ES: 24, SE: 24, CH: 21, TN: 24,
  TR: 26, UA: 29, AE: 23, GB: 22, VG: 24, XK: 20, EG: 27, LC: 32, SC: 31,
  ST: 25, TL: 23,
};

const COUNTRY_NAMES: Record<string, string> = {
  GB: 'United Kingdom', DE: 'Germany', FR: 'France', ES: 'Spain',
  IT: 'Italy', NL: 'Netherlands', BE: 'Belgium', AT: 'Austria',
  CH: 'Switzerland', SE: 'Sweden', NO: 'Norway', DK: 'Denmark',
  FI: 'Finland', PT: 'Portugal', IE: 'Ireland', PL: 'Poland',
  CZ: 'Czech Republic', HU: 'Hungary', RO: 'Romania', BG: 'Bulgaria',
  HR: 'Croatia', GR: 'Greece', CY: 'Cyprus', MT: 'Malta',
  LT: 'Lithuania', LV: 'Latvia', EE: 'Estonia', SK: 'Slovakia',
  SI: 'Slovenia', LU: 'Luxembourg', IS: 'Iceland', LI: 'Liechtenstein',
  MC: 'Monaco', SM: 'San Marino', TR: 'Turkey', AE: 'United Arab Emirates',
  SA: 'Saudi Arabia', QA: 'Qatar', KW: 'Kuwait', BH: 'Bahrain',
  JO: 'Jordan', IL: 'Israel', PK: 'Pakistan', KZ: 'Kazakhstan',
  GE: 'Georgia', AZ: 'Azerbaijan', UA: 'Ukraine', BY: 'Belarus',
  MD: 'Moldova', AL: 'Albania', MK: 'North Macedonia', ME: 'Montenegro',
  RS: 'Serbia', BA: 'Bosnia and Herzegovina', XK: 'Kosovo',
  BR: 'Brazil', CR: 'Costa Rica', DO: 'Dominican Republic', GT: 'Guatemala',
  TN: 'Tunisia', EG: 'Egypt', MR: 'Mauritania', MU: 'Mauritius',
  SC: 'Seychelles', ST: 'Sao Tome and Principe', TL: 'Timor-Leste',
  LC: 'Saint Lucia', VG: 'British Virgin Islands', PS: 'Palestine',
};

export function validateIban(code: string): {
  valid: boolean;
  parsed: Record<string, string | null>;
  parsedParts: ParsedParts[];
  country: string | null;
  countryName: string | null;
} {
  const clean = code.replace(/[\s\-]/g, '').toUpperCase();

  if (clean.length < 15 || clean.length > 34 || !/^[A-Z]{2}\d{2}[A-Z0-9]+$/.test(clean)) {
    return { valid: false, parsed: {}, parsedParts: [], country: null, countryName: null };
  }

  const countryCode = clean.substring(0, 2);
  const checkDigits = clean.substring(2, 4);
  const bban = clean.substring(4);

  const expectedLength = IBAN_LENGTHS[countryCode];
  if (expectedLength && clean.length !== expectedLength) {
    return {
      valid: false,
      parsed: { countryCode, checkDigits, bban },
      parsedParts: [
        { name: 'countryCode', value: countryCode, description: '国家代码' },
        { name: 'checkDigits', value: checkDigits, description: '校验位' },
        { name: 'bban', value: bban, description: '基本银行账号' },
      ],
      country: countryCode,
      countryName: COUNTRY_NAMES[countryCode] || countryCode,
    };
  }

  const countryName = COUNTRY_NAMES[countryCode] || countryCode;

  const parsedParts: ParsedParts[] = [
    { name: 'countryCode', value: countryCode, description: '国家代码 (ISO 3166-1)' },
    { name: 'checkDigits', value: checkDigits, description: '校验位 (2位数字)' },
    { name: 'bban', value: bban, description: '基本银行账号 (BBAN)' },
  ];

  return {
    valid: true,
    parsed: { countryCode, checkDigits, bban, expectedLength: String(expectedLength || 'N/A') },
    parsedParts,
    country: countryCode,
    countryName,
  };
}
