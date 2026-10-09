# brain-dev

Statische site (kennisbank + blog) voor GitHub Pages. Platte HTML, één
CSS-bestand, twee kleine JS-bestanden. Geen Node, geen Jekyll, geen
dependencies.

## Structuur

```
brain-dev/
├── index.html              overzicht: zoeken + filterpills, rendert uit de index
├── over.html               over-pagina
├── 404.html                eigen 404 (absolute paden, vanaf elke diepe URL bruikbaar)
├── robots.txt              crawl-toegang + verwijzing naar de sitemap
├── sitemap.xml             alle URL's met lastmod
├── content/
│   └── index.js            ZOEKINDEX — enige bron van waarheid voor het overzicht
├── assets/
│   ├── css/style.css       stijl, licht/donker via prefers-color-scheme
│   └── js/
│       ├── app.js          renderen, zoeken, filteren, URL-sync
│       └── highlight.js    mini syntax-highlighter voor codeblokken
├── posts/                  artikelen (één HTML-bestand per stuk)
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

3. **Sitemap bijwerken** in `sitemap.xml`: één `<url>`-blok met de nieuwe URL
   en `<lastmod>` = de publicatiedatum. `tests/run-tests.js` faalt als een
   index-entry niet in de sitemap staat of als `lastmod` afwijkt van `date`.

## Vindbaarheid

- `robots.txt` — staat toe te crawlen en verwijst naar de sitemap.
- `sitemap.xml` — alle pagina's met `lastmod` (zie stap 3).
- Canonical + Open Graph/Twitter-meta bovenin elke HTML-pagina (afgeleid van
  `<title>` en `meta description`; pas je die aan, pas dan ook `og:title` /
  `og:description` aan). Geen `og:image`: er is geen afbeelding.
- `404.html` — eigen 404 met terugweg naar het overzicht. Gebruikt **absolute**
  paden (`/brain-dev/…`), want GitHub Pages serveert het vanaf elke diepe URL.
  Vermijdt dus per ongeluk relatieve links op die pagina.
- Repo-link in de footer van elke pagina.

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
datumnotatie, en de highlighter (escaping, XSS, roundtrip).

## GitHub Pages zetten

1. Repo aanmaken en pushen:

   ```bash
   git init
   git add .
   git commit -m "brain-dev: eerste versie"
   git remote add origin https://github.com/<gebruiker>/brain-dev.git
   git push -u origin main
   ```

2. GitHub → repo → **Settings → Pages → Source: Deploy from a branch** →
   `main` / `(root)` → Save.
3. Site: `https://<gebruiker>.github.io/brain-dev/`.

Alle links en assets zijn relatief, dus de site werkt ook onder een subpad en
lokaal via `index.html` openen of `python -m http.server`.

## Aanpassen

- **Kleuren:** CSS-variabelen bovenin `assets/css/style.css`; donkere modus in
  de `@media (prefers-color-scheme: dark)`-blok daaronder. Accentkleur:
  `--accent: #a3c9a8`.
- **Fonts:** standaard `system-ui` + monospace; Wil je Inter/JetBrains Mono
  echt laden, voeg dan zelf zelfgehoste WOFF2-bestanden toe (bewust geen
  externe CDN).
- **Zoekvelden uitbreiden:** pas `haystack` in `assets/js/app.js` (`normalize`).
