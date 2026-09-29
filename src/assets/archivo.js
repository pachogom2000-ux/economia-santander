// Buscador del archivo (/archivo/).
//
// La lista completa ya viene en el HTML; aquí solo se esconde lo que no
// coincide. Cada fila trae en data-texto su titular, resumen y sección ya
// normalizados en el build. El texto de las notas llega aparte, de
// /archivo/indice.json, y solo se pide cuando alguien empieza a buscar.
//
// La búsqueda queda en la dirección (?q=cacao&seccion=agro): se puede mandar
// por WhatsApp y abre con el mismo resultado.
(function () {
  var form = document.getElementById("archivo-form");
  if (!form) return;
  var campo = document.getElementById("archivo-q");
  var selector = document.getElementById("archivo-seccion");
  var estado = document.getElementById("archivo-estado");
  var vacio = document.getElementById("archivo-vacio");
  var meses = Array.prototype.slice.call(document.querySelectorAll(".archivo-mes"));
  var filas = Array.prototype.slice.call(document.querySelectorAll(".archivo-item"));
  var total = filas.length;

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
      .then(function (datos) { indice = datos || {}; filtrar(); })
      .catch(function () { indice = {}; }); // sin índice se sigue buscando por titular y resumen
  }

  function filtrar() {
    var q = normalizar(campo.value).trim();
    var terminos = q ? q.split(/[^a-z0-9]+/).filter(Boolean) : [];
    var seccion = selector.value;
    var vistas = 0;

    filas.forEach(function (fila) {
      var ok = !seccion || fila.getAttribute("data-seccion") === seccion;
      if (ok && terminos.length) {
        var texto = fila.getAttribute("data-texto") + " " + ((indice && indice[fila.getAttribute("data-url")]) || "");
        // Todas las palabras tienen que aparecer, en cualquier orden.
        for (var i = 0; i < terminos.length && ok; i++) ok = texto.indexOf(terminos[i]) !== -1;
      }
      fila.hidden = !ok;
      if (ok) vistas++;
    });

    // Un mes sin notas visibles se esconde entero, con su título.
    meses.forEach(function (mes) {
      mes.hidden = !mes.querySelector(".archivo-item:not([hidden])");
    });

    vacio.hidden = vistas > 0;
    if (!terminos.length && !seccion) {
      estado.textContent = "";
    } else {
      var texto = vistas === 1 ? "1 nota" : vistas + " notas";
      if (terminos.length) texto += " con «" + campo.value.trim() + "»";
      if (seccion) texto += " en " + selector.options[selector.selectedIndex].text;
      estado.textContent = texto + " de " + total + ".";
    }
    guardarEnDireccion();
  }

  function guardarEnDireccion() {
    if (!window.history || !history.replaceState) return;
    var p = new URLSearchParams();
    if (campo.value.trim()) p.set("q", campo.value.trim());
    if (selector.value) p.set("seccion", selector.value);
    var qs = p.toString();
    history.replaceState(null, "", location.pathname + (qs ? "?" + qs : ""));
  }

  var espera;
  campo.addEventListener("input", function () {
    pedirIndice();
    clearTimeout(espera);
    espera = setTimeout(filtrar, 150);
  });
  campo.addEventListener("focus", pedirIndice);
  selector.addEventListener("change", filtrar);
  // Enter no recarga la página: el resultado ya está en pantalla.
  form.addEventListener("submit", function (e) {
    e.preventDefault();
    filtrar();
    campo.blur(); // en el teléfono, cierra el teclado para ver los resultados
  });

  // Llegada con una búsqueda en la dirección.
  var params = new URLSearchParams(location.search);
  if (params.get("q")) campo.value = params.get("q");
  if (params.get("seccion")) selector.value = params.get("seccion");
  if (campo.value || selector.value) {
    if (campo.value) pedirIndice();
    filtrar();
  }
})();
