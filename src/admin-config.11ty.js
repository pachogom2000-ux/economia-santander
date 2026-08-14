const fs = require("fs");
const path = require("path");

// Genera /admin/config.yml a partir de src/admin/config.yml, inyectando las
// opciones del desplegable "Orden de la portada".
//
// Por qué existe este archivo: Decap no sabe ordenar un campo de relación. Los
// lista por nombre de archivo y solo enseña 20, así que al superar las 20 notas
// las últimas del alfabeto desaparecían del desplegable. Aquí se generan las
// opciones por fecha, de la más reciente a la más antigua, y se recortan a las
// últimas CUANTAS. Las notas viejas salen del desplegable, que es lo que se
// quiere: la portada se arma con lo reciente.
//
// El config.yml sigue siendo YAML normal y editable a mano. Lo único que este
// archivo toca es la línea marcada.

const CUANTAS = 20;
const MARCA = "# OPCIONES-GENERADAS-EN-EL-BUILD";
const CONFIG = path.join(__dirname, "admin", "config.yml");
const NOTICIAS = path.join(__dirname, "noticias");
const DESTACADAS = path.join(__dirname, "_data", "destacadas.json");

function cabecera(archivo) {
  const texto = fs.readFileSync(path.join(NOTICIAS, archivo), "utf8");
  const bloque = texto.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  const cab = bloque ? bloque[1] : "";
  const campo = (nombre) => {
    const m = cab.match(new RegExp("^" + nombre + ":\\s*(.+)$", "m"));
    return m ? m[1].trim().replace(/^["']|["']$/g, "") : "";
  };
  return {
    slug: archivo.replace(/\.md$/, ""),
    titulo: campo("title") || archivo,
    fecha: campo("date"),
    // Un borrador no puede ir en la portada, así que no se ofrece.
    borrador: /^eleventyExcludeFromCollections:\s*true/m.test(cab),
  };
}

module.exports = class {
  data() {
    return {
      permalink: "/admin/config.yml",
      eleventyExcludeFromCollections: true,
    };
  }

  render() {
    const base = fs.readFileSync(CONFIG, "utf8");

    const notas = fs
      .readdirSync(NOTICIAS)
      .filter((f) => f.endsWith(".md"))
      .map(cabecera)
      .filter((n) => !n.borrador)
      .sort((a, b) => String(b.fecha).localeCompare(String(a.fecha)));

    const recientes = notas.slice(0, CUANTAS);

    // Una nota ya fijada tiene que seguir en la lista aunque se haya quedado
    // vieja: si desaparece de las opciones, Decap la borra en el primer
    // guardado y la portada cambia sin que nadie lo haya pedido.
    let fijadas = [];
    try {
      fijadas = (JSON.parse(fs.readFileSync(DESTACADAS, "utf8")).destacadas) || [];
    } catch (e) {}
    const yaEstan = new Set(recientes.map((n) => n.slug));
    const rezagadas = fijadas
      .filter((s) => !yaEstan.has(s))
      .map((s) => {
        const n = notas.find((x) => x.slug === s);
        return { slug: s, titulo: (n ? n.titulo : s) + " — ya fijada", fecha: "" };
      });

    const opciones = recientes.concat(rezagadas);

    const sangria = " ".repeat(14);
    const lineas = [`${sangria}options:`];
    for (const o of opciones) {
      lineas.push(`${sangria}  - { label: ${JSON.stringify(o.titulo)}, value: ${JSON.stringify(o.slug)} }`);
    }

    if (!base.includes(MARCA)) {
      throw new Error(
        "admin-config: no se encontro la marca " + MARCA + " en src/admin/config.yml"
      );
    }
    return base.replace(new RegExp("^\\s*" + MARCA + "\\s*$", "m"), lineas.join("\n"));
  }
};
