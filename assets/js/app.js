/* brain-dev — overzicht, zoeken en filteren (client-side, dependency-vrij).
   Zoekindex: window.BRAINDEV_INDEX (content/index.js), geladen vóór dit script.
   Pure functies zijn via module.exports testbaar met node. */
(function () {
  'use strict';

  var TYPE_LABEL = { kennis: 'kennis', blog: 'blog' };
  var MAANDEN = ['jan', 'feb', 'mrt', 'apr', 'mei', 'jun', 'jul', 'aug', 'sep', 'okt', 'nov', 'dec'];
  var TAGBAR_MAX = 8;   /* tag-pills boven de lijst */
  var SUGGEST_MAX = 6;  /* tagsuggesties bij een leeg resultaat */

  /* Elke href komt uit de index; alleen relatieve paden en http(s) mogen erin.
     Zo kan een fout of kwaadwillende indexregel geen javascript:-URL injecteren. */
  var SCHEME = /^[a-z][a-z0-9+.-]*:/i;

  function isLocalUrl(url) {
    return typeof url === 'string' && url !== '' && !SCHEME.test(url);
  }

  function isHttpUrl(url) {
    return typeof url === 'string' && /^https?:\/\//i.test(url.trim());
  }

  function isIsoDate(s) {
    return typeof s === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(s);
  }

  function isPlainItem(it) {
    return !!it && typeof it === 'object' &&
      (it.type === 'kennis' || it.type === 'blog') &&
      typeof it.title === 'string' && it.title.trim() !== '' &&
      isLocalUrl(it.url) &&
      isIsoDate(it.date);
  }

  function normalize(it) {
    var tags = Array.isArray(it.tags)
      ? it.tags.filter(function (t) { return typeof t === 'string' && t.trim() !== ''; })
          .map(function (t) { return t.trim(); })
      : [];
    var summary = typeof it.summary === 'string' ? it.summary.trim() : '';
    return {
      type: it.type,
      title: it.title.trim(),
      url: it.url,
      summary: summary,
      date: it.date,
      /* optioneel: laatste inhoudelijke wijziging (anders = datum) */
      updated: isIsoDate(it.updated) ? it.updated : '',
      /* optioneel: broncode/repo van het beschreven project */
      repo: isHttpUrl(it.repo) ? it.repo.trim() : '',
      minutes: typeof it.minutes === 'number' && it.minutes > 0 ? it.minutes : null,
      tags: tags,
      tagsLower: tags.map(function (t) { return t.toLowerCase(); }),
      /* alles waarop gezocht wordt, klein opgeslagen */
      haystack: (it.title + ' ' + summary + ' ' + tags.join(' ') + ' ' + TYPE_LABEL[it.type]).toLowerCase()
    };
  }

  function loadIndex(raw) {
    if (!Array.isArray(raw)) return [];
    return raw.filter(isPlainItem).map(normalize);
  }

  function tokenize(q) {
    var s = String(q == null ? '' : q).trim().toLowerCase();
    return s === '' ? [] : s.split(/\s+/);
  }

  function normTag(tag) {
    return String(tag == null ? '' : tag).trim().toLowerCase();
  }

  function matches(item, tokens) {
    for (var i = 0; i < tokens.length; i++) {
      if (item.haystack.indexOf(tokens[i]) === -1) return false;
    }
    return true;
  }

  /* type: 'alles' | 'kennis' | 'blog'; tag: '' = geen tagfilter.
     Resultaat gesorteerd op datum, nieuw eerst. */
  function filter(items, type, query, tag) {
    var tokens = tokenize(query);
    var want = normTag(tag);
    return items.filter(function (it) {
      if (type !== 'alles' && it.type !== type) return false;
      if (want !== '' && it.tagsLower.indexOf(want) === -1) return false;
      return matches(it, tokens);
    }).sort(function (a, b) {
      if (a.date === b.date) return a.title.localeCompare(b.title);
      return a.date < b.date ? 1 : -1;
    });
  }

  /* '2026-09-12' -> '12 sep 2026' (handmatig, geen tijdzone-risico) */
  function fmtDate(iso) {
    var p = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso);
    if (!p) return iso;
    var maand = MAANDEN[parseInt(p[2], 10) - 1] || p[2];
    return parseInt(p[3], 10) + ' ' + maand + ' ' + p[1];
  }

  /* Spelling van een tag zoals die in de index staat, of '' als hij niet bestaat. */
  function resolveTag(items, tag) {
    var want = normTag(tag);
    if (want === '') return '';
    for (var i = 0; i < items.length; i++) {
      for (var j = 0; j < items[i].tags.length; j++) {
        if (items[i].tagsLower[j] === want) return items[i].tags[j];
      }
    }
    return '';
  }

  /* Meest gebruikte tags eerst, dan alfabetisch. 'exclude' laat de actieve
     tagfilter weg, zodat een leeg resultaat alternatieven voorstelt. */
  function popularTags(items, limit, exclude) {
    var skip = normTag(exclude);
    var counts = Object.create(null);
    var keys = [];
    items.forEach(function (it) {
      it.tags.forEach(function (t, i) {
        var key = it.tagsLower[i];
        if (key === skip) return;
        if (!(key in counts)) { counts[key] = { label: it.tags[i], n: 0 }; keys.push(key); }
        counts[key].n++;
      });
    });
    var sorted = keys.map(function (k) { return counts[k]; }).sort(function (a, b) {
      if (a.n !== b.n) return b.n - a.n;
      return a.label.localeCompare(b.label);
    });
    if (typeof limit === 'number' && limit > 0) sorted = sorted.slice(0, limit);
    return sorted.map(function (t) { return t.label; });
  }

  /* Toelichting bij een lege lijst: benoem wat er niet gevonden is. */
  function emptyMessage(state, total) {
    var s = state || {};
    if (total === 0) return 'De index is nog leeg.';
    if (String(s.q || '').trim() !== '') return 'Geen resultaten voor "' + String(s.q).trim() + '".';
    if (normTag(s.tag) !== '') return 'Geen artikelen met de tag "' + s.tag + '".';
    if (s.type && s.type !== 'alles') return 'Geen artikelen in deze categorie.';
    return 'Geen resultaten.';
  }

  function readState() {
    var state = { type: 'alles', q: '', tag: '' };
    if (typeof location !== 'undefined' && location.search) {
      var params = new URLSearchParams(location.search);
      var t = params.get('type');
      if (t === 'kennis' || t === 'blog') state.type = t;
      state.q = params.get('q') || '';
      state.tag = params.get('tag') || '';
    }
    return state;
  }

  function el(tag, cls, text) {
    var node = document.createElement(tag);
    if (cls) node.className = cls;
    if (text != null) node.textContent = text;
    return node;
  }

  function tagButton(tag, cls) {
    var b = el('button', cls || 'tag', tag);
    b.type = 'button';
    b.dataset.tag = tag;
    b.title = 'filter: ' + tag;
    return b;
  }

  function itemNode(it) {
    var li = el('li', 'item');

    var head = el('div', 'item-head');
    head.appendChild(el('span', 'badge badge-' + it.type, TYPE_LABEL[it.type]));
    var a = el('a', 'item-title', it.title);
    a.href = it.url;
    head.appendChild(a);
    li.appendChild(head);

    if (it.summary) li.appendChild(el('p', 'item-summary', it.summary));

    var meta = el('p', 'item-meta');
    var tijd = el('time', null, fmtDate(it.date));
    tijd.dateTime = it.date;
    meta.appendChild(tijd);
    if (it.updated && it.updated !== it.date) {
      meta.appendChild(el('span', 'sep', '·'));
      var bij = el('time', null, 'bijgewerkt ' + fmtDate(it.updated));
      bij.dateTime = it.updated;
      meta.appendChild(bij);
    }
    if (it.minutes) {
      meta.appendChild(el('span', 'sep', '·'));
      meta.appendChild(el('span', null, it.minutes + ' min'));
    }
    if (it.tags.length) {
      meta.appendChild(el('span', 'sep', '·'));
      var wrap = el('span', 'item-tags');
      it.tags.forEach(function (t) { wrap.appendChild(tagButton(t)); });
      meta.appendChild(wrap);
    }
    if (it.repo) {
      meta.appendChild(el('span', 'sep', '·'));
      var repo = el('a', 'item-repo', 'code ↗');
      repo.href = it.repo;
      repo.rel = 'noopener';
      repo.title = 'Broncode van dit artikel';
      meta.appendChild(repo);
    }
    li.appendChild(meta);
    return li;
  }

  function init() {
    var items = loadIndex(typeof window !== 'undefined' ? window.BRAINDEV_INDEX : null);

    var input = document.getElementById('q');
    var clearBtn = document.getElementById('q-clear');
    var hint = document.getElementById('q-hint');
    var searchBox = document.querySelector('.search');
    var results = document.getElementById('results');
    var count = document.getElementById('count');
    var empty = document.getElementById('empty');
    var emptyText = document.getElementById('empty-text');
    var emptyTags = document.getElementById('empty-tags');
    var tagbar = document.getElementById('tagbar');
    var pills = Array.prototype.slice.call(document.querySelectorAll('[data-filter]'));
    var navLinks = Array.prototype.slice.call(document.querySelectorAll('.site-nav [data-type]'));

    if (!results) return;

    var state = readState();
    state.tag = resolveTag(items, state.tag);
    if (input) input.value = state.q;

    /* tag-pills: de meest gebruikte tags uit de index */
    var tagPills = [];
    var topTags = popularTags(items, TAGBAR_MAX);
    if (tagbar && topTags.length > 1) {
      topTags.forEach(function (t) {
        var b = tagButton(t, 'pill');
        tagbar.appendChild(b);
        tagPills.push(b);
      });
      tagbar.hidden = false;
    }

    function syncUrl() {
      var params = new URLSearchParams();
      if (state.type !== 'alles') params.set('type', state.type);
      if (state.q.trim() !== '') params.set('q', state.q.trim());
      if (state.tag !== '') params.set('tag', state.tag);
      var qs = params.toString();
      try {
        history.replaceState(null, '', location.pathname + (qs ? '?' + qs : ''));
      } catch (e) {
        /* file:// of oude browser: zoeken blijft werken, URL wordt niet bijgewerkt */
      }
    }

    function renderEmpty() {
      if (emptyText) emptyText.textContent = emptyMessage(state, items.length);
      if (!emptyTags) return;
      emptyTags.textContent = '';
      var suggest = items.length ? popularTags(items, SUGGEST_MAX, state.tag) : [];
      if (suggest.length === 0) { emptyTags.hidden = true; return; }
      emptyTags.hidden = false;
      emptyTags.appendChild(el('span', 'empty-label', 'tags:'));
      suggest.forEach(function (t) { emptyTags.appendChild(tagButton(t)); });
      if (state.q.trim() !== '' || state.tag !== '' || state.type !== 'alles') {
        var reset = el('button', 'reset', 'wis filters');
        reset.type = 'button';
        emptyTags.appendChild(reset);
      }
    }

    function render() {
      var list = filter(items, state.type, state.q, state.tag);

      results.textContent = '';
      var frag = document.createDocumentFragment();
      list.forEach(function (it) { frag.appendChild(itemNode(it)); });
      results.appendChild(frag);

      count.textContent = list.length + (list.length === 1 ? ' resultaat' : ' resultaten');
      empty.hidden = list.length !== 0;
      if (list.length === 0) renderEmpty();

      pills.forEach(function (b) {
        var on = b.dataset.filter === state.type;
        b.classList.toggle('is-active', on);
        b.setAttribute('aria-pressed', on ? 'true' : 'false');
      });
      tagPills.forEach(function (b) {
        var on = state.tag !== '' && normTag(b.dataset.tag) === normTag(state.tag);
        b.classList.toggle('is-active', on);
        b.setAttribute('aria-pressed', on ? 'true' : 'false');
      });
      navLinks.forEach(function (a) {
        a.classList.toggle('is-active', a.dataset.type === state.type);
      });

      var hasQuery = state.q.trim() !== '';
      if (clearBtn) clearBtn.hidden = !hasQuery;
      if (hint) hint.textContent = hasQuery ? 'Esc' : '/';
      if (searchBox) searchBox.classList.toggle('has-query', hasQuery);

      syncUrl();
    }

    /* Tag aanklikken (in een item, in de tagbalk of als suggestie) filtert op
       die tag; nogmaals klikken heft het filter op. */
    function applyTag(tag) {
      var next = resolveTag(items, tag);
      state.tag = (next !== '' && normTag(next) === normTag(state.tag)) ? '' : next;
      state.q = '';
      if (input) { input.value = ''; }
      render();
    }

    function resetFilters() {
      state.type = 'alles';
      state.tag = '';
      state.q = '';
      if (input) input.value = '';
      render();
    }

    if (input) {
      input.addEventListener('input', function () {
        state.q = input.value;
        render();
      });
      /* Esc: eerst de zoekopdracht wissen, anders het veld verlaten */
      input.addEventListener('keydown', function (e) {
        if (e.key !== 'Escape') return;
        if (input.value !== '') {
          input.value = '';
          state.q = '';
          render();
        } else {
          input.blur();
        }
      });
    }

    if (clearBtn) {
      clearBtn.addEventListener('click', function () {
        if (input) { input.value = ''; input.focus(); }
        state.q = '';
        render();
      });
    }

    pills.forEach(function (b) {
      b.addEventListener('click', function () {
        state.type = b.dataset.filter;
        render();
      });
    });

    /* "/" focust de zoekbalk, mits je niet al in een invoerveld zit */
    document.addEventListener('keydown', function (e) {
      if (e.key !== '/' || !input) return;
      var t = e.target;
      if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.isContentEditable)) return;
      e.preventDefault();
      input.focus();
      input.select();
    });

    document.addEventListener('click', function (e) {
      var t = e.target;
      if (!t || !t.closest) return;
      var tag = t.closest('[data-tag]');
      if (tag) { applyTag(tag.dataset.tag); return; }
      if (t.closest('.reset')) resetFilters();
    });

    /* statistiekregel bovenaan het overzicht (uit de index, dus altijd actueel) */
    var stats = document.getElementById('tagline-stats');
    if (stats && items.length) {
      var nieuwste = items.reduce(function (m, it) {
        return it.updated > m ? it.updated : (it.date > m ? it.date : m);
      }, '');
      stats.textContent = items.length + (items.length === 1 ? ' artikel' : ' artikelen') +
        ' · laatst bijgewerkt ' + fmtDate(nieuwste);
    }

    render();
  }

  var api = {
    loadIndex: loadIndex,
    normalize: normalize,
    tokenize: tokenize,
    filter: filter,
    fmtDate: fmtDate,
    resolveTag: resolveTag,
    popularTags: popularTags,
    emptyMessage: emptyMessage
  };

  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  if (typeof document !== 'undefined' && document.getElementById('results')) init();
})();
