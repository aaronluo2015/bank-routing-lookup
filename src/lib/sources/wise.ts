import { DataSource, DataSourceResult } from './base';
import { RoutingCodeType } from '../types';

export class WiseDataSource extends DataSource {
  name = 'wise';
  supportedTypes: RoutingCodeType[] = ['swift'];

  async lookup(code: string, type: RoutingCodeType): Promise<DataSourceResult> {
    if (type !== 'swift') return { success: false, error: 'Wise only supports SWIFT' };

    const clean = code.replace(/[\s\-\.]/g, '').toUpperCase();

    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 5000);

      const response = await fetch(
        `https://api.transferwise.com/v1/swift-codes/${clean}`,
        {
          signal: controller.signal,
          headers: {
            'Accept': 'application/json',
            'User-Agent': 'BankCode-Lookup/1.0',
          },
        }
      );
      clearTimeout(timeout);

      if (!response.ok) return { success: false, error: `${response.status}` };

      const data = await response.json();
      if (!data || data.error) return { success: false, error: data?.error || 'Not found' };

      return {
        success: true,
        bankName: data.bank || data.institution,
        branch: data.branch,
        address: data.address,
        city: data.city,
        country: data.country || clean.substring(4, 6),
        countryName: data.countryName,
        isHeadOffice: clean.length === 8 || clean.endsWith('XXX'),
      };
    } catch {
      return { success: false, error: 'Source unavailable' };
    }
  }
}
