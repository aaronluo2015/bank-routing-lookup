import fs from 'fs';
import path from 'path';
import { BankRecord, RoutingCodeType } from './types';

const CHUNKS_DIR = path.join(process.cwd(), 'src/data/chunks');

let db: {
  records: BankRecord[];
  index: Map<string, BankRecord>;
} | null = null;

function getNormalizedKey(code: string, type: RoutingCodeType): string {
  return `${type}:${code.replace(/[\s\-\.]/g, '').toUpperCase()}`;
}

function ensureDb() {
  if (db) return db;

  const index = new Map<string, BankRecord>();
  const records: BankRecord[] = [];

  if (fs.existsSync(CHUNKS_DIR)) {
    const files = fs.readdirSync(CHUNKS_DIR).filter(f => f.endsWith('.json'));
    for (const file of files) {
      try {
        const data: BankRecord[] = JSON.parse(
          fs.readFileSync(path.join(CHUNKS_DIR, file), 'utf-8')
        );
        if (Array.isArray(data)) {
          for (const record of data) {
            index.set(getNormalizedKey(record.code, record.type), record);
          }
          records.push(...data);
        }
      } catch { /* skip bad files */ }
    }
  }

  db = { records, index };
  return db;
}

export function getFromLocalDb(code: string, type: RoutingCodeType): BankRecord | null {
  const d = ensureDb();
  return d.index.get(getNormalizedKey(code, type)) || null;
}

export function searchLocalDb(query: string): BankRecord[] {
  const d = ensureDb();
  const lower = query.toLowerCase();
  return d.records.filter(r =>
    r.code.toLowerCase().includes(lower) ||
    r.bankName.toLowerCase().includes(lower) ||
    (r.city?.toLowerCase().includes(lower)) ||
    r.country.toLowerCase().includes(lower)
  ).slice(0, 50);
}

export function saveToLocalDb(record: BankRecord): void {
  const d = ensureDb();
  const key = getNormalizedKey(record.code, record.type);
  const idx = d.records.findIndex(r => getNormalizedKey(r.code, r.type) === key);
  if (idx >= 0) d.records[idx] = record;
  else d.records.push(record);
  d.index.set(key, record);
  saveChunk(record.type, record);
}

export function saveManyToLocalDb(records: BankRecord[]): void {
  const d = ensureDb();
  for (const record of records) {
    const key = getNormalizedKey(record.code, record.type);
    const idx = d.records.findIndex(r => getNormalizedKey(r.code, r.type) === key);
    if (idx >= 0) d.records[idx] = record;
    else d.records.push(record);
    d.index.set(key, record);
  }
  persistAll();
}

export function deleteFromLocalDb(code: string, type: RoutingCodeType): boolean {
  const d = ensureDb();
  const key = getNormalizedKey(code, type);
  const idx = d.records.findIndex(r => getNormalizedKey(r.code, r.type) === key);
  if (idx < 0) return false;
  d.records.splice(idx, 1);
  d.index.delete(key);
  persistAll();
  return true;
}

export function getLocalDbStats() {
  const d = ensureDb();
  const avg = d.records.length > 0
    ? Math.round(d.records.reduce((s, r) => s + (r.confidence || 80), 0) / d.records.length)
    : 0;
  return { size: d.records.length, avgConfidence: avg, lastUpdated: new Date().toISOString() };
}

export function getAllRecords(): BankRecord[] {
  return ensureDb().records;
}

export function reloadDb(): void {
  db = null;
  ensureDb();
}

export function getLowConfidenceRecords(minConfidence: number = 70): BankRecord[] {
  return ensureDb().records.filter(r => (r.confidence || 80) < minConfidence);
}

function saveChunk(type: string, record: BankRecord): void {
  if (!fs.existsSync(CHUNKS_DIR)) fs.mkdirSync(CHUNKS_DIR, { recursive: true });
  const d = ensureDb();
  const chunkFiles = fs.readdirSync(CHUNKS_DIR).filter(f => f.endsWith('.json'));

  // Find the right chunk file for this type
  for (const file of chunkFiles) {
    if (file.startsWith(type)) {
      const data: BankRecord[] = JSON.parse(fs.readFileSync(path.join(CHUNKS_DIR, file), 'utf-8'));
      const key = getNormalizedKey(record.code, record.type as RoutingCodeType);
      const idx = data.findIndex(r => getNormalizedKey(r.code, r.type as RoutingCodeType) === key);
      if (idx >= 0) data[idx] = record;
      else data.push(record);
      fs.writeFileSync(path.join(CHUNKS_DIR, file), JSON.stringify(data), 'utf-8');
      return;
    }
  }

  // New type, create chunk
  const newFile = `${type}.json`;
  fs.writeFileSync(path.join(CHUNKS_DIR, newFile), JSON.stringify([record]), 'utf-8');
}

function persistAll(): void {
  const d = ensureDb();
  if (!fs.existsSync(CHUNKS_DIR)) fs.mkdirSync(CHUNKS_DIR, { recursive: true });

  // Group by type
  const groups: Record<string, BankRecord[]> = {};
  for (const record of d.records) {
    const prefix = record.type.startsWith('swift-') ? record.type :
      record.type === 'swift' ? `swift-${record.code.substring(0, 2)}` : record.type;
    (groups[prefix] ||= []).push(record);
  }

  for (const [prefix, recs] of Object.entries(groups)) {
    fs.writeFileSync(path.join(CHUNKS_DIR, `${prefix}.json`), JSON.stringify(recs), 'utf-8');
  }
}
