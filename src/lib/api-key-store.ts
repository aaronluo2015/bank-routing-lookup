import { createHash } from 'crypto';
import { ApiKeyRecord } from './types';
import fs from 'fs';
import path from 'path';

const TIER_QUOTAS: Record<string, number> = {
  free: 100,
  starter: 10000,
  growth: 100000,
  business: 500000,
  enterprise: -1,
};

const KEYS_PATH = path.join(process.cwd(), 'src/data/apikeys.json');

class ApiKeyStore {
  private keys: Map<string, ApiKeyRecord> = new Map();

  constructor() {
    this.loadFromFile();
  }

  private loadFromFile(): void {
    try {
      if (fs.existsSync(KEYS_PATH)) {
        const raw = fs.readFileSync(KEYS_PATH, 'utf-8');
        const data = JSON.parse(raw);
        if (Array.isArray(data)) {
          for (const record of data) {
            this.keys.set(record.id, record);
          }
        }
      }
    } catch {
      // ignore - start fresh
    }
  }

  private saveToFile(): void {
    try {
      const dir = path.dirname(KEYS_PATH);
      if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
      const data = Array.from(this.keys.values());
      fs.writeFileSync(KEYS_PATH, JSON.stringify(data, null, 2), 'utf-8');
    } catch {
      // ignore silently
    }
  }

  generateKey(): { plainKey: string; hash: string } {
    const plainKey = 'sk_' + Array.from({ length: 48 }, () =>
      'abcdefghijklmnopqrstuvwxyz0123456789'[Math.floor(Math.random() * 36)]
    ).join('');
    const hash = createHash('sha256').update(plainKey).digest('hex');
    return { plainKey, hash };
  }

  createApiKey(name: string, tier: ApiKeyRecord['tier'] = 'free', expiresAt?: string): { plainKey: string; record: ApiKeyRecord } {
    const { plainKey, hash } = this.generateKey();
    const id = hash.substring(0, 12);

    const record: ApiKeyRecord = {
      id, name, keyHash: hash,
      tier, quota: TIER_QUOTAS[tier] || 100,
      used: 0, enabled: true,
      createdAt: new Date().toISOString(),
      expiresAt: expiresAt || null,
      lastUsedAt: null, lastUsedIp: null,
    };

    this.keys.set(id, record);
    this.saveToFile();
    return { plainKey, record };
  }

  verifyApiKey(plainKey: string): ApiKeyRecord | null {
    const hash = createHash('sha256').update(plainKey).digest('hex');
    for (const record of this.keys.values()) {
      if (record.keyHash === hash) {
        if (!record.enabled) return null;
        if (record.expiresAt && new Date(record.expiresAt) < new Date()) return null;
        record.lastUsedAt = new Date().toISOString();
        record.used++;
        if (record.quota > 0 && record.used > record.quota) return null;
        this.saveToFile();
        return record;
      }
    }
    return null;
  }

  getKey(id: string): ApiKeyRecord | undefined { return this.keys.get(id); }
  getAllKeys(): ApiKeyRecord[] { return Array.from(this.keys.values()); }

  updateKey(id: string, updates: Partial<Pick<ApiKeyRecord, 'name' | 'tier' | 'quota' | 'enabled' | 'expiresAt'>>): boolean {
    const record = this.keys.get(id);
    if (!record) return false;
    Object.assign(record, updates);
    if (updates.tier && TIER_QUOTAS[updates.tier]) record.quota = TIER_QUOTAS[updates.tier];
    this.saveToFile();
    return true;
  }

  deleteKey(id: string): boolean {
    const result = this.keys.delete(id);
    if (result) this.saveToFile();
    return result;
  }

  resetUsage(id: string): boolean {
    const record = this.keys.get(id);
    if (!record) return false;
    record.used = 0;
    this.saveToFile();
    return true;
  }
}

export const apiKeyStore = new ApiKeyStore();
