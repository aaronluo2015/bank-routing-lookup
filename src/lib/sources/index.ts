import { DataSource } from './base';
import { RoutingCodeType } from '../types';
import { WiseDataSource } from './wise';
import { OpenIbanDataSource } from './openiban';
import { BankCodesDataSource } from './bankcodes';
import { RazorpayIfscDataSource } from './razorpay-ifsc';
import { BsbAuspaynetDataSource } from './bsb-auspaynet';
import { MySwiftCodesDataSource } from './myswiftcodes';
import { SwiftCodesInfoSource } from './swiftcodes-info';

const sources: DataSource[] = [
  new MySwiftCodesDataSource(),
  new SwiftCodesInfoSource(),
  new WiseDataSource(),
  new OpenIbanDataSource(),
  new BankCodesDataSource(),
  new RazorpayIfscDataSource(),
  new BsbAuspaynetDataSource(),
];

export function getSourcesForType(type: RoutingCodeType): DataSource[] {
  return sources.filter(s => s.supportedTypes.includes(type));
}

export function getAllSources(): DataSource[] {
  return sources;
}

export function getSourceByName(name: string): DataSource | undefined {
  return sources.find(s => s.name === name);
}

export async function checkAllSourcesHealth(): Promise<Record<string, { status: 'online' | 'offline' | 'degraded'; lastCheck: string }>> {
  const result: Record<string, { status: 'online' | 'offline' | 'degraded'; lastCheck: string }> = {};

  const checks = sources.map(async (source) => {
    const healthy = await source.healthCheck();
    result[source.name] = {
      status: healthy ? 'online' : 'offline',
      lastCheck: new Date().toISOString(),
    };
  });

  await Promise.allSettled(checks);
  return result;
}

export { WiseDataSource, OpenIbanDataSource, BankCodesDataSource, RazorpayIfscDataSource, BsbAuspaynetDataSource, MySwiftCodesDataSource, SwiftCodesInfoSource };
