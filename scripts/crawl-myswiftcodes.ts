/**
 * myswiftcodes.com Full Crawler
 * Crawls all SWIFT codes from sitemaps and populates local database
 * Run via GitHub Actions (not Vercel — unrestricted outbound network)
 */
import fs from 'fs';
import path from 'path';

const DB_PATH = path.join(process.cwd(), 'src/data/banks.json');
const PROGRESS_PATH = path.join(process.cwd(), 'src/data/.crawl-progress.json');

const SITEMAP_URLS = [
  'https://static.xtransfer.com/sitemaps/myswiftcodes/sitemap-myswiftcodes-en-1.xml',
  'https://static.xtransfer.com/sitemaps/myswiftcodes/sitemap-myswiftcodes-en-2.xml',
  'https://static.xtransfer.com/sitemaps/myswiftcodes/sitemap-myswiftcodes-en-3.xml',
  'https://static.xtransfer.com/sitemaps/myswiftcodes/sitemap-myswiftcodes-en-4.xml',
  'https://static.xtransfer.com/sitemaps/myswiftcodes/sitemap-myswiftcodes-en-5.xml',
];

const COUNTRY_NAMES: Record<string, string> = {
  AD: 'Andorra', AE: 'United Arab Emirates', AT: 'Austria', AU: 'Australia',
  BE: 'Belgium', BG: 'Bulgaria', BH: 'Bahrain', BR: 'Brazil',
  CA: 'Canada', CH: 'Switzerland', CN: 'China', CY: 'Cyprus',
  CZ: 'Czech Republic', DE: 'Germany', DK: 'Denmark', EE: 'Estonia',
  EG: 'Egypt', ES: 'Spain', FI: 'Finland', FR: 'France',
  GB: 'United Kingdom', GR: 'Greece', HK: 'Hong Kong', HR: 'Croatia',
  HU: 'Hungary', ID: 'Indonesia', IE: 'Ireland', IL: 'Israel',
  IN: 'India', IS: 'Iceland', IT: 'Italy', JP: 'Japan',
  KE: 'Kenya', KR: 'South Korea', KW: 'Kuwait', LI: 'Liechtenstein',
  LT: 'Lithuania', LU: 'Luxembourg', LV: 'Latvia',
  MA: 'Morocco', MC: 'Monaco', MT: 'Malta', MX: 'Mexico',
  MY: 'Malaysia', NG: 'Nigeria', NL: 'Netherlands', NO: 'Norway',
  NZ: 'New Zealand', OM: 'Oman', PH: 'Philippines', PK: 'Pakistan',
  PL: 'Poland', PT: 'Portugal', QA: 'Qatar', RO: 'Romania',
  RU: 'Russia', SA: 'Saudi Arabia', SE: 'Sweden', SG: 'Singapore',
  SI: 'Slovenia', SK: 'Slovakia', TH: 'Thailand', TR: 'Turkey',
  TW: 'Taiwan', UA: 'Ukraine', US: 'United States', VN: 'Vietnam',
  ZA: 'South Africa', BD: 'Bangladesh', LK: 'Sri Lanka', NP: 'Nepal',
  MM: 'Myanmar', KH: 'Cambodia', LA: 'Laos', MN: 'Mongolia',
  CL: 'Chile', CO: 'Colombia', PE: 'Peru', AR: 'Argentina',
  TN: 'Tunisia', DZ: 'Algeria', GH: 'Ghana', MU: 'Mauritius',
  AZ: 'Azerbaijan', BY: 'Belarus', GE: 'Georgia', MD: 'Moldova',
  BA: 'Bosnia and Herzegovina', MK: 'North Macedonia', RS: 'Serbia',
  ME: 'Montenegro', AL: 'Albania', XK: 'Kosovo', AM: 'Armenia',
  KZ: 'Kazakhstan', UZ: 'Uzbekistan', TM: 'Turkmenistan',
  JO: 'Jordan', LB: 'Lebanon', IQ: 'Iraq', SY: 'Syria',
  YE: 'Yemen', PS: 'Palestine', LY: 'Libya', SD: 'Sudan',
  ET: 'Ethiopia', SO: 'Somalia', DJ: 'Djibouti', ER: 'Eritrea',
  MG: 'Madagascar', ZW: 'Zimbabwe', ZM: 'Zambia', MW: 'Malawi',
  MZ: 'Mozambique', NA: 'Namibia', BW: 'Botswana', SZ: 'Eswatini',
  GM: 'Gambia', SN: 'Senegal', ML: 'Mali', NE: 'Niger',
  BF: 'Burkina Faso', CI: "Cote d'Ivoire", TG: 'Togo', BJ: 'Benin',
  CM: 'Cameroon', GA: 'Gabon', CG: 'Congo',
  FJ: 'Fiji', PG: 'Papua New Guinea', SB: 'Solomon Islands',
  PA: 'Panama', CR: 'Costa Rica', NI: 'Nicaragua', HN: 'Honduras',
  SV: 'El Salvador', GT: 'Guatemala', BZ: 'Belize',
  JM: 'Jamaica', TT: 'Trinidad and Tobago', BS: 'Bahamas',
  BB: 'Barbados', LC: 'Saint Lucia',
  PY: 'Paraguay', UY: 'Uruguay',
  BO: 'Bolivia', EC: 'Ecuador', VE: 'Venezuela',
  DO: 'Dominican Republic',
  FO: 'Faroe Islands',
  MO: 'Macao', BN: 'Brunei', MV: 'Maldives',
  RW: 'Rwanda', UG: 'Uganda', TZ: 'Tanzania', BI: 'Burundi',
  CD: 'DR Congo', AO: 'Angola',
  CF: 'Central African Republic', TD: 'Chad',
  MR: 'Mauritania',
  LS: 'Lesotho', SC: 'Seychelles', KM: 'Comoros', CV: 'Cape Verde',
  ST: 'Sao Tome and Principe', GW: 'Guinea-Bissau', SL: 'Sierra Leone',
  LR: 'Liberia', SS: 'South Sudan',
  TL: 'Timor-Leste', PW: 'Palau',
  TO: 'Tonga', WS: 'Samoa', VU: 'Vanuatu',
  TV: 'Tuvalu',
};

