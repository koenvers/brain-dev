/* brain-dev — meting, pas activeren zodra het GoatCounter-account bestaat (zie README).
   Zolang ACCOUNT leeg is wordt er niets geladen: geen externe requests, geen cookies.
   Locale previews (localhost) tellen nooit mee. */
(function () {
  'use strict';

  var ACCOUNT = ''; /* bv. 'brain-dev' → https://brain-dev.goatcounter.com/count */

  if (!ACCOUNT) return;
  if (/^(localhost|127\.0\.0\.1|\[::1\])$/.test(location.hostname)) return;

  var s = document.createElement('script');
  s.setAttribute('data-goatcounter', 'https://' + ACCOUNT + '.goatcounter.com/count');
  s.async = true;
  s.src = '//gc.zgo.at/count.js';
  document.head.appendChild(s);
})();
