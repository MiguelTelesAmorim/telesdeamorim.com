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
  }

  links.forEach(function (a, n) {
    a.addEventListener('click', function (e) {
      if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) return;
      e.preventDefault();
      show(n);
      dlg.showModal();
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
