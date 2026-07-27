/* Página de indicadores: gráficas históricas y puntas de compra/venta.
   Fuentes sin llave de API:
   - TRM histórica: datos.gov.co (Socrata, dataset 32sa-8pi3 del Banco de la República)
   - Puntas del dólar spot: co.dolarapi.com (SetFX)
   - Oro (PAXG) y Bitcoin: CoinGecko
   - Acciones con listado en NYSE, Brent y S&P 500: Yahoo Finanzas vía la función
     Netlify /.netlify/functions/quote (solo funciona en el sitio publicado)   */
(function () {
  'use strict';

  function $(sel, root) { return (root || document).querySelector(sel); }
  function fmt(n, dec) {
    if (n == null || isNaN(n)) return '—';
    return Number(n).toLocaleString('es-CO', { minimumFractionDigits: dec == null ? 0 : dec, maximumFractionDigits: dec == null ? 2 : dec });
  }

  /* ---------- Gráfica de línea en SVG, sin dependencias ---------- */
  function dibujar(cont, puntos, opts) {
    opts = opts || {};
    if (!cont || !puntos || puntos.length < 2) {
      if (cont) cont.innerHTML = '<p class="ind-chart-vacia">' + (opts.vacio || 'Serie histórica no disponible por ahora.') + '</p>';
      return;
    }
    var W = 640, H = 240, PAD_L = 8, PAD_R = 8, PAD_T = 26, PAD_B = 26;
    var vals = puntos.map(function (p) { return p.v; });
    var min = Math.min.apply(null, vals), max = Math.max.apply(null, vals);
    if (min === max) { min -= 1; max += 1; }
    var span = max - min;
    min -= span * 0.06; max += span * 0.06;

    function x(i) { return PAD_L + (i / (puntos.length - 1)) * (W - PAD_L - PAD_R); }
    function y(v) { return PAD_T + (1 - (v - min) / (max - min)) * (H - PAD_T - PAD_B); }

    var d = '';
    for (var i = 0; i < puntos.length; i++) {
      d += (i === 0 ? 'M' : 'L') + x(i).toFixed(1) + ' ' + y(puntos[i].v).toFixed(1) + ' ';
    }
    var ult = puntos[puntos.length - 1];
    var pri = puntos[0];
    var sube = ult.v >= pri.v;
    var area = d + 'L' + x(puntos.length - 1).toFixed(1) + ' ' + (H - PAD_B) + ' L' + PAD_L + ' ' + (H - PAD_B) + ' Z';

    function fdate(t) {
      try {
        return new Intl.DateTimeFormat('es-CO', { day: 'numeric', month: 'short', year: '2-digit' }).format(new Date(t)).replace(/\./g, '');
      } catch (e) { return ''; }
    }

    var dec = (max - min) < 20 ? 2 : 0;
    cont.innerHTML =
      '<svg viewBox="0 0 ' + W + ' ' + H + '" role="img" aria-label="Serie histórica de ' + (opts.nombre || '') + '">' +
      '<path class="ind-area ' + (sube ? 'sube' : 'baja') + '" d="' + area + '"></path>' +
      '<path class="ind-linea ' + (sube ? 'sube' : 'baja') + '" d="' + d + '"></path>' +
      '<circle class="ind-punto" cx="' + x(puntos.length - 1).toFixed(1) + '" cy="' + y(ult.v).toFixed(1) + '" r="4"></circle>' +
      '<text class="ind-txt" x="' + PAD_L + '" y="14">' + fdate(pri.t) + ' → ' + fdate(ult.t) + (opts.unidad ? ' · ' + opts.unidad : '') + '</text>' +
      '<text class="ind-txt fuerte" x="' + (W - PAD_R) + '" y="14" text-anchor="end">' + fmt(ult.v, dec) + '</text>' +
      '<text class="ind-txt" x="' + PAD_L + '" y="' + (H - 8) + '">mín ' + fmt(Math.min.apply(null, vals), dec) + '</text>' +
      '<text class="ind-txt" x="' + (W - PAD_R) + '" y="' + (H - 8) + '" text-anchor="end">máx ' + fmt(Math.max.apply(null, vals), dec) + '</text>' +
      '</svg>' +
      (opts.leyenda ? '<p class="ind-chart-leyenda">' + opts.leyenda + '</p>' : '');
  }

  function jsonFetch(url) {
    return fetch(url).then(function (r) { return r.ok ? r.json() : Promise.reject(new Error('HTTP ' + r.status)); });
  }

  /* ---------- USD/COP: TRM histórica + puntas del spot ---------- */
  function cargarUsd(card) {
    var chart = $('[data-rol="chart"]', card);
    var puntas = $('[data-rol="puntas"]', card);

    jsonFetch('https://www.datos.gov.co/resource/32sa-8pi3.json?$select=vigenciadesde,valor&$order=vigenciadesde%20DESC&$limit=365')
      .then(function (rows) {
        var pts = rows.map(function (r) { return { t: r.vigenciadesde, v: parseFloat(r.valor) }; })
          .filter(function (p) { return !isNaN(p.v); })
          .reverse();
        dibujar(chart, pts, { nombre: 'USD/COP', unidad: 'TRM oficial', leyenda: 'Serie: TRM certificada por la Superfinanciera (Banco de la República · datos.gov.co).' });
      })
      .catch(function () { dibujar(chart, null, {}); });

    jsonFetch('https://co.dolarapi.com/v1/cotizaciones')
      .then(function (list) {
        var usd = null;
        for (var i = 0; i < list.length; i++) { if (list[i].moneda === 'USD') { usd = list[i]; break; } }
        if (!usd) return;
        var compra = parseFloat(usd.compra), venta = parseFloat(usd.venta), cierre = parseFloat(usd.ultimoCierre);
        var html = '';
        if (!isNaN(compra)) html += '<span class="ind-punta"><b>Punta compra</b> $' + fmt(compra, 2) + '</span>';
        if (!isNaN(venta)) html += '<span class="ind-punta"><b>Punta venta</b> $' + fmt(venta, 2) + '</span>';
        if (!isNaN(cierre)) html += '<span class="ind-punta cierre"><b>Último cierre</b> $' + fmt(cierre, 2) + '</span>';
        if (html) { puntas.innerHTML = html + '<span class="ind-punta-fuente">Dólar spot (SetFX) vía dolarapi.com</span>'; puntas.hidden = false; }
        if (!isNaN(cierre)) $('[data-rol="valor"]', card).textContent = '$' + fmt(cierre, 2);
      })
      .catch(function () {});
  }

  /* ---------- CoinGecko: oro (PAXG) y bitcoin ---------- */
  function cargarCoinGecko(card, id, nombre, leyenda) {
    var chart = $('[data-rol="chart"]', card);
    jsonFetch('https://api.coingecko.com/api/v3/coins/' + id + '/market_chart?vs_currency=usd&days=90')
      .then(function (j) {
        var pts = (j.prices || []).map(function (p) { return { t: p[0], v: p[1] }; });
        // Una muestra por día para aligerar la gráfica
        var porDia = [], visto = {};
        for (var i = 0; i < pts.length; i++) {
          var dia = new Date(pts[i].t).toISOString().slice(0, 10);
          if (!visto[dia]) { visto[dia] = true; porDia.push(pts[i]); }
        }
        dibujar(chart, porDia, { nombre: nombre, unidad: 'US$', leyenda: leyenda });
        // Es el mismo activo: el valor grande de la ficha se refresca en vivo
        if (pts.length) {
          var ultimo = pts[pts.length - 1].v;
          var elValor = $('[data-rol="valor"]', card);
          if (elValor && !isNaN(ultimo)) elValor.textContent = 'US$' + Math.round(ultimo).toLocaleString('es-CO');
        }
      })
      .catch(function () { dibujar(chart, null, {}); });
  }

  /* ---------- Yahoo Finanzas vía función Netlify ---------- */
  function cargarYahoo(card, simbolo) {
    var chart = $('[data-rol="chart"]', card);
    var fuente = $('[data-rol="fuente"]', card);
    var puntas = $('[data-rol="puntas"]', card);
    var esMismoActivo = card.getAttribute('data-yahoo-mismo') === '1';
    jsonFetch('/.netlify/functions/quote?symbol=' + encodeURIComponent(simbolo) + '&range=6mo')
      .then(function (j) {
        if (!j || !j.puntos || j.puntos.length < 2) throw new Error('sin datos');
        var pts = j.puntos.map(function (p) { return { t: p.t * 1000, v: p.v }; });
        var moneda = j.currency === 'USD' ? 'US$' : (j.currency === 'COP' ? '$' : (j.currency || ''));
        dibujar(chart, pts, {
          nombre: card.getAttribute('data-nombre'),
          unidad: moneda,
          leyenda: 'Serie: Yahoo Finanzas, últimos 6 meses (' + simbolo + ').'
        });
        // Último cierre real de la serie: se muestra como chip. El mercado
        // bursátil no publica puntas en este endpoint; cuando cierra, el dato
        // correcto es el cierre.
        var cierre = (j.precio != null && !isNaN(j.precio)) ? j.precio : pts[pts.length - 1].v;
        var dec = cierre < 1000 ? 2 : 0;
        if (puntas && !isNaN(cierre)) {
          puntas.innerHTML = '<span class="ind-punta cierre"><b>Último cierre ' + simbolo + '</b> ' + moneda + fmt(cierre, dec) + '</span>';
          puntas.hidden = false;
        }
        // Solo si la ficha y el símbolo son el mismo instrumento se actualiza
        // el valor grande (Tecnoglass, Brent, S&P 500). En Ecopetrol/Bancolombia
        // el valor es el cierre local en la BVC y la gráfica es el ADR.
        if (esMismoActivo && !isNaN(cierre)) {
          var elValor = $('[data-rol="valor"]', card);
          if (elValor) elValor.textContent = moneda + fmt(cierre, dec);
        }
        if (fuente) fuente.hidden = false;
      })
      .catch(function () {
        dibujar(chart, null, { vacio: 'No se pudo cargar la gráfica en este momento. El valor mostrado es el último cierre publicado por la redacción.' });
        if (fuente) fuente.hidden = false;
      });
  }

  /* ---------- Recorrido de fichas ---------- */
  var cards = document.querySelectorAll('.ind-card');
  for (var i = 0; i < cards.length; i++) {
    (function (card) {
      var vivo = card.getAttribute('data-vivo');
      var yahoo = card.getAttribute('data-yahoo');
      if (vivo === 'usd') cargarUsd(card);
      else if (vivo === 'oro') cargarCoinGecko(card, 'pax-gold', 'Oro (PAXG)', 'Serie: PAXG/CoinGecko (respaldado 1:1 por una onza troy), últimos 90 días.');
      else if (vivo === 'btc') cargarCoinGecko(card, 'bitcoin', 'Bitcoin', 'Serie: CoinGecko, últimos 90 días.');
      else if (yahoo) cargarYahoo(card, yahoo);
    })(cards[i]);
  }

  /* ---------- Resaltar la ficha a la que apunta el enlace ---------- */
  function resaltar() {
    var id = location.hash.replace('#', '');
    if (!id) return;
    var el = document.getElementById(id);
    if (!el || !el.classList || !el.classList.contains('ind-card')) return;
    var prev = document.querySelector('.ind-card.destacada');
    if (prev) prev.classList.remove('destacada');
    el.classList.add('destacada');
    el.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }
  window.addEventListener('hashchange', resaltar);
  // Al llegar desde la cinta, esperar al layout inicial
  window.setTimeout(resaltar, 150);
})();
