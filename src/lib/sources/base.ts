import { BankRecord, RoutingCodeType } from '../types';

export interface DataSourceResult {
  success: boolean;
  bankName?: string;
  branch?: string;
  address?: string;
  city?: string;
  zip?: string;
  country?: string;
  countryName?: string;
  isHeadOffice?: boolean;
  phone?: string;
  website?: string;
  error?: string;
}

export abstract class DataSource {
  abstract name: string;
  abstract supportedTypes: RoutingCodeType[];

  abstract lookup(code: string, type: RoutingCodeType): Promise<DataSourceResult>;

  async healthCheck(): Promise<boolean> {
    try {
      const result = await this.lookup('DEUTDEFF', 'swift');
      return result.success;
    } catch {
      return false;
    }
  }
}
