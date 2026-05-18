/**
 * myswiftcodes.com Crawler v2 — slower, more resilient, multi-strategy
 * Run: npx tsx scripts/crawl-v2.ts [startOffset] [maxPages]
 */
import fs from 'fs';
import path from 'path';

// Use require for undici (tsx import has issues with it)
const { ProxyAgent, setGlobalDispatcher } = require('undici');

// Set proxy for Node.js fetch
const PROXY_URL = process.env.HTTPS_PROXY || process.env.HTTP_PROXY || 'http://127.0.0.1:10809';
try {
  setGlobalDispatcher(new ProxyAgent(PROXY_URL));
  console.log(`Using proxy: ${PROXY_URL}`);
} catch { /* ignore */ }

const CHUNKS_DIR = path.join(process.cwd(), 'src/data/chunks');
const SITEMAP_URLS = [
  'https://static.xtransfer.com/sitemaps/myswiftcodes/sitemap-myswiftcodes-en-1.xml',
  'https://static.xtransfer.com/sitemaps/myswiftcodes/sitemap-myswiftcodes-en-2.xml',
  'https://static.xtransfer.com/sitemaps/myswiftcodes/sitemap-myswiftcodes-en-3.xml',
  'https://static.xtransfer.com/sitemaps/myswiftcodes/sitemap-myswiftcodes-en-4.xml',
  'https://static.xtransfer.com/sitemaps/myswiftcodes/sitemap-myswiftcodes-en-5.xml',
];

const COUNTRY_NAMES: Record<string, string> = {
  CN: 'China', US: 'United States', GB: 'United Kingdom', DE: 'Germany',
  FR: 'France', JP: 'Japan', HK: 'Hong Kong', SG: 'Singapore',
  AU: 'Australia', CA: 'Canada', CH: 'Switzerland', IN: 'India',
  IT: 'Italy', ES: 'Spain', KR: 'South Korea', NL: 'Netherlands',
  AE: 'United Arab Emirates', SA: 'Saudi Arabia', SE: 'Sweden',
  BR: 'Brazil', MX: 'Mexico', RU: 'Russia', TR: 'Turkey',
  PL: 'Poland', BE: 'Belgium', AT: 'Austria', DK: 'Denmark',
  FI: 'Finland', NO: 'Norway', PT: 'Portugal', IE: 'Ireland',
  NZ: 'New Zealand', ZA: 'South Africa', LU: 'Luxembourg',
  TH: 'Thailand', MY: 'Malaysia', ID: 'Indonesia', PH: 'Philippines',
  VN: 'Vietnam', TW: 'Taiwan', KW: 'Kuwait', QA: 'Qatar',
  IL: 'Israel', EG: 'Egypt', NG: 'Nigeria', KE: 'Kenya',
  PK: 'Pakistan', BD: 'Bangladesh', LK: 'Sri Lanka',
  CL: 'Chile', CO: 'Colombia', PE: 'Peru', AR: 'Argentina',
  MA: 'Morocco', TN: 'Tunisia', DZ: 'Algeria',
  IS: 'Iceland', CY: 'Cyprus', MT: 'Malta', BG: 'Bulgaria',
  RO: 'Romania', HR: 'Croatia', CZ: 'Czech Republic', SK: 'Slovakia',
  HU: 'Hungary', SI: 'Slovenia', LT: 'Lithuania', LV: 'Latvia',
  EE: 'Estonia', UA: 'Ukraine',
};

async function fetchHtml(url: string, retries = 2): Promise<string | null> {
  for (let i = 0; i < retries; i++) {
    try {
      const ctrl = new AbortController();
      const t = setTimeout(() => ctrl.abort(), 20000);
      const res = await fetch(url, {
        signal: ctrl.signal,
        headers: {
          'Accept': 'text/html,application/xhtml+xml',
          'User-Agent': 'Mozilla/5.0 (compatible; BankCodeCrawler/2.0)',
          'Accept-Language': 'en,zh;q=0.9',
        },
      });
      clearTimeout(t);

      if (res.status === 429) {
        if (i === 0) console.log('  Rate limited, waiting...');
        await new Promise(r => setTimeout(r, 5000 + Math.random() * 5000));
        continue;
      }
      if (!res.ok) {
        if (i === 0) console.log(`  HTTP ${res.status} for ${url.slice(-20)}`);
        return null;
      }

      const html = await res.text();
      if (html.length < 500) continue;
      return html;
    } catch (e: any) {
      const msg = e?.message || e?.toString() || String(e);
      if (i === 0) console.log(`  Err: ${msg.slice(0, 80)}`);
      await new Promise(r => setTimeout(r, 1000 + Math.random() * 2000));
    }
  }
  return null;
}

