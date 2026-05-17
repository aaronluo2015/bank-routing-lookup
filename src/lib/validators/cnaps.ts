import { ParsedParts } from '../types';

export function validateCnaps(code: string): {
  valid: boolean;
  parsed: Record<string, string | null>;
  parsedParts: ParsedParts[];
  country: string | null;
  countryName: string | null;
} {
  const clean = code.replace(/[\s\-]/g, '');

  if (!/^\d{12}$/.test(clean)) {
    return { valid: false, parsed: {}, parsedParts: [], country: null, countryName: null };
  }

  const bankCode = clean.substring(0, 3);
  const cityCode = clean.substring(3, 7);
  const branchCode = clean.substring(7, 11);
  const checkDigit = clean.substring(11);

  const parsedParts: ParsedParts[] = [
    { name: 'bankCode', value: bankCode, description: '银行代码 (3位)' },
    { name: 'cityCode', value: cityCode, description: '城市代码 (4位)' },
    { name: 'branchCode', value: branchCode, description: '分行代码 (4位)' },
    { name: 'checkDigit', value: checkDigit, description: '校验位 (1位)' },
  ];

  return {
    valid: true,
    parsed: { bankCode, cityCode, branchCode, checkDigit },
    parsedParts,
    country: 'CN',
    countryName: 'China',
  };
}
