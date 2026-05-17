import { DataSource, DataSourceResult } from './base';
import { RoutingCodeType } from '../types';

const BANKCODES_API = 'https://api.bank.codes/v1/bank';

export class BankCodesDataSource extends DataSource {
  name = 'bankcodes';
  supportedTypes: RoutingCodeType[] = ['swift', 'aba', 'sortcode', 'bsb', 'ifsc'];

  async lookup(code: string, type: RoutingCodeType): Promise<DataSourceResult> {
    const clean = code.replace(/[\s\-\.]/g, '').toUpperCase();

    try {
      const response = await fetch(`${BANKCODES_API}/${clean}`);

      if (!response.ok) {
        return { success: false, error: `bank.codes returned ${response.status}` };
      }

      const data = await response.json();

      if (!data || data.error) {
        return { success: false, error: data?.error || 'Not found' };
      }

      return {
        success: true,
        bankName: data.name || data.bankName || data.institution,
        branch: data.branch,
        address: data.address,
        city: data.city,
        country: data.country || data.countryCode,
        countryName: data.countryName,
        isHeadOffice: data.isHeadOffice ?? (type === 'swift' && clean.endsWith('XXX')),
      };
    } catch (err) {
      return { success: false, error: `bank.codes request failed: ${err}` };
    }
  }
}
