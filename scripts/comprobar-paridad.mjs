/**
 * Compara el sitio candidato (Cloudflare) contra el que está publicado
 * (Netlify) y dice si se puede hacer el corte. Es la prueba de aceptación de
 * la migración: mientras esto no dé todo en verde, no se toca el dominio.
 *
 *   npm run cf:check                              (contra el Worker local)
 *   node scripts/comprobar-paridad.mjs https://economia-santander.<sub>.workers.dev
 *
 * No modifica nada: solo hace peticiones GET.
 */

const candidato = (process.argv[2] || "http://127.0.0.1:8787").replace(/\/+$/, "");
const referencia = (process.argv[3] || "https://economiasantander.com").replace(/\/+$/, "");

const SIMBOLOS = ["EC", "CIB", "TGLS", "BZ=F", "^GSPC", "ICOLCAP.CL"];
const verde = (t) => `\x1b[32m${t}\x1b[0m`;
const rojo = (t) => `\x1b[31m${t}\x1b[0m`;

let fallos = 0;
let avisos = 0;

function ok(nombre, condicion, detalle = "") {
  if (condicion) {
    console.log(`  ${verde("✓")} ${nombre}${detalle ? "  " + detalle : ""}`);
  } else {
    fallos++;
    console.log(`  ${rojo("✗")} ${nombre}${detalle ? "  " + detalle : ""}`);
  }
}

function aviso(texto) {
  avisos++;
  console.log(`  ! ${texto}`);
}

async function pedir(url, opciones = {}) {
  try {
    return await fetch(url, { redirect: "manual", ...opciones });
  } catch (e) {
    return { status: 0, headers: new Headers(), text: async () => String(e.message || e) };
  }
}

console.log(`\nCandidato:  ${candidato}`);
console.log(`Referencia: ${referencia}\n`);

// ── 1. Todas las páginas del sitemap responden igual en las dos plataformas ──
console.log("1. Paridad de páginas");
const smResp = await pedir(candidato + "/sitemap.xml");
const sitemap = await smResp.text();
const rutas = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => new URL(m[1]).pathname);

if (!rutas.length) {
  ok("el sitemap trae URLs", false, "no se pudo leer /sitemap.xml");
} else {
  let distintas = 0;
  let caidas = 0;
  for (const ruta of rutas) {
    const [a, b] = await Promise.all([pedir(candidato + ruta), pedir(referencia + ruta)]);
    if (a.status !== 200) {
      caidas++;
      console.log(`  ${rojo("✗")} ${ruta} → ${a.status} en el candidato`);
    }
    if (a.status !== b.status) {
      distintas++;
      console.log(`  ${rojo("✗")} ${ruta} → candidato ${a.status}, referencia ${b.status}`);
    }
  }
  ok(`las ${rutas.length} páginas del sitemap responden 200`, caidas === 0);
  ok("ninguna difiere de lo publicado", distintas === 0);
}

// ── 2. La 404 es de verdad ──────────────────────────────────────────────────
console.log("\n2. Página de error");
const r404 = await pedir(candidato + "/una-url-que-no-existe-jamas");
const cuerpo404 = await r404.text();
ok("una URL inexistente devuelve 404, no 200", r404.status === 404, `(${r404.status})`);
ok("sirve la 404 del portal, no una en blanco", /Economía Santander/.test(cuerpo404));

// ── 3. Cabeceras ────────────────────────────────────────────────────────────
console.log("\n3. Cabeceras");
const portada = await pedir(candidato + "/");
const hsts = portada.headers.get("strict-transport-security") || "";
ok("HSTS presente y de un año", /max-age=31536000/.test(hsts), hsts || "(ausente)");
ok("nosniff", (portada.headers.get("x-content-type-options") || "") === "nosniff");
const ccHtml = portada.headers.get("cache-control") || "";
ok("el HTML revalida siempre", /must-revalidate/.test(ccHtml), ccHtml || "(ausente)");
const css = await pedir(candidato + "/assets/style.css");
const ccCss = css.headers.get("cache-control") || "";
ok("la hoja de estilos revalida siempre", /must-revalidate/.test(ccCss), ccCss || "(ausente)");

// ── 4. La función de bolsa ──────────────────────────────────────────────────
console.log("\n4. Función de bolsa");
for (const s of SIMBOLOS) {
  const r = await pedir(`${candidato}/.netlify/functions/quote?symbol=${encodeURIComponent(s)}&range=1mo`);
  let datos = {};
  try {
    datos = JSON.parse(await r.text());
  } catch {}
  const bien = r.status === 200 && Array.isArray(datos.puntos) && datos.puntos.length > 5;
  ok(s.padEnd(11), bien, bien ? `${datos.puntos.length} puntos` : `status ${r.status} ${datos.error || ""}`);
  if (r.status === 429 || r.status === 403) {
    aviso("posible bloqueo del proveedor a las IP de Cloudflare — revisar antes de cortar");
  }
}
const malSimbolo = await pedir(candidato + "/api/quote?symbol=AAPL");
ok("rechaza símbolos fuera de la lista blanca", malSimbolo.status === 400, `(${malSimbolo.status})`);

// ── 5. El mismo HTML, no solo el mismo código de estado ─────────────────────
console.log("\n5. Contenido idéntico");
// Se normaliza el fin de línea antes de comparar: en Windows el repositorio se
// descarga con CRLF, así que un build local sale distinto byte a byte de uno
// hecho en Linux aunque el contenido sea exactamente el mismo. Sin esto, las
// cuatro páginas darían "difiere" siempre y el aviso dejaría de significar algo.
const sha = async (texto) => {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(texto.replace(/\r\n/g, "\n")));
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, "0")).join("").slice(0, 12);
};
for (const ruta of ["/", "/quien-soy/", "/dolar-hoy/", "/multimedia/"]) {
  const [a, b] = await Promise.all([pedir(candidato + ruta), pedir(referencia + ruta)]);
  const [ha, hb] = await Promise.all([sha(await a.text()), sha(await b.text())]);
  if (ha !== hb) {
    aviso(`${ruta} difiere (${ha} vs ${hb}) — normal si el despliegue publicado es de otro commit`);
  } else {
    ok(ruta, true, "idéntico");
  }
}

// ── Resultado ───────────────────────────────────────────────────────────────
console.log("");
if (fallos === 0) {
  console.log(verde(`Todo en verde${avisos ? ` (con ${avisos} aviso${avisos > 1 ? "s" : ""} para revisar a ojo)` : ""}.`));
  console.log("El candidato se comporta igual que lo publicado.\n");
} else {
  console.log(rojo(`${fallos} comprobación${fallos > 1 ? "es" : ""} sin pasar. No cortar todavía.\n`));
  process.exitCode = 1;
}
