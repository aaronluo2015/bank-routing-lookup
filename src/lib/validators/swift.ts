import { ParsedParts } from '../types';

const SWIFT_REGEX = /^[A-Z]{6}[A-Z0-9]{2}([A-Z0-9]{3})?$/;

const SWIFT_BANK_CODES: Record<string, string> = {
  DEUT: 'Deutsche Bank AG',
  CHAS: 'JPMorgan Chase Bank',
  BNPA: 'BNP Paribas',
  HSBC: 'HSBC Bank PLC',
  BOFA: 'Bank of America',
  CITI: 'Citibank',
  BARB: 'Barclays Bank PLC',
  SCBL: 'Standard Chartered Bank',
  ICIC: 'ICICI Bank',
  SBIN: 'State Bank of India',
  BKCH: 'Bank of China',
  COMM: 'Commerzbank AG',
  INGB: 'ING Bank',
  ABNL: 'ABN AMRO Bank',
  RABO: 'Rabobank',
  SOGL: 'Societe Generale',
  CRLY: 'Credit Agricole',
  BARC: 'Barclays Bank',
  NATA: 'National Australia Bank',
  ANZB: 'ANZ Bank',
  WPAC: 'Westpac Banking Corporation',
  CTBA: 'Commonwealth Bank of Australia',
  DBSB: 'DBS Bank',
  OCBC: 'OCBC Bank',
  UOVB: 'UOB Bank',
  BKID: 'Bank Indonesia',
  BKKB: 'Bangkok Bank',
  SMBC: 'Sumitomo Mitsui Banking Corporation',
  MIZU: 'Mizuho Bank',
  BOTK: 'Bank of Tokyo-Mitsubishi UFJ',
  BNPJ: 'BNP Paribas Japan',
  UBSW: 'UBS AG',
  CRES: 'Credit Suisse',
  CMFC: 'China Minsheng Bank',
  MSBC: 'China Merchants Bank',
  ABOC: 'Agricultural Bank of China',
  DBSG: 'DBS Bank Singapore',
  KOEX: 'Korea Exchange Bank',
  SHBK: 'Shinhan Bank',
  HVBK: 'Hana Bank',
  NACN: 'National Bank of Canada',
  ROYC: 'Royal Bank of Canada',
  TDOM: 'Toronto-Dominion Bank',
  BCOM: 'Bank of Communications',
  PCBG: 'China Construction Bank',
  ICBC: 'Industrial and Commercial Bank of China',
  MSHQ: 'Morgan Stanley',
  GSCM: 'Goldman Sachs',
  NWBK: 'NatWest Bank',
  LOYD: 'Lloyds Bank',
  HLFX: 'Halifax',
  RBOS: 'Royal Bank of Scotland',
  MIDL: 'HSBC UK (Midland)',
  CPBK: 'CaixaBank',
  BSCH: 'Banco Santander',
  BBVA: 'BBVA',
  POPU: 'Banco Popular',
  UNCR: 'UniCredit',
  BCIT: 'Intesa Sanpaolo',
};

