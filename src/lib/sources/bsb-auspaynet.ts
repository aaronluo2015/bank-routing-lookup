import { DataSource, DataSourceResult } from './base';
import { RoutingCodeType } from '../types';

const BSB_LOOKUP_API = 'https://api.auspaynet.com.au/bsb/v1';

export class BsbAuspaynetDataSource extends DataSource {
  name = 'bsb-auspaynet';
  supportedTypes: RoutingCodeType[] = ['bsb', 'australia_bsb'];

  async lookup(code: string, type: RoutingCodeType): Promise<DataSourceResult> {
    if (type !== 'bsb' && type !== 'australia_bsb') {
      return { success: false, error: 'AusPayNet only supports BSB codes' };
    }

    const clean = code.replace(/[\s\-]/g, '');

    try {
      const response = await fetch(`${BSB_LOOKUP_API}/${clean}`);

      if (!response.ok) {
        return { success: false, error: `AusPayNet returned ${response.status}` };
      }

      const data = await response.json();

      return {
        success: true,
        bankName: data.financialInstitutionName || data.bankName,
        branch: data.branchName,
        address: data.addressLine1,
        city: data.suburb || data.city,
        country: 'AU',
        countryName: 'Australia',
      };
    } catch {
      return { success: false, error: 'AusPayNet request failed' };
    }
  }
}
