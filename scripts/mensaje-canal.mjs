// Arma el mensaje para pegar a mano en el Canal de WhatsApp, con las notas
// mas recientes ya publicadas. No publica nada: solo imprime el texto listo.
//
// No existe API oficial para publicar en Canales de WhatsApp (verificado en
// docs/estrategia-trafico.md), asi que el paso de pegarlo sigue siendo manual.
// Este script solo ahorra el trabajo de armar el texto y copiar los enlaces.
//
// Uso: npm run mensaje-canal [cuantas]   (por defecto, las ultimas 5 notas)

const FEED_URL = "https://economiasantander.com/feed.xml";
const cuantas = Number(process.argv[2]) || 5;

function decodeEntities(texto) {
  return texto
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");
}

function extraerItems(xml, limite) {
  const bloques = xml.match(/<item>[\s\S]*?<\/item>/g) || [];
  return bloques.slice(0, limite).map((bloque) => {
    const titulo = (bloque.match(/<title>([\s\S]*?)<\/title>/) || [])[1] || "";
    const link = (bloque.match(/<link>([\s\S]*?)<\/link>/) || [])[1] || "";
    return { titulo: decodeEntities(titulo.trim()), link: link.trim() };
  });
}

const res = await fetch(FEED_URL);
if (!res.ok) {
  console.error(`No se pudo leer ${FEED_URL} (HTTP ${res.status}). ¿El sitio está caído?`);
  process.exit(1);
}
const xml = await res.text();
const items = extraerItems(xml, cuantas);

if (!items.length) {
  console.error("El feed respondió pero no encontré notas dentro. Revisa https://economiasantander.com/feed.xml a mano.");
  process.exit(1);
}

const lineas = [];
lineas.push("📰 *Economía Santander* — lo último para leer:");
lineas.push("");
for (const { titulo, link } of items) {
  lineas.push(`• ${titulo}`);
  lineas.push(`  ${link}`);
  lineas.push("");
}
lineas.push("👉 Todas las notas: https://economiasantander.com");

console.log(lineas.join("\n"));
