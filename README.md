# brain-dev

Statische site (kennisbank + blog) voor GitHub Pages. Platte HTML, één
CSS-bestand, vier kleine JS-bestanden, zelfgehoste fonts. Geen Node-build, geen
Jekyll, geen dependencies (Node alleen voor tests en de meta-generator).

## Structuur

```
brain-dev/
├── index.html              overzicht: zoeken + filterpills, rendert uit de index
├── over.html               over-pagina
├── 404.html                eigen 404 (absolute paden, vanaf elke diepe URL bruikbaar)
├── robots.txt              crawl-toegang + verwijzing naar de sitemap
├── sitemap.xml             gegenereerd door tools/build-meta.js
├── feed.xml                RSS 2.0, gegenereerd door tools/build-meta.js
├── content/
│   └── index.js            ZOEKINDEX — enige bron van waarheid voor overzicht én feed
├── assets/
│   ├── css/style.css       stijl, licht/donker via prefers-color-scheme, @font-face
│   ├── fonts/              Inter + JetBrains Mono (woff2, OFL-1.1 licentie)
│   ├── img/                logo-mark.svg (header), favicon.svg/.png, og.png (1200x630)
│   └── js/
│       ├── app.js          renderen, zoeken, filteren, URL-sync, statistiekregel
│       ├── highlight.js    mini syntax-highlighter voor codeblokken
│       └── analytics.js    meting (standaard uit; zie "Meten")
├── posts/                  artikelen (één HTML-bestand per stuk)
├── tools/build-meta.js     genereert sitemap.xml + feed.xml uit de index
├── tests/run-tests.js      node tests/run-tests.js
└── .nojekyll               schakelt de Jekyll-build van GitHub Pages uit
```

## Nieuw item toevoegen (3 stappen, geen build)

1. **Pagina maken.** Kopieer een bestaand bestand uit `posts/` en pas titel,
   meta-blok en content aan. Codeblokken: `<pre><code class="language-python">…</code></pre>`
   (ondersteund: `python`, `js`, `bash`, `sql`, `css`, `json`; alles wat
   onbekend is krijgt neutrale opmaak).

2. **Indexregel toevoegen** in `content/index.js`, bovenaan de lijst (volgorde
   maakt niet uit — het overzicht sorteert op datum, nieuw eerst):

   ```js
   {
     type: 'kennis',                       // 'kennis' of 'blog'
     title: 'Titel van het stuk',
     url: 'posts/mijn-stuk.html',          // relatief ten opzichte van index.html
     summary: 'Eén samenvatting van 1-2 zinnen — wordt getoond en geïndexeerd.',
     date: '2026-10-09',                   // YYYY-MM-DD
     minutes: 7,                           // leestijd in minuten
     tags: ['ai', 'tooling']               // klein, aaneengesloten, herbruikbaar
   }
   ```

   Een item met een ongeldige regel (verkeerd type, ontbrekende titel/url,
   datum niet `YYYY-MM-DD`) wordt door de code overgeslagen — de site blijft
   werken, het item verschijnt niet.

De index is meteen de zoekindex: er is niets te genereren of bij te werken.
Velden die je zoekt: titel, samenvatting, tags (en het type: `Kennis`/`Blog`).

3. **Meta-generator draaien** (als er Node is): `node tools/build-meta.js`
   herschrijft `sitemap.xml` en `feed.xml` uit de index. Zonder Node: die twee
   bestanden handmatig bijwerken. De tests falen als de bestanden niet meer
   kloppen met de index of als `lastmod` afwijkt van `date`.

## Vindbaarheid

- `robots.txt` — staat toe te crawlen en verwijst naar de sitemap.
- `sitemap.xml` + `feed.xml` — uit de generator (zie stap 3); elke pagina heeft
  een `<link rel="alternate" type="application/rss+xml">`.
- Canonical + Open Graph/Twitter-meta bovenin elke HTML-pagina (afgeleid van
  `<title>` en `meta description`; pas je die aan, pas dan ook `og:title` /
  `og:description` aan). `og:image` = `assets/img/og.png` (1200×630);
  reproduceerbaar door `tools/og-card.html` op 1200×630 te screenshot-en.
