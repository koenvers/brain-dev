# brain-dev

Statische site (kennisbank + whitepapers + blog + code) voor GitHub Pages. Platte
HTML, één CSS-bestand, vier kleine JS-bestanden, systeemfonts. Geen Node-build,
geen Jekyll, geen dependencies (Node alleen voor tests en de meta-generator).

## Structuur

```
brain-dev/
├── index.html              overzicht: zoeken + secties in de navigatie, rendert uit de index
├── 404.html                eigen 404 (absolute paden, vanaf elke diepe URL bruikbaar)
├── robots.txt              crawl-toegang + verwijzing naar de sitemap
├── sitemap.xml             gegenereerd door tools/build-meta.js
├── feed.xml                RSS 2.0, gegenereerd door tools/build-meta.js
├── content/
│   └── index.js            ZOEKINDEX — enige bron van waarheid voor overzicht én feed
├── assets/
│   ├── css/style.css       stijl, licht/donker via prefers-color-scheme, systeemfonts
│   ├── img/                logo-mark.svg (header), favicon.svg/.png, og.png (1200x630)
│   └── js/
│       ├── app.js          renderen, zoeken, filteren, URL-sync, statistiekregel
│       ├── highlight.js    mini syntax-highlighter voor codeblokken
│       └── analytics.js    meting (standaard uit; zie "Meten")
├── posts/                  artikelen (één HTML-bestand per stuk)
├── repos/                  projectpagina's van open-source repo's (type 'repo', dezelfde chrome als posts/)
├── tools/build-meta.js     genereert sitemap.xml + feed.xml uit de index
├── tests/run-tests.js      node tests/run-tests.js
└── .nojekyll               schakelt de Jekyll-build van GitHub Pages uit
```

## Nieuw item toevoegen (3 stappen, geen build)

1. **Pagina maken.** Kopieer een bestaand bestand uit `posts/` (of uit `repos/`
   voor een projectpagina) en pas titel, meta-blok en content aan. Codeblokken:
   `<pre><code class="language-python">…</code></pre>`
   (ondersteund: `python`, `js`, `bash`, `sql`, `css`, `json`; alles wat
   onbekend is krijgt neutrale opmaak).

   De vorm staat los van het onderwerp: klikbare referenties naar de bron zelf,
   afkortingen bij het eerste gebruik als `<abbr title>`, de begrippenlijst als
   `<dl>`, een sectie Bronnen zodra er meer dan twee externe links zijn,
   optionele uitweidingen in `<details>`, en koppen met een `id` waar de
   inhoudsopgave naartoe linkt. Die eisen staan in de skill
   `blogpost-schrijven` (Poort 4), met deze twee controles:

   ```bash
   # elk anker heeft een bestaand id
   python -c "import re; h=open('posts/<naam>.html',encoding='utf-8').read(); a=set(re.findall(r'href=\"#([^\"]+)\"',h)); i=set(re.findall(r'id=\"([^\"]+)\"',h)); print('dode ankers:', sorted(a-i) or 'geen')"
   ```

   Nieuwe CSS hoort in `assets/css/style.css`, in een eigen sectie achteraan —
   niet in een `<style>`-blok in de pagina.

2. **Indexregel toevoegen** in `content/index.js`, bovenaan de lijst (volgorde
   maakt niet uit — het overzicht sorteert op datum, nieuw eerst):

   ```js
   {
     type: 'kennis',                       // 'kennis', 'whitepaper', 'blog' of 'repo'
     title: 'Titel van het stuk',
     url: 'posts/mijn-stuk.html',          // relatief ten opzichte van index.html; een
                                           // projectpagina staat in repos/
     summary: 'Eén samenvatting van 1-2 zinnen — wordt getoond en geïndexeerd.',
     date: '2026-10-09',                   // YYYY-MM-DD
     minutes: 7,                           // leestijd in minuten
     tags: ['ai', 'tooling'],              // klein, aaneengesloten, herbruikbaar
     subtag: 'under construction',         // optioneel: kort label naast het type → oranje, tussen haken
     updated: '2026-10-20',                // optioneel: laatste wijziging → sitemap-lastmod
     repo: 'https://github.com/…'          // optioneel: broncode → "code ↗" in het overzicht
    }
    ```

   `tags` zijn meteen ook de filterrij boven de lijst: de meest gebruikte tags
   komen daar automatisch als pill te staan. `subtag`, `updated` en `repo` mogen
   weg. Ongeldige waarden in die drie velden worden genegeerd, het item blijft
   staan.

   `subtag` is geen tag maar een kort label naast het type: het project waar een
   stuk bij hoort (`fundingradar`) of de status ervan (`under construction`).
   Kleine letters, spaties en koppelstreepjes mogen, hoogstens 24 tekens; het
   label staat in oranje tussen blokhaken, in het overzicht en op de
   artikelpagina. De haken komen uit de CSS, niet uit de waarde. Eén per item —
   is een tweede nodig, dan is dat een teken dat het een tag had moeten zijn.

   Een item met een ongeldige regel (verkeerd type, ontbrekende titel/url,
   datum niet `YYYY-MM-DD`) wordt door de code overgeslagen — de site blijft
   werken, het item verschijnt niet.

De index is meteen de zoekindex: er is niets te genereren of bij te werken.
Velden die je zoekt: titel, samenvatting, subtag, tags (en het type:
`knowledge`/`whitepaper`/`blog`/`code`).

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
- Repo-link en contactgegevens (e-mail, LinkedIn) in de footer van elke pagina.

## Meten (actief)

