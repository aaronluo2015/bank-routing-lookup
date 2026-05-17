import { DataSource, DataSourceResult } from './base';
import { RoutingCodeType } from '../types';

const RAZORPAY_IFSC_API = 'https://ifsc.razorpay.com';

export class RazorpayIfscDataSource extends DataSource {
  name = 'razorpay-ifsc';
  supportedTypes: RoutingCodeType[] = ['ifsc'];

  async lookup(code: string, type: RoutingCodeType): Promise<DataSourceResult> {
    if (type !== 'ifsc') {
      return { success: false, error: 'Razorpay only supports IFSC codes' };
    }

    const clean = code.replace(/[\s\-]/g, '').toUpperCase();

    try {
      const response = await fetch(`${RAZORPAY_IFSC_API}/${clean}`);

      if (!response.ok) {
        return { success: false, error: `Razorpay IFSC returned ${response.status}` };
      }

      const data = await response.json();

      if (!data || data === 'Not Found') {
        return { success: false, error: 'IFSC not found' };
      }

      return {
        success: true,
        bankName: data.BANK || data.bank,
        branch: data.BRANCH || data.branch,
        address: data.ADDRESS || data.address,
        city: data.CITY || data.city,
        country: 'IN',
        countryName: 'India',
      };
    } catch (err) {
      return { success: false, error: `Razorpay IFSC request failed: ${err}` };
    }
  }
}
