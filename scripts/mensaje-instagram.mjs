// Arma, por cada nota reciente, el texto listo para Instagram (con hashtags)
// y te dice qué foto adjuntar. No publica nada: Instagram no tiene forma de
// publicar sin adjuntar la imagen a mano, así que ese paso queda siempre para
// quien publique.
//
// Por qué "link en la bio" y no la URL pegada: Instagram NO vuelve clicable
// ningún link dentro del texto de una publicación (solo el de la biografía,
// o el sticker de link en Historias). Pegar la URL completa en el texto no
// sirve de nada — así que el texto le recuerda al lector ir a la bio.
//
// Uso: npm run mensaje-instagram [cuantas]   (por defecto, las ultimas 3 notas)

const FEED_URL = "https://economiasantander.com/feed.xml";
const cuantas = Number(process.argv[2]) || 3;

const HASHTAGS_FIJOS = "#EconomíaSantander #Santander #Bucaramanga";

function decodeEntities(texto) {
  return texto
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");
}

function hashtagDeCategoria(categoria) {
  if (!categoria) return "";
  const limpio = categoria
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "") // quita tildes, un hashtag no las lleva bien
    .replace(/[^a-zA-Z0-9]+/g, "");
  return limpio ? `#${limpio}` : "";
}

function extraerItems(xml, limite) {
  const bloques = xml.match(/<item>[\s\S]*?<\/item>/g) || [];
  return bloques.slice(0, limite).map((bloque) => {
    const titulo = (bloque.match(/<title>([\s\S]*?)<\/title>/) || [])[1] || "";
    const link = (bloque.match(/<link>([\s\S]*?)<\/link>/) || [])[1] || "";
    const descripcion = (bloque.match(/<description>([\s\S]*?)<\/description>/) || [])[1] || "";
    const categoria = (bloque.match(/<category>([\s\S]*?)<\/category>/) || [])[1] || "";
    const imagen = (bloque.match(/<enclosure url="([\s\S]*?)"/) || [])[1] || "";
    return {
      titulo: decodeEntities(titulo.trim()),
      link: link.trim(),
      descripcion: decodeEntities(descripcion.trim()),
      categoria: decodeEntities(categoria.trim()),
      imagen: imagen.trim(),
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

console.log(`${items.length} publicación(es) para Instagram — una por nota.\n`);
console.log("Antes de arrancar: revisa que el link de tu bio apunte a https://economiasantander.com\n");
console.log("=".repeat(70));

items.forEach(({ titulo, descripcion, categoria, imagen }, i) => {
  const hashtagCategoria = hashtagDeCategoria(categoria);
  const hashtags = [HASHTAGS_FIJOS, hashtagCategoria].filter(Boolean).join(" ");

  console.log(`\nPUBLICACIÓN ${i + 1} de ${items.length}${categoria ? " · " + categoria : ""}`);
  console.log("-".repeat(70));
  console.log(
    imagen
      ? `\n1) Foto para adjuntar (descárgala y súbela a mano):\n   ${imagen}`
      : `\n1) Esta nota no tiene foto propia — no publiques sin una. Ver CLAUDE.md, sección Imágenes.`
  );
  console.log(`\n2) Texto para pegar en Instagram:\n`);
  console.log(`${titulo}\n\n${descripcion}\n\n🔗 Link en la bio.\n\n${hashtags}`);
  console.log("\n" + "=".repeat(70));
});
