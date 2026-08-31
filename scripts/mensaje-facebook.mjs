// Arma, por cada nota reciente, un texto listo para Facebook y el enlace al
// Depurador de Facebook para esa URL. No publica ni programa nada: solo
// prepara lo necesario para hacerlo a mano, una publicación por nota.
//
// Por qué el Depurador es el paso clave:
// Cuando una nota se programa (o se pega el link) ANTES de que Facebook
// termine de leer sus etiquetas og:*, a veces la deja publicada como texto
// plano con la URL, sin la tarjeta con foto y titular. Abrir el enlace del
// Depurador y darle "Scrape Again" fuerza a Facebook a leer la nota de nuevo
// y guardar la vista previa correcta ANTES de programar el post, así el
// compositor ya la encuentra lista.
//
// Uso: npm run mensaje-facebook [cuantas]   (por defecto, las ultimas 3 notas)

const FEED_URL = "https://economiasantander.com/feed.xml";
const cuantas = Number(process.argv[2]) || 3;

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
    const descripcion = (bloque.match(/<description>([\s\S]*?)<\/description>/) || [])[1] || "";
    const categoria = (bloque.match(/<category>([\s\S]*?)<\/category>/) || [])[1] || "";
    return {
      titulo: decodeEntities(titulo.trim()),
      link: link.trim(),
      descripcion: decodeEntities(descripcion.trim()),
      categoria: decodeEntities(categoria.trim()),
    };
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

console.log(`${items.length} publicación(es) para Facebook — una por nota, no las pegues todas de una vez.\n`);
console.log("=".repeat(70));

items.forEach(({ titulo, link, descripcion, categoria }, i) => {
  const depurador = "https://developers.facebook.com/tools/debug/?q=" + encodeURIComponent(link);
  console.log(`\nPUBLICACIÓN ${i + 1} de ${items.length}${categoria ? " · " + categoria : ""}`);
  console.log("-".repeat(70));
  console.log(`\n1) Antes de programar, abre esto y dale "Scrape Again":\n   ${depurador}`);
  console.log(`\n2) Texto para pegar en Facebook:\n`);
  console.log(`${titulo}\n\n${descripcion}\n\n${link}`);
  console.log("\n" + "=".repeat(70));
});
