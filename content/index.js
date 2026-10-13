/* brain-dev — zoekindex en enige bron van waarheid voor het overzicht.
   Elk nieuw artikel/blog krijgt hier één regel; het overzicht rendert hieruit.
   Velden: type ('knowledge' | 'whitepaper' | 'blog' | 'software'), title, url, summary, date (YYYY-MM-DD),
           minutes (leestijd), tags (array), subtag (optioneel: kort label naast het type,
           kleine letters). Slechte entries worden overgeslagen.
   Welk type een stuk krijgt staat in de skill `blogpost-schrijven`. */
window.BRAINDEV_INDEX = [
  {
    type: 'software',
    title: 'FundingRadar: subsidieregelingen vinden per onderzoeksgroep',
    url: 'software/fundingradar.html',
    summary: 'Interne webapplicatie die subsidieregelingen dagelijks verzamelt, met AI uit de brondocumenten haalt en per onderzoeksgroep presenteert. PHP 8 op PostgreSQL, een Airflow-pijplijn en een read-only API met persoonlijke tokens.',
    date: '2026-10-13',
    minutes: 4,
    tags: ['subsidie', 'onderzoek', 'ai']
  },
  {
    type: 'software',
    title: 'Digital Food Forestry: het voedselbos als dashboard',
    url: 'software/digital-food-forestry.html',
    summary: 'Dashboard en backend voor het voedselbos bij Schuilenburg: percelen uit PostgreSQL op de kaart, bodemmonsters en verdichtingsmetingen per campagne, en de PDOK-luchtfoto per jaargang.',
    date: '2026-10-13',
    minutes: 6,
    tags: ['dashboard', 'bodem', 'leaflet']
  },
  {
    type: 'software',
    title: 'SensorFlow: sensordata van de fieldlabs op één plek',
    url: 'software/sensorflow.html',
    summary: 'Django-applicatie met een API voor fieldlabs, devices, sensoren en observaties in de begrippen van de OGC SensorThings-standaard, plus een systeemmonitor die laat zien welke apparaten stil zijn komen te liggen.',
    date: '2026-10-11',
    minutes: 6,
    tags: ['sensoren', 'api', 'dashboard']
  },
  {
    type: 'software',
    title: 'GrantWrite: AI-hulp bij het schrijven van een aanvraag',
    url: 'software/grantwrite.html',
    summary: 'Interne webapplicatie waarin onderzoekers een subsidieaanvraag opbouwen met AI-ondersteuning. De landingspagina is publiek, de toepassing staat achter een account, en een ONLYOFFICE-plugin brengt de assistentie naar de tekstverwerker.',
    date: '2026-10-11',
    minutes: 4,
    tags: ['subsidie', 'onderzoek', 'ai']
  },
  {
    type: 'software',
    title: 'Boveneind Realtime: koeienposities in de stal',
    url: 'software/boveneind-realtime.html',
    summary: 'Statisch Leaflet-dashboard dat de realtime posities van de melkkoeien op Hoeve Boveneind op een stalplattegrond zet, met negen stal-lagen, URL-opties voor schermen op de locatie en een offline variant voor demonstraties.',
    date: '2026-10-11',
    minutes: 5,
    tags: ['realtime', 'dashboard', 'veehouderij']
  },
  {
    type: 'software',
    title: 'Maisdoolhof Generator: van BRP-perceel naar zaai-taakkaart',
    url: 'software/maisdoolhof-generator.html',
    summary: 'Browsertool die op een BRP-perceel een doolhofpatroon tekent en dat als zaai-taakkaart exporteert naar ISOXML, Shapefile, GeoJSON en CSV, met celgrootte, moeilijkheidsgraad en ingangen.',
    date: '2026-05-22',
    minutes: 4,
    tags: ['taakkaart', 'remote-sensing', 'prototype']
  },
  {
    type: 'software',
    title: 'Jasin de Kas: het kasklimaat in één antwoord',
    url: 'software/jasindekas.html',
    summary: 'Kleine webpagina die het gemiddelde klimaat van vandaag uit de kas-databron leest en de vraag beantwoordt of je een jas nodig hebt. Bedoeld voor een scherm in of bij de kas.',
    date: '2026-04-02',
    minutes: 3,
    tags: ['dashboard', 'kas', 'sensoren']
  },
  {
    type: 'software',
    title: 'BirdScan: vogelwaarnemingen met webcam',
    url: 'software/birdscan.html',
    summary: 'PHP-applicatie op PostgreSQL die vogelwaarnemingen toont: een live webcam, het weer uit Open-Meteo, weekstatistieken per soort en een REST-API op de waarnemingstabel.',
    date: '2026-04-02',
    minutes: 4,
    tags: ['monitoring', 'dashboard', 'php']
  },
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
