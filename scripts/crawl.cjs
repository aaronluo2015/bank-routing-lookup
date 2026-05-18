const { ProxyAgent, setGlobalDispatcher } = require('undici');
setGlobalDispatcher(new ProxyAgent('http://127.0.0.1:10809'));

const fs = require('fs');
const path = require('path');
const DIR = path.join(__dirname, '..', 'src', 'data', 'chunks');
if (!fs.existsSync(DIR)) fs.mkdirSync(DIR, { recursive: true });

const SITEMAP_URLS = [
  'https://static.xtransfer.com/sitemaps/myswiftcodes/sitemap-myswiftcodes-en-1.xml',
  'https://static.xtransfer.com/sitemaps/myswiftcodes/sitemap-myswiftcodes-en-2.xml',
  'https://static.xtransfer.com/sitemaps/myswiftcodes/sitemap-myswiftcodes-en-3.xml',
  'https://static.xtransfer.com/sitemaps/myswiftcodes/sitemap-myswiftcodes-en-4.xml',
  'https://static.xtransfer.com/sitemaps/myswiftcodes/sitemap-myswiftcodes-en-5.xml',
];

async function fetchHtml(url) {
  for (let i = 0; i < 2; i++) {
    try {
      const ctrl = new AbortController();
      setTimeout(() => ctrl.abort(), 15000);
      const res = await fetch(url, {
        signal: ctrl.signal,
        headers: { 'User-Agent': 'Mozilla/5.0 (compatible; BankCodeCrawler/2.0)', 'Accept': 'text/html' },
      });
      if (res.status === 429) { await new Promise(r => setTimeout(r, 5000)); continue; }
      if (!res.ok) return null;
      const html = await res.text();
      return html.length > 500 ? html : null;
    } catch { await new Promise(r => setTimeout(r, 2000)); }
  }
  return null;
}

function parse(html, url) {
  const cm = url.match(/\/([A-Z0-9]{8,11})\.html$/i);
  if (!cm) return null;
  const code = cm[1].toUpperCase();
  if (code.length < 8 || code.length > 11) return null;

  const nm = html.match(/<title>([^<]+)<\/title>/);
  const title = nm?.[1] || '';
  const bm = title.match(/是(.+?)的SWIFT代码/);
  const bank = bm?.[1]?.trim();
  if (!bank || bank.length > 120 || bank === code || /<[a-z]/.test(bank)) return null;

  const top = html.split('常见问题')[0] || html.slice(0, 8000);
  const com = top.match(/国家\/地区[：:]\s*([^<\n]{1,80})/);
  const cim = top.match(/城市[：:]\s*([^<\n]{1,120})/);
  let city = (cim?.[1] || '').trim();
  if (city === '\\N' || city === 'N' || /[<>]/.test(city)) city = '';

  return {
    code, normalizedCode: code, type: 'swift',
    country: code.substring(4, 6),
    countryName: com?.[1]?.trim() || '',
    bankName: bank,
    branch: code.length === 11 ? 'Branch ' + code.slice(8) : undefined,
    city: city || undefined,
    isHeadOffice: code.length === 8 || code.endsWith('XXX'),
    sourceCount: 1, lastVerified: new Date().toISOString(), confidence: 85,
    sources: ['myswiftcodes'], conflicts: [], sourceLog: [],
  };
}

function saveChunks(buf) {
  for (const [prefix, recs] of Object.entries(buf)) {
    if (!recs.length) continue;
    const file = path.join(DIR, `swift-${prefix}.json`);
    let data = [];
    if (fs.existsSync(file)) { try { data = JSON.parse(fs.readFileSync(file, 'utf-8')); } catch { } }
    for (const r of recs) {
      const idx = data.findIndex(x => x.code === r.code);
      if (idx >= 0) data[idx] = r;
      else data.push(r);
    }
    fs.writeFileSync(file, JSON.stringify(data));
  }
}

async function main() {
  const offset = parseInt(process.argv[2] || '0');
  const limit = parseInt(process.argv[3] || '2000');
  console.log(`Crawl offset=${offset} limit=${limit}`);

  // Fetch sitemaps
  let urls = [];
  for (const su of SITEMAP_URLS) {
    const xml = await fetchHtml(su);
    if (!xml) continue;
    const re = /<loc>([^<]+)<\/loc>/g;
    let m;
    while ((m = re.exec(xml)) !== null) {
      if (m[1].includes('myswiftcodes.com') && m[1].endsWith('.html')) urls.push(m[1]);
    }
    console.log(`  Sitemap: ${su.split('/').pop()} -> ${urls.length} URLs`);
  }
  console.log(`Total: ${urls.length} URLs`);

  const batch = urls.slice(offset, offset + limit);
  console.log(`Processing: ${batch.length}`);

  let ok = 0, err = 0;
  const buf = {};

  for (let i = 0; i < batch.length; i += 10) {
    const sub = batch.slice(i, i + 10);
    const htmls = await Promise.all(sub.map(u => fetchHtml(u)));
    for (let j = 0; j < htmls.length; j++) {
      if (!htmls[j]) { err++; continue; }
      const r = parse(htmls[j], sub[j]);
      if (!r) { err++; continue; }
      const p = r.code.substring(0, 2);
      (buf[p] = buf[p] || []).push(r);
      ok++;
    }
    if (ok % 50 === 0 || i + 10 >= batch.length) {
      saveChunks(buf);
      for (const k of Object.keys(buf)) buf[k] = [];
      console.log(`  [${offset + ok}/${urls.length}] OK:${ok} Err:${err}`);
    }
    await new Promise(r => setTimeout(r, 2000));
  }

  console.log(`Done! OK:${ok} Err:${err}`);
}

main().catch(e => { console.error(e); process.exit(1); });
