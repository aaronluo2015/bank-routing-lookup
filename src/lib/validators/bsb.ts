import { ParsedParts } from '../types';

export function validateBsb(code: string): {
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

  const bankCode = clean.substring(0, 3);
  const branchCode = clean.substring(3, 6);

  const parsedParts: ParsedParts[] = [
    { name: 'bankCode', value: bankCode, description: '银行代码 (前3位)' },
    { name: 'branchCode', value: branchCode, description: '分行代码 (后3位)' },
  ];

  return {
    valid: true,
    parsed: { bankCode, branchCode, formatted: `${bankCode}-${branchCode}` },
    parsedParts,
    country: 'AU',
    countryName: 'Australia',
  };
}
