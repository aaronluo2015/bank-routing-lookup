import { ParsedParts } from '../types';

export function validateBlz(code: string): {
  valid: boolean;
  parsed: Record<string, string | null>;
  parsedParts: ParsedParts[];
  country: string | null;
  countryName: string | null;
} {
  const clean = code.replace(/[\s\-]/g, '');

  if (!/^\d{8}$/.test(clean)) {
    return { valid: false, parsed: {}, parsedParts: [], country: null, countryName: null };
  }

  const clearingArea = clean[0];
  const locationCode = clean.substring(1, 4);
  const bankCode = clean.substring(4, 7);
  const checkDigit = clean[7];

  const parsedParts: ParsedParts[] = [
    { name: 'clearingArea', value: clearingArea, description: '清算区域 (1位)' },
    { name: 'locationCode', value: locationCode, description: '地区代码 (3位)' },
    { name: 'bankCode', value: bankCode, description: '银行/分行代码 (3位)' },
    { name: 'checkDigit', value: checkDigit, description: '校验位' },
  ];

  return {
    valid: true,
    parsed: { clearingArea, locationCode, bankCode, checkDigit },
    parsedParts,
    country: 'DE',
    countryName: 'Germany',
  };
}
