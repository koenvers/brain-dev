/* brain-dev — meting via GoatCounter (cookieloos, geen cookies, geen persoonsgegevens).
   Uitzetten: ACCOUNT leeg maken → er wordt niets geladen.
   Actief account: koenverschuren → https://koenverschuren.goatcounter.com/count
   Localhost- en file://-previews tellen nooit mee. */
(function () {
  'use strict';

  var ACCOUNT = 'koenverschuren';

  if (!ACCOUNT) return;
  if (/^(localhost|127\.0\.0\.1|\[::1\])$/.test(location.hostname)) return;
  if (location.protocol === 'file:') return;

  var s = document.createElement('script');
  s.setAttribute('data-goatcounter', 'https://' + ACCOUNT + '.goatcounter.com/count');
  s.async = true;
  s.src = 'https://gc.zgo.at/count.js';
  document.head.appendChild(s);
})();
