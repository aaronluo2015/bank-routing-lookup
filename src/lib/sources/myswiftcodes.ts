import { DataSource, DataSourceResult } from './base';
import { RoutingCodeType } from '../types';

export class MySwiftCodesDataSource extends DataSource {
  name = 'myswiftcodes';
  supportedTypes: RoutingCodeType[] = ['swift'];

  async lookup(code: string, type: RoutingCodeType): Promise<DataSourceResult> {
    if (type !== 'swift') return { success: false, error: 'Only SWIFT supported' };

    const clean = code.replace(/[\s\-\.\/]/g, '').toUpperCase();
    const url = `https://www.myswiftcodes.com/${clean}.html`;

    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 8000);

      const response = await fetch(url, {
        signal: controller.signal,
        headers: {
          'Accept': 'text/html',
          'User-Agent': 'BankCode-Lookup/1.0',
        },
      });
      clearTimeout(timeout);

      if (!response.ok) return { success: false, error: `HTTP ${response.status}` };

      const html = await response.text();

      // Parse: "ICBKCNBJ220是Industrial and Commercial Bank of China QING YUAN BRANCH的SWIFT代码"
      const titleMatch = html.match(/<title>([^<]+)<\/title>/);
      const title = titleMatch?.[1] || '';

      // Extract bank name from title
      const nameMatch = title.match(/是(.+?)的SWIFT代码/);
      const bankName = nameMatch?.[1]?.trim();

      if (!bankName) return { success: false, error: 'Could not parse bank name' };

      // Extract country
      let country = clean.substring(4, 6);
      let countryName = '';

      const countryMatch = html.match(/国家\/地区[：:]\s*([^<\n]+)/);
      if (countryMatch) countryName = countryMatch[1].trim();

      // Extract city
      let city = '';
      const cityMatch = html.match(/城市[：:]\s*([^<\n]+)/);
      if (cityMatch && cityMatch[1].trim() !== '\\N' && cityMatch[1].trim() !== 'N') {
        city = cityMatch[1].trim();
      }

      // Extract address
      let address = '';
      const addrMatch = html.match(/银行地址[：:]\s*([^<\n]+)/);
      if (addrMatch && addrMatch[1].trim() !== '\\N') {
        address = addrMatch[1].trim();
      }

      // Extract branch code from SWIFT parts
      const partsMatch = html.match(/SWIFT\s*代码[：:]\s*([A-Z0-9]+)/i);
      const swiftFromPage = partsMatch?.[1]?.trim();

      const isValid = swiftFromPage === clean;

      return {
        success: true,
        bankName,
        branch: clean.length === 11 ? `Branch ${clean.substring(8)}` : undefined,
        city: city || undefined,
        address: address || undefined,
        country,
        countryName: countryName || 'Unknown',
        isHeadOffice: clean.length === 8 || clean.endsWith('XXX'),
      };
    } catch {
      return { success: false, error: 'Request failed' };
    }
  }

  async healthCheck(): Promise<boolean> {
    try {
      const result = await this.lookup('DEUTDEFF', 'swift');
      return result.success;
    } catch {
      return false;
    }
  }
}