- Favicon: `favicon.svg` (tabvriendelijke versimplering, lichte achtergrond) met
  `favicon.png` als fallback; `logo-mark.svg` is uitsluitend het merkteken in de
  header (en de bron voor de OG-kaart).
- Herkomst merkteken: `logo-mark.svg` is een **vectorreconstructie** van het
  aangeleverde logo — het bronbestand ontbrak op schijf (plakken in de chat levert
  geen bestand op). Lever je het origineel aan, vervang dan dat ene bestand;
  markup, CSS en tests blijven gelijk.
- `404.html` — eigen 404 met terugweg naar het overzicht. Gebruikt **absolute**
  paden (`/brain-dev/…`), want GitHub Pages serveert het vanaf elke diepe URL.
  Vermijdt dus per ongeluk relatieve links op die pagina.
- Repo-link in de footer van elke pagina.

## Meten (standaard uit)

`assets/js/analytics.js` is op elke pagina geladen, maar laadt niets zolang
`ACCOUNT` leeg is — dus geen externe requests, geen cookies, niets geteld.
Activeren (handmatig, ~2 minuten):

1. Account aanmaken op <https://www.goatcounter.com/signup> — **door een mens**:
   de voorwaarden verbieden accounts die via automatisering geregistreerd worden.
2. Het toegewezen code-veld invullen in `assets/js/analytics.js`:
   `var ACCOUNT = 'jouw-code';` (→ `https://jouw-code.goatcounter.com/count`).
3. `git commit -am "analytics aan" && git push`.

Preview op localhost telt nooit mee; cookies zijn er niet (GoatCounter telt
anoniem per paginaweergave).

## Zoeken en filteren

- Zoekveld bovenaan `index.html`; matches op titel + samenvatting + tags,
  hoofdletteronafhankelijk, meerdere woorden = EN. Zoeken is een
  substring-match: `ai` vindt ook `Airflow`.
- Pills: Alle content / Alleen Kennisbank / Alleen Blog.
- `/` focust de zoekbalk, `Esc` wist de zoekopdracht, klik op een tag = zoeken
  op die tag.
- Status zit in de URL: `index.html?type=kennis&q=airflow` — deelbaar en
  overleft een refresh. Alles client-side, geen `fetch`, geen netwerkverkeer.

## Tests

```bash
node tests/run-tests.js
```

Dekt: indexvalidatie, bestandsverwijzingen, zoeken/filteren/sortering,
datumnotatie, highlighter (escaping, XSS, roundtrip), vindbaarheid
(sitemap/feed/canonical/OG/404), generator-idempotentie, fonts en analytics.

## GitHub Pages (actief)

Repo: <https://github.com/koenvers/brain-dev> · site:
<https://koenvers.github.io/brain-dev/> (Pages: `main` / `(root)`, `.nojekyll`
houdt de Jekyll-build buiten de deur).

Wijzigingen publiceren:

```bash
node tools/build-meta.js   # als de index veranderde (sitemap + feed)
node tests/run-tests.js    # moet groen
git add -A && git commit -m "…" && git push
```

Bouw duurt enkele tientallen seconden; status via Settings → Pages of de
API (`pages/builds/latest` → `status: built`).

Alle links en assets zijn relatief, dus de site werkt ook onder een subpad en
lokaal via `index.html` openen of `python -m http.server`.

## Aanpassen

- **Kleuren:** CSS-variabelen bovenin `assets/css/style.css`; donkere modus in
  de `@media (prefers-color-scheme: dark)`-blok daaronder. Accentkleur:
  `--accent: #a3c9a8`.
- **Fonts:** Inter (body) en JetBrains Mono (monospace) staan zelfgehost in
  `assets/fonts/` (woff2, OFL-1.1). `src: local(...)` eerst: wie ze al
  geïnstalleerd heeft downloadt niets. Vervang de bestanden en houd de
  `@font-face`-regels gelijk; `font-display: swap` voorkomt lege tekst.
- **Zoekvelden uitbreiden:** pas `haystack` in `assets/js/app.js` (`normalize`).
