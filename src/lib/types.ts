export type RoutingCodeType =
  | 'swift' | 'aba' | 'sortcode' | 'iban' | 'bsb' | 'ifsc'
  | 'transit' | 'blz' | 'cnaps' | 'ncc' | 'hk_bank_code'
  | 'sg_branch_code' | 'abi_cab' | 'nuban' | 'fedwire' | 'chips'
  | 'brasil_compensacao' | 'mexico_clabe' | 'japan_bank_code'
  | 'korea_bank_code' | 'australia_bsb' | 'india_micr';

export interface ConflictRecord {
  field: string;
  values: Record<string, string>;
}

export interface SourceLog {
  timestamp: string;
  source: string;
  success: boolean;
  data: Partial<{
    bankName: string; branch: string; address: string;
    city: string; country: string; countryName: string;
  }>;
  error?: string;
  chosen: boolean;
}

export interface BankRecord {
  code: string;
  normalizedCode: string;
  type: RoutingCodeType;
  country: string;
  countryName: string;
  bankName: string;
  branch?: string;
  address?: string;
  city?: string;
  zip?: string;
  phone?: string;
  website?: string;
  isHeadOffice?: boolean;
  isConnected?: boolean;

  sourceCount: number;
  lastVerified: string;
  confidence: number;
  sources: string[];
  conflicts?: ConflictRecord[];
  sourceLog?: SourceLog[];
}

export interface ParsedParts {
  name: string;
  value: string;
  description: string;
}

export interface LookupResult {
  success: boolean;
  valid: boolean;
  code: string;
  type: RoutingCodeType;
  country: string;
  countryName: string;
  parsed: Record<string, string | null | boolean>;
  parsedParts: ParsedParts[];
  bank?: Omit<BankRecord, 'conflicts' | 'sourceCount' | 'sourceLog'> & { sources: string[] };
  confidence: number;
  sources: string[];
  verifiedAt?: string;
  queriedAt: string;
  error?: string;
  message?: string;
  suggestions?: string[];
  warnings?: string[];
}

export interface BatchLookupRequest {
  codes: string[];
  api_key?: string;
  type?: RoutingCodeType;
}

export interface BatchLookupResponse {
  success: boolean;
  results: LookupResult[];
  total: number;
  found: number;
}

export interface ValidateResult {
  success: boolean;
  valid: boolean;
  code: string;
  type: RoutingCodeType | null;
  country: string | null;
  parsed: Record<string, string | null>;
  parsedParts: ParsedParts[];
  message?: string;
}

export interface HealthCheckResult {
  status: 'ok' | 'degraded' | 'down';
  uptime: string;
  version: string;
  sources: Record<string, { status: 'online' | 'offline' | 'degraded'; lastCheck: string }>;
  localDb: { size: number; avgConfidence: number; lastUpdated: string };
  rateLimit: { current: number; limit: number };
}

export interface EnrichRequest {
  codes?: string[];
  minConfidence?: number;
  types?: RoutingCodeType[];
}

export interface EnrichResult {
  success: boolean;
  processed: number;
  updated: number;
  created: number;
  errors: string[];
}

export interface AdminStats {
  totalQueries: number;
  apiCalls: number;
  cacheHitRate: number;
  queriesByDay: { date: string; count: number }[];
  queriesByType: { type: string; count: number }[];
  topCodes: { code: string; type: string; count: number }[];
  dbSize: number;
  avgConfidence: number;
  sourcesStatus: Record<string, string>;
}

export interface ApiKeyRecord {
  id: string;
  name: string;
  keyHash: string;
  tier: 'free' | 'starter' | 'growth' | 'business' | 'enterprise';
  quota: number;
  used: number;
  enabled: boolean;
  createdAt: string;
  expiresAt: string | null;
  lastUsedAt: string | null;
  lastUsedIp: string | null;
}

export type RoutingCodeTypeInfo = {
  type: RoutingCodeType;
  name: string;
  country: string;
  description: string;
  example: string;
  format: string;
  length: number | [number, number];
};
