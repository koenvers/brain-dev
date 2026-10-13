/* brain-dev — zoekindex en enige bron van waarheid voor het overzicht.
   Elk nieuw artikel/blog krijgt hier één regel; het overzicht rendert hieruit.
   Velden: type ('knowledge' | 'whitepaper' | 'blog' | 'software'), title, url, summary, date (YYYY-MM-DD),
           minutes (leestijd), tags (array), subtag (optioneel: kort label naast het type,
           kleine letters). Slechte entries worden overgeslagen.
   Welk type een stuk krijgt staat in de skill `blogpost-schrijven`. */
window.BRAINDEV_INDEX = [
  {
    type: 'software',
    title: 'NDVItoTaskmap: taakkaarten uit drone-NDVI',
    url: 'software/ndvi-taakkaart-generator.html',
    summary: 'Open-source browsertool die van drone-NDVI (GeoTIFF) een variabele-dosering taakkaart maakt: automatische banddetectie, BRP-percelen via PDOK, en export naar Shapefile, ISOXML, GeoJSON en CSV. Gepubliceerd in de Research Software Directory, met DOI.',
    date: '2026-10-13',
    minutes: 5,
    tags: ['ndvi', 'remote-sensing', 'open-source']
  },
  {
    type: 'whitepaper',
    title: 'FundingRadar: van handmatig subsidiezoeken naar een dagelijkse radar',
    url: 'posts/fundingradar-whitepaper.html',
    summary: 'Whitepaper over FundingRadar: de achtergrond in de hbo-bekostiging, wat de tool uit de AI-roadmap dagelijks doet voor de onderzoeksgroepen, de gemeten cijfers op 13 oktober 2026, en een fasering van handwerk naar keten.',
    date: '2026-10-13',
    minutes: 12,
    tags: ['subsidie', 'onderzoek', 'ai'],
    subtag: 'under construction'
  },
  {
    type: 'knowledge',
    title: 'Onderzoekssoftware publiceren via Zenodo en de RSD',
    url: 'posts/onderzoekssoftware-publiceren-zenodo-rsd.html',
    summary: 'Van een afgeschermde repository naar een citeerbare publicatie: GitHub aan Zenodo koppelen, een release met DOI, en een pagina in de Research Software Directory. Wat verplicht is, wat optioneel is, en waar het misgaat.',
    date: '2026-10-13',
    minutes: 12,
    tags: ['onderzoekssoftware', 'zenodo', 'doi']
  }
];
