import { DataSource, DataSourceResult } from './base';
import { RoutingCodeType } from '../types';

export class SwiftCodesInfoSource extends DataSource {
  name = 'swiftcodes-info';
  supportedTypes: RoutingCodeType[] = ['swift'];

  async lookup(code: string, type: RoutingCodeType): Promise<DataSourceResult> {
    if (type !== 'swift') return { success: false, error: 'Only SWIFT' };
    const clean = code.replace(/[\s\-\.\/]/g, '').toUpperCase();
    const url = `https://www.theswiftcodes.com/${clean.toLowerCase()}/`;

    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 5000);
      const res = await fetch(url, { signal: controller.signal, headers: { 'User-Agent': 'BankCode/1.0', 'Accept': 'text/html' } });
      clearTimeout(timeout);
      if (!res.ok) return { success: false, error: `${res.status}` };

      const html = await res.text();
      const titleMatch = html.match(/<title>([^<]+)<\/title>/);
      const title = titleMatch?.[1] || '';

      const nameMatch = title.match(/(.+?)\s*-\s*SWIFT/);
      const bankName = nameMatch?.[1]?.trim();

      if (!bankName) return { success: false, error: 'Could not parse' };

      return {
        success: true, bankName,
        country: clean.substring(4, 6),
        isHeadOffice: clean.length === 8 || clean.endsWith('XXX'),
      };
    } catch { return { success: false, error: 'Unavailable' }; }
  }
}
