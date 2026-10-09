/* Tests voor brain-dev — geen dependencies, draait met: node tests/run-tests.js */
'use strict';

const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');

const root = path.join(__dirname, '..');

let passed = 0;
let failed = 0;
function test(name, fn) {
  try {
    fn();
    passed++;
    console.log('  ok   ' + name);
  } catch (err) {
    failed++;
    console.log('  FAIL ' + name + '\n       ' + (err && err.message ? err.message.split('\n')[0] : err));
  }
}

/* browser-globals simuleren zodat de modules laden */
global.window = {};
require(path.join(root, 'content', 'index.js'));
const RAW = global.window.BRAINDEV_INDEX;
const app = require(path.join(root, 'assets', 'js', 'app.js'));
const hl = require(path.join(root, 'assets', 'js', 'highlight.js'));

console.log('index');
test('index is een array met items', () => {
  assert.ok(Array.isArray(RAW) && RAW.length > 0);
});
test('alle items zijn geldig en worden genormaliseerd', () => {
  const items = app.loadIndex(RAW);
  assert.strictEqual(items.length, RAW.length);
  items.forEach((it) => {
    assert.ok(it.type === 'kennis' || it.type === 'blog');
    assert.ok(it.title.length > 0);
    assert.ok(it.summary.length > 0);
    assert.ok(Array.isArray(it.tags) && it.tags.length > 0);
    assert.ok(it.haystack === it.haystack.toLowerCase());
  });
});
test('ongeldige items worden overgeslagen', () => {
  const bad = [
    null,
    { type: 'video', title: 'x', url: 'x.html', date: '2026-01-01' },
    { type: 'blog', title: '', url: 'x.html', date: '2026-01-01' },
    { type: 'blog', title: 'x', url: '', date: '2026-01-01' },
    { type: 'blog', title: 'x', url: 'x.html', date: 'gisteren' },
    { type: 'kennis', title: 'x', url: 'x.html', date: '2026-1-1' }
  ];
  assert.strictEqual(app.loadIndex(bad).length, 0);
  assert.strictEqual(app.loadIndex('geen array').length, 0);
});
test('elke index-entry verwijst naar een bestaand bestand', () => {
  RAW.forEach((it) => {
    assert.ok(fs.existsSync(path.join(root, it.url)), 'ontbreekt: ' + it.url);
  });
});
test('datums, leestijd en tags hebben het juiste formaat', () => {
  RAW.forEach((it) => {
    assert.ok(/^\d{4}-\d{2}-\d{2}$/.test(it.date), it.title + ': datum');
    assert.ok(Number.isFinite(it.minutes) && it.minutes > 0, it.title + ': minutes');
    assert.ok(Array.isArray(it.tags) && it.tags.length > 0, it.title + ': tags');
    it.tags.forEach((t) => assert.ok(t.trim() === t && t.length > 0, it.title + ': tag-formaat'));
  });
});
test('posts verwijzen terug naar bestaande assets (script/css-pad)', () => {
  fs.readdirSync(path.join(root, 'posts')).forEach((f) => {
    const html = fs.readFileSync(path.join(root, 'posts', f), 'utf8');
    const refs = [...html.matchAll(/(?:href|src)="([^"#]+)"/g)].map((m) => m[1]);
    refs.forEach((r) => {
      if (/^(https?:|data:)/.test(r)) return;
      const file = r.split('?')[0].split('#')[0];
      assert.ok(fs.existsSync(path.join(root, 'posts', file)), f + ': ' + r);
    });
  });
});

console.log('filteren en zoeken');
const items = app.loadIndex(RAW);
test('type-filter levert alleen die type', () => {
  const kennis = app.filter(items, 'kennis', '');
  assert.ok(kennis.length > 0);
  kennis.forEach((it) => assert.strictEqual(it.type, 'kennis'));
  const blog = app.filter(items, 'blog', '');
  assert.ok(blog.length > 0);
  blog.forEach((it) => assert.strictEqual(it.type, 'blog'));
  assert.strictEqual(app.filter(items, 'alles', '').length, items.length);
});
test('zoeken op titel, samenvatting en tags', () => {
  assert.ok(app.filter(items, 'alles', 'airflow').some((it) => it.type === 'kennis'));
  assert.ok(app.filter(items, 'alles', 'retrieval').length >= 1);   // tag
  assert.ok(app.filter(items, 'alles', 'quantisatie').length >= 1); // samenvatting
  assert.ok(app.filter(items, 'alles', 'HNSW').length >= 1);        // titel, hoofdlettergevoelig?
  assert.strictEqual(app.filter(items, 'alles', 'bestaat-niet-ook-niet').length, 0);
});
test('zoeken is hoofdletteronafhankelijk en overleeft extra witruimte', () => {
  assert.deepStrictEqual(app.tokenize('  AIRFLOW   DAG '), ['airflow', 'dag']);
  assert.strictEqual(app.filter(items, 'alles', '  AIRFLOW ').length,
                     app.filter(items, 'alles', 'airflow').length);
});
test('meerdere woorden zijn een EN (elk token moet matchen)', () => {
  const both = app.filter(items, 'alles', 'airflow dag');
  assert.ok(both.length >= 1);
  const impossible = app.filter(items, 'alles', 'airflow llm');
  assert.strictEqual(impossible.length, 0);
});
test('onbekend type geeft leeg resultaat; readState valideert de URL', () => {
  assert.strictEqual(app.filter(items, 'onbekend', '').length, 0);
});
test('resultaten zijn op datum gesorteerd, nieuw eerst', () => {
  const list = app.filter(items, 'alles', '');
  for (let i = 1; i < list.length; i++) {
    assert.ok(list[i - 1].date >= list[i].date, 'volgorde fout op index ' + i);
  }
});
test('datumnotatie: 2026-09-12 -> 12 sep 2026', () => {
  assert.strictEqual(app.fmtDate('2026-09-12'), '12 sep 2026');
  assert.strictEqual(app.fmtDate('2026-12-01'), '1 dec 2026');
  assert.strictEqual(app.fmtDate('ongeldig'), 'ongeldig');
});

console.log('syntax-highlighter');
function strip(html) {
  return html
    .replace(/<span class="tok-\w+">/g, '')
    .replace(/<\/span>/g, '')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&');
}
test('escapeert HTML in code', () => {
  assert.strictEqual(hl.highlight('a < b & c > d', 'text'), 'a &lt; b &amp; c &gt; d');
});
test('geen onbewerkte tags in output (XSS)', () => {
  const out = hl.highlight('<script>alert(1)</script>', 'js');
  assert.ok(!out.includes('<script'), out);
  assert.ok(out.includes('&lt;script&gt;'));
});
test('sleutelwoorden, strings, getallen en commentaar krijgen klassen', () => {
  const js = hl.highlight('const x = 1; // top\nvar s = "hi";', 'js');
  assert.ok(js.includes('<span class="tok-kw">const</span>'), js);
  assert.ok(js.includes('<span class="tok-num">1</span>'), js);
  assert.ok(js.includes('<span class="tok-com">// top</span>'), js);
  assert.ok(js.includes('<span class="tok-str">"hi"</span>'), js);

  const py = hl.highlight('def f():  # ja\n    return None', 'python');
  assert.ok(py.includes('<span class="tok-kw">def</span>'), py);
  assert.ok(py.includes('<span class="tok-com"># ja</span>'), py);

  const sql = hl.highlight("select * from t where a = 'x' -- where", 'sql');
  assert.ok(sql.includes('<span class="tok-kw">select</span>'), sql);
  assert.ok(sql.includes('<span class="tok-com">-- where</span>'), sql);
});
test('roundtrip: markeren verandert de tekst niet', () => {
  const src = [
    'const url = `http://example.com/${id}`; // een <test> & "quote"',
    "def f(x): return x * 2  # commentaar met 'apostrof'",
    "select naam from klant where id = 42; -- 'sql'"
  ].join('\n');
  ['js', 'python', 'sql'].forEach((lang) => {
    assert.strictEqual(strip(hl.highlight(src, lang)), src, lang);
  });
});
test('onbekende taal valt terug op neutraal', () => {
  assert.strictEqual(hl.langOf(''), 'text');
  assert.strictEqual(hl.langOf('language-python'), 'python');
  assert.strictEqual(hl.langOf('language-js'), 'js');
  assert.strictEqual(hl.langOf('language-zzz'), 'text');
  assert.strictEqual(strip(hl.highlight('foo <bar>', 'zzz')), 'foo <bar>');
});

console.log('vindbaarheid');
test('sitemap verwijst alleen naar bestaande bestanden', () => {
  const sm = fs.readFileSync(path.join(root, 'sitemap.xml'), 'utf8');
  const locs = [...sm.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
  assert.ok(locs.length >= 6, 'te weinig URLs: ' + locs.length);
  locs.forEach((u) => {
    assert.ok(u.startsWith('https://koenvers.github.io/brain-dev/'), u);
    const rel = u.replace('https://koenvers.github.io/brain-dev/', '');
    const file = rel === '' ? 'index.html' : rel;
    assert.ok(fs.existsSync(path.join(root, file)), 'ontbreekt: ' + file);
  });
});
test('elke index-entry staat in de sitemap (met lastmod)', () => {
  const sm = fs.readFileSync(path.join(root, 'sitemap.xml'), 'utf8');
  RAW.forEach((it) => {
    assert.ok(sm.includes('/' + it.url), 'sitemap mist: ' + it.url);
    const blok = sm.split('<url>').find((b) => b.includes(it.url));
    const lastmod = /<lastmod>(\d{4}-\d{2}-\d{2})<\/lastmod>/.exec(blok);
    assert.ok(lastmod, 'geen lastmod bij ' + it.url);
    assert.strictEqual(lastmod[1], it.date, 'lastmod != datum bij ' + it.url);
  });
});
test('robots.txt wijst naar de sitemap', () => {
  const rb = fs.readFileSync(path.join(root, 'robots.txt'), 'utf8');
  assert.ok(rb.includes('Sitemap: https://koenvers.github.io/brain-dev/sitemap.xml'));
  assert.ok(!/Disallow:\s*\//.test(rb));
});
test('canonical en Open Graph op elke contentpagina', () => {
  const pages = ['index.html', 'over.html']
    .concat(fs.readdirSync(path.join(root, 'posts')).map((f) => 'posts/' + f));
  pages.forEach((f) => {
    const html = fs.readFileSync(path.join(root, f), 'utf8');
    const canon = /rel="canonical" href="([^"]+)"/.exec(html);
    assert.ok(canon, f + ': canonical');
    assert.ok(canon[1].startsWith('https://koenvers.github.io/brain-dev/'), f + ': ' + canon[1]);
    assert.ok(html.includes('property="og:title"'), f + ': og:title');
    assert.ok(html.includes('property="og:description"'), f + ': og:description');
    assert.ok(html.includes('property="og:url"'), f + ': og:url');
    assert.ok(html.includes('name="twitter:card"'), f + ': twitter:card');
    assert.ok(html.includes('href="https://github.com/koenvers/brain-dev"'), f + ': repo-link');
    if (f.startsWith('posts/')) assert.ok(html.includes('article:published_time'), f + ': published_time');
  });
});
test('404-pagina bestaat en gebruikt absolute paden', () => {
  const html = fs.readFileSync(path.join(root, '404.html'), 'utf8');
  assert.ok(html.includes('404'));
  assert.ok(html.includes('href="/brain-dev/"'), 'startpagina-ontsnapping');
  assert.ok(!/href="(?:\.\.\/|(?:assets|posts|content)\/)/.test(html), 'relatieve pad in 404');
});

console.log('feed, generator en assets');
const BASE = 'https://koenvers.github.io/brain-dev';
test('feed.xml: geldige structuur, alle items, niets rauw', () => {
  const feed = fs.readFileSync(path.join(root, 'feed.xml'), 'utf8');
  assert.ok(feed.startsWith('<?xml version="1.0" encoding="UTF-8"?>'));
  assert.ok(feed.includes('<rss version="2.0"'));
  assert.ok(feed.trim().endsWith('</rss>'));
  assert.strictEqual((feed.match(/<item>/g) || []).length, RAW.length);
  RAW.forEach((it) => {
    assert.ok(feed.includes(`<guid isPermaLink="true">${BASE}/${it.url}</guid>`), 'guid: ' + it.url);
    assert.ok(feed.includes(`<title>${it.title}</title>`), 'title: ' + it.title);
    assert.ok(feed.includes(`<description>${it.summary}</description>`), 'desc: ' + it.title);
    assert.ok(feed.includes(`<pubDate>`), 'pubDate ontbreekt');
  });
  const rauw = feed.replace(/&(amp|lt|gt|quot|apos|#\d+);/g, '');
  assert.ok(!rauw.includes('&'), 'rauw & in feed');
  assert.ok(!feed.includes('<![CDATA['), 'geen CDATA — alles geëscape');
});
test('generator is idempotent: hervatten levert identieke bestanden', () => {
  const { execFileSync } = require('child_process');
  const lees = () => ({
    sm: fs.readFileSync(path.join(root, 'sitemap.xml'), 'utf8'),
    feed: fs.readFileSync(path.join(root, 'feed.xml'), 'utf8')
  });
  const voor = lees();
  execFileSync(process.execPath, [path.join(root, 'tools', 'build-meta.js')], { cwd: root });
  const na = lees();
  assert.strictEqual(na.sm, voor.sm, 'sitemap.xml wijkt af van generator');
  assert.strictEqual(na.feed, voor.feed, 'feed.xml wijkt af van generator');
});
test('feed-link op elke pagina', () => {
  const pages = ['index.html', 'over.html', '404.html']
    .concat(fs.readdirSync(path.join(root, 'posts')).map((f) => 'posts/' + f));
  pages.forEach((f) => {
    const html = fs.readFileSync(path.join(root, f), 'utf8');
    assert.ok(html.includes('type="application/rss+xml"'), f + ': feed-link');
  });
});
test('analytics: gewired maar standaard uit', () => {
  const src = fs.readFileSync(path.join(root, 'assets/js/analytics.js'), 'utf8');
  assert.ok(/var ACCOUNT = ''/.test(src), 'ACCOUNT moet leeg zijn (niet geregistreerd via automatisering)');
  assert.ok(src.includes('goatcounter'), 'laadfunctie ontbreekt');
  assert.ok(src.includes('localhost'), 'localhost moet uitgesloten zijn');
  const pages = ['index.html', 'over.html', '404.html']
    .concat(fs.readdirSync(path.join(root, 'posts')).map((f) => 'posts/' + f));
  pages.forEach((f) => {
    assert.ok(fs.readFileSync(path.join(root, f), 'utf8').includes('analytics.js'), f + ': analytics-script');
  });
});
test('fonts: zelfgehost, aanwezig en aangeroepen', () => {
  const css = fs.readFileSync(path.join(root, 'assets/css/style.css'), 'utf8');
  assert.strictEqual((css.match(/@font-face/g) || []).length, 2);
  ['inter-latin.woff2', 'jetbrains-mono.woff2'].forEach((f) => {
    assert.ok(css.includes(`url('../fonts/${f}')`), 'css mist ' + f);
    const p = path.join(root, 'assets/fonts', f);
    assert.ok(fs.existsSync(p), 'bestand ontbreekt: ' + f);
    assert.ok(fs.statSync(p).size > 10000, 'verdacht klein: ' + f);
  });
  assert.ok(fs.existsSync(path.join(root, 'assets/fonts/OFL-1.1.txt')));
  assert.ok(fs.existsSync(path.join(root, 'assets/fonts/OFL-1.1-inter.txt')));
  assert.ok(!/https?:\/\/[^"']*\.(?:woff2?|ttf)/.test(css), 'geen externe font-URL');
});
test('favicon en og-image: aanwezig, bestanden bestaan, echte PNG', () => {
  const pages = ['index.html', 'over.html', '404.html']
    .concat(fs.readdirSync(path.join(root, 'posts')).map((f) => 'posts/' + f));
  pages.forEach((f) => {
    const html = fs.readFileSync(path.join(root, f), 'utf8');
    const pre = f.startsWith('posts/') ? '../' : f === '404.html' ? '/brain-dev/' : '';
    assert.ok(html.includes(`href="${pre}assets/img/favicon.svg" type="image/svg+xml"`), f + ': svg-favicon');
    assert.ok(html.includes(`href="${pre}assets/img/favicon.png" type="image/png"`), f + ': png-fallback');
    assert.ok(!html.includes('logo-mark.svg" type="image/svg+xml"'), f + ': logo-mark.svg hoort geen favicon-link te zijn');
  });
  assert.ok(fs.existsSync(path.join(root, 'assets/img/favicon.svg')), 'favicon.svg ontbreekt');
  assert.ok(fs.existsSync(path.join(root, 'tools/og-card.html')), 'og-card.html (reproductiebron) ontbreekt');
  pages.filter((f) => f !== '404.html').forEach((f) => {
    const html = fs.readFileSync(path.join(root, f), 'utf8');
    const m = /property="og:image" content="([^"]+)"/.exec(html);
    assert.ok(m, f + ': og:image');
    const rel = m[1].replace('https://koenvers.github.io/brain-dev/', '');
    assert.ok(fs.existsSync(path.join(root, rel)), f + ': og:image-bestand ontbreekt');
    assert.ok(html.includes('name="twitter:image"'), f + ': twitter:image');
  });
  ['assets/img/og.png', 'assets/img/favicon.png'].forEach((f) => {
    const buf = fs.readFileSync(path.join(root, f));
    assert.ok(buf.length > 1000, f + ': verdacht klein');
    assert.deepStrictEqual([...buf.subarray(0, 4)], [0x89, 0x50, 0x4e, 0x47], f + ': geen PNG-signatuur');
  });
  const og = fs.readFileSync(path.join(root, 'assets/img/og.png'));
  assert.ok(og.length > 30000, 'og.png te licht voor een 1200x630 kaart');
  assert.strictEqual(og.readUInt32BE(16), 1200, 'og.png breedte');
  assert.strictEqual(og.readUInt32BE(20), 630, 'og.png hoogte');
});

console.log('DOM-integratie');
test('DOMContentLoaded-listener overleeft het meegeleverde Event', () => {
  /* regressie: de listener kreeg het Event als root mee -> querySelectorAll-crash */
  const nodes = [{ className: 'language-js', textContent: 'const x = 1;', innerHTML: '' }];
  const listeners = {};
  global.document = {
    readyState: 'loading',
    addEventListener: (type, fn) => { listeners[type] = fn; },
    querySelectorAll: (sel) => { assert.strictEqual(sel, 'pre code'); return nodes; }
  };
  try {
    const mod = require.resolve(path.join(root, 'assets', 'js', 'highlight.js'));
    delete require.cache[mod];
    require(mod);
    assert.strictEqual(typeof listeners.DOMContentLoaded, 'function');
    listeners.DOMContentLoaded({ type: 'DOMContentLoaded' });
    assert.ok(nodes[0].innerHTML.includes('tok-kw'), nodes[0].innerHTML);
    assert.ok(nodes[0].innerHTML.includes('tok-num'), nodes[0].innerHTML);
  } finally {
    delete global.document;
  }
});

console.log('');
console.log(failed === 0
  ? `alle ${passed} tests geslaagd`
  : `${failed} gefaald, ${passed} geslaagd`);
process.exit(failed === 0 ? 0 : 1);
