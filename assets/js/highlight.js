/* brain-dev — mini syntax-highlighter voor codeblokken.
   Commentaar, strings, getallen en sleutelwoorden. Geen dependencies.
   Tokeniseert rijke tekst, escapt elk stuk afzonderlijk: geen HTML-injectie.
   Beperking (bewust): geen contextgevoelige verwerking, geen nested templates. */
(function () {
  'use strict';

  var KEYWORDS = {
    js: 'const let var function return if else for of in import from export default class new await async try catch throw typeof instanceof null undefined true false this yield static get set extends super delete void',
    python: 'def class return if elif else for while import from as with try except finally raise None True False lambda yield async await in not and or is pass break continue global nonlocal',
    bash: 'if then else elif fi for in do done while case esac function return local export echo exit set unset read printf source cd true false',
    sql: 'select from where group by order limit insert into update set delete create table alter drop as on left right inner outer join and or not null distinct values primary key',
    json: '',
    css: ''
  };

  var RULES = {
    js: {
      comment: /\/\/.*$|\/\*[\s\S]*?\*\//,
      string: /"(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*'|`(?:\\.|[^`\\])*`/
    },
    python: {
      comment: /#.*/,
      string: /"""[\s\S]*?"""|'''[\s\S]*?'''|"(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*'/
    },
    bash: {
      comment: /#.*/,
      string: /"(?:\\.|[^"\\])*"|'[^']*'/
    },
    sql: {
      comment: /--.*$/,
      string: /'(?:''|[^'])*'/
    },
    css: {
      comment: /\/\*[\s\S]*?\*\//,
      string: /"[^"]*"|'[^']*'/
    },
    json: {
      comment: null,
      string: /"(?:\\.|[^"\\])*"/
    },
    text: { comment: null, string: null }
  };

  var ALIASES = { py: 'python', sh: 'shell', shell: 'bash', js: 'js', ts: 'js', jsx: 'js', tsx: 'js', yml: 'text', yaml: 'text' };

  function escapeHtml(s) {
    return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  function langOf(cls) {
    var m = /language-([\w-]+)/.exec(cls || '');
    var lang = m ? m[1].toLowerCase() : '';
    if (ALIASES[lang]) lang = ALIASES[lang];
    return RULES[lang] ? lang : 'text';
  }

  function buildRegex(lang) {
    var rules = RULES[lang];
    var parts = [];
    var groups = {};
    var g = 1;
    if (rules.comment) { groups.comment = g++; parts.push('(' + rules.comment.source + ')'); }
    if (rules.string) { groups.string = g++; parts.push('(' + rules.string.source + ')'); }
    groups.number = g++; parts.push('(\\b\\d+(?:\\.\\d+)?\\b)');
    groups.word = g++; parts.push('([A-Za-z_$][\\w$]*)');
    return { re: new RegExp(parts.join('|'), 'gm'), groups: groups };
  }

  function highlight(code, lang) {
    lang = RULES[lang] ? lang : 'text';
    var kwList = (KEYWORDS[lang] || '').split(' ').filter(Boolean);
    var kw = {};
    kwList.forEach(function (w) { kw[w] = true; });

    var b = buildRegex(lang);
    var out = '';
    var last = 0;
    var m;
    b.re.lastIndex = 0;

    while ((m = b.re.exec(code)) !== null) {
      out += escapeHtml(code.slice(last, m.index));
      var cls = null;
      if (m[b.groups.comment] !== undefined) cls = 'tok-com';
      else if (m[b.groups.string] !== undefined) cls = 'tok-str';
      else if (m[b.groups.number] !== undefined) cls = 'tok-num';
      else if (kw[m[b.groups.word].toLowerCase()]) cls = 'tok-kw';

      out += cls
        ? '<span class="' + cls + '">' + escapeHtml(m[0]) + '</span>'
        : escapeHtml(m[0]);
      last = m.index + m[0].length;
      if (m[0].length === 0) b.re.lastIndex++; /* defensive: one-char vooruit bij lege match */
    }
    out += escapeHtml(code.slice(last));
    return out;
  }

  function highlightAll(root) {
    if (typeof document === 'undefined') return;
    var nodes = (root || document).querySelectorAll('pre code');
    Array.prototype.forEach.call(nodes, function (node) {
      node.innerHTML = highlight(node.textContent, langOf(node.className));
    });
  }

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = { highlight: highlight, highlightAll: highlightAll, langOf: langOf };
  }
  if (typeof document !== 'undefined') {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', highlightAll);
    } else {
      highlightAll();
    }
  }
})();