function parsePage(html: string, url: string): any | null {
  const codeMatch = url.match(/\/([A-Z0-9]{8,11})\.html$/i);
  if (!codeMatch) return null;
  const code = codeMatch[1].toUpperCase();
  if (code.length < 8 || code.length > 11) return null;

  // Extract from <title> tag specifically (most reliable)
  const titleMatch = html.match(/<title>([^<]+)<\/title>/);
  const title = titleMatch?.[1] || '';

  // Pattern: "CODE是BANK NAME的SWIFT代码"
  const nameMatch = title.match(/是(.+?)的SWIFT代码/);
  const bankName = nameMatch?.[1]?.trim();

  // Validation
  if (!bankName || bankName.length > 120 || /<[a-z]/.test(bankName)) return null;
  if (bankName === code) return null;

  const countryCode = code.substring(4, 6);

  // Extract from the top section (before "常见问题" keyword)
  const topSection = html.split('常见问题')[0] || html.slice(0, 8000);

  const countryMatch = topSection.match(/国家\/地区[：:]\s*([^<\n]{1,80})/);
  const countryName = countryMatch?.[1]?.trim() || COUNTRY_NAMES[countryCode] || '';

  const cityMatch = topSection.match(/城市[：:]\s*([^<\n]{1,120})/);
  let city = cityMatch?.[1]?.trim() || '';
  if (city === '\\N' || city === 'N' || /[<>]/.test(city)) city = '';

  const addrMatch = topSection.match(/银行地址[：:]\s*([^<\n]{1,200})/);
  let address = addrMatch?.[1]?.trim() || '';
  if (address === '\\N' || /[<>]/.test(address)) address = '';

  return {
    code, normalizedCode: code, type: 'swift' as const,
    country: countryCode,
    countryName: countryName || COUNTRY_NAMES[countryCode] || countryCode,
    bankName,
    branch: code.length === 11 ? `Branch ${code.slice(8)}` : undefined,
    city: city || undefined,
    address: address || undefined,
    isHeadOffice: code.length === 8 || code.endsWith('XXX'),
    sourceCount: 1,
    lastVerified: new Date().toISOString(),
    confidence: 85,
    sources: ['myswiftcodes-crawl'],
    conflicts: [],
    sourceLog: [],
  };
}

async function fetchSitemapUrls(url: string): Promise<string[]> {
  const xml = await fetchHtml(url);
  if (!xml) return [];
  const urls: string[] = [];
  const re = /<loc>([^<]+)<\/loc>/g;
  let m;
  while ((m = re.exec(xml)) !== null) {
    if (m[1].includes('myswiftcodes.com') && m[1].endsWith('.html')) {
      urls.push(m[1]);
    }
  }
  return urls;
}

function saveChunk(prefix: string, records: any[]) {
  if (!fs.existsSync(CHUNKS_DIR)) fs.mkdirSync(CHUNKS_DIR, { recursive: true });
  const file = path.join(CHUNKS_DIR, `${prefix}.json`);
  let existing: any[] = [];
  if (fs.existsSync(file)) {
    try { existing = JSON.parse(fs.readFileSync(file, 'utf-8')); } catch {}
  }
  const map = new Map<string, any>();
  for (const r of existing) map.set(r.code, r);
  for (const r of records) {
    const k = r.code;
    if (!map.has(k)) map.set(k, r);
    else {
      const old = map.get(k)!;
      if (old.confidence < r.confidence) map.set(k, { ...old, ...r });
    }
  }
  fs.writeFileSync(file, JSON.stringify(Array.from(map.values())), 'utf-8');
}

async function main() {
  const startOffset = parseInt(process.argv[2] || '0');
  const maxPages = parseInt(process.argv[3] || '2000');

  console.log(`=== Crawler v2 ===`);
  console.log(`Start: ${startOffset}, Max: ${maxPages}`);

  // Collect URLs from sitemaps
  let allUrls: string[] = [];
  for (const su of SITEMAP_URLS) {
    const urls = await fetchSitemapUrls(su);
    console.log(`Sitemap: ${su.split('/').pop()} → ${urls.length} URLs`);
    allUrls = allUrls.concat(urls);
  }
  console.log(`Total: ${allUrls.length} URLs`);

  const targetUrls = allUrls.slice(startOffset, startOffset + maxPages);
  console.log(`Processing: ${targetUrls.length}`);

  let crawled = 0, saved = 0, errors = 0;
  const batchSize = 10;
  const batchDelay = 2000; // 2s between batches (gentle)

  for (let i = 0; i < targetUrls.length; i += batchSize) {
    const batch = targetUrls.slice(i, i + batchSize);
    const results = await Promise.all(batch.map(url => fetchHtml(url)));
    const batchRecords: any[] = [];

    for (let j = 0; j < results.length; j++) {
      const html = results[j];
      if (!html) { errors++; continue; }
      const record = parsePage(html, batch[j]);
      if (!record) { errors++; continue; }

      // Group by first 2 chars for chunk storage
      const prefix = `swift-${record.code.slice(0, 2)}`;
      batchRecords.push(record);

      // Save to chunk immediately
      if (!fs.existsSync(path.join(CHUNKS_DIR, `${prefix}.json`))) {
        saveChunk(prefix, [record]);
      }
      crawled++; saved++;
    }

    if (crawled % 50 === 0 || i + batchSize >= targetUrls.length) {
      // Batch save all accumulated records
      const byPrefix: Record<string, any[]> = {};
      for (const r of batchRecords) {
        const p = `swift-${r.code.slice(0, 2)}`;
        (byPrefix[p] ||= []).push(r);
      }
      for (const [p, recs] of Object.entries(byPrefix)) {
        saveChunk(p, recs);
      }

      const pct = (((startOffset + crawled) / allUrls.length) * 100).toFixed(1);
      console.log(`  [${pct}%] Crawled ${crawled}, Saved ${saved}, Errors ${errors}`);
    }

    if (batchRecords.length > 0) batchRecords.length = 0;
    await new Promise(r => setTimeout(r, batchDelay));
  }

  console.log(`\nDone! Crawled: ${crawled}, Saved: ${saved}, Errors: ${errors}`);
}

main().catch(console.error);
