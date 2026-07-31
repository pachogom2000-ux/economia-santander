/**
 * TRM oficial traída en el momento del build.
 *
 * Por qué existe: /dolar-hoy/ e /indicadores/ pintaban la TRM con JavaScript
 * desde el navegador. El buscador recibía la palabra "Cargando…" y guiones,
 * así que la página de consulta permanente más obvia del portal publicaba un
 * valor vacío. Google puede ejecutar JavaScript, pero lo hace en una segunda
 * pasada y sin garantía.
 *
 * Ahora el valor viaja en el HTML y el JavaScript solo lo refresca.
 *
 * Fuente: dataset 32sa-8pi3 de datos.gov.co — TRM certificada por la
 * Superintendencia Financiera, publicada por el Banco de la República. Sin
 * llave de API.
 *
 * TRAMPA IMPORTANTE: el Banco de la República publica la TRM del día
 * SIGUIENTE. La última fila de la serie suele ser la de mañana. Hay que tomar
 * la última cuya `vigenciadesde` ya empezó, y anunciar la de mañana aparte.
 *
 * Si la consulta falla, el build NO se rompe: se devuelve null y las
 * plantillas caen al comportamiento de antes. Un despliegue no puede depender
 * de que una API ajena esté arriba.
 */
const URL_TRM =
  "https://www.datos.gov.co/resource/32sa-8pi3.json" +
  "?$select=vigenciadesde,vigenciahasta,valor&$order=vigenciadesde%20DESC&$limit=400";

const pesos = (n) =>
  new Intl.NumberFormat("es-CO", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(n);

const diaLegible = (iso) =>
  new Date(iso + "T12:00:00Z").toLocaleDateString("es-CO", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "America/Bogota",
  });

module.exports = async function () {
  try {
    const r = await fetch(URL_TRM, { signal: AbortSignal.timeout(15000) });
    if (!r.ok) throw new Error("respuesta " + r.status);
    const filas = await r.json();
    if (!Array.isArray(filas) || !filas.length) throw new Error("serie vacía");

    const serie = filas
      .map((f) => ({ desde: String(f.vigenciadesde).slice(0, 10), valor: Number(f.valor) }))
      .filter((f) => f.desde && Number.isFinite(f.valor))
      .sort((a, b) => (a.desde < b.desde ? 1 : -1));

    // Hoy en Bogotá, no en la zona horaria de quien compila.
    const hoy = new Date().toLocaleDateString("en-CA", { timeZone: "America/Bogota" });

    const vigente = serie.find((f) => f.desde <= hoy);
    if (!vigente) throw new Error("ninguna fila vigente");
    const manana = serie.filter((f) => f.desde > hoy).pop() || null;

    const hace30 = serie.find((f) => f.desde <= restarDias(hoy, 30));
    const hace365 = serie.find((f) => f.desde <= restarDias(hoy, 365));
    const ultimoAnio = serie.filter((f) => f.desde >= restarDias(hoy, 365));

    return {
      valor: vigente.valor,
      valorTexto: pesos(vigente.valor),
      desde: vigente.desde,
      desdeTexto: diaLegible(vigente.desde),
      manana: manana ? { valor: manana.valor, valorTexto: pesos(manana.valor), desde: manana.desde, desdeTexto: diaLegible(manana.desde) } : null,
      variacionMes: hace30 ? porcentaje(vigente.valor, hace30.valor) : null,
      variacionAnio: hace365 ? porcentaje(vigente.valor, hace365.valor) : null,
      maximoAnio: ultimoAnio.length ? pesos(Math.max(...ultimoAnio.map((f) => f.valor))) : null,
      minimoAnio: ultimoAnio.length ? pesos(Math.min(...ultimoAnio.map((f) => f.valor))) : null,
      fuente: "Banco de la República, vía datos.gov.co",
    };
  } catch (e) {
    console.warn("[trm] no se pudo traer la TRM en el build:", e.message);
    return null;
  }
};

function restarDias(iso, dias) {
  const d = new Date(iso + "T12:00:00Z");
  d.setUTCDate(d.getUTCDate() - dias);
  return d.toISOString().slice(0, 10);
}

function porcentaje(actual, antes) {
  if (!antes) return null;
  const p = ((actual - antes) / antes) * 100;
  return (p >= 0 ? "+" : "") + p.toFixed(2).replace(".", ",") + "%";
}
