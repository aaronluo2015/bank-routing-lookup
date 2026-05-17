/**
 * Global Bank Code Enrichment — runs on GitHub Actions (unrestricted network)
 * Fetches from multiple public data sources worldwide, merges into banks.json
 */
import fs from 'fs';
import path from 'path';

const DB_PATH = path.join(process.cwd(), 'src/data/banks.json');

interface BankEntry {
  code: string; normalizedCode: string; type: string;
  country: string; countryName: string; bankName: string;
  branch?: string; city?: string; address?: string;
  isHeadOffice?: boolean;
  sourceCount: number; lastVerified: string; confidence: number;
  sources: string[]; conflicts: any[]; sourceLog: any[];
}

const COUNTRY: Record<string, string> = {
  AD: 'Andorra', AE: 'United Arab Emirates', AT: 'Austria', AU: 'Australia',
  BE: 'Belgium', BG: 'Bulgaria', BH: 'Bahrain', BR: 'Brazil',
  CA: 'Canada', CH: 'Switzerland', CN: 'China', CY: 'Cyprus',
  CZ: 'Czech Republic', DE: 'Germany', DK: 'Denmark', EE: 'Estonia',
  EG: 'Egypt', ES: 'Spain', FI: 'Finland', FR: 'France',
  GB: 'United Kingdom', GR: 'Greece', HK: 'Hong Kong', HR: 'Croatia',
  HU: 'Hungary', ID: 'Indonesia', IE: 'Ireland', IL: 'Israel',
  IN: 'India', IS: 'Iceland', IT: 'Italy', JP: 'Japan',
  KE: 'Kenya', KR: 'South Korea', KW: 'Kuwait', KZ: 'Kazakhstan',
  LI: 'Liechtenstein', LT: 'Lithuania', LU: 'Luxembourg', LV: 'Latvia',
  MA: 'Morocco', MC: 'Monaco', MT: 'Malta', MX: 'Mexico',
  MY: 'Malaysia', NG: 'Nigeria', NL: 'Netherlands', NO: 'Norway',
  NZ: 'New Zealand', OM: 'Oman', PH: 'Philippines', PK: 'Pakistan',
  PL: 'Poland', PT: 'Portugal', QA: 'Qatar', RO: 'Romania',
  RU: 'Russia', SA: 'Saudi Arabia', SE: 'Sweden', SG: 'Singapore',
  SI: 'Slovenia', SK: 'Slovakia', TH: 'Thailand', TR: 'Turkey',
  TW: 'Taiwan', UA: 'Ukraine', US: 'United States', VN: 'Vietnam',
  ZA: 'South Africa',
};

const NOW = new Date().toISOString().split('T')[0] + 'T00:00:00Z';

function makeKey(code: string, type: string): string {
  return `${type}:${code.replace(/[\s\-\.\/]/g, '').toUpperCase()}`;
}

async function fetchJson(url: string): Promise<any> {
  try {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), 15000);
    const res = await fetch(url, {
      signal: ctrl.signal,
      headers: { 'Accept': 'application/json', 'User-Agent': 'BankCode-Enricher/1.0' },
    });
    clearTimeout(t);
    if (!res.ok) return null;
    return await res.json();
  } catch { return null; }
}

async function fetchText(url: string): Promise<string | null> {
  try {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), 10000);
    const res = await fetch(url, { signal: ctrl.signal, headers: { 'User-Agent': 'BankCode-Enricher/1.0' } });
    clearTimeout(t);
    if (!res.ok) return null;
    return await res.text();
  } catch { return null; }
}

// ─── Source 1: RBI IFSC data (India) ───
async function fetchRbiIfsc(): Promise<BankEntry[]> {
  const entries: BankEntry[] = [];
  const data = await fetchJson('https://ifsc.razorpay.com/SBIN0005944');
  if (!data) return entries;

  // Razorpay has per-code API, try a batch of known codes
  const knownIfsc = [
    'SBIN0000001', 'SBIN0005944', 'SBIN0000691', 'SBIN0001717',
    'HDFC0000124', 'HDFC0000001', 'ICIC0000007', 'ICIC0000001',
    'AXIS0000001', 'PUNB0000100', 'CNRB0000001', 'BKID0000001',
    'YESB0000001', 'INDB0000001', 'KKBK0000001',
  ];

  for (const code of knownIfsc) {
    const item = await fetchJson(`https://ifsc.razorpay.com/${code}`);
    if (!item || item === 'Not Found') continue;

    entries.push({
      code, normalizedCode: code, type: 'ifsc',
      country: 'IN', countryName: 'India',
      bankName: item.BANK || item.bank || 'Unknown',
      branch: item.BRANCH || item.branch,
      city: item.CITY || item.city,
      address: item.ADDRESS || item.address,
      sourceCount: 1, lastVerified: NOW, confidence: 85,
      sources: ['razorpay-ifsc-api'], conflicts: [], sourceLog: [],
    });
  }
  return entries;
}

