import { ParsedParts } from '../types';

const IFSC_BANKS: Record<string, string> = {
  SBIN: 'State Bank of India',
  ICIC: 'ICICI Bank',
  HDFC: 'HDFC Bank',
  AXIS: 'Axis Bank',
  PUNB: 'Punjab National Bank',
  BOBR: 'Bank of Baroda',
  CBIN: 'Central Bank of India',
  UBIN: 'Union Bank of India',
  CNRB: 'Canara Bank',
  BKID: 'Bank of India',
  IDIB: 'Indian Bank',
  INDB: 'IndusInd Bank',
  YESB: 'Yes Bank',
  KKBK: 'Kotak Mahindra Bank',
  FDRL: 'Federal Bank',
  UTIB: 'Axis Bank',
  IOBA: 'Indian Overseas Bank',
  UCOB: 'UCO Bank',
  MAHB: 'Bank of Maharashtra',
};

export function validateIfsc(code: string): {
  valid: boolean;
  parsed: Record<string, string | null>;
  parsedParts: ParsedParts[];
  bankName: string | null;
  country: string | null;
  countryName: string | null;
} {
  const clean = code.replace(/[\s\-]/g, '').toUpperCase();

  if (!/^[A-Z]{4}0\d{6}$/.test(clean)) {
    return {
      valid: false, parsed: {}, parsedParts: [],
      bankName: null, country: null, countryName: null,
    };
  }

  const bankCode = clean.substring(0, 4);
  const zero = clean[4];
  const branchCode = clean.substring(5);
  const bankName = IFSC_BANKS[bankCode] || null;

  const parsedParts: ParsedParts[] = [
    { name: 'bankCode', value: bankCode, description: '银行代码 (4位字母)' },
    { name: 'controlDigit', value: zero, description: '控制位 (固定为0)' },
    { name: 'branchCode', value: branchCode, description: '分行代码 (6位数字)' },
  ];

  return {
    valid: true,
    parsed: { bankCode, controlDigit: zero, branchCode, bankName },
    parsedParts,
    bankName,
    country: 'IN',
    countryName: 'India',
  };
}
