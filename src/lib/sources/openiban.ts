import { DataSource, DataSourceResult } from './base';
import { RoutingCodeType } from '../types';

const OPENIBAN_API_URL = 'https://openiban.com/validate';

export class OpenIbanDataSource extends DataSource {
  name = 'openiban';
  supportedTypes: RoutingCodeType[] = ['iban'];

  async lookup(code: string, type: RoutingCodeType): Promise<DataSourceResult> {
    if (type !== 'iban') {
      return { success: false, error: 'OpenIBAN only supports IBAN codes' };
    }

    const clean = code.replace(/[\s\-]/g, '').toUpperCase();

    try {
      const response = await fetch(`${OPENIBAN_API_URL}/${clean}?getBIC=true&validateBankCode=true`);

      if (!response.ok) {
        return { success: false, error: `OpenIBAN returned ${response.status}` };
      }

      const data = await response.json();

      if (!data.valid) {
        return {
          success: false,
          error: data.messages?.join(', ') || 'IBAN validation failed',
        };
      }

      const bankData = data.bankData || {};

      return {
        success: true,
        bankName: bankData.name || bankData.bankName,
        branch: bankData.branch,
        address: bankData.address,
        city: bankData.city || bankData.town,
        zip: bankData.zip || bankData.postCode,
        country: data.country || clean.substring(0, 2),
        countryName: data.countryName,
      };
    } catch (err) {
      return { success: false, error: `OpenIBAN request failed: ${err}` };
    }
  }
}