// ─── Source 2: OpenIBAN validation with bank data ───
async function fetchIbanBankData(): Promise<BankEntry[]> {
  const entries: BankEntry[] = [];
  const ibans = [
    'DE89370400440532013000', 'GB29NWBK60161331926819', 'FR1420041010050500013M02606',
    'ES9121000418450200051332', 'IT60X0542811101000000123456', 'NL91ABNA0417164300',
    'CH9300762011623852957', 'BE68539007547034', 'AT611904300234573201',
    'SE4550000000058398257466', 'PT50003506830001234567845', 'IE29AIBK93115212345678',
    'PL61109010140000071219812874', 'CZ6508000000192000145399', 'HU42117730161111101800000000',
    'DK9520000123456789', 'NO9386011117947', 'FI2112345600000785',
    'GR1601101250000000012300695', 'RO49AAAA1B31007593840000',
    'BG80BNBG96611020345678', 'HR1210010051863000160',
    'LT121000011101001000', 'LV80BANK0000435195001',
    'EE382200221020145685', 'SK3112000000198742637541',
    'SI56263300012039086', 'MT84MALT011000012345MTLCAST001S',
    'CY17002001280000001200527600', 'LU280019400644750000',
    'IS140159260076545510730339', 'LI21088100002324013AA',
    'MC5811222000010123456789037',
  ];

  for (let i = 0; i < ibans.length; i += 5) {
    const batch = ibans.slice(i, i + 5);
    const results = await Promise.all(batch.map(iban =>
      fetchJson(`https://openiban.com/validate/${iban}?getBIC=true`)
    ));

    for (let j = 0; j < results.length; j++) {
      const data = results[j];
      if (!data?.valid || !data.bankData) continue;

      const cc = batch[j].substring(0, 2);
      entries.push({
        code: batch[j], normalizedCode: batch[j], type: 'iban',
        country: cc, countryName: COUNTRY[cc] || data.country || cc,
        bankName: data.bankData.name || data.bankData.bankName || `IBAN ${cc}`,
        city: data.bankData.city || data.bankData.town,
        sourceCount: 1, lastVerified: NOW, confidence: 80,
        sources: ['openiban-api'], conflicts: [], sourceLog: [],
      });
    }
  }
  return entries;
}

// ─── Source 3: SWIFT codes via myswiftcodes.com (batch) ───
async function fetchMySwiftCodes(codes: string[]): Promise<BankEntry[]> {
  const entries: BankEntry[] = [];
  for (const code of codes) {
    const html = await fetchText(`https://www.myswiftcodes.com/${code}.html`);
    if (!html) continue;

    const nameMatch = html.match(/是(.+?)的SWIFT代码/);
    const bankName = nameMatch?.[1]?.trim();
    if (!bankName) continue;

    const countryMatch = html.match(/国家\/地区[：:]\s*([^<\n]+)/);
    const countryName = countryMatch?.[1]?.trim() || '';
    const countryCode = code.substring(4, 6);

    const cityMatch = html.match(/城市[：:]\s*([^<\n]+)/);
    const city = cityMatch?.[1]?.trim() || '';

    entries.push({
      code, normalizedCode: code, type: 'swift',
      country: countryCode,
      countryName: countryName || COUNTRY[countryCode] || 'Unknown',
      bankName,
      branch: code.length === 11 ? `Branch ${code.substring(8)}` : undefined,
      city: city && city !== '\\N' ? city : undefined,
      isHeadOffice: code.length === 8 || code.endsWith('XXX'),
      sourceCount: 1, lastVerified: NOW, confidence: 85,
      sources: ['myswiftcodes'], conflicts: [], sourceLog: [],
    });
    // Be gentle to the server
    await new Promise(r => setTimeout(r, 200));
  }
  return entries;
}

