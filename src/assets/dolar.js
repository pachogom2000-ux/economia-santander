/* Convertidor de dólares y gráfica de la TRM.
   Fuentes sin llave de API:
   - TRM oficial e histórico: datos.gov.co (dataset 32sa-8pi3 del Banco de la República)
   - Puntas de compra y venta del spot: co.dolarapi.com (SetFX)              */
(function () {
  'use strict';

  var trm = null;               // tasa vigente para convertir
  var editando = false;         // evita el eco entre los dos campos

  function $(sel) { return document.querySelector(sel); }
  function rol(nombre) { return document.querySelector('[data-rol="' + nombre + '"]'); }
  function fmt(n, dec) {
    if (n == null || isNaN(n)) return '—';
    return Number(n).toLocaleString('es-CO', {
      minimumFractionDigits: dec == null ? 0 : dec,
      maximumFractionDigits: dec == null ? 0 : dec
    });
  }
  // Acepta "1.234,56" y "1234.56"; devuelve número o NaN
  function parsear(txt) {
    if (!txt) return NaN;
    var s = String(txt).replace(/\s/g, '').replace(/[^\d.,-]/g, '');
    if (s.indexOf(',') > -1) { s = s.replace(/\./g, '').replace(',', '.'); }
    else if ((s.match(/\./g) || []).length > 1) { s = s.replace(/\./g, ''); }
    return parseFloat(s);
  }

  /* ---------- Convertidor ---------- */
  var elUsd = $('#conv-usd');
  var elCop = $('#conv-cop');

  function desdeUsd() {
    if (editando || trm == null) return;
    var v = parsear(elUsd.value);
    editando = true;
    elCop.value = isNaN(v) ? '' : fmt(v * trm, 0);
    editando = false;
    pintarRemesas();
  }
  function desdeCop() {
    if (editando || trm == null) return;
    var v = parsear(elCop.value);
    editando = true;
    elUsd.value = isNaN(v) ? '' : fmt(v / trm, 2);
    editando = false;
  }
  if (elUsd) elUsd.addEventListener('input', desdeUsd);
  if (elCop) elCop.addEventListener('input', desdeCop);

  var chips = document.querySelectorAll('.conv-chip');
  for (var c = 0; c < chips.length; c++) {
    (function (btn) {
      btn.addEventListener('click', function () {
        if (!elUsd) return;
        elUsd.value = fmt(parseFloat(btn.getAttribute('data-usd')), 0);
        desdeUsd();
        elUsd.focus();
      });
    })(chips[c]);
  }

  function pintarRemesas() {
    var cuerpo = rol('remesas');
    if (!cuerpo || trm == null) return;
    var montos = [100, 200, 500];
    var html = '';
    for (var i = 0; i < montos.length; i++) {
      var bruto = montos[i] * trm;
      html += '<tr><td>US$' + fmt(montos[i], 0) + '</td><td><b>$' + fmt(bruto, 0) +
        '</b></td><td>$' + fmt(bruto * 0.98, 0) + '</td></tr>';
    }
    cuerpo.innerHTML = html;
  }

  /* ---------- Gráfica de la TRM (SVG a mano) ---------- */
  function dibujar(cont, puntos) {
    if (!cont) return;
    if (!puntos || puntos.length < 2) {
      cont.innerHTML = '<p class="ind-chart-vacia">No se pudo cargar la serie histórica en este momento.</p>';
      return;
    }
    var W = 640, H = 220, PL = 8, PR = 8, PT = 24, PB = 24;
    var vals = puntos.map(function (p) { return p.v; });
    var min = Math.min.apply(null, vals), max = Math.max.apply(null, vals);
    if (min === max) { min -= 1; max += 1; }
    var span = max - min;
    min -= span * 0.08; max += span * 0.08;

    function x(i) { return PL + (i / (puntos.length - 1)) * (W - PL - PR); }
    function y(v) { return PT + (1 - (v - min) / (max - min)) * (H - PT - PB); }

    var d = '';
    for (var i = 0; i < puntos.length; i++) {
      d += (i === 0 ? 'M' : 'L') + x(i).toFixed(1) + ' ' + y(puntos[i].v).toFixed(1) + ' ';
    }
    var pri = puntos[0], ult = puntos[puntos.length - 1];
    var sube = ult.v >= pri.v;
    var area = d + 'L' + x(puntos.length - 1).toFixed(1) + ' ' + (H - PB) + ' L' + PL + ' ' + (H - PB) + ' Z';

    function fecha(t) {
      try {
        return new Intl.DateTimeFormat('es-CO', { month: 'short', year: '2-digit' })
          .format(new Date(t)).replace(/\./g, '');
      } catch (e) { return ''; }
    }

    cont.innerHTML =
      '<svg viewBox="0 0 ' + W + ' ' + H + '" role="img" aria-label="Gráfica de la TRM del último año">' +
      '<path class="ind-area ' + (sube ? 'sube' : 'baja') + '" d="' + area + '"></path>' +
      '<path class="ind-linea ' + (sube ? 'sube' : 'baja') + '" d="' + d + '"></path>' +
      '<circle class="ind-punto" cx="' + x(puntos.length - 1).toFixed(1) + '" cy="' + y(ult.v).toFixed(1) + '" r="4"></circle>' +
      '<text class="ind-txt" x="' + PL + '" y="14">' + fecha(pri.t) + '</text>' +
      '<text class="ind-txt fuerte" x="' + (W - PR) + '" y="14" text-anchor="end">$' + fmt(ult.v, 2) + '</text>' +
      '<text class="ind-txt" x="' + PL + '" y="' + (H - 6) + '">mín $' + fmt(Math.min.apply(null, vals), 0) + '</text>' +
      '<text class="ind-txt" x="' + (W - PR) + '" y="' + (H - 6) + '" text-anchor="end">máx $' + fmt(Math.max.apply(null, vals), 0) + '</text>' +
      '</svg>';
  }

  function variacion(actual, antes) {
    if (antes == null || isNaN(antes) || !antes) return '—';
    var pct = ((actual - antes) / antes) * 100;
    var signo = pct >= 0 ? '▲ ' : '▼ ';
    return signo + fmt(Math.abs(pct), 2) + '%';
  }

  // Fecha de hoy en Colombia, como 'AAAA-MM-DD'
  function hoyBogota() {
    try {
      var p = new Intl.DateTimeFormat('en-CA', {
        timeZone: 'America/Bogota', year: 'numeric', month: '2-digit', day: '2-digit'
      }).format(new Date());
      return p;   // en-CA ya entrega AAAA-MM-DD
    } catch (e) { return new Date().toISOString().slice(0, 10); }
  }
  function dia(iso) { return String(iso || '').slice(0, 10); }
  function fechaLarga(iso) {
    try {
      // Se parte la fecha a mano: 'AAAA-MM-DD' con new Date() se interpreta
      // como UTC y en Colombia mostraría el día anterior.
      var t = dia(iso).split('-');
      return new Intl.DateTimeFormat('es-CO', { day: 'numeric', month: 'long', year: 'numeric' })
        .format(new Date(Number(t[0]), Number(t[1]) - 1, Number(t[2])));
    } catch (e) { return ''; }
  }

  /* ---------- Carga de datos ---------- */
  fetch('https://www.datos.gov.co/resource/32sa-8pi3.json?$select=vigenciadesde,valor&$order=vigenciadesde%20DESC&$limit=370')
    .then(function (r) { return r.ok ? r.json() : Promise.reject(new Error('http')); })
    .then(function (filas) {
      var serie = filas.map(function (f) { return { t: f.vigenciadesde, v: parseFloat(f.valor) }; })
        .filter(function (p) { return !isNaN(p.v); })
        .reverse();
      if (!serie.length) throw new Error('vacío');

      // El Banco de la República publica la TRM del día siguiente, así que la
      // última fila de la serie suele ser la de mañana: para "hoy" hay que
      // tomar la última cuya vigencia ya empezó.
      var hoy = hoyBogota();
      var iHoy = -1;
      for (var k = serie.length - 1; k >= 0; k--) {
        if (dia(serie[k].t) <= hoy) { iHoy = k; break; }
      }
      if (iHoy < 0) iHoy = serie.length - 1;
      var vigente = serie[iHoy];
      var manana = (iHoy < serie.length - 1) ? serie[serie.length - 1] : null;
      trm = vigente.v;

      var elTrm = rol('trm');
      if (elTrm) elTrm.textContent = '$' + fmt(trm, 2);

      var elFecha = rol('trm-fecha');
      if (elFecha) {
        // La TRM del viernes cubre el fin de semana, así que lo útil para el
        // lector no es la fecha del registro sino que rige HOY.
        var texto = 'Rige hoy, ' + fechaLarga(hoy) + ' · Banco de la República';
        if (manana) {
          texto += '. Desde el ' + fechaLarga(manana.t) + ' regirá $' + fmt(manana.v, 2) + '.';
        }
        elFecha.textContent = texto;
      }

      // Variación frente al dato anterior de la serie
      if (iHoy > 0) {
        var previo = serie[iHoy - 1].v;
        var dif = trm - previo;
        var elVar = rol('trm-var');
        if (elVar) {
          elVar.textContent = (dif >= 0 ? '▲ ' : '▼ ') + '$' + fmt(Math.abs(dif), 2) + ' frente al dato anterior';
          elVar.className = 'dolar-variacion ' + (dif >= 0 ? 'up' : 'down');
        }
      }

      dibujar(rol('chart'), serie);

      // Comparativos, siempre contra la TRM vigente hoy
      var vals = serie.map(function (p) { return p.v; });
      var hace30 = iHoy > 30 ? serie[iHoy - 30].v : null;
      var hace365 = serie[0].v;
      var cm = rol('comp-mes'), ca = rol('comp-anio'), cx = rol('comp-max'), cn = rol('comp-min');
      if (cm) cm.textContent = variacion(trm, hace30);
      if (ca) ca.textContent = variacion(trm, hace365);
      if (cx) cx.textContent = '$' + fmt(Math.max.apply(null, vals), 0);
      if (cn) cn.textContent = '$' + fmt(Math.min.apply(null, vals), 0);

      // Con la tasa lista, llenar el convertidor y la tabla de remesas
      desdeUsd();
      pintarRemesas();
    })
    .catch(function () {
      var elTrm = rol('trm');
      if (elTrm) elTrm.textContent = 'No disponible';
      var elFecha = rol('trm-fecha');
      if (elFecha) elFecha.textContent = 'No pudimos consultar la TRM en este momento. Intenta de nuevo en unos minutos.';
      dibujar(rol('chart'), null);
    });

  /* ---------- Puntas del mercado spot ---------- */
  fetch('https://co.dolarapi.com/v1/cotizaciones')
    .then(function (r) { return r.ok ? r.json() : Promise.reject(new Error('http')); })
    .then(function (lista) {
      var usd = null;
      for (var i = 0; i < lista.length; i++) { if (lista[i].moneda === 'USD') { usd = lista[i]; break; } }
      if (!usd) return;
      var compra = parseFloat(usd.compra), venta = parseFloat(usd.venta), cierre = parseFloat(usd.ultimoCierre);
      var elC = rol('compra'), elV = rol('venta'), elN = rol('spot-nota');
      if (elC && !isNaN(compra)) elC.textContent = '$' + fmt(compra, 2);
      if (elV && !isNaN(venta)) elV.textContent = '$' + fmt(venta, 2);
      if (elN) {
        var partes = [];
        if (!isNaN(cierre)) partes.push('Último cierre $' + fmt(cierre, 2));
        try {
          partes.push(new Intl.DateTimeFormat('es-CO', {
            day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit', timeZone: 'America/Bogota'
          }).format(new Date(usd.fechaActualizacion)));
        } catch (e) {}
        elN.textContent = partes.join(' · ') + ' · fuente: SetFX vía dolarapi.com';
      }
    })
    .catch(function () {
      var elN = rol('spot-nota');
      if (elN) elN.textContent = 'El mercado spot no respondió. La conversión usa la TRM oficial.';
    });
})();
