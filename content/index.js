/* brain-dev — zoekindex en enige bron van waarheid voor het overzicht.
   Elk nieuw artikel/blog krijgt hier één regel; het overzicht rendert hieruit.
   Velden: type ('kennis' | 'blog'), title, url, summary, date (YYYY-MM-DD),
           minutes (leestijd), tags (array). Slechte entries worden overgeslagen. */
window.BRAINDEV_INDEX = [
  {
    type: 'kennis',
    title: 'Vectorzoekindexen: waarom HNSW werkt',
    url: 'posts/vectorzoekindexen-hnsw.html',
    summary: 'Brute-force zoeken op embeddings is exact maar O(n). HNSW bouwt een gelaagd graafnetwerk en zoekt in O(log n) — met drie knelpunten die je moet kennen voordat je de standaardparameters overneemt.',
    date: '2026-09-12',
    minutes: 9,
    tags: ['ai', 'retrieval', 'indexeren']
  },
  {
    type: 'kennis',
    title: 'Airflow-productie-DAG: patronen en valkuilen',
    url: 'posts/airflow-dag-patronen.html',
    summary: 'Idempotente taken, een juiste retry-policy en geen-logica-in-de-DAG: de afspraken waarmee een DAG jaren later nog steeds te onderhouden is.',
    date: '2026-08-03',
    minutes: 12,
    tags: ['airflow', 'data-engineering', 'tooling']
  },
  {
    type: 'blog',
    title: 'Waarom deze kennisbank platte HTML is',
    url: 'posts/platte-html-kennisbank.html',
    summary: 'Geen Jekyll, geen Node, geen dependencies: één JSON-index, één renderfunctie. Notities over wat dat oplevert en waar de grens ligt.',
    date: '2026-10-01',
    minutes: 4,
    tags: ['tooling', 'web']
  },
  {
    type: 'blog',
    title: 'Eerste week lokale LLM’s op een laptop',
    url: 'posts/lokale-llm-laptop.html',
    summary: 'Wat er wel en niet op 16 GB geheugen draait, hoeveel tokens per seconde je echt haalt en waarom quantisatie geen detail is.',
    date: '2026-10-07',
    minutes: 6,
    tags: ['ai', 'experiment']
  }
];
