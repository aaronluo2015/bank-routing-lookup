import { ParsedParts } from '../types';

export function validateTransit(code: string): {
  valid: boolean;
  parsed: Record<string, string | null>;
  parsedParts: ParsedParts[];
  country: string | null;
  countryName: string | null;
} {
  const clean = code.replace(/[\s\-]/g, '');

  if (!/^\d{9}$/.test(clean) && !/^\d{5}-\d{3}$/.test(code)) {
    if (clean.length === 8 && /^\d{8}$/.test(clean)) {
      // Some Canadian transit numbers are 8 digits
      const branchNumber = clean.substring(0, 5);
      const institutionId = clean.substring(5, 8);
      return {
        valid: true,
        parsed: { branchNumber, institutionId, formatted: `${branchNumber}-${institutionId}` },
        parsedParts: [
          { name: 'branchNumber', value: branchNumber, description: '分行号 (5位)' },
          { name: 'institutionId', value: institutionId, description: '机构ID (3位)' },
        ],
        country: 'CA', countryName: 'Canada',
      };
    }
    return { valid: false, parsed: {}, parsedParts: [], country: null, countryName: null };
  }

  const digits = clean;
  const branchNumber = digits.substring(0, 5);
  const institutionId = digits.length >= 8 ? digits.substring(5, 8) : digits.substring(5);

  const parsedParts: ParsedParts[] = [
    { name: 'branchNumber', value: branchNumber, description: '分行号 (5位)' },
    { name: 'institutionId', value: institutionId, description: '机构ID (3位)' },
  ];

  return {
    valid: true,
    parsed: { branchNumber, institutionId, formatted: `${branchNumber}-${institutionId}` },
    parsedParts,
    country: 'CA',
    countryName: 'Canada',
  };
}