interface BankEntry {
  code: string; normalizedCode: string; type: string;
  country: string; countryName: string; bankName: string;
  branch?: string; city?: string; address?: string;
  isHeadOffice?: boolean;
  sourceCount: number; lastVerified: string; confidence: number;
  sources: string[]; conflicts: any[]; sourceLog: any[];
}

interface Progress { lastSitemap: number; lastUrl: string; total: number; }

const NOW = new Date().toISOString();
const BATCH_SIZE = 50; // URLs per batch
const DELAY_MS = 300; // Delay between pages

async function fetchText(url: string): Promise<string | null> {
  try {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), 15000);
    const res = await fetch(url, {
      signal: ctrl.signal,
      headers: { 'User-Agent': 'BankCode-Crawler/1.0', 'Accept': 'application/xml,text/html,*/*' },
    });
    clearTimeout(t);
    if (!res.ok) return null;
    return await res.text();
  } catch { return null; }
}

async function fetchSitemapUrls(sitemapUrl: string): Promise<string[]> {
  const xml = await fetchText(sitemapUrl);
  if (!xml) return [];

  const urls: string[] = [];
  const regex = /<loc>([^<]+)<\/loc>/g;
  let match;
  while ((match = regex.exec(xml)) !== null) {
    const url = match[1];
    // Only collect swiftcode page URLs (not nested sitemaps)
    if (url.includes('myswiftcodes.com') && url.endsWith('.html')) {
      urls.push(url);
    }
  }
  return urls;
}

async function fetchSwiftCodePage(url: string): Promise<BankEntry | null> {
  const html = await fetchText(url);
  if (!html) return null;

  // Extract SWIFT code from URL: /XXXXYYYYZZZ.html
  const codeMatch = url.match(/\/([A-Z0-9]{8,11})\.html$/i);
  if (!codeMatch) return null;

  const code = codeMatch[1].toUpperCase();
  if (!/^[A-Z]{4}[A-Z]{2}[A-Z0-9]{2}([A-Z0-9]{3})?$/i.test(code)) return null;

  // Parse title: "XXXXXXXX是Bank Name的SWIFT代码"
  // Only match within first 5KB (title area), not from FAQ at page bottom
  const headSection = html.slice(0, 5000);
  const nameMatch = headSection.match(/是(.+?)的SWIFT代码/);
  let bankName = nameMatch?.[1]?.trim();
  if (!bankName) return null;

  // Reject invalid names (too long, contains HTML, or is FAQ text)
  if (bankName.length > 150 || /<[^>]+>/.test(bankName) || /银行识别码/.test(bankName)) {
    return null;
  }

  const countryCode = code.substring(4, 6);

  // Parse country from the head section only
  const countryMatch = headSection.match(/国家\/地区[：:]\s*([^<\n]+)/);
  const countryName = countryMatch?.[1]?.trim() || COUNTRY_NAMES[countryCode] || '';

  // Parse city from head section only
  const cityMatch = headSection.match(/城市[：:]\s*([^<\n]+)/);
  let city = cityMatch?.[1]?.trim() || '';
  if (city === '\\N' || city === 'N' || city.length > 100) city = '';

  // Parse address
  const addrMatch = html.match(/银行地址[：:]\s*([^<\n]+)/);
  let address = addrMatch?.[1]?.trim() || '';
  if (address === '\\N') address = '';

  return {
    code,
    normalizedCode: code,
    type: 'swift',
    country: countryCode,
    countryName: countryName || COUNTRY_NAMES[countryCode] || countryCode,
    bankName,
    branch: code.length === 11 ? `Branch ${code.substring(8)}` : undefined,
    city: city || undefined,
    address: address || undefined,
    isHeadOffice: code.length === 8 || code.endsWith('XXX'),
    sourceCount: 1,
    lastVerified: NOW,
    confidence: 85,
    sources: ['myswiftcodes-crawl'],
    conflicts: [],
    sourceLog: [{
      timestamp: NOW,
      source: 'myswiftcodes-crawl',
      success: true,
      data: { bankName, city, country: countryCode },
      chosen: true,
    }],
  };
}

