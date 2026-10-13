# brain-dev — workspace-regels

Statische kennisbank + blog voor GitHub Pages: platte HTML, één CSS-bestand, vier kleine
JS-bestanden, zelfgehoste fonts. Geen Node-build, geen Jekyll, geen dependencies (Node alleen voor de
tests en de meta-generator). `readme.md` beschrijft de structuur en het toevoegen van een item in
drie stappen — dat is de bron; dit bestand houdt alleen wat een agent vóór een wijziging moet weten.

- **`content/index.js` is de enige bron van waarheid**: het overzicht, de zoekfunctie én `feed.xml`
  lezen daaruit. Een item met een ongeldige regel (type, titel, url, datum niet `YYYY-MM-DD`) wordt
  stil overgeslagen — de site blijft werken, het item verschijnt niet.
- **Na een wijziging in `content/index.js` of een nieuw `posts/`-bestand**: `node tools/build-meta.js`
  opnieuw draaien. `sitemap.xml` en `feed.xml` zijn gegenereerd en staan wél in de repo.
- **Opleveringscheck, in deze volgorde:** eerst `node --check "<gewijzigd bestand>.js"` (seconden),
  dan `node tests/run-tests.js` (30 tests, zonder browser). Stop bij de eerste fout. Geef node een
  Windows-pad (`D:/GIT/brain-dev/...`); een MSYS-pad als `/d/GIT/...` geeft *Cannot find module*.
- **Content gaat altijd via de skill `blogpost-schrijven`** (nieuw item, bestaande post aanpassen,
  redigeren, reviewen). Die skill draagt de drie poorten: feiten (elk getal met een aanwijsbare bron,
  links machinaal gecheckt, niets toevoegen wat er niet staat), repo (indexregel → generator → tests)
  en stijl (vier grep-controles op het body-bereik). De Engelstalige writing-skills van derden staan
  als naslag in `D:/GIT/loadout/External/` — lees ze, maar pas de regels toe via die skill.
- **Geen dependencies en geen buildstap toevoegen.** Dat is een eigenschap van dit project (GitHub
  Pages met `.nojekyll`), niet een tussenstand — een bundler of framework verandert de publicatiewijze.
- **Documentatie:** één `readme.md`. Een nieuw los `.md`-bestand hoort hier niet; een stuk content is
  een `posts/`-pagina plus een regel in de index.
