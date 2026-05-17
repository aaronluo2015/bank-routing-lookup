import { RoutingCodeType, RoutingCodeTypeInfo } from './types';

export const ROUTING_TYPE_INFO: RoutingCodeTypeInfo[] = [
  { type: 'swift', name: 'SWIFT/BIC', country: '全球', description: '国际银行间通信代码', example: 'DEUTDEFF', format: '8或11位字母数字', length: [8, 11] },
  { type: 'iban', name: 'IBAN', country: '欧洲/全球', description: '国际银行账户号码', example: 'DE89370400440532013000', format: '15-34位', length: [15, 34] },
  { type: 'aba', name: 'ABA Routing', country: '美国', description: '美国银行路由号', example: '021000021', format: '9位数字', length: 9 },
  { type: 'fedwire', name: 'Fedwire', country: '美国', description: '美联储电汇路由号', example: '021000021', format: '9位数字', length: 9 },
  { type: 'sortcode', name: 'Sort Code', country: '英国', description: '英国银行清算代码', example: '20-00-00', format: '6位数字', length: 6 },
  { type: 'bsb', name: 'BSB Number', country: '澳大利亚', description: '澳大利亚银行分行代码', example: '082-902', format: '6位数字', length: 6 },
  { type: 'ncc', name: 'NCC', country: '新西兰', description: '新西兰国家清算代码', example: '123456', format: '6位数字', length: 6 },
  { type: 'ifsc', name: 'IFSC Code', country: '印度', description: '印度金融系统代码', example: 'SBIN0005944', format: '4字母+0+6数字', length: 11 },
  { type: 'india_micr', name: 'MICR Code', country: '印度', description: '印度磁墨字符识别码', example: '400002005', format: '9位数字', length: 9 },
  { type: 'transit', name: 'Transit Number', country: '加拿大', description: '加拿大银行分行号', example: '12345-678', format: '5位+3位', length: [8, 9] },
  { type: 'blz', name: 'BLZ', country: '德国', description: '德国银行代码', example: '10070000', format: '8位数字', length: 8 },
  { type: 'cnaps', name: 'CNAPS Code', country: '中国', description: '中国现代化支付系统行号', example: '102100099996', format: '12位数字', length: 12 },
  { type: 'nuban', name: 'NUBAN', country: '尼日利亚', description: '尼日利亚统一银行账号', example: '1234567890', format: '10位数字', length: 10 },
  { type: 'hk_bank_code', name: '香港银行代码', country: '香港', description: '香港银行代码', example: '004', format: '3位数字', length: 3 },
  { type: 'sg_branch_code', name: '新加坡分行代码', country: '新加坡', description: '新加坡银行分行代码', example: '7375', format: '3-4位数字', length: [3, 4] },
  { type: 'abi_cab', name: 'ABI/CAB', country: '意大利', description: '意大利银行代码', example: '02008', format: '5位数字', length: 5 },
  { type: 'mexico_clabe', name: 'CLABE', country: '墨西哥', description: '墨西哥银行间标准账号', example: '002180059702006345', format: '18位数字', length: 18 },
  { type: 'japan_bank_code', name: '日本銀行コード', country: '日本', description: '日本全国银行代码', example: '0001', format: '4位数字', length: 4 },
  { type: 'korea_bank_code', name: '韩国银行代码', country: '韩国', description: '韩国金融结算院代码', example: '004', format: '3位数字', length: 3 },
  { type: 'chips', name: 'CHIPS UID', country: '美国', description: '纽约清算所银行间支付系统', example: '123456', format: '3-6位数字', length: [3, 6] },
  { type: 'swift', name: 'Routing Code', country: '其他', description: '其他银行路由号', example: '123456789', format: '各种格式', length: [1, 34] },
];

