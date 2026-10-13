/* brain-dev — zoekindex en enige bron van waarheid voor het overzicht.
   Elk nieuw artikel/blog krijgt hier één regel; het overzicht rendert hieruit.
   Velden: type ('kennis' | 'blog'), title, url, summary, date (YYYY-MM-DD),
           minutes (leestijd), tags (array). Slechte entries worden overgeslagen.
   Welk type een stuk krijgt staat in de skill `blogpost-schrijven`. */
window.BRAINDEV_INDEX = [
  {
    type: 'kennis',
    title: 'FundingRadar: van handmatig subsidiezoeken naar een dagelijkse radar',
    url: 'posts/fundingradar-whitepaper.html',
    summary: 'Een whitepaper over wat er gebeurt als een hogeschool haar subsidiebronnen dagelijks laat doorzoeken: de aanleiding in de hbo-bekostiging, het knelpunt bij lectoraten, wat het systeem doet, de gemeten cijfers op 13 oktober 2026 en de metingen die er nog ontbreken.',
    date: '2026-10-13',
    minutes: 14,
    tags: ['whitepaper', 'subsidie', 'onderzoek', 'ai']
  },
  {
    type: 'kennis',
    title: 'Onderzoekssoftware publiceren via Zenodo en de RSD',
    url: 'posts/onderzoekssoftware-publiceren-zenodo-rsd.html',
    summary: 'Van een afgeschermde repository naar een citeerbare publicatie: GitHub aan Zenodo koppelen, een release met DOI, en een pagina in de Research Software Directory. Wat verplicht is, wat optioneel is, en waar het misgaat.',
    date: '2026-10-13',
    minutes: 12,
    tags: ['onderzoekssoftware', 'zenodo', 'doi']
  }
];
