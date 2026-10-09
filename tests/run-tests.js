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

console.log('');
console.log(failed === 0
  ? `alle ${passed} tests geslaagd`
  : `${failed} gefaald, ${passed} geslaagd`);
process.exit(failed === 0 ? 0 : 1);
