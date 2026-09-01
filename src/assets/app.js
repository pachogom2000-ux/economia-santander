// Comportamiento del sitio: cinta de indicadores, pico y placa, menú, criptos,
// galerías, barras de compartir y el aviso de cookies.
//
// Vivía en línea dentro de layout.njk —26 KB repartidos en tres bloques— y eso
// significaba volver a bajarlo entero en CADA página, porque el JavaScript en
// línea no se puede cachear ni diferir. Aquí, con huella en el nombre y un año
// de caché, se baja una sola vez.
//
// Se carga con defer, así que corre cuando el DOM ya está armado. Antes se
// ejecutaba al vuelo en mitad del documento, después de <main> y <footer>: el
// orden efectivo no cambia, pero ya no bloquea el parseo.
//
// Depende de window.__PICO_Y_PLACA__, que layout.njk sigue declarando en línea
// porque es un dato del build, no lógica.

// ---------------------------------------------------------------------
// 1. Cinta, pico y placa, menú, criptos y galerías
// ---------------------------------------------------------------------
  (function () {
    // ---------- utilidades ----------
    function each(sel, fn) {
      var nodes = document.querySelectorAll(sel);
      for (var i = 0; i < nodes.length; i++) { fn(nodes[i]); }
    }
    function fmtNum(n, dec) {
      return n.toLocaleString('es-CO', { minimumFractionDigits: dec, maximumFractionDigits: dec });
    }
    // Fecha de hoy en la zona horaria de Colombia, como objeto Date local
    function hoyBogota() {
      try {
        var p = new Intl.DateTimeFormat('en-US', {
          timeZone: 'America/Bogota', year: 'numeric', month: '2-digit', day: '2-digit'
        }).formatToParts(new Date());
        var o = {};
        for (var i = 0; i < p.length; i++) { o[p[i].type] = p[i].value; }
        return new Date(Number(o.year), Number(o.month) - 1, Number(o.day));
      } catch (e) { return new Date(); }
    }

    // ---------- 1) Fecha del encabezado: dd/mmm/yyyy ----------
    try {
      var fp = new Intl.DateTimeFormat('es-CO', {
        day: '2-digit', month: 'short', year: 'numeric', timeZone: 'America/Bogota'
      }).formatToParts(new Date());
      var fo = {};
      for (var fi = 0; fi < fp.length; fi++) { fo[fp[fi].type] = fp[fi].value; }
      var elFecha = document.getElementById('fecha-hoy');
      if (elFecha && fo.day && fo.month && fo.year) {
        elFecha.textContent = fo.day + '/' + fo.month.replace('.', '') + '/' + fo.year;
      }
    } catch (e) {}

    // ---------- 2) Pico y placa (una sola fila, nombres cortos) ----------
    (function () {
      var cont = document.getElementById('pico-cities');
      if (!cont) return;
      // Los digitos NO se calculan aqui: vienen de src/_data/picoyplaca.json,
      // que la redaccion edita desde el CMS en "Datos del sitio". Este codigo
      // solo elige que fila mostrar segun el dia. Si algo falta en el dato,
      // se muestra "Libre" antes que inventar un numero.
      var fuente = window.__PICO_Y_PLACA__;
      if (!fuente || !fuente.ciudades) return;

      var d = hoyBogota();
      var dow = d.getDay();            // 0 domingo … 6 sábado
      var dia = d.getDate();
      var hoyISO = d.getFullYear() + '-' +
        ('0' + (d.getMonth() + 1)).slice(-2) + '-' +
        ('0' + d.getDate()).slice(-2);
      var nombreDia = ['domingo', 'lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado'];
      // La franja va en una sola fila: nombres largos se abrevian y los
      // digitos "7 y 8" se compactan a "7·8" para que quepan en el celular.
      var abreviaturas = { 'Bucaramanga': 'B/manga' };
      function compacta(v) {
        return v ? String(v).replace(/,\s*/g, '·').replace(/\s*y\s*/g, '·') : v;
      }

      // De todas las rotaciones cargadas, la ultima cuya fecha de inicio ya paso.
      // Asi el cambio de semestre o de trimestre ocurre solo el dia que toca.
      function rotacionVigente(ciudad) {
        var lista = ciudad.rotaciones || [];
        var elegida = null;
        for (var i = 0; i < lista.length; i++) {
          if (lista[i].desde <= hoyISO && (!elegida || lista[i].desde > elegida.desde)) {
            elegida = lista[i];
          }
        }
        return elegida;
      }

      function digitosSabado(ciudad) {
        var lista = ciudad.sabados || [];
        for (var i = 0; i < lista.length; i++) {
          if (lista[i].fecha === hoyISO) { return lista[i].digitos; }
        }
        return null;   // sabado sin dato publicado: no se inventa
      }

      // En festivo nacional no hay pico y placa en ninguna de las tres ciudades:
      // la resolucion de Bucaramanga habla de "dias habiles", y un festivo no lo
      // es. Manda sobre todo lo demas, incluidos los sabados cargados a mano.
      function festivoDeHoy() {
        var lista = fuente.festivos || [];
        for (var i = 0; i < lista.length; i++) {
          if (lista[i].fecha === hoyISO) { return lista[i].nombre || 'festivo'; }
        }
        return null;
      }
      var festivo = festivoDeHoy();

      var datos = [];
      for (var ci = 0; ci < fuente.ciudades.length; ci++) {
        var ciudad = fuente.ciudades[ci];
        var v = null;
        var h = 'sin restricción';

        if (festivo) {
          h = 'festivo: ' + festivo;
        } else if (dow >= 1 && dow <= 5) {
          if (ciudad.reglaParidad) {
            v = (dia % 2 === 1) ? ciudad.reglaParidad.impar : ciudad.reglaParidad.par;
          } else {
            var rot = rotacionVigente(ciudad);
            v = rot ? rot[nombreDia[dow]] : null;
          }
          if (v) { h = ciudad.horario || h; }
        } else if (dow === 6) {
          v = digitosSabado(ciudad);
          if (v) { h = ciudad.horarioSabado || ciudad.horario || h; }
        }

        datos.push({ c: abreviaturas[ciudad.nombre] || ciudad.nombre, n: ciudad.nombre, v: compacta(v) || null, h: h });
      }

      cont.textContent = '';
      for (var i = 0; i < datos.length; i++) {
        var it = datos[i];
        var wrap = document.createElement('span');
        wrap.className = 'pico-city';
        var b = document.createElement('b');
        b.textContent = it.c;
        var dig = document.createElement('span');
        dig.className = 'pico-digits' + (it.v ? '' : ' libre');
        dig.textContent = it.v ? it.v : 'Libre';
        var tm = document.createElement('span');
        tm.className = 'pico-time';
        tm.textContent = it.h;
        wrap.appendChild(b);
        wrap.appendChild(dig);
        wrap.appendChild(tm);
        wrap.title = it.v
          ? 'Placas restringidas hoy en ' + it.n + ' para vehículos particulares (' + it.v.split('·').join(', ') + '), ' + it.h + '.'
          : 'Hoy no hay pico y placa para vehículos particulares en ' + it.n + '.';
        cont.appendChild(wrap);
      }
    })();

    // ---------- 3) Cinta bursátil: duplicar para desplazamiento continuo ----------
    (function () {
      var track = document.getElementById('ticker-track');
      if (!track) return;
      var set = track.querySelector('.ticker-set');
      if (!set) return;
      var clon = set.cloneNode(true);
      clon.setAttribute('aria-hidden', 'true');
      clon.querySelectorAll('a').forEach ? clon.querySelectorAll('a').forEach(function (a) { a.setAttribute('tabindex', '-1'); }) : null;
      track.appendChild(clon);
    })();

    var elLive = document.getElementById('trm-live');

    // ---------- 4) Monedas en vivo (dolarapi.com) ----------
    // Una sola petición trae el dólar y el euro. Se tratan distinto a
    // propósito: ver el bloque del euro más abajo.
    fetch('https://co.dolarapi.com/v1/cotizaciones')
      .then(function (r) { return r.ok ? r.json() : Promise.reject(); })
      .then(function (list) {
        function moneda(codigo) {
          for (var i = 0; i < list.length; i++) {
            if (list[i].moneda === codigo) return list[i];
          }
          return null;
        }

        // ----- Euro: se muestran las DOS puntas -----
        // El euro no tiene mercado spot interbancario en Colombia; lo que hay
        // es precio de casa de cambio. Ahí la diferencia entre lo que le
        // compran y lo que le venden ronda el 7%, contra el 0,1% del dólar.
        // Dar una sola cifra sería engañar: la punta que le sirve al lector
        // depende de si va a comprar euros o a venderlos.
        var eur = moneda('EUR');
        if (eur) {
          var ec = parseFloat(eur.compra), ev = parseFloat(eur.venta);
          if (!isNaN(ec) && !isNaN(ev)) {
            each('.js-eur-val', function (el) {
              el.textContent = '$' + fmtNum(Math.round(ec), 0) + ' / $' + fmtNum(Math.round(ev), 0);
            });
            var fe = '';
            try {
              fe = ' · ' + new Intl.DateTimeFormat('es-CO', { day: 'numeric', month: 'short', timeZone: 'America/Bogota' })
                .format(new Date(eur.fechaActualizacion));
            } catch (e) {}
            each('.js-eur-item', function (el) {
              el.title = 'Euro en Colombia, precio de casa de cambio vía dolarapi.com' + fe + '.'
                + ' · Compra $' + fmtNum(ec, 2)
                + ' · Venta $' + fmtNum(ev, 2)
                + ' · Margen entre las dos puntas: ' + fmtNum(100 * (ev - ec) / ec, 1) + '%.'
                + ' Toca para ver el detalle.';
            });
          }
        }

        // ----- Dólar: se muestra el último cierre spot -----
        var usd = moneda('USD');
        if (!usd) return;
        var cierre = parseFloat(usd.ultimoCierre);
        if (!isNaN(cierre)) {
          each('.js-usd-val', function (el) { el.textContent = '$' + fmtNum(cierre, 2); });
          // En el botón del encabezado el dato va sin decimales: es un gancho,
          // no una cotización.
          each('.js-usd-entero', function (el) { el.textContent = '$' + fmtNum(Math.round(cierre), 0); });
        }
        try {
          var ff = new Intl.DateTimeFormat('es-CO', { day: 'numeric', month: 'short', timeZone: 'America/Bogota' })
            .format(new Date(usd.fechaActualizacion));
          each('.js-usd-delta', function (el) { el.textContent = 'cierre · ' + ff; });
        } catch (e) {}
        var c = parseFloat(usd.compra), v = parseFloat(usd.venta);
        each('.js-usd-item', function (el) {
          el.title = 'Último cierre del dólar spot en Colombia (SetFX), vía dolarapi.com — se actualiza en cada visita.'
            + (!isNaN(c) ? ' · Compra $' + fmtNum(c, 2) : '')
            + (!isNaN(v) ? ' · Venta $' + fmtNum(v, 2) : '')
            + ' Toca para ver la gráfica.';
        });
        if (elLive) elLive.classList.add('on');
      })
      .catch(function () {});

    // ---------- 5) Oro y Bitcoin en vivo (CoinGecko) ----------
    function setCripto(clave, precio, cambio) {
      if (!isNaN(precio)) {
        each('.js-' + clave + '-val', function (el) { el.textContent = 'US$' + Math.round(precio).toLocaleString('es-CO'); });
      }
      if (cambio != null && !isNaN(cambio)) {
        var sube = cambio >= 0;
        each('.js-' + clave + '-delta', function (el) {
          el.textContent = (sube ? '▲ ' : '▼ ') + fmtNum(Math.abs(cambio), 2) + '%';
          el.className = 'delta js-' + clave + '-delta ' + (sube ? 'up' : 'down');
        });
      }
    }
    fetch('https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,pax-gold&vs_currencies=usd&include_24hr_change=true')
      .then(function (r) { return r.ok ? r.json() : Promise.reject(); })
      .then(function (j) {
        if (j.bitcoin) setCripto('btc', parseFloat(j.bitcoin.usd), parseFloat(j.bitcoin.usd_24h_change));
        if (j['pax-gold']) setCripto('oro', parseFloat(j['pax-gold'].usd), parseFloat(j['pax-gold'].usd_24h_change));
        if (elLive) elLive.classList.add('on');
      })
      .catch(function () {});

    // ---------- 6) Menú móvil y submenú de Secciones ----------
    (function () {
      var btn = document.getElementById('nav-toggle');
      var menu = document.getElementById('nav-menu');
      var grupo = document.getElementById('nav-grupo');
      var subBtn = document.getElementById('nav-sub-toggle');

      function cerrarSub() {
        if (!grupo || !subBtn) return;
        grupo.classList.remove('abierto');
        subBtn.setAttribute('aria-expanded', 'false');
      }
      function cerrarMenu() {
        if (!menu || !btn) return;
        menu.classList.remove('is-open');
        btn.setAttribute('aria-expanded', 'false');
        var h = btn.querySelector('.nav-toggle-hint');
        if (h) h.textContent = 'Abrir';
      }

      if (subBtn && grupo) {
        subBtn.addEventListener('click', function (ev) {
          ev.stopPropagation();
          var abierto = grupo.classList.toggle('abierto');
          subBtn.setAttribute('aria-expanded', abierto ? 'true' : 'false');
        });
        // En escritorio el submenú es un desplegable: se cierra al hacer
        // clic por fuera o con Escape.
        document.addEventListener('click', function (ev) {
          if (grupo.classList.contains('abierto') && !grupo.contains(ev.target)) cerrarSub();
        });
        document.addEventListener('keydown', function (ev) {
          if (ev.key === 'Escape') { cerrarSub(); cerrarMenu(); }
        });
      }

      if (btn && menu) {
        btn.addEventListener('click', function () {
          var abierto = menu.classList.toggle('is-open');
          btn.setAttribute('aria-expanded', abierto ? 'true' : 'false');
          var hint = btn.querySelector('.nav-toggle-hint');
          if (hint) hint.textContent = abierto ? 'Cerrar' : 'Abrir';
          if (!abierto) cerrarSub();
        });
        // Al elegir un destino se cierra todo
        each('#nav-menu a', function (a) {
          a.addEventListener('click', function () { cerrarSub(); cerrarMenu(); });
        });
      }
    })();

    // ---------- 7) Cupón del anunciante: uno por dispositivo, 100 disponibles ----------
    (function () {
      var btn = document.getElementById('btn-cupon');
      var caja = document.getElementById('cupon-tinto');
      if (!btn || !caja) return;

      var LLAVE = 'sinestres-tinto-2026';
      var TOTAL = 100;

      function guardado() {
        try { return JSON.parse(window.localStorage.getItem(LLAVE) || 'null'); }
        catch (e) { return null; }
      }
      function guardar(dato) {
        try { window.localStorage.setItem(LLAVE, JSON.stringify(dato)); } catch (e) {}
      }
      function numeroAleatorio() {
        if (window.crypto && window.crypto.getRandomValues) {
          var a = new Uint32Array(1);
          window.crypto.getRandomValues(a);
          return (a[0] % TOTAL) + 1;
        }
        return Math.floor(Math.random() * TOTAL) + 1;
      }
      function fechaLarga(iso) {
        try {
          return new Intl.DateTimeFormat('es-CO', {
            day: 'numeric', month: 'long', year: 'numeric', timeZone: 'America/Bogota'
          }).format(iso ? new Date(iso) : new Date());
        } catch (e) { return ''; }
      }
      function pintar(dato) {
        var elCod = document.getElementById('cupon-codigo');
        var elVig = document.getElementById('cupon-vigencia');
        if (elCod) elCod.textContent = 'TINTO-' + ('00' + dato.n).slice(-3);
        if (elVig) {
          elVig.textContent = 'Cupón ' + dato.n + ' de ' + TOTAL + '. Emitido el ' + fechaLarga(dato.fecha)
            + '. Uno por dispositivo: muéstralo en caja y escanea el QR para llegar a la tienda.';
        }
        caja.hidden = false;
        btn.textContent = 'Ver mi cupón';
        btn.setAttribute('aria-disabled', 'true');
      }

      var previo = guardado();
      if (previo && previo.n) { pintar(previo); }

      btn.addEventListener('click', function () {
        var actual = guardado();
        if (!actual || !actual.n) {
          actual = { n: numeroAleatorio(), fecha: new Date().toISOString() };
          guardar(actual);
        }
        pintar(actual);
        caja.setAttribute('tabindex', '-1');
        caja.focus();
      });
    })();

    // ---------- 8) Pestañas de tasas ----------
    (function () {
      var tabs = document.querySelectorAll('.tab-btn');
      if (!tabs.length) return;
      function activar(tab) {
        for (var i = 0; i < tabs.length; i++) {
          var t = tabs[i];
          var sel = (t === tab);
          t.setAttribute('aria-selected', sel ? 'true' : 'false');
          t.tabIndex = sel ? 0 : -1;
          var panel = document.getElementById(t.getAttribute('aria-controls'));
          if (panel) panel.hidden = !sel;
        }
      }
      for (var i = 0; i < tabs.length; i++) {
        tabs[i].addEventListener('click', function () { activar(this); });
        tabs[i].addEventListener('keydown', function (e) {
          var lista = Array.prototype.slice.call(tabs);
          var pos = lista.indexOf(this);
          var sig = null;
          if (e.key === 'ArrowRight') { sig = lista[(pos + 1) % lista.length]; }
          if (e.key === 'ArrowLeft') { sig = lista[(pos - 1 + lista.length) % lista.length]; }
          if (sig) { e.preventDefault(); activar(sig); sig.focus(); }
        });
      }
    })();

    // ---------- 9) Tarjetas flip ----------
    each('.flip-btn', function (btn) {
      btn.addEventListener('click', function () {
        var card = btn.closest('.flip-card');
        if (!card) return;
        var abierta = card.classList.toggle('is-flipped');
        var frente = card.querySelector('.flip-front .flip-btn');
        var reverso = card.querySelector('.flip-back .flip-btn');
        if (frente) frente.setAttribute('aria-expanded', abierta ? 'true' : 'false');
        if (reverso) reverso.setAttribute('aria-expanded', abierta ? 'true' : 'false');
        var destino = abierta ? reverso : frente;
        if (destino) { window.setTimeout(function () { destino.focus(); }, 320); }
      });
    });

    // ---------- 9) Incrustaciones: cargar el contenido solo si lo piden ----------
    //
    // Lo que hay en la página es una tapa: una imagen, el nombre de la
    // plataforma y la medida ya reservada. El marco de verdad se crea aquí, al
    // tocar. Hasta entonces el navegador del lector no habla con YouTube, ni
    // con TikTok, ni con Meta, ni con X.
    //
    // Ese es el motivo de fondo: el aviso de /legal/cookies/ promete que quien
    // rechaza deja de ser medido, y los scripts de las redes rastrean apenas
    // cargan, mire o no mire alguien el video.
    each('.incrusta-abrir', function (btn) {
      btn.addEventListener('click', function () {
        var src = btn.getAttribute('data-src');
        if (!src) return;
        var f = document.createElement('iframe');
        f.className = 'incrusta-marco';
        f.src = src;
        f.setAttribute('allow', 'autoplay; clipboard-write; encrypted-media; picture-in-picture; web-share');
        f.setAttribute('allowfullscreen', '');
        f.setAttribute('referrerpolicy', 'strict-origin-when-cross-origin');
        f.title = btn.getAttribute('data-titulo') || 'Contenido incrustado';
        // La caja de una publicación sin foto de tapa estaba encogida a
        // propósito; ahora sí toma el alto que pide la red.
        if (btn.parentNode.classList) btn.parentNode.classList.add('incrusta-abierta');
        btn.parentNode.replaceChild(f, btn);
        // Quien abrió con el teclado se quedaba sin foco: el botón que tenía el
        // foco acaba de desaparecer y el siguiente tabulador volvía al principio
        // del documento. Se le pasa el foco al marco recién creado.
        if (typeof f.focus === 'function') { try { f.focus(); } catch (e) {} }
      });
    });

    // ---------- 10) Multimedia: galerías con visor tipo lightbox ----------
    each('.mm-open-galeria', function (btn) {
      btn.addEventListener('click', function () {
        var tpl = document.getElementById(btn.getAttribute('data-galeria'));
        if (!tpl) return;
        var dlg = document.getElementById('mm-lightbox');
        if (!dlg) {
          dlg = document.createElement('dialog');
          dlg.id = 'mm-lightbox';
          dlg.className = 'mm-lightbox';
          dlg.innerHTML = '<button type="button" class="mm-lb-close" aria-label="Cerrar galería">×</button>' +
            '<button type="button" class="mm-lb-prev" aria-label="Foto anterior">‹</button>' +
            '<div class="mm-lb-stage"></div>' +
            '<button type="button" class="mm-lb-next" aria-label="Foto siguiente">›</button>' +
            '<p class="mm-lb-count"></p>';
          document.body.appendChild(dlg);
          // En navegadores sin <dialog> no existe close(): se cierra quitando
          // el atributo open (el CSS oculta .mm-lightbox:not([open])).
          var cerrar = function () {
            if (typeof dlg.close === 'function') { dlg.close(); } else { dlg.removeAttribute('open'); }
          };
          dlg.addEventListener('click', function (ev) { if (ev.target === dlg) cerrar(); });
          dlg.querySelector('.mm-lb-close').addEventListener('click', cerrar);
          document.addEventListener('keydown', function (ev) {
            if (ev.key === 'Escape' && dlg.hasAttribute('open')) cerrar();
          });
        }
        var fotos = [];
        var imgs = tpl.content ? tpl.content.querySelectorAll('img') : [];
        for (var i = 0; i < imgs.length; i++) {
          // El plugin de imágenes deja en `src` la medida MÁS PEQUEÑA (400 px)
          // y el resto en `srcset`. El visor pinta a pantalla completa, así que
          // con `src` a secas mostraba una foto de 400 px en el centro de una
          // pantalla de 1280: no se veía borrosa, se veía diminuta. Se toma la
          // última candidata del srcset, que es la más grande.
          var conjunto = imgs[i].getAttribute('srcset');
          var grande = conjunto ? conjunto.split(',').pop().trim().split(/\s+/)[0] : '';
          fotos.push({ src: grande || imgs[i].getAttribute('src'), alt: imgs[i].getAttribute('alt') || '' });
        }
        if (!fotos.length) return;
        // Empieza en la foto que se tocó, no siempre en la primera.
        var idx = Math.min(parseInt(btn.getAttribute('data-indice'), 10) || 0, fotos.length - 1);
        var stage = dlg.querySelector('.mm-lb-stage');
        var count = dlg.querySelector('.mm-lb-count');
        function pinta() {
          stage.innerHTML = '';
          var im = document.createElement('img');
          im.src = fotos[idx].src;
          im.alt = fotos[idx].alt;
          stage.appendChild(im);
          count.textContent = (idx + 1) + ' / ' + fotos.length;
        }
        dlg.querySelector('.mm-lb-prev').onclick = function () { idx = (idx - 1 + fotos.length) % fotos.length; pinta(); };
        dlg.querySelector('.mm-lb-next').onclick = function () { idx = (idx + 1) % fotos.length; pinta(); };
        pinta();
        if (dlg.showModal) dlg.showModal(); else dlg.setAttribute('open', '');
      });
    });
  })();