export function detectRoutingCodeType(code: string): RoutingCodeType[] {
  const clean = code.replace(/[\s\-\.\/]/g, '').toUpperCase();
  const hasLetters = /[A-Z]/.test(clean);
  const hasDots = code.includes('.');
  const hasDash = code.includes('-');
  const hasSlash = code.includes('/');
  const len = clean.length;

  const types: RoutingCodeType[] = [];

  // SWIFT: 8 or 11 chars, pattern: 4 letters + 2 letters + 2 alphanumeric [+ 3 alphanumeric]
  if (len === 8 || len === 11) {
    if (/^[A-Z]{4}[A-Z]{2}[A-Z0-9]{2}([A-Z0-9]{3})?$/.test(clean)) {
      types.push('swift');
    }
  }
  // SWIFT can also have numbers in bank code position for some banks
  if ((len === 8 || len === 11) && hasLetters && /^[A-Z0-9]{4}[A-Z]{2}[A-Z0-9]{2}([A-Z0-9]{3})?$/.test(clean)) {
    if (!types.includes('swift')) types.push('swift');
  }

  // IBAN: 15-34 chars, starts with 2 letters + 2 digits
  if (len >= 15 && len <= 34 && /^[A-Z]{2}\d{2}[A-Z0-9]+$/.test(clean)) {
    types.push('iban');
  }

  // CLABE (Mexico): exactly 18 digits
  if (len === 18 && /^\d{18}$/.test(clean)) {
    types.push('mexico_clabe');
  }

  // CNAPS (China): exactly 12 digits
  if (len === 12 && /^\d{12}$/.test(clean)) {
    types.push('cnaps');
  }

  // IFSC (India): 11 chars, 4 letters + 0 + 6 digits
  if (len === 11 && /^[A-Z]{4}0\d{6}$/.test(clean)) {
    types.push('ifsc');
  }

  // NUBAN (Nigeria): exactly 10 digits
  if (len === 10 && /^\d{10}$/.test(clean)) {
    types.push('nuban');
  }

  // ABA/Fedwire: 9 digits (US)
  if (len === 9 && /^\d{9}$/.test(clean)) {
    if (/^\d{9}$/.test(clean)) {
      types.push('aba', 'fedwire', 'india_micr');
    }
  }

  // BLZ (Germany): exactly 8 digits
  if (len === 8 && /^\d{8}$/.test(clean)) {
    types.push('blz');
  }

  // Transit (Canada): 8 or 9 digits, or XXXXX-YYY format
  if ((len === 8 || len === 9) && /^\d+$/.test(clean)) {
    types.push('transit');
  }
  if ((hasDash && /^\d{5}-\d{3}$/.test(code.trim()))) {
    types.push('transit');
  }

  // 6 digits: could be BSB, Sort Code, NCC
  if (len === 6 && /^\d{6}$/.test(clean)) {
    types.push('sortcode', 'bsb', 'ncc');
  }

  // 5 digits: ABI/CAB (Italy) or short bank code
  if (len === 5 && /^\d{5}$/.test(clean)) {
    types.push('abi_cab');
  }

  // 4 digits: Japan bank code
  if (len === 4 && /^\d{4}$/.test(clean) && !hasDash) {
    types.push('japan_bank_code');
  }

  // 3 digits: HK bank code, Korea bank code, or Brazil
  if (len === 3 && /^\d{3}$/.test(clean)) {
    types.push('hk_bank_code', 'korea_bank_code');
  }

  // 3-4 digits with letters likely SG branch code
  if ((len === 3 || len === 4) && /^\d{3,4}$/.test(clean) && !types.includes('hk_bank_code')) {
    types.push('sg_branch_code');
  }

  // CHIPS: 3-6 digits
  if (len >= 3 && len <= 6 && /^\d{3,6}$/.test(clean) && types.length === 0) {
    types.push('chips');
  }

  // Fallback: try as SWIFT if has letters
  if (types.length === 0) {
    if (hasLetters) types.push('swift');
    else types.push('swift'); // generic fallback
  }

  return types;
}

export function getTypeInfo(type: RoutingCodeType): RoutingCodeTypeInfo | undefined {
  return ROUTING_TYPE_INFO.find(t => t.type === type);
}
