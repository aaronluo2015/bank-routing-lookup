import { ParsedParts } from '../types';

export function validateAba(code: string): {
  valid: boolean;
  parsed: Record<string, string | null>;
  parsedParts: ParsedParts[];
  country: string | null;
  countryName: string | null;
} {
  const clean = code.replace(/[\s\-]/g, '');

  if (!/^\d{9}$/.test(clean)) {
    return { valid: false, parsed: {}, parsedParts: [], country: null, countryName: null };
  }

  const checksum =
    (3 * (parseInt(clean[0]) + parseInt(clean[3]) + parseInt(clean[6])) +
      7 * (parseInt(clean[1]) + parseInt(clean[4]) + parseInt(clean[7])) +
      (parseInt(clean[2]) + parseInt(clean[5]) + parseInt(clean[8]))) % 10;

  const federalReservePrefix = clean.substring(0, 4);
  const institutionId = clean.substring(4, 8);
  const checkDigit = clean[8];
  const checksumValid = checksum === 0;

  const parsedParts: ParsedParts[] = [
    { name: 'federalReservePrefix', value: federalReservePrefix, description: '联邦储备路由前缀 (4位)' },
    { name: 'institutionId', value: institutionId, description: '机构标识 (4位)' },
    { name: 'checkDigit', value: checkDigit, description: '校验位' },
  ];

  return {
    valid: checksumValid,
    parsed: { federalReservePrefix, institutionId, checkDigit },
    parsedParts,
    country: 'US',
    countryName: 'United States',
  };
}