// ─── Source 4: Common bank code patterns ───
const COMMON_SWIFT: string[] = [
  'DEUTDEFF', 'DEUTDEHH', 'DEUTDEMB', 'DEUTDEDT',
  'CHASUS33', 'CHASUS66', 'CHASUS44',
  'BNPAFRPP', 'BNPAFRPA', 'BNPAFRLY',
  'HSBCHKHH', 'HSBCGB2L', 'HSBCSG22', 'HSBCAU2S',
  'BKCHCNBJ', 'BKCHCNSH', 'BKCHCNGZ', 'BKCHCNSZ',
  'ICBKCNBJ', 'ICBKCNSH', 'ICBKCNGZ',
  'PCBCCNBJ', 'PCBCCNSH',
  'ABOCCNBJ', 'ABOCCNSH',
  'COMMCNSH', 'COMMCNBJ',
  'CMBCCNBS', 'CMBCCNSH',
  'CITIUS33', 'CITIGB2L', 'CITISGSG', 'CITIHKAX',
  'BOFAUS3N', 'BOFAUS6S', 'BOFAGB22',
  'SCBLHKHH', 'SCBLGB2L', 'SCBLSGSG',
  'SOGEFRPP', 'SOGEFRPA',
  'AGRIFRPP', 'AGRIFRLY',
  'INGBNL2A', 'INGBDEFF',
  'ABNANL2A', 'ABNANL2R',
  'RABONL2U', 'RABONL2A',
  'UBSWCHZH', 'UBSWCHGG',
  'CRESCHZZ', 'CRESCHZH',
  'SMBCJPJT', 'SMBCJPJTXXX',
  'MHCBJPJT', 'MHCBJPJTXXX',
  'BOTKJPJT', 'BOTKJPJTXXX',
  'ICICINBB', 'ICICINBBC',
  'SBININBB', 'SBININBBC',
  'HDFCINBB', 'HDFCINBBC',
  'DBSBSGSG', 'DBSBHKHH',
  'OCBCSGSG', 'OCBCHKHH',
  'UOVBSGSG', 'UOVBHKHH',
  'NATAAU33', 'NATAAU3M',
  'ANZBAU3M', 'ANZBAU2S',
  'WPACAU2S', 'WPACAU3M',
  'CTBAAU2S', 'CTBAAU3M',
  'ROYCCAT2', 'ROYCCATT',
  'TDOMCATT', 'TDOMCATTT',
  'BSCHESMM', 'BSCHESBB',
  'BBVAESMM', 'BBVAESBB',
  'UNCRITMM', 'UNCRITRR',
  'BCITITMM', 'BPMIITM1',
  'KOEXKRSE', 'SHBKKRSE',
  'NWBKGB2L', 'NWBKGB21',
  'LOYDGB2L', 'LOYDGB21',
  'BARBGB2L', 'BARBGB22',
];

async function main() {
  console.log('=== Global Bank Code Enrichment ===');
  console.log('Time:', new Date().toISOString());

  const existing: BankEntry[] = fs.existsSync(DB_PATH)
    ? JSON.parse(fs.readFileSync(DB_PATH, 'utf-8')) : [];
  const map = new Map<string, BankEntry>();
  for (const e of existing) map.set(makeKey(e.code, e.type), e);

  let added = 0, updated = 0;

  function merge(entries: BankEntry[]) {
    for (const e of entries) {
      const key = makeKey(e.code, e.type);
      const current = map.get(key);
      if (!current) { map.set(key, e); added++; }
      else if (current.confidence < e.confidence) {
        e.sources = [...new Set([...current.sources, ...e.sources])];
        map.set(key, e); updated++;
      } else {
        current.sources = [...new Set([...current.sources, ...e.sources])];
        current.lastVerified = NOW; updated++;
      }
    }
  }

  // 1. RBI IFSC data
  console.log('\n[1/4] Fetching RBI IFSC data...');
  const ifscData = await fetchRbiIfsc();
  merge(ifscData);
  console.log(`  Fetched: ${ifscData.length}, Added: ${added}, Updated: ${updated}`);

  const before2 = added + updated;

  // 2. OpenIBAN bank data
  console.log('\n[2/4] Fetching IBAN bank data...');
  const ibanData = await fetchIbanBankData();
  merge(ibanData);
  console.log(`  Fetched: ${ibanData.length}, Added: ${added - ifscData.length}, Updated: ${updated + added - before2}`);

  // 3. SWIFT codes from myswiftcodes
  console.log('\n[3/4] Fetching SWIFT codes from myswiftcodes.com...');
  const swiftData = await fetchMySwiftCodes(COMMON_SWIFT);
  merge(swiftData);
  console.log(`  Fetched: ${swiftData.length}, Total added: ${added}, Total updated: ${updated}`);

  // 4. Save
  console.log('\n[4/4] Saving...');
  const merged = Array.from(map.values());
  fs.writeFileSync(DB_PATH, JSON.stringify(merged, null, 2), 'utf-8');

  const byType: Record<string, number> = {};
  for (const r of merged) byType[r.type] = (byType[r.type] || 0) + 1;

  console.log(`\nDone! ${merged.length} records (${added} new, ${updated} updated)`);
  console.log('By type:', Object.entries(byType).sort((a, b) => b[1] - a[1]).map(([t, c]) => `${t}:${c}`).join(', '));
}

main().catch(console.error);
