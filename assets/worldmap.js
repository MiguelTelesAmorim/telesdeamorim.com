/* World map for the travel page: visited countries in the accent colour, airport stopovers hatched,
   and a pin for every city and place.
   Draws from the Natural Earth 110m outlines in world-atlas; if anything fails to load, the map is removed. */
(function () {
  var fig = document.getElementById('worldmap');
  if (!fig) return;
  var dataEl = document.getElementById('map-data');
  var NS = 'http://www.w3.org/2000/svg';

  function fail() { if (fig.parentNode) fig.parentNode.removeChild(fig); }
  if (!window.d3 || !window.d3.geoPath || !window.topojson || !dataEl || !window.fetch) { fail(); return; }

  var data = JSON.parse(dataEl.textContent);

  function el(name, attrs) {
    var n = document.createElementNS(NS, name);
    for (var k in attrs) n.setAttribute(k, attrs[k]);
    return n;
  }
  function titled(node, text) {
    var t = document.createElementNS(NS, 'title');
    t.textContent = text;
    node.appendChild(t);
    return node;
  }
  function link(v) { return titled(el('a', { href: '#' + v.slug }), v.country); }

  function draw(topo) {
    var byIso = {}, byName = {}, transit = {};
    data.visited.forEach(function (v) {
      if (v.iso > 0) byIso[v.iso] = v;
      if (v.mapName) byName[v.mapName] = v;
    });
    data.transit.forEach(function (t) { transit[t.iso] = t; });

    var features = window.topojson.feature(topo, topo.objects.countries).features.filter(function (f) {
      return f.properties.name !== 'Antarctica';
    });
    var W = 960, H = 470;
    var projection = window.d3.geoEqualEarth().fitExtent([[2, 2], [W - 2, H - 2]], { type: 'FeatureCollection', features: features });
    var path = window.d3.geoPath(projection);

    var svg = el('svg', { viewBox: '0 0 ' + W + ' ' + H, role: 'img', 'aria-label': fig.getAttribute('data-label') || 'World map' });
    var defs = el('defs', {});
    var pattern = el('pattern', { id: 'hatch', width: '5', height: '5', patternUnits: 'userSpaceOnUse', patternTransform: 'rotate(45)' });
    pattern.appendChild(el('rect', { 'class': 'hatch-bg', width: '5', height: '5' }));
    pattern.appendChild(el('line', { 'class': 'hatch-line', x1: '0', y1: '0', x2: '0', y2: '5' }));
    defs.appendChild(pattern);
    svg.appendChild(defs);

    var base = el('g', {}), hot = el('g', {});
    features.forEach(function (f) {
      var d = path(f);
      if (!d) return;
      var iso = +f.id;
      var v = byIso[iso] || byName[f.properties.name];
      var t = transit[iso];
      if (v) {
        var a = link(v);
        a.appendChild(el('path', { d: d, 'class': 'visited' }));
        hot.appendChild(a);
      } else if (t) {
        base.appendChild(titled(el('path', { d: d, 'class': 'transit' }), t.country + ', passed through'));
      } else {
        base.appendChild(el('path', { d: d, 'class': 'land' }));
      }
    });
    svg.appendChild(base);
    svg.appendChild(hot);

    data.visited.forEach(function (v) {
      if (!v.dot) return;
      var xy = projection([v.lon, v.lat]);
      if (!xy) return;
      var a = link(v);
      a.appendChild(el('circle', { cx: xy[0].toFixed(1), cy: xy[1].toFixed(1), r: '3.6', 'class': 'dot' }));
      svg.appendChild(a);
    });

    // every city and place in the pages, as a small pin that jumps to its section
    var pins = el('g', {});
    (data.places || []).forEach(function (p) {
      var xy = projection([p.lon, p.lat]);
      if (!xy) return;
      var a = titled(el('a', { href: '#' + p.anchor }), p.name + ', ' + p.country);
      a.appendChild(el('circle', { cx: xy[0].toFixed(1), cy: xy[1].toFixed(1), r: '1.7', 'class': 'city' }));
      pins.appendChild(a);
    });
    svg.appendChild(pins);

    fig.querySelector('.map-canvas').appendChild(svg);
    fig.classList.add('ready');
  }

  fetch('https://cdn.jsdelivr.net/npm/world-atlas@2.0.2/countries-110m.json')
    .then(function (r) { if (!r.ok) throw new Error('HTTP ' + r.status); return r.json(); })
    .then(draw)
    .catch(fail);
})();