`assets/js/analytics.js` laadt het GoatCounter-script op elke pagina zodra
`ACCOUNT` gevuld is — nu `koenverschuren` →
`https://koenverschuren.goatcounter.com/count`. Geen cookies, geen
persoonsgegevens, alleen paginaweergaven; `localhost` en `file://` tellen niet
mee (geen vervuiling van de cijfers door previews).

- Dashboard: <https://koenverschuren.goatcounter.com>
- Uitzetten: `var ACCOUNT = '';` in `assets/js/analytics.js` → er wordt niets
  geladen (de tests eisen een geldige code zodra dit aan staat).
- Account ooit opnieuw aanmaken: alleen **handmatig** op
  <https://www.goatcounter.com/signup> — de voorwaarden verbieden registratie
  via automatisering.

## Zoeken en filteren

- Zoekveld bovenaan `index.html`; matches op titel + samenvatting + tags,
  hoofdletteronafhankelijk, meerdere woorden = EN. Zoeken is een
  substring-match: `ai` vindt ook `Airflow`.
- Secties (typefilter) zitten in de navigatie: `all` / `knowledge` /
  `whitepapers` / `blog` / `code`; de
  resultaatregel staat onder de tagrij. Daaronder een tagrij
  met de meest gebruikte tags: klik = filteren op die tag, nog een klik heft het
  filter op. Klikken op een tag in een item zet dezelfde tagfilter.
- Vindt een zoekopdracht niets, dan zegt de lege staat wat er niet gevonden is
  (zoekterm of tag) en staan er populaire tags als alternatief, plus "wis alle
  filters" als er een filter actief is.
- `/` focust de zoekbalk; `Esc` wist de zoekopdracht en verlaat daarna het veld.
- Status zit in de URL: `index.html?type=kennis&q=airflow&tag=retrieval`, deelbaar
  en overleft een refresh. Alles client-side, geen `fetch`, geen netwerkverkeer.

## Tests

```bash
node tests/run-tests.js
```

Dekt: indexvalidatie, bestandsverwijzingen, zoeken/filteren/sorteren (type, tag,
vrije tekst), datumnotatie, highlighter (escaping, XSS, roundtrip), vindbaarheid
(sitemap/feed/canonical/OG/404), generator-idempotentie, systeemfonts en analytics.
De pagina-tests (canonical, OG, favicon, feed-link, analytics) lopen over `posts/`
én `repos/`.

## GitHub Pages (actief)

Repo: <https://github.com/koenvers/brain-dev> · site: <https://brain-dev.nl/>
(Pages: `main` / `(root)`, `.nojekyll` houdt de Jekyll-build buiten de deur).

Custom domain `brain-dev.nl`, vastgelegd in het bestand `CNAME` in de root.
Het oude adres <https://koenvers.github.io/brain-dev/> blijft werken: GitHub
stuurt het door naar het custom domain (gemeten: na het zetten van het domein
duurt dat tot de cache-TTL van 10 minuten verstreken is; dieper gelegen paden
gaan mee). Apex is de canonical host; `www` verwijst daar automatisch naartoe.
DNS staat bij Strato (`docks18.rzone.de`): `A`/`AAAA` op `@` naar de GitHub
Pages-IP's, `www` als CNAME naar `koenvers.github.io` (niet naar de apex — dat
breekt Enforce HTTPS). Een eigen doorverwijzing op de apex moet uit staan, anders
lus je tussen Strato en Pages. Het paneel van Strato neemt één A- en één
AAAA-record aan; dat is genoeg, want elk van de vier GitHub-IP's serveert de site
zelfstandig (alle vier met 200 getest). Het TXT-record
`_github-pages-challenge-koenvers` laat je staan: dat houdt het domein verified
en blokkeert overname door een andere repo.

Wijzigingen publiceren:

```bash
node tools/build-meta.js   # na elke wijziging in content/index.js of index.html:
                           # de lastmod van de startpagina komt uit de mtime van index.html
node tests/run-tests.js    # moet groen
git add -A && git commit -m "…" && git push
```

Bouw duurt enkele tientallen seconden; status via Settings → Pages of de
API (`pages/builds/latest` → `status: built`).

Alle links en assets zijn relatief, dus de site werkt ook onder een subpad en
lokaal via `index.html` openen of `python -m http.server`.

## Aanpassen

- **Kleuren:** CSS-variabelen bovenin `assets/css/style.css`; donkere modus in
  de `@media (prefers-color-scheme: dark)`-blok daaronder. Eén accentkleur
  (`--accent-strong`) voor links, het actieve filter en focus; de rest is
  monochroom, op één uitzondering na: `--subtag` is oranje, want dat label moet
  van het type en van de tags te onderscheiden blijven. Wisselen naar Hacker
  News-oranje (`#ff6600`) of terminalblauw (`#3b5bdb`) is één regel, zie het
  commentaar bij de variabelen.
- **Fonts:** systeemfonts, geen webfonts. `--sans` en `--mono` staan bovenin
  `style.css` en verwijzen naar `system-ui` en `ui-monospace`. Inter en
  JetBrains Mono zijn eruit gehaald omdat twee woff2-bestanden 88 kB van de
  107 kB van een koude paginalading waren; de map `assets/fonts/` bestaat niet
  meer. De test `geen webfonts` houdt dat zo.
- **Taal:** de site-omgeving is Engels (navigatie, microcopy, meta, feed, OG-kaart);
  de artikelen zelf zijn Nederlands. Nieuwe UI-tekst dus in het Engels, nieuwe
  content in het Nederlands. De chrome-pagina's hebben `lang="en"`, een artikel
  houdt `lang="nl"`.
- **Zoekvelden uitbreiden:** pas `haystack` in `assets/js/app.js` (`normalize`).
