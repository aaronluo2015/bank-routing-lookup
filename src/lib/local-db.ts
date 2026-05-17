import { BankRecord, RoutingCodeType } from './types';
import fs from 'fs';
import path from 'path';

const DB_PATH = path.join(process.cwd(), 'src/data/banks.json');

interface DbCache {
  records: BankRecord[];
  index: Map<string, BankRecord>;
  meta: { lastUpdated: string; version: string; total: number };
}

let cache: DbCache | null = null;

function getNormalizedKey(code: string, type: RoutingCodeType): string {
  return `${type}:${code.replace(/[\s\-\.]/g, '').toUpperCase()}`;
}

function ensureCache(): DbCache {
  if (cache) return cache;

  const index = new Map<string, BankRecord>();
  let records: BankRecord[] = [];

  if (fs.existsSync(DB_PATH)) {
    try {
      records = JSON.parse(fs.readFileSync(DB_PATH, 'utf-8'));
      if (!Array.isArray(records)) records = [];
    } catch {
      records = [];
    }
  }

  for (const record of records) {
    index.set(getNormalizedKey(record.code, record.type), record);
  }

  cache = {
    records,
    index,
    meta: {
      lastUpdated: new Date().toISOString(),
      version: '1.0.0',
      total: records.length,
    },
  };

  return cache;
}

function persist(): void {
  if (!cache) return;
  const dir = path.dirname(DB_PATH);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(DB_PATH, JSON.stringify(cache.records, null, 2), 'utf-8');
}

export function getFromLocalDb(code: string, type: RoutingCodeType): BankRecord | null {
  const db = ensureCache();
  return db.index.get(getNormalizedKey(code, type)) || null;
}

export function searchLocalDb(query: string): BankRecord[] {
  const db = ensureCache();
  const lower = query.toLowerCase();
  return db.records.filter(r =>
    r.code.toLowerCase().includes(lower) ||
    r.bankName.toLowerCase().includes(lower) ||
    (r.city?.toLowerCase().includes(lower)) ||
    r.country.toLowerCase().includes(lower)
  ).slice(0, 50);
}

export function saveToLocalDb(record: BankRecord): void {
  const db = ensureCache();
  const key = getNormalizedKey(record.code, record.type);
  const idx = db.records.findIndex(r => getNormalizedKey(r.code, r.type) === key);

  if (idx >= 0) {
    db.records[idx] = record;
  } else {
    db.records.push(record);
  }
  db.index.set(key, record);
  db.meta.lastUpdated = new Date().toISOString();
  db.meta.total = db.records.length;
  persist();
}

export function saveManyToLocalDb(records: BankRecord[]): void {
  const db = ensureCache();
  for (const record of records) {
    const key = getNormalizedKey(record.code, record.type);
    const idx = db.records.findIndex(r => getNormalizedKey(r.code, r.type) === key);
    if (idx >= 0) {
      db.records[idx] = record;
    } else {
      db.records.push(record);
    }
    db.index.set(key, record);
  }
  db.meta.lastUpdated = new Date().toISOString();
  db.meta.total = db.records.length;
  persist();
}

export function deleteFromLocalDb(code: string, type: RoutingCodeType): boolean {
  const db = ensureCache();
  const key = getNormalizedKey(code, type);
  const idx = db.records.findIndex(r => getNormalizedKey(r.code, r.type) === key);
  if (idx < 0) return false;
  db.records.splice(idx, 1);
  db.index.delete(key);
  db.meta.total = db.records.length;
  persist();
  return true;
}

export function getLocalDbStats() {
  const db = ensureCache();
  const avgConfidence = db.records.length > 0
    ? Math.round(db.records.reduce((sum, r) => sum + r.confidence, 0) / db.records.length)
    : 0;
  return { size: db.records.length, avgConfidence, lastUpdated: db.meta.lastUpdated };
}

export function getLowConfidenceRecords(minConfidence: number = 70): BankRecord[] {
  return ensureCache().records.filter(r => r.confidence < minConfidence);
}

export function getAllRecords(): BankRecord[] {
  return ensureCache().records;
}

export function reloadDb(): void {
  cache = null;
  ensureCache();
}
