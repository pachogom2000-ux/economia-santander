// Avisa a IndexNow de lo que se acaba de publicar.
//
// El sitio ya servía la clave en /851cd111...txt, pero nadie llamaba nunca al
// API: era una llave sin cerradura. Bing, Yandex, Naver, Seznam y Yep se
// enteraban de una nota nueva cuando pasaran a rastrear por su cuenta, que
// para un dominio nuevo puede tardar semanas. Google no participa en IndexNow
// y se entera por el sitemap, como siempre.
//
// Se ejecuta después de compilar. NUNCA rompe el build: si el API falla, se
// anota y se sigue. Un despliegue no se puede caer porque un buscador esté de
// mal humor.

import { readFile } from "node:fs/promises";

const CLAVE = "851cd111c4cd75b657229a301a84210a";
const HOST = "economiasantander.com";
const UBICACION_CLAVE = `https://${HOST}/${CLAVE}.txt`;
const SITEMAP = "_site/sitemap.xml";

// Solo se avisa de lo publicado o corregido en los últimos días. Enviar el
// sitio entero en cada despliegue es justo lo que IndexNow pide no hacer.
const DIAS = 3;
const TOPE = 50;

function log(msg) {
  console.log(`[indexnow] ${msg}`);
}

// En una previsualización o en una rama no se avisa a nadie: se estaría
// mandando a indexar una URL que no es la definitiva.
function esProduccion() {
  if (process.env.INDEXNOW_FORZAR === "1") return true;
  if (process.env.CONTEXT) return process.env.CONTEXT === "production";
  if (process.env.CF_PAGES_BRANCH) return process.env.CF_PAGES_BRANCH === "main";
  return false;
}

async function urlsRecientes() {
  const xml = await readFile(SITEMAP, "utf8");
  const bloques = xml.match(/<url>[\s\S]*?<\/url>/g) || [];
  const corte = Date.now() - DIAS * 24 * 60 * 60 * 1000;

  const encontradas = [];
  for (const b of bloques) {
    const loc = (b.match(/<loc>(.*?)<\/loc>/) || [])[1];
    const mod = (b.match(/<lastmod>(.*?)<\/lastmod>/) || [])[1];
    if (!loc || !mod) continue; // sin lastmod no hay forma de saber si es nueva
    const t = Date.parse(mod);
    if (!Number.isNaN(t) && t >= corte) encontradas.push(loc);
  }
  return encontradas.slice(0, TOPE);
}

async function main() {
  if (!esProduccion()) {
    log("no es un despliegue de producción; no se avisa a nadie.");
    return;
  }

  let urls;
  try {
    urls = await urlsRecientes();
  } catch (e) {
    log(`no se pudo leer ${SITEMAP}: ${e.message}. Se omite el aviso.`);
    return;
  }

  if (!urls.length) {
    log(`sin publicaciones ni correcciones en los últimos ${DIAS} días. Nada que avisar.`);
    return;
  }

  log(`avisando de ${urls.length} URL(s):`);
  urls.forEach((u) => log(`   ${u}`));

  try {
    const r = await fetch("https://api.indexnow.org/indexnow", {
      method: "POST",
      headers: { "Content-Type": "application/json; charset=utf-8" },
      body: JSON.stringify({
        host: HOST,
        key: CLAVE,
        keyLocation: UBICACION_CLAVE,
        urlList: urls,
      }),
    });

    // 200 = recibido. 202 = recibido, la clave se está comprobando todavía.
    if (r.status === 200 || r.status === 202) {
      log(`aceptado (HTTP ${r.status}).`);
    } else {
      const cuerpo = await r.text().catch(() => "");
      log(`rechazado (HTTP ${r.status}). ${cuerpo.slice(0, 200)}`);
    }
  } catch (e) {
    log(`no se pudo contactar el API: ${e.message}. El despliegue sigue.`);
  }
}

main().catch((e) => {
  log(`error inesperado: ${e.message}. El despliegue sigue.`);
});
