const fs = require("fs");
const path = require("path");

// Índice de previsualización. Solo existe cuando corres el sitio en local
// con `npm start`: en producción `permalink: false` hace que Eleventy no
// escriba el archivo, así que esta página nunca se publica.
//
// Sirve para ver una nota tal como quedará antes de hacer push. Los
// borradores (los que llevan eleventyExcludeFromCollections) no salen en la
// portada, pero sí tienen página propia; aquí quedan listados con su enlace.

const CARPETA = path.join(__dirname, "noticias");

function esLocal() {
  const modo = process.env.ELEVENTY_RUN_MODE;
  return modo === "serve" || modo === "watch";
}

// Se lee el front matter con expresiones regulares en vez de gray-matter
// para no sumar una dependencia solo por una pantalla de uso interno.
function leerCabecera(archivo) {
  const texto = fs.readFileSync(path.join(CARPETA, archivo), "utf8");
  const bloque = texto.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  const cabecera = bloque ? bloque[1] : "";
  const campo = (nombre) => {
    const m = cabecera.match(new RegExp("^" + nombre + ":\\s*(.+)$", "m"));
    return m ? m[1].trim().replace(/^["']|["']$/g, "") : "";
  };
  return {
    slug: archivo.replace(/\.md$/, ""),
    titulo: campo("title") || archivo,
    fecha: campo("date").slice(0, 10),
    categoria: campo("categoria"),
    autor: campo("autor"),
    borrador: /^eleventyExcludeFromCollections:\s*true/m.test(cabecera),
  };
}

module.exports = class {
  data() {
    return {
      permalink: esLocal() ? "/borradores/index.html" : false,
      eleventyExcludeFromCollections: true,
    };
  }

  render(data) {
    let notas = [];
    try {
      notas = fs
        .readdirSync(CARPETA)
        .filter((f) => f.endsWith(".md"))
        .map(leerCabecera)
        .sort((a, b) => (b.fecha || "").localeCompare(a.fecha || ""));
    } catch (e) {
      return "<p>No se pudo leer src/noticias/</p>";
    }

    const enPortada = new Set(
      (data.collections.noticias || []).map(
        (p) => (p.page && p.page.fileSlug) || p.fileSlug || ""
      )
    );

    const fila = (n) => {
      const publicada = enPortada.has(n.slug);
      const etiqueta = publicada
        ? '<span class="est pub">En portada</span>'
        : '<span class="est bor">Borrador</span>';
      return `<tr>
        <td>${etiqueta}</td>
        <td><a href="/noticias/${n.slug}/">${n.titulo}</a>
            <div class="meta">${n.categoria || "sin categoría"} · ${n.fecha || "sin fecha"} · ${n.autor || "sin autor"}</div></td>
      </tr>`;
    };

    const borradores = notas.filter((n) => !enPortada.has(n.slug));
    const publicadas = notas.filter((n) => enPortada.has(n.slug));

    return `<!doctype html>
<html lang="es">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex, nofollow">
<title>Borradores — previsualización local</title>
<style>
  body { font-family: system-ui, -apple-system, "Segoe UI", sans-serif; max-width: 900px;
         margin: 0 auto; padding: 24px 18px 60px; line-height: 1.5; color: #16241a; }
  h1 { font-size: 24px; margin: 0 0 4px; }
  .aviso { background: #FFF6DA; border: 1px solid #E8CE7A; border-radius: 6px;
           padding: 12px 14px; margin: 16px 0 24px; font-size: 14px; }
  h2 { font-size: 16px; text-transform: uppercase; letter-spacing: .04em;
       color: #5b6b5f; margin: 28px 0 8px; }
  table { width: 100%; border-collapse: collapse; }
  td { border-top: 1px solid #e3e8e4; padding: 10px 8px; vertical-align: top; }
  td:first-child { width: 110px; }
  a { color: #0B6E3B; font-weight: 600; text-decoration: none; }
  a:hover { text-decoration: underline; }
  .meta { font-size: 12.5px; color: #6b7a6f; margin-top: 2px; }
  .est { display: inline-block; font-size: 11.5px; font-weight: 700; padding: 3px 8px;
         border-radius: 999px; text-transform: uppercase; letter-spacing: .03em; }
  .pub { background: #E3F3E9; color: #0B6E3B; }
  .bor { background: #FDE8E4; color: #A33B22; }
  .vacio { color: #6b7a6f; font-size: 14px; font-style: italic; }
</style>
</head>
<body>
  <h1>Previsualización de notas</h1>
  <p class="meta">${notas.length} notas en <code>src/noticias/</code></p>

  <div class="aviso">
    <b>Esta página solo existe en tu equipo.</b> No se publica: en el build de
    producción no se genera. Úsala para abrir una nota y verla tal como quedará
    antes de hacer push.
  </div>

  <h2>Borradores — no salen en la portada</h2>
  ${borradores.length
    ? `<table>${borradores.map(fila).join("")}</table>`
    : '<p class="vacio">No hay borradores pendientes.</p>'}

  <h2>Publicadas</h2>
  ${publicadas.length
    ? `<table>${publicadas.map(fila).join("")}</table>`
    : '<p class="vacio">Todavía no hay notas publicadas.</p>'}
</body>
</html>`;
  }
};
