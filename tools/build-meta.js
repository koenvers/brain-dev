#!/usr/bin/env node
/* brain-dev — genereert sitemap.xml en feed.xml uit content/index.js.
   Geen dependencies. Draai na elke indexwijziging:  node tools/build-meta.js
   Tests controleren dat de bestanden exact overeenkomen met deze uitvoer. */
'use strict';

const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const BASE = 'https://koenvers.github.io/brain-dev';
const SITE_TITLE = 'brain-dev — kennisbank en blog';
const SITE_DESC = 'Kennisartikelen en blogs over AI, data science en tooling.';
const STATIC = ['index.html', 'over.html'];

function xml(s) {
  return String(s)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function today() {
  const d = new Date();
  const p = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

function loadItems() {
  global.window = {};
  require(path.join(root, 'content', 'index.js'));
  const app = require(path.join(root, 'assets', 'js', 'app.js'));
  return app.filter(app.loadIndex(global.window.BRAINDEV_INDEX), 'alles', '');
}

function buildSitemap(items, lastmodStatisch) {
  const rows = [
    { loc: `${BASE}/`, lastmod: lastmodStatisch },
    { loc: `${BASE}/over.html`, lastmod: lastmodStatisch },
    ...items.map((it) => ({ loc: `${BASE}/${it.url}`, lastmod: it.date }))
  ];
  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${rows.map((r) => `  <url>\n    <loc>${r.loc}</loc>\n    <lastmod>${r.lastmod}</lastmod>\n  </url>`).join('\n')}
</urlset>
`;
}

function buildFeed(items) {
  const nieuwste = items[0] ? new Date(items[0].date + 'T00:00:00+02:00') : new Date();
  const itemsXml = items.map((it) => {
    const url = `${BASE}/${it.url}`;
    const pubDate = new Date(it.date + 'T00:00:00+02:00').toUTCString();
    return [
      '  <item>',
      `    <title>${xml(it.title)}</title>`,
      `    <link>${url}</link>`,
      `    <guid isPermaLink="true">${url}</guid>`,
      `    <pubDate>${pubDate}</pubDate>`,
      `    <description>${xml(it.summary)}</description>`,
      ...it.tags.map((t) => `    <category>${xml(t)}</category>`),
      '  </item>'
    ].join('\n');
  }).join('\n');

  return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
<channel>
  <title>${xml(SITE_TITLE)}</title>
  <link>${BASE}/</link>
  <description>${xml(SITE_DESC)}</description>
  <language>nl</language>
  <lastBuildDate>${nieuwste.toUTCString()}</lastBuildDate>
  <atom:link href="${BASE}/feed.xml" rel="self" type="application/rss+xml"/>
${itemsXml}
</channel>
</rss>
`;
}

function main() {
  const items = loadItems();
  if (items.length === 0) {
    console.error('geen geldige items in content/index.js — niets gegenereerd');
    process.exit(1);
  }
  const lastmodStatisch = STATIC.map((f) => fs.statSync(path.join(root, f)).mtime)
    .map((d) => d.toISOString().slice(0, 10))
    .sort()
    .pop();

  fs.writeFileSync(path.join(root, 'sitemap.xml'), buildSitemap(items, lastmodStatisch));
  fs.writeFileSync(path.join(root, 'feed.xml'), buildFeed(items));
  console.log(`sitemap.xml: ${STATIC.length + items.length} URL's, feed.xml: ${items.length} items`);
}

if (require.main === module) main();

module.exports = { buildSitemap, buildFeed, loadItems };