function loadDb(): Map<string, BankEntry> {
  const map = new Map<string, BankEntry>();
  if (fs.existsSync(DB_PATH)) {
    try {
      const existing: BankEntry[] = JSON.parse(fs.readFileSync(DB_PATH, 'utf-8'));
      for (const e of existing) {
        map.set(`${e.type}:${e.normalizedCode}`, e);
      }
    } catch {}
  }
  return map;
}

function saveDb(map: Map<string, BankEntry>): void {
  const arr = Array.from(map.values());
  fs.writeFileSync(DB_PATH, JSON.stringify(arr, null, 2), 'utf-8');
  console.log(`  Saved ${arr.length} records`);
}

async function main() {
  console.log('=== myswiftcodes.com Full Crawler ===');
  console.log('Time:', new Date().toISOString());

  // Collect all URLs from sitemaps
  let allUrls: string[] = [];
  for (const sitemapUrl of SITEMAP_URLS) {
    console.log(`\nFetching sitemap: ${sitemapUrl.split('/').pop()}`);
    const urls = await fetchSitemapUrls(sitemapUrl);
    console.log(`  Found ${urls.length} SWIFT code URLs`);
    allUrls = allUrls.concat(urls);
  }

  console.log(`\nTotal URLs to crawl: ${allUrls.length}`);
  if (allUrls.length === 0) {
    console.log('No URLs found — sitemaps may have changed format');
    return;
  }

  const db = loadDb();
  console.log(`Existing records: ${db.size}`);

  // Crawl in batches
  let crawled = 0, newRecords = 0, errors = 0;
  const total = allUrls.length;

  for (let i = 0; i < total; i += BATCH_SIZE) {
    const batch = allUrls.slice(i, i + BATCH_SIZE);
    const results = await Promise.all(batch.map(url => fetchSwiftCodePage(url)));

    for (const entry of results) {
      if (!entry) { errors++; continue; }
      const key = `${entry.type}:${entry.normalizedCode}`;
      const existing = db.get(key);

      if (!existing) {
        db.set(key, entry);
        newRecords++;
      } else if (existing.confidence < 85) {
        entry.sources = [...new Set([...existing.sources, ...entry.sources])];
        db.set(key, { ...existing, ...entry, confidence: 85 });
      }
      crawled++;
    }

    // Progress update every batch
    const pct = ((crawled / total) * 100).toFixed(1);
    console.log(`  [${pct}%] ${crawled}/${total} | New: ${newRecords} | Errors: ${errors}`);

    // Save periodically (every 500 records)
    if (crawled % 500 === 0) {
      saveDb(db);
    }

    // Be gentle to the server
    await new Promise(r => setTimeout(r, DELAY_MS));
  }

  // Final save
  saveDb(db);

  const byCountry = new Map<string, number>();
  for (const [_, e] of db) {
    byCountry.set(e.country, (byCountry.get(e.country) || 0) + 1);
  }
  const topCountries = [...byCountry.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 20)
    .map(([c, n]) => `${COUNTRY_NAMES[c] || c}:${n}`);

  console.log(`\n=== Complete ===`);
  console.log(`Total crawled: ${crawled}`);
  console.log(`New records: ${newRecords}`);
  console.log(`Errors: ${errors}`);
  console.log(`Final DB size: ${db.size}`);
  console.log(`Top countries: ${topCountries.join(', ')}`);
}

main().catch(console.error);
