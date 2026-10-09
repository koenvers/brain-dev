/* brain-dev — overzicht, zoeken en filteren (client-side, dependency-vrij).
   Zoekindex: window.BRAINDEV_INDEX (content/index.js), geladen vóór dit script.
   Pure functies zijn via module.exports testbaar met node. */
(function () {
  'use strict';

  var TYPE_LABEL = { kennis: 'Kennis', blog: 'Blog' };
  var MAANDEN = ['jan', 'feb', 'mrt', 'apr', 'mei', 'jun', 'jul', 'aug', 'sep', 'okt', 'nov', 'dec'];

  function isPlainItem(it) {
    return !!it && typeof it === 'object' &&
      (it.type === 'kennis' || it.type === 'blog') &&
      typeof it.title === 'string' && it.title.trim() !== '' &&
      typeof it.url === 'string' && it.url !== '' &&
      typeof it.date === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(it.date);
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
      minutes: typeof it.minutes === 'number' && it.minutes > 0 ? it.minutes : null,
      tags: tags,
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

  function matches(item, tokens) {
    for (var i = 0; i < tokens.length; i++) {
      if (item.haystack.indexOf(tokens[i]) === -1) return false;
    }
    return true;
  }

  /* type: 'alles' | 'kennis' | 'blog'. Resultaat gesorteerd op datum, nieuw eerst. */
  function filter(items, type, query) {
    var tokens = tokenize(query);
    return items.filter(function (it) {
      return (type === 'alles' || it.type === type) && matches(it, tokens);
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

  function readState() {
    var type = 'alles';
    var q = '';
    if (typeof location !== 'undefined' && location.search) {
      var params = new URLSearchParams(location.search);
      var t = params.get('type');
      if (t === 'kennis' || t === 'blog') type = t;
      q = params.get('q') || '';
    }
    return { type: type, q: q };
  }

  function el(tag, cls, text) {
    var node = document.createElement(tag);
    if (cls) node.className = cls;
    if (text != null) node.textContent = text;
    return node;
  }

  function itemNode(it) {
    var li = el('li', 'item');

    var head = el('div', 'item-head');
    head.appendChild(el('span', 'badge badge-' + it.type, '[' + TYPE_LABEL[it.type] + ']'));
    var a = el('a', 'item-title', it.title);
    a.href = it.url;
    head.appendChild(a);
    li.appendChild(head);

    if (it.summary) li.appendChild(el('p', 'item-summary', it.summary));

    var meta = el('p', 'item-meta');
    meta.appendChild(el('span', null, fmtDate(it.date)));
    if (it.minutes) {
      meta.appendChild(el('span', null, '·'));
      meta.appendChild(el('span', null, it.minutes + ' min'));
    }
    if (it.tags.length) {
      meta.appendChild(el('span', null, '·'));
      var wrap = el('span', 'item-tags');
      it.tags.forEach(function (t) {
        var b = el('button', 'tag', t);
        b.type = 'button';
        b.title = 'Zoek op tag "' + t + '"';
        wrap.appendChild(b);
      });
      meta.appendChild(wrap);
    }
    li.appendChild(meta);
    return li;
  }

  function init() {
    var items = loadIndex(typeof window !== 'undefined' ? window.BRAINDEV_INDEX : null);

    var input = document.getElementById('q');
    var clearBtn = document.getElementById('q-clear');
    var hint = document.getElementById('q-hint');
    var results = document.getElementById('results');
    var count = document.getElementById('count');
    var empty = document.getElementById('empty');
    var pills = Array.prototype.slice.call(document.querySelectorAll('[data-filter]'));
    var navLinks = Array.prototype.slice.call(document.querySelectorAll('.site-nav [data-type]'));

    if (!results) return;

    var state = readState();
    if (input) input.value = state.q;

    function syncUrl() {
      var params = new URLSearchParams();
      if (state.type !== 'alles') params.set('type', state.type);
      if (state.q.trim() !== '') params.set('q', state.q.trim());
      var qs = params.toString();
      try {
        history.replaceState(null, '', location.pathname + (qs ? '?' + qs : ''));
      } catch (e) {
        /* file:// of oude browser: zoeken blijft werken, URL wordt niet bijgewerkt */
      }
    }

    function render() {
      var list = filter(items, state.type, state.q);

      results.textContent = '';
      var frag = document.createDocumentFragment();
      list.forEach(function (it) { frag.appendChild(itemNode(it)); });
      results.appendChild(frag);

      count.textContent = list.length + (list.length === 1 ? ' resultaat' : ' resultaten');
      empty.hidden = list.length !== 0;

      pills.forEach(function (b) {
        var on = b.dataset.filter === state.type;
        b.classList.toggle('is-active', on);
        b.setAttribute('aria-pressed', on ? 'true' : 'false');
      });
      navLinks.forEach(function (a) {
        a.classList.toggle('is-active', a.dataset.type === state.type);
      });

      var hasQuery = state.q.trim() !== '';
      if (clearBtn) clearBtn.hidden = !hasQuery;
      if (hint) hint.hidden = hasQuery;

      syncUrl();
    }

    if (input) {
      input.addEventListener('input', function () {
        state.q = input.value;
        render();
      });
      input.addEventListener('keydown', function (e) {
        if (e.key === 'Escape' && input.value !== '') {
          input.value = '';
          state.q = '';
          render();
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

    /* Tag klikken = zoeken op die tag */
    results.addEventListener('click', function (e) {
      var tag = e.target && e.target.closest ? e.target.closest('.tag') : null;
      if (!tag || !results.contains(tag)) return;
      state.q = tag.textContent;
      if (input) { input.value = state.q; input.focus(); }
      render();
    });

    /* statistiekregel bovenaan het overzicht (uit de index, dus altijd actueel) */
    var stats = document.getElementById('tagline-stats');
    if (stats && items.length) {
      var nieuwste = items.reduce(function (m, it) { return it.date > m ? it.date : m; }, '');
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
    fmtDate: fmtDate
  };

  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  if (typeof document !== 'undefined' && document.getElementById('results')) init();
})();
