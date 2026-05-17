import { BankRecord, RoutingCodeType, ConflictRecord, SourceLog } from './types';
import { DataSourceResult } from './sources/base';
import { getSourcesForType } from './sources';
import { validateByType } from './validators';
import { getFromLocalDb, saveToLocalDb } from './local-db';
import { cacheGet, cacheSet } from './cache';

interface ReconciledRecord {
  record: BankRecord;
  confidence: number;
  conflicts: ConflictRecord[];
}

export async function lookupWithReconciler(
  code: string,
  type: RoutingCodeType
): Promise<ReconciledRecord | null> {
  const normalizedCode = code.replace(/[\s\-\.]/g, '').toUpperCase();
  const cacheKey = `lookup:${type}:${normalizedCode}`;

  const cached = cacheGet<ReconciledRecord>(cacheKey);
  if (cached) return cached;

  const validation = validateByType(code, type);
  if (!validation.valid) return null;

  // Check local DB first
  const local = getFromLocalDb(normalizedCode, type);

  // Build basic record from validation + local data
  const createRecord = (): BankRecord => ({
    code: normalizedCode,
    normalizedCode,
    type,
    country: validation.country || 'UNKNOWN',
    countryName: validation.countryName || 'Unknown',
    bankName: local?.bankName || validation.parsed?.bankName as string || 'Unknown Bank',
    branch: local?.branch || undefined,
    address: local?.address || undefined,
    city: local?.city || undefined,
    sourceCount: local?.sourceCount || 0,
    lastVerified: local?.lastVerified || new Date().toISOString(),
    confidence: local?.confidence || 30,
    sources: local?.sources || [],
    conflicts: local?.conflicts || [],
    sourceLog: local?.sourceLog || [],
  });

  // If we have high-quality local data, use it immediately
  if (local && local.confidence >= 80) {
    const result: ReconciledRecord = {
      record: local,
      confidence: local.confidence,
      conflicts: local.conflicts || [],
    };
    cacheSet(cacheKey, result, 3600000);
    return result;
  }

  // Try external sources for enrichment
  const sources = getSourcesForType(type);
  const results: { source: string; result: DataSourceResult }[] = [];

  if (sources.length > 0) {
    const promises = sources.map(async (source) => {
      try {
        const controller = new AbortController();
        const id = setTimeout(() => controller.abort(), 3000); // 3s timeout
        const result = await source.lookup(normalizedCode, type);
        clearTimeout(id);
        return { source: source.name, result };
      } catch {
        return { source: source.name, result: { success: false, error: 'timeout' } };
      }
    });

    const settled = await Promise.allSettled(promises);
    for (const item of settled) {
      if (item.status === 'fulfilled' && item.value.result.success) {
        results.push(item.value);
      }
    }
  }

  // If no local data and no external results
  if (!local && results.length === 0) {
    // For SWIFT branch codes, return null so caller can fall back to head office
    if (type === 'swift' && normalizedCode.length === 11) {
      return null;
    }
    // For other types, return basic validation-only record
    const record = createRecord();
    const result: ReconciledRecord = { record, confidence: 30, conflicts: [] };
    cacheSet(cacheKey, result, 3600000);
    return result;
  }

  // If we have local data but external enrichment, merge
  const merged = mergeResults(normalizedCode, type, validation, local, results);
  cacheSet(cacheKey, merged, 3600000);

  // Save improved data back to local DB
  if (merged.confidence > (local?.confidence || 0)) {
    saveToLocalDb(merged.record);
  }

  return merged;
}

function mergeResults(
  code: string,
  type: RoutingCodeType,
  validation: ReturnType<typeof validateByType>,
  local: BankRecord | null,
  remoteResults: { source: string; result: DataSourceResult }[]
): ReconciledRecord {
  const sourcesList: string[] = remoteResults.map(r => r.source);
  const conflicts: ConflictRecord[] = [];

  const bankNames = new Map<string, number>();
  const cities = new Map<string, number>();
  const branches = new Map<string, number>();
  const addresses = new Map<string, number>();

  if (local) {
    sourcesList.push('local');
    bankNames.set(local.bankName, 1);
    if (local.city) cities.set(local.city, 1);
    if (local.branch) branches.set(local.branch, 1);
    if (local.address) addresses.set(local.address, 1);
  }

  for (const { source, result } of remoteResults) {
    if (result.bankName) bankNames.set(result.bankName, (bankNames.get(result.bankName) || 0) + 1);
    if (result.city) cities.set(result.city, (cities.get(result.city) || 0) + 1);
    if (result.branch) branches.set(result.branch, (branches.get(result.branch) || 0) + 1);
    if (result.address) addresses.set(result.address, (addresses.get(result.address) || 0) + 1);
  }

  const bankName = pickMajority(bankNames) || local?.bankName || 'Unknown';
  const city = pickMajority(cities) || local?.city;
  const branch = pickMajority(branches) || local?.branch;
  const address = pickMajority(addresses) || local?.address;

  if (bankNames.size > 1) {
    const vals: Record<string, string> = {};
    bankNames.forEach((count, name) => { vals[name] = `${name} (${count} sources)`; });
    conflicts.push({ field: 'bankName', values: vals });
  }

  const hasLocal = !!local;
  const remoteCount = remoteResults.length;
  const totalSources = (hasLocal ? 1 : 0) + remoteCount;
  let confidence = hasLocal ? local!.confidence : 30;

  if (remoteCount >= 2 && conflicts.length === 0) confidence = 90;
  else if (remoteCount === 1 && conflicts.length === 0) confidence = Math.max(confidence, 70);
  else if (remoteCount >= 1 && conflicts.length <= 1) confidence = Math.max(confidence, 60);
  else if (hasLocal && remoteCount === 0) confidence = local?.confidence || 40;

  const record: BankRecord = {
    code,
    normalizedCode: code,
    type,
    country: local?.country || validation.country || remoteResults[0]?.result.country || 'UNKNOWN',
    countryName: local?.countryName || validation.countryName || remoteResults[0]?.result.countryName || 'Unknown',
    bankName,
    branch: branch || undefined,
    address: address || undefined,
    city: city || undefined,
    sourceCount: totalSources,
    lastVerified: new Date().toISOString(),
    confidence,
    sources: [...new Set(sourcesList)],
    conflicts,
    sourceLog: buildSourceLog(local, remoteResults, bankName, city),
  };

  return { record, confidence, conflicts };
}

function pickMajority(map: Map<string, number>): string | undefined {
  if (map.size === 0) return undefined;
  let best = '';
  let bestCount = 0;
  map.forEach((count, value) => { if (count > bestCount) { bestCount = count; best = value; } });
  return best || undefined;
}

function buildSourceLog(
  local: BankRecord | null,
  remoteResults: { source: string; result: DataSourceResult }[],
  chosenBankName: string,
  chosenCity: string | undefined
): SourceLog[] {
  const logs: SourceLog[] = [];
  const timestamp = new Date().toISOString();

  if (local) {
    logs.push({
      timestamp,
      source: 'local',
      success: true,
      data: { bankName: local.bankName, city: local.city, country: local.country },
      chosen: local.bankName === chosenBankName,
    });
  }

  for (const { source, result } of remoteResults) {
    logs.push({
      timestamp,
      source,
      success: result.success,
      data: {
        bankName: result.bankName,
        city: result.city,
        country: result.country,
        countryName: result.countryName,
      },
      error: result.error,
      chosen: result.bankName === chosenBankName,
    });
  }

  return logs;
}