const COUNTRY_CODES: Record<string, { name: string; code: string }> = {
  DE: { name: 'Germany', code: 'DEU' },
  US: { name: 'United States', code: 'USA' },
  GB: { name: 'United Kingdom', code: 'GBR' },
  FR: { name: 'France', code: 'FRA' },
  JP: { name: 'Japan', code: 'JPN' },
  CN: { name: 'China', code: 'CHN' },
  HK: { name: 'Hong Kong', code: 'HKG' },
  SG: { name: 'Singapore', code: 'SGP' },
  IN: { name: 'India', code: 'IND' },
  AU: { name: 'Australia', code: 'AUS' },
  CA: { name: 'Canada', code: 'CAN' },
  CH: { name: 'Switzerland', code: 'CHE' },
  NL: { name: 'Netherlands', code: 'NLD' },
  IT: { name: 'Italy', code: 'ITA' },
  ES: { name: 'Spain', code: 'ESP' },
  KR: { name: 'South Korea', code: 'KOR' },
  BR: { name: 'Brazil', code: 'BRA' },
  MX: { name: 'Mexico', code: 'MEX' },
  ZA: { name: 'South Africa', code: 'ZAF' },
  AE: { name: 'United Arab Emirates', code: 'ARE' },
  SA: { name: 'Saudi Arabia', code: 'SAU' },
  SE: { name: 'Sweden', code: 'SWE' },
  NO: { name: 'Norway', code: 'NOR' },
  DK: { name: 'Denmark', code: 'DNK' },
  FI: { name: 'Finland', code: 'FIN' },
  BE: { name: 'Belgium', code: 'BEL' },
  AT: { name: 'Austria', code: 'AUT' },
  PT: { name: 'Portugal', code: 'PRT' },
  IE: { name: 'Ireland', code: 'IRL' },
  NZ: { name: 'New Zealand', code: 'NZL' },
  PL: { name: 'Poland', code: 'POL' },
  RU: { name: 'Russia', code: 'RUS' },
  TR: { name: 'Turkey', code: 'TUR' },
  TH: { name: 'Thailand', code: 'THA' },
  MY: { name: 'Malaysia', code: 'MYS' },
  ID: { name: 'Indonesia', code: 'IDN' },
  PH: { name: 'Philippines', code: 'PHL' },
  VN: { name: 'Vietnam', code: 'VNM' },
  TW: { name: 'Taiwan', code: 'TWN' },
  NG: { name: 'Nigeria', code: 'NGA' },
  KE: { name: 'Kenya', code: 'KEN' },
  EG: { name: 'Egypt', code: 'EGY' },
  LU: { name: 'Luxembourg', code: 'LUX' },
  GR: { name: 'Greece', code: 'GRC' },
  CZ: { name: 'Czech Republic', code: 'CZE' },
  HU: { name: 'Hungary', code: 'HUN' },
  RO: { name: 'Romania', code: 'ROU' },
  BG: { name: 'Bulgaria', code: 'BGR' },
  HR: { name: 'Croatia', code: 'HRV' },
  SK: { name: 'Slovakia', code: 'SVK' },
  SI: { name: 'Slovenia', code: 'SVN' },
  LT: { name: 'Lithuania', code: 'LTU' },
  LV: { name: 'Latvia', code: 'LVA' },
  EE: { name: 'Estonia', code: 'EST' },
  IS: { name: 'Iceland', code: 'ISL' },
  MT: { name: 'Malta', code: 'MLT' },
  CY: { name: 'Cyprus', code: 'CYP' },
  IL: { name: 'Israel', code: 'ISR' },
  KW: { name: 'Kuwait', code: 'KWT' },
  QA: { name: 'Qatar', code: 'QAT' },
  BH: { name: 'Bahrain', code: 'BHR' },
  OM: { name: 'Oman', code: 'OMN' },
};

export function validateSwift(code: string): {
  valid: boolean;
  parsed: Record<string, string | null | boolean>;
  parsedParts: ParsedParts[];
  country: string | null;
  countryName: string | null;
  bankName: string | null;
  isHeadOffice: boolean;
} {
  const clean = code.replace(/[\s\-\.]/g, '').toUpperCase();

  if (!SWIFT_REGEX.test(clean)) {
    return {
      valid: false,
      parsed: {},
      parsedParts: [],
      country: null,
      countryName: null,
      bankName: null,
      isHeadOffice: false,
    };
  }

  const bankCode = clean.substring(0, 4);
  const countryCode = clean.substring(4, 6);
  const locationCode = clean.substring(6, 8);
  const branchCode = clean.length === 11 ? clean.substring(8, 11) : null;

  const country = COUNTRY_CODES[countryCode];
  const bankName = SWIFT_BANK_CODES[bankCode] || null;
  const isHeadOffice = branchCode === 'XXX' || branchCode === null;

  const parsedParts: ParsedParts[] = [
    { name: 'bankCode', value: bankCode, description: '银行代码 (4位字母)' },
    { name: 'countryCode', value: countryCode, description: '国家代码 (2位字母, ISO 3166)' },
    { name: 'locationCode', value: locationCode, description: '地区代码 (2位字母或数字)' },
  ];

  if (branchCode) {
    parsedParts.push({
      name: 'branchCode', value: branchCode,
      description: branchCode === 'XXX' ? '分行码 (XXX=总行)' : '分行码 (3位字母或数字)',
    });
  }

  return {
    valid: true,
    parsed: { bankCode, countryCode, locationCode, branchCode, isHeadOffice, bankName },
    parsedParts,
    country: countryCode,
    countryName: country?.name || countryCode,
    bankName,
    isHeadOffice,
  };
}