// ---------------------------------------------------------------------
// 2. Barras de compartir
// ---------------------------------------------------------------------
// WhatsApp, Facebook, LinkedIn y Gmail son enlaces normales armados en el build
// y no necesitan nada de esto. Instagram y TikTok si: no publican una direccion
// web para compartir un enlace, asi que se usa el menu de compartir del telefono
// (que lista las apps instaladas) y, donde no existe, se copia el enlace.
  // Cada nota lleva DOS barras (arriba y al final), así que se recorren todas:
  // con querySelector a secas solo funcionaría la primera y la de abajo
  // quedaría muerta al tacto.
  document.querySelectorAll('[data-compartir]').forEach(function (caja) {
    var url = caja.getAttribute('data-url');
    var titulo = caja.getAttribute('data-titulo');
    var texto = caja.getAttribute('data-texto');
    var aviso = caja.querySelector('[data-compartir-aviso]');
    var reloj;

    function decir(mensaje) {
      if (!aviso) return;
      aviso.textContent = mensaje;
      aviso.hidden = false;
      clearTimeout(reloj);
      reloj = setTimeout(function () { aviso.hidden = true; }, 4000);
    }

    function copiar() {
      if (navigator.clipboard && window.isSecureContext) {
        return navigator.clipboard.writeText(url);
      }
      // Sin portapapeles moderno (http, navegadores viejos): se selecciona
      // el texto en un campo fuera de pantalla y se copia a la vieja usanza.
      return new Promise(function (resolver, rechazar) {
        var campo = document.createElement('textarea');
        campo.value = url;
        campo.setAttribute('readonly', '');
        campo.style.cssText = 'position:absolute;left:-9999px;top:0';
        document.body.appendChild(campo);
        campo.select();
        var bien = false;
        try { bien = document.execCommand('copy'); } catch (e) {}
        document.body.removeChild(campo);
        bien ? resolver() : rechazar();
      });
    }

    function copiarYAvisar(app) {
      copiar().then(
        function () {
          decir(app
            ? 'Enlace copiado. Pégalo en tu historia o publicación de ' + app + '.'
            : 'Enlace copiado.');
        },
        function () { decir('No se pudo copiar. El enlace es: ' + url); }
      );
    }

    caja.querySelectorAll('[data-compartir-app]').forEach(function (boton) {
      boton.addEventListener('click', function () {
        var app = boton.getAttribute('data-compartir-app');
        if (navigator.share) {
          // Dentro de un try: hay navegadores donde share() existe pero está
          // bloqueado (por ejemplo en un iframe con la política restringida) y
          // revienta en el acto, sin devolver promesa. Sin esto el botón se
          // quedaría mudo, que es justo lo que no queremos.
          try {
            var promesa = navigator.share({ title: titulo, text: texto, url: url });
            if (promesa && promesa.catch) {
              promesa.catch(function (e) {
                // Cancelar el menú no es un fallo: no hay que decir nada.
                if (e && e.name === 'AbortError') return;
                copiarYAvisar(app);
              });
              return;
            }
          } catch (e) {
            if (e && e.name === 'AbortError') return;
          }
        }
        copiarYAvisar(app);
      });
    });

    var botonCopiar = caja.querySelector('[data-compartir-copiar]');
    if (botonCopiar) {
      botonCopiar.addEventListener('click', function () { copiarYAvisar(null); });
    }
  });

