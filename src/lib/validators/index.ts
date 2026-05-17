import { validateSwift } from './swift';
import { validateAba } from './aba';
import { validateSortCode } from './sortcode';
import { validateIban } from './iban';
import { validateBsb } from './bsb';
import { validateIfsc } from './ifsc';
import { validateTransit } from './transit';
import { validateBlz } from './blz';
import { validateCnaps } from './cnaps';
import { RoutingCodeType, ParsedParts } from '../types';

export interface ValidationResult {
  valid: boolean;
  parsed: Record<string, string | null | boolean>;
  parsedParts: ParsedParts[];
  country: string | null;
  countryName: string | null;
  bankName?: string | null;
}

export function validateByType(code: string, type: RoutingCodeType): ValidationResult {
  switch (type) {
    case 'swift': return validateSwift(code);
    case 'aba': return validateAba(code);
    case 'sortcode': return validateSortCode(code);
    case 'iban': return validateIban(code);
    case 'bsb': case 'australia_bsb': return validateBsb(code);
    case 'ifsc': case 'india_micr': return validateIfsc(code);
    case 'transit': return validateTransit(code);
    case 'blz': return validateBlz(code);
    case 'cnaps': return validateCnaps(code);
    case 'fedwire': return validateAba(code);
    case 'chips': {
      const parts = code.replace(/[\s\-]/g, '');
      if (!/^\d{3,6}$/.test(parts)) {
        return { valid: false, parsed: {}, parsedParts: [], country: null, countryName: null };
      }
      return {
        valid: true,
        parsed: { code: parts },
        parsedParts: [{ name: 'chipsUID', value: parts, description: 'CHIPS参与方UID' }],
        country: 'US', countryName: 'United States',
      };
    }
    case 'ncc': {
      const clean = code.replace(/[\s\-]/g, '');
      if (!/^\d{6}$/.test(clean)) {
        return { valid: false, parsed: {}, parsedParts: [], country: null, countryName: null };
      }
      return {
        valid: true,
        parsed: { code: clean, bankCode: clean.substring(0, 2), branchCode: clean.substring(2, 4), suffix: clean.substring(4, 6) },
        parsedParts: [
          { name: 'bankCode', value: clean.substring(0, 2), description: '银行代码 (2位)' },
          { name: 'branchCode', value: clean.substring(2, 4), description: '分行代码 (2位)' },
          { name: 'suffix', value: clean.substring(4, 6), description: '后缀 (2位)' },
        ],
        country: 'NZ', countryName: 'New Zealand',
      };
    }
    case 'hk_bank_code': {
      const clean = code.replace(/[\s\-]/g, '');
      if (!/^\d{3}$/.test(clean)) {
        return { valid: false, parsed: {}, parsedParts: [], country: null, countryName: null };
      }
      return {
        valid: true, parsed: { code: clean },
        parsedParts: [{ name: 'bankCode', value: clean, description: '银行代码 (3位)' }],
        country: 'HK', countryName: 'Hong Kong',
      };
    }
    case 'sg_branch_code': {
      const clean = code.replace(/[\s\-]/g, '');
      if (!/^\d{3,4}$/.test(clean)) {
        return { valid: false, parsed: {}, parsedParts: [], country: null, countryName: null };
      }
      return {
        valid: true, parsed: { code: clean },
        parsedParts: [{ name: 'branchCode', value: clean, description: '分行代码 (3-4位)' }],
        country: 'SG', countryName: 'Singapore',
      };
    }
    case 'abi_cab': {
      const clean = code.replace(/[\s\-]/g, '');
      if (!/^\d{5}$/.test(clean)) {
        return { valid: false, parsed: {}, parsedParts: [], country: null, countryName: null };
      }
      return {
        valid: true, parsed: { abi: clean.substring(0, 5) },
        parsedParts: [
          { name: 'abi', value: clean.substring(0, 5), description: 'ABI代码 (5位)' },
        ],
        country: 'IT', countryName: 'Italy',
      };
    }
    case 'nuban': {
      const clean = code.replace(/[\s\-]/g, '');
      if (!/^\d{10}$/.test(clean)) {
        return { valid: false, parsed: {}, parsedParts: [], country: null, countryName: null };
      }
      return {
        valid: true, parsed: { bankCode: clean.substring(0, 3), accountSerial: clean.substring(3, 9), checkDigit: clean.substring(9) },
        parsedParts: [
          { name: 'bankCode', value: clean.substring(0, 3), description: '银行代码 (3位)' },
          { name: 'accountSerial', value: clean.substring(3, 9), description: '账户序列号 (6位)' },
          { name: 'checkDigit', value: clean.substring(9), description: '校验位 (1位)' },
        ],
        country: 'NG', countryName: 'Nigeria',
      };
    }
    case 'mexico_clabe': {
      const clean = code.replace(/[\s\-]/g, '');
      if (!/^\d{18}$/.test(clean)) {
        return { valid: false, parsed: {}, parsedParts: [], country: null, countryName: null };
      }
      return {
        valid: true, parsed: {
          bankCode: clean.substring(0, 3), branchCode: clean.substring(3, 6),
          accountNumber: clean.substring(6, 17), checkDigit: clean.substring(17),
        },
        parsedParts: [
          { name: 'bankCode', value: clean.substring(0, 3), description: '银行代码 (3位)' },
          { name: 'branchCode', value: clean.substring(3, 6), description: '分行代码 (3位)' },
          { name: 'accountNumber', value: clean.substring(6, 17), description: '账号 (11位)' },
          { name: 'checkDigit', value: clean.substring(17), description: '校验位 (1位)' },
        ],
        country: 'MX', countryName: 'Mexico',
      };
    }
    case 'japan_bank_code': {
      const clean = code.replace(/[\s\-]/g, '');
      if (!/^\d{4}$/.test(clean)) {
        return { valid: false, parsed: {}, parsedParts: [], country: null, countryName: null };
      }
      return {
        valid: true, parsed: { bankCode: clean },
        parsedParts: [{ name: 'bankCode', value: clean, description: '全国银行代码 (4位)' }],
        country: 'JP', countryName: 'Japan',
      };
    }
    case 'korea_bank_code': {
      const clean = code.replace(/[\s\-]/g, '');
      if (!/^\d{3}$/.test(clean)) {
        return { valid: false, parsed: {}, parsedParts: [], country: null, countryName: null };
      }
      return {
        valid: true, parsed: { bankCode: clean },
        parsedParts: [{ name: 'bankCode', value: clean, description: '金融结算院代码 (3位)' }],
        country: 'KR', countryName: 'South Korea',
      };
    }
    case 'india_micr': {
      const clean = code.replace(/[\s\-]/g, '');
      if (!/^\d{9}$/.test(clean)) {
        return { valid: false, parsed: {}, parsedParts: [], country: null, countryName: null };
      }
      return {
        valid: true, parsed: {
          cityCode: clean.substring(0, 3), bankCode: clean.substring(3, 6), branchCode: clean.substring(6, 9),
        },
        parsedParts: [
          { name: 'cityCode', value: clean.substring(0, 3), description: '城市代码 (3位)' },
          { name: 'bankCode', value: clean.substring(3, 6), description: '银行代码 (3位)' },
          { name: 'branchCode', value: clean.substring(6, 9), description: '分行代码 (3位)' },
        ],
        country: 'IN', countryName: 'India',
      };
    }
    default: {
      return { valid: false, parsed: {}, parsedParts: [], country: null, countryName: null };
    }
  }
}

export {
  validateSwift, validateAba, validateSortCode, validateIban,
  validateBsb, validateIfsc, validateTransit, validateBlz, validateCnaps,
};
