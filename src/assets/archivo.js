// Buscador y paginación del archivo (/archivo/).
//
// La lista completa ya viene en el HTML; aquí solo se esconde lo que no
// coincide o lo que no cae en la página actual. Cada fila trae en
// data-texto su titular, resumen y sección ya normalizados en el build. El
// texto de las notas llega aparte, de /archivo/indice.json, y solo se pide
// cuando alguien empieza a buscar.
//
// La búsqueda y la página quedan en la dirección (?q=cacao&seccion=agro&p=2):
// se puede mandar por WhatsApp y abre con el mismo resultado.
(function () {
  var form = document.getElementById("archivo-form");
  if (!form) return;
  var campo = document.getElementById("archivo-q");
  var selector = document.getElementById("archivo-seccion");
  var estado = document.getElementById("archivo-estado");
  var vacio = document.getElementById("archivo-vacio");
  var nav = document.getElementById("archivo-paginacion");
  var lista = document.getElementById("archivo-lista");
  var meses = Array.prototype.slice.call(document.querySelectorAll(".archivo-mes"));
  var filas = Array.prototype.slice.call(document.querySelectorAll(".archivo-item"));
  var total = filas.length;

  var POR_PAGINA = 20;
  var paginaActual = 1;

  var indice = null; // { "/noticias/slug/": "palabras unicas ..." }
  var pidiendo = false;

  // Igual que lib/buscar.js. Si cambia una, cambia la otra.
  function normalizar(t) {
    return String(t || "").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
  }

  function pedirIndice() {
    if (indice || pidiendo) return;
    pidiendo = true;
    fetch("/archivo/indice.json")
      .then(function (r) { return r.ok ? r.json() : {}; })
      .then(function (datos) { indice = datos || {}; filtrar(true); })
      .catch(function () { indice = {}; }); // sin índice se sigue buscando por titular y resumen
  }

  // `mantenerPagina`: true para no volver a la página 1 (cambio de página,
  // llegada de la carga de indice.json). Cualquier cambio real de búsqueda o
  // sección sí debe volver al principio, como en cualquier buscador.
  function filtrar(mantenerPagina) {
    var q = normalizar(campo.value).trim();
    var terminos = q ? q.split(/[^a-z0-9]+/).filter(Boolean) : [];
    var seccion = selector.value;

    var coinciden = [];
    filas.forEach(function (fila) {
      var ok = !seccion || fila.getAttribute("data-seccion") === seccion;
      if (ok && terminos.length) {
        var texto = fila.getAttribute("data-texto") + " " + ((indice && indice[fila.getAttribute("data-url")]) || "");
        // Todas las palabras tienen que aparecer, en cualquier orden.
        for (var i = 0; i < terminos.length && ok; i++) ok = texto.indexOf(terminos[i]) !== -1;
      }
      if (ok) coinciden.push(fila);
    });

    if (!mantenerPagina) paginaActual = 1;
    var totalPaginas = Math.max(1, Math.ceil(coinciden.length / POR_PAGINA));
    if (paginaActual > totalPaginas) paginaActual = totalPaginas;
    if (paginaActual < 1) paginaActual = 1;

    var desde = (paginaActual - 1) * POR_PAGINA;
    var visiblesEnPagina = coinciden.slice(desde, desde + POR_PAGINA);

    filas.forEach(function (fila) { fila.hidden = true; });
    visiblesEnPagina.forEach(function (fila) { fila.hidden = false; });

    // Un mes sin notas visibles EN ESTA PÁGINA se esconde entero, con su título.
    meses.forEach(function (mes) {
      mes.hidden = !mes.querySelector(".archivo-item:not([hidden])");
    });

    vacio.hidden = coinciden.length > 0;
    if (!terminos.length && !seccion) {
      estado.textContent = totalPaginas > 1 ? "Página " + paginaActual + " de " + totalPaginas + "." : "";
    } else {
      var texto = coinciden.length === 1 ? "1 nota" : coinciden.length + " notas";
      if (terminos.length) texto += " con «" + campo.value.trim() + "»";
      if (seccion) texto += " en " + selector.options[selector.selectedIndex].text;
      texto += " de " + total + ".";
      if (totalPaginas > 1) texto += " Página " + paginaActual + " de " + totalPaginas + ".";
      estado.textContent = texto;
    }

    pintarPaginacion(totalPaginas);
    guardarEnDireccion();
  }

  function pintarPaginacion(totalPaginas) {
    if (!nav) return;
    if (totalPaginas <= 1) {
      nav.hidden = true;
      nav.innerHTML = "";
      return;
    }
    nav.hidden = false;

    function boton(n, etiqueta, actual, deshabilitado) {
      if (deshabilitado) {
        return '<span class="archivo-pag-btn deshabilitado" aria-hidden="true">' + etiqueta + "</span>";
      }
      return (
        '<button type="button" class="archivo-pag-btn' + (actual ? " actual" : "") + '"' +
        ' data-pagina="' + n + '"' +
        (actual ? ' aria-current="page"' : "") +
        ' aria-label="Página ' + n + '">' + etiqueta + "</button>"
      );
    }

    var partes = [];
    partes.push(boton(paginaActual - 1, "‹", false, paginaActual === 1));

    var VENTANA = 2; // páginas vecinas a cada lado de la actual, además de la primera y la última
    var anterior = 0;
    for (var i = 1; i <= totalPaginas; i++) {
      var mostrar = i === 1 || i === totalPaginas || (i >= paginaActual - VENTANA && i <= paginaActual + VENTANA);
      if (!mostrar) continue;
      if (anterior && i - anterior > 1) {
        partes.push('<span class="archivo-pag-salto" aria-hidden="true">…</span>');
      }
      partes.push(boton(i, String(i), i === paginaActual, false));
      anterior = i;
    }

    partes.push(boton(paginaActual + 1, "›", false, paginaActual === totalPaginas));
    nav.innerHTML = partes.join("");
  }

  function guardarEnDireccion() {
    if (!window.history || !history.replaceState) return;
    var p = new URLSearchParams();
    if (campo.value.trim()) p.set("q", campo.value.trim());
    if (selector.value) p.set("seccion", selector.value);
    if (paginaActual > 1) p.set("p", paginaActual);
    var qs = p.toString();
    history.replaceState(null, "", location.pathname + (qs ? "?" + qs : ""));
  }

  var espera;
  campo.addEventListener("input", function () {
    pedirIndice();
    clearTimeout(espera);
    espera = setTimeout(function () { filtrar(); }, 150);
  });
  campo.addEventListener("focus", pedirIndice);
  selector.addEventListener("change", function () { filtrar(); });
  // Enter no recarga la página: el resultado ya está en pantalla.
  form.addEventListener("submit", function (e) {
    e.preventDefault();
    filtrar();
    campo.blur(); // en el teléfono, cierra el teclado para ver los resultados
  });

  if (nav) {
    nav.addEventListener("click", function (e) {
      var boton = e.target.closest("[data-pagina]");
      if (!boton) return;
      var n = parseInt(boton.getAttribute("data-pagina"), 10);
      if (!n || n < 1) return;
      paginaActual = n;
      filtrar(true);
      if (lista) lista.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  }

  // Llegada con una búsqueda, sección o página en la dirección.
  var params = new URLSearchParams(location.search);
  if (params.get("q")) campo.value = params.get("q");
  if (params.get("seccion")) selector.value = params.get("seccion");
  if (params.get("p")) paginaActual = parseInt(params.get("p"), 10) || 1;
  if (campo.value) pedirIndice();
  filtrar(true); // siempre se pagina, haya o no haya búsqueda
})();
