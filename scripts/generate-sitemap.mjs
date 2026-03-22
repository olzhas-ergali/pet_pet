/**
 * После vite build: пишет dist/sitemap.xml из VITE_PUBLIC_SITE_URL (.env в корне).
 * Без URL — использует https://example.com (замените в проде).
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { config } from 'dotenv';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
config({ path: path.join(root, '.env') });

const base = (process.env.VITE_PUBLIC_SITE_URL || 'https://example.com').replace(/\/$/, '');
const langs = ['ru', 'en', 'kk'];
const staticPaths = ['', '/auth', '/catalog', '/market'];

const urls = [];
for (const lang of langs) {
  for (const p of staticPaths) {
    const loc = p ? `${base}/${lang}${p}` : `${base}/${lang}`;
    urls.push(`  <url>\n    <loc>${loc}</loc>\n    <changefreq>weekly</changefreq>\n  </url>`);
  }
}

const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.join('\n')}
</urlset>
`;

const dist = path.join(root, 'dist');
if (!fs.existsSync(dist)) {
  console.warn('[sitemap] dist/ not found — run after vite build');
  process.exit(0);
}
fs.writeFileSync(path.join(dist, 'sitemap.xml'), xml, 'utf8');
console.log('[sitemap] wrote dist/sitemap.xml for base', base);
