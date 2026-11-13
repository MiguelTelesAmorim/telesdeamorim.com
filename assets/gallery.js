/* Photo galleries for telesdeamorim.com: fade-in on load and a keyboard/swipe lightbox.
   Every photo is a plain link to the full-size image, so the page works without this script. */
(function () {
  document.documentElement.classList.add('js');

  var thumbs = document.querySelectorAll('.ph img');
  Array.prototype.forEach.call(thumbs, function (img) {
    if (img.complete) return;
    img.classList.add('loading');
    var done = function () { img.classList.remove('loading'); };
    img.addEventListener('load', done, { once: true });
    img.addEventListener('error', done, { once: true });
  });

  // find a city or place: filters the A to Z list as you type (accents and case ignored)
  var q = document.getElementById('az-q');
  if (q) {
    var fold = function (s) { return s.normalize ? s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase() : s.toLowerCase(); };
    var details = q.closest('details');
    var groups = Array.prototype.slice.call(document.querySelectorAll('.az-group'));
    var none = document.getElementById('az-none');
    var rows = [];
    groups.forEach(function (g) {
      Array.prototype.forEach.call(g.querySelectorAll('li'), function (li) { rows.push({ li: li, g: g, t: fold(li.textContent) }); });
    });
    q.addEventListener('input', function () {
      var v = fold(q.value.trim());
      if (v && details && !details.open) details.open = true;
      var shown = new Map(), any = false;
      rows.forEach(function (r) {
        var hit = !v || r.t.indexOf(v) !== -1;
        r.li.hidden = !hit;
        if (hit) { shown.set(r.g, true); any = true; }
      });
      groups.forEach(function (g) { g.hidden = !shown.has(g); });
      if (none) none.hidden = any;
    });
  }

  var links = Array.prototype.slice.call(document.querySelectorAll('a.ph'));
  var dlg = document.getElementById('lightbox');
  if (!dlg || !links.length || typeof dlg.showModal !== 'function') return;

  var img = dlg.querySelector('.lb-stage img');
  var cap = dlg.querySelector('.lb-caption');
  var meta = dlg.querySelector('.lb-meta');
  var count = dlg.querySelector('.lb-count');
  var where = dlg.querySelector('.lb-where');
  var current = 0;

  function preload(n) {
    var a = links[(n + links.length) % links.length];
    var p = new Image();
    p.src = a.href;
  }

  function show(n) {
    current = (n + links.length) % links.length;
    var a = links[current];
    var thumb = a.querySelector('img');
    img.src = a.href;
    img.alt = thumb ? thumb.alt : '';
    cap.textContent = a.getAttribute('data-caption') || img.alt;
    meta.textContent = a.getAttribute('data-meta') || '';
    where.textContent = a.getAttribute('data-where') || '';
    count.textContent = (current + 1) + ' / ' + links.length;
    preload(current + 1);
    preload(current - 1);
    // a shareable address for the photo on screen: #photo=<section>/<number>
    var id = photoId(a);
    if (id && window.history && history.replaceState) history.replaceState(null, '', '#photo=' + id);
  }

  function photoId(a) {
    var m = /photos\/([^\/]+\/\d+)\.jpg$/.exec(a.getAttribute('href') || '');
    return m ? m[1] : '';
  }
  var hashBefore = '';
  function open(n) {
    if (!dlg.open) hashBefore = /^#photo=/.test(location.hash) ? '' : location.hash;
    show(n);
    if (!dlg.open) dlg.showModal();
  }
  dlg.addEventListener('close', function () {
    if (window.history && history.replaceState) history.replaceState(null, '', location.pathname + location.search + hashBefore);
  });

  links.forEach(function (a, n) {
    a.addEventListener('click', function (e) {
      if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) return;
      e.preventDefault();
      open(n);
    });
  });

  // arriving on a #photo= address opens that photo
  var m0 = /^#photo=([^\/]+\/\d+)$/.exec(location.hash);
  if (m0) {
    for (var k = 0; k < links.length; k++) {
      if (photoId(links[k]) === m0[1]) {
        var at = links[k];
        if (at.scrollIntoView) at.scrollIntoView({ block: 'center' });
        open(k);
        break;
      }
    }
  }

  // landmark links open the lightbox on the photograph of that landmark
  var byHref = {};
  links.forEach(function (a, n) { byHref[a.getAttribute('href')] = n; });
  Array.prototype.forEach.call(document.querySelectorAll('a.lm-link'), function (a) {
    a.addEventListener('click', function (e) {
      if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) return;
      var n = byHref[a.getAttribute('href')];
      if (n === undefined) return;
      e.preventDefault();
      open(n);
    });
  });

  dlg.querySelector('.lb-prev').addEventListener('click', function () { show(current - 1); });
  dlg.querySelector('.lb-next').addEventListener('click', function () { show(current + 1); });
  dlg.querySelector('.lb-close').addEventListener('click', function () { dlg.close(); });
  dlg.addEventListener('keydown', function (e) {
    if (e.key === 'ArrowLeft') { e.preventDefault(); show(current - 1); }
    else if (e.key === 'ArrowRight') { e.preventDefault(); show(current + 1); }
  });
  dlg.addEventListener('click', function (e) {
    if (e.target === dlg || e.target.classList.contains('lb-stage')) dlg.close();
  });

  var x0 = null, y0 = null;
  dlg.addEventListener('touchstart', function (e) {
    x0 = e.touches[0].clientX;
    y0 = e.touches[0].clientY;
  }, { passive: true });
  dlg.addEventListener('touchend', function (e) {
    if (x0 === null) return;
    var dx = e.changedTouches[0].clientX - x0;
    var dy = e.changedTouches[0].clientY - y0;
    if (Math.abs(dx) > 40 && Math.abs(dx) > Math.abs(dy)) show(current + (dx < 0 ? 1 : -1));
    else if (dy > 90 && Math.abs(dy) > Math.abs(dx)) dlg.close();
    x0 = y0 = null;
  });
})();
