import { ParsedParts } from '../types';

export function validateSortCode(code: string): {
  valid: boolean;
  parsed: Record<string, string | null>;
  parsedParts: ParsedParts[];
  country: string | null;
  countryName: string | null;
} {
  const clean = code.replace(/[\s\-]/g, '');

  if (!/^\d{6}$/.test(clean)) {
    return { valid: false, parsed: {}, parsedParts: [], country: null, countryName: null };
  }

  const pair1 = clean.substring(0, 2);
  const pair2 = clean.substring(2, 4);
  const pair3 = clean.substring(4, 6);

  const parsedParts: ParsedParts[] = [
    { name: 'bankRange', value: pair1, description: '银行范围 (前2位)' },
    { name: 'areaRange', value: pair2, description: '区域范围 (中2位)' },
    { name: 'branchRange', value: pair3, description: '分行范围 (后2位)' },
  ];

  return {
    valid: true,
    parsed: { pair1, pair2, pair3, formatted: `${pair1}-${pair2}-${pair3}` },
    parsedParts,
    country: 'GB',
    countryName: 'United Kingdom',
  };
}