// ---------------------------------------------------------------------
// 3. Aviso de cookies
// ---------------------------------------------------------------------
  (function () {
    var LLAVE = 'es-consent-analitica';
    var aviso = document.getElementById('cookie-aviso');
    if (!aviso) return;

    function leer() {
      try { return window.localStorage.getItem(LLAVE); } catch (e) { return null; }
    }
    function guardar(valor) {
      try { window.localStorage.setItem(LLAVE, valor); } catch (e) {}
    }
    function mostrar() { aviso.hidden = false; }
    function ocultar() { aviso.hidden = true; }

    // Sin decisión previa, se pregunta. Con decisión, no se molesta más.
    if (leer() === null) mostrar();

    aviso.querySelectorAll('[data-cookies]').forEach(function (b) {
      b.addEventListener('click', function () {
        var valor = b.getAttribute('data-cookies');
        guardar(valor);
        ocultar();
        // La analítica ya venía corriendo: aceptar no hace nada nuevo y
        // rechazar la apaga de inmediato, sin necesidad de recargar.
        if (valor === 'no' && window.esApagarAnalitica) window.esApagarAnalitica();
        if (valor === 'si' && window.esCargarAnalitica) window.esCargarAnalitica();
      });
    });

    // Botón "Preferencias de cookies" del pie y de la página de cookies.
    document.querySelectorAll('[data-abrir-cookies]').forEach(function (b) {
      b.addEventListener('click', function (e) {
        e.preventDefault();
        mostrar();
        aviso.scrollIntoView({ behavior: 'smooth', block: 'center' });
      });
    });
  })();
