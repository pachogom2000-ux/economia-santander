const markdownIt = require("markdown-it");
const Image = require("@11ty/eleventy-img");
const { eleventyImageTransformPlugin } = require("@11ty/eleventy-img");
const crypto = require("node:crypto");
const fsSync = require("node:fs");

// Huella del CSS, como la que ya llevan las fuentes.
//
// La hoja se servía con `max-age=0, must-revalidate` por miedo —fundado— a
// servir una versión vieja. El precio era que el navegador preguntaba al
// servidor si había cambiado ANTES de pintar nada, en cada visita: 360 ms de
// bloqueo que pagaba hasta quien ya tenía el archivo guardado.
//
// Con la huella en el nombre ese miedo desaparece: si el contenido cambia,
// cambia el nombre, y es IMPOSIBLE servir una versión vieja. Por eso se puede
// cachear un año (ver src/_headers).
//
// Se calcula al cargar la configuración. En `--serve` hay que reiniciar para
// que cambie; en producción cada despliegue arranca de cero, así que da igual.
const CSS_ORIGEN = "src/assets/style.css";
const cssHuella = crypto
  .createHash("sha256")
  .update(fsSync.readFileSync(CSS_ORIGEN))
  .digest("hex")
  .slice(0, 10);
const CSS_SALIDA = `assets/css/style.${cssHuella}.css`;

module.exports = function (eleventyConfig) {
  // La copia con huella va a su propia carpeta para que la regla de caché de
  // un año en _headers apunte SOLO a archivos con huella. /assets/style.css
  // se sigue publicando (lo copia el passthrough de la carpeta) y conserva su
  // cabecera de revalidar siempre: así el HTML viejo que quedó cacheado en
  // algún navegador no se queda sin estilos.
  eleventyConfig.addPassthroughCopy({ [CSS_ORIGEN]: CSS_SALIDA });
  eleventyConfig.addGlobalData("cssUrl", `/${CSS_SALIDA}`);

  // Todas las <img> del sitio se reescriben en el build con varias medidas.
  // Antes se servía el original a cualquier tamaño: una foto de 4,5 MB y
  // 8688 px de ancho se pintaba a 276 px en un teléfono. El navegador ahora
  // baja la medida que le sirve.
  //
  // El tope se queda en 1600 y NUNCA baja de 1200: Google Discover exige
  // imágenes de al menos 1200 px de ancho. Y el og:image sigue siendo el JPEG
  // original a propósito — WhatsApp es el canal real de este portal y no se
  // le va a mandar un WebP.
  eleventyConfig.addPlugin(eleventyImageTransformPlugin, {
    formats: ["webp", "auto"],
    widths: [400, 800, 1200, 1600],
    failOnError: false,
    htmlOptions: {
      imgAttributes: { loading: "lazy", decoding: "async" },
      pictureAttributes: {},
    },
    sharpOptions: { animated: false },
    defaultAttributes: {
      sizes: "(max-width: 700px) 100vw, 700px",
    },
  });
  eleventyConfig.addPassthroughCopy("src/assets");
  eleventyConfig.addPassthroughCopy("src/admin");
  eleventyConfig.addPassthroughCopy("src/robots.txt");
  // Cabeceras del sitio. Netlify y Cloudflare leen el mismo archivo, así que
  // las dos plataformas sirven exactamente igual mientras convivan.
  eleventyConfig.addPassthroughCopy({ "src/_headers": "_headers" });
  // Verificación de propiedad de Search Console. El passthrough es OBLIGATORIO:
  // sin él Eleventy lo procesa como plantilla y lo escribe en
  // /google.../index.html, que no es la ruta que Google comprueba.
  eleventyConfig.addPassthroughCopy("src/google91c787862403ac92.html");
  // Clave de IndexNow: avisa a Bing, Yandex y otros buscadores cuando hay
  // contenido nuevo, sin cuentas ni consolas. Google no participa.
  eleventyConfig.addPassthroughCopy("src/851cd111c4cd75b657229a301a84210a.txt");
  // Verificación de propiedad de Bing Webmaster Tools. Sin el passthrough,
  // Eleventy ni siquiera copia el .xml —no es un formato de plantilla— y la
  // ruta devolvería 404. El nombre va con mayúsculas EXACTAS: Bing comprueba
  // /BingSiteAuth.xml y el alojamiento distingue mayúsculas de minúsculas.
  eleventyConfig.addPassthroughCopy("src/BingSiteAuth.xml");

  // Los enlaces externos se abren en una pestaña nueva, como pide la guía SEO.
  // Aplica también a lo que se escriba desde el CMS, sin tener que recordarlo.
  const md = markdownIt({ html: true, linkify: true });
  const renderPorDefecto =
    md.renderer.rules.link_open ||
    function (tokens, idx, options, env, self) {
      return self.renderToken(tokens, idx, options, env, self);
    };
  md.renderer.rules.link_open = function (tokens, idx, options, env, self) {
    const href = tokens[idx].attrGet("href") || "";
    if (/^https?:\/\//i.test(href)) {
      tokens[idx].attrSet("target", "_blank");
      tokens[idx].attrSet("rel", "noopener noreferrer");
    }
    return renderPorDefecto(tokens, idx, options, env, self);
  };

  // IDs automáticos en los encabezados, para poder enlazar a una sección
  // concreta: el pie apunta al aviso financiero y al derecho de rectificación.
  // Se hace a mano en vez de con markdown-it-anchor para no sumar dependencia.
  md.renderer.rules.heading_open = function (tokens, idx, options, env, self) {
    const inline = tokens[idx + 1];
    if (inline && inline.type === "inline") {
      const slug = inline.content
        .toLowerCase()
        .normalize("NFD")
        .replace(/[̀-ͯ]/g, "")
        .replace(/[^a-z0-9\s-]/g, "")
        .trim()
        .replace(/\s+/g, "-");
      if (slug) tokens[idx].attrSet("id", slug);
    }
    return self.renderToken(tokens, idx, options, env, self);
  };

  // Las fotos del cuerpo de la nota las procesa el plugin de imágenes, que
  // repone width y height con la relación de aspecto REAL de cada archivo.
  // Antes se declaraban 1200x700 a mano: reservaba el espacio, sí, pero
  // deformaba las que no cumplían la norma y —lo importante— impedía que el
  // plugin generara más de una medida.
  md.renderer.rules.image = function (tokens, idx, options, env, self) {
    const token = tokens[idx];
    const src = token.attrGet("src") || "";
    if (/^\/assets\/uploads\//.test(src)) {
      token.attrSet("loading", "lazy");
      token.attrSet("decoding", "async");
    }
    token.attrSet("alt", token.content);
    return self.renderToken(tokens, idx, options, env, self);
  };

  eleventyConfig.setLibrary("md", md);

  eleventyConfig.addFilter("readableDate", (dateObj) => {
    return new Date(dateObj).toLocaleDateString("es-CO", {
      day: "numeric",
      month: "long",
      year: "numeric",
      timeZone: "America/Bogota",
    });
  });

  eleventyConfig.addFilter("isoDate", (dateObj) => new Date(dateObj).toISOString());

  // "2026-08-01" -> "sábado 1 de agosto". Para el calendario de sábados del
  // pico y placa. Mediodía UTC para que la zona horaria no corra el día.
  eleventyConfig.addFilter("fechaCortaCo", (iso) =>
    new Date(iso + "T12:00:00Z").toLocaleDateString("es-CO", {
      weekday: "long",
      day: "numeric",
      month: "long",
      timeZone: "America/Bogota",
    })
  );

  // Fecha de última modificación. Se toma el MÁXIMO, no "updated si existe":
  // con `updated or date`, una nota con una corrección mal fechada le decía a
  // Google que se modificó ANTES de publicarse, y en el sitemap hacía
  // retroceder el lastmod. Google descarta el lastmod de un sitio entero si lo
  // pilla siendo inconsistente.
  const masReciente = (fecha, actualizada) => {
    const d = new Date(fecha);
    if (!actualizada) return d;
    const u = new Date(actualizada);
    return u > d ? u : d;
  };
  eleventyConfig.addFilter("fechaModificacion", (fecha, actualizada) =>
    masReciente(fecha, actualizada).toISOString()
  );
  eleventyConfig.addFilter("fechaModificacionCorta", (fecha, actualizada) =>
    masReciente(fecha, actualizada).toISOString().slice(0, 10)
  );

  // RSS 2.0 exige fechas en RFC-822 ("Wed, 29 Jul 2026 12:19:00 GMT"), no en
  // ISO. Muchos lectores toleran el ISO, pero los validadores lo marcan como
  // inválido y algunos agregadores descartan el ítem entero.
  eleventyConfig.addFilter("fechaRss", (fecha, actualizada) =>
    masReciente(fecha, actualizada).toUTCString()
  );

  // Fecha de la nota más reciente de una sección: es el único `lastmod`
  // honesto que se le puede dar a una página de sección, porque sí cambia
  // cuando entra una nota.
  eleventyConfig.addFilter("ultimaDeSeccion", (lista, categoria) => {
    const cat = String(categoria || "").toLowerCase();
    const fechas = (lista || [])
      .filter((p) => String(p.data.categoria || "").toLowerCase() === cat)
      .map((p) => masReciente(p.date, p.data.updated).getTime());
    return fechas.length ? new Date(Math.max(...fechas)).toISOString().slice(0, 10) : "";
  });

  eleventyConfig.addFilter("jsonify", (value) => JSON.stringify(value));

  // Medidas REALES de una foto, leídas de la cabecera del archivo. Estaban
  // quemadas en 1200x700 para todo el sitio, aunque las fotos van de 724x483
  // a 8688x5792: se le declaraba a Google y a WhatsApp una medida que no era
  // la del archivo. Devuelve null si la foto no existe, y entonces la
  // plantilla simplemente no declara medidas — mejor callar que mentir.
  const fs = require("fs");
  const path = require("path");
  const imageSize = require("image-size");
  const medirImagen = imageSize.imageSize || imageSize;
  const medidasCache = new Map();
  eleventyConfig.addFilter("medidas", (ruta) => {
    if (!ruta) return null;
    if (medidasCache.has(ruta)) return medidasCache.get(ruta);
    let r = null;
    try {
      const archivo = path.join("src", String(ruta).replace(/^\//, ""));
      const { width, height } = medirImagen(fs.readFileSync(archivo));
      if (width && height) r = { width, height };
    } catch (e) {
      r = null;
    }
    medidasCache.set(ruta, r);
    return r;
  });

  // Imagen de vista previa para WhatsApp, Facebook y buscadores.
  //
  // Se generaba apuntando al ORIGINAL, y algunos originales pesan 4,5 MB con
  // 8688 px de ancho. WhatsApp no descarga imágenes así para pintar la vista
  // previa: el enlace sale sin foto justo en el canal por el que llega la
  // mayoría de los lectores de este portal.
  //
  // Aquí se genera una versión de 1200 px en JPEG: por encima del mínimo de
  // 1200 que exige Google Discover, y en JPEG porque WhatsApp no come WebP.
  const ogCache = new Map();
  eleventyConfig.addFilter("imagenVistaPrevia", (ruta) => {
    if (!ruta) return null;
    if (ogCache.has(ruta)) return ogCache.get(ruta);
    const archivo = path.join("src", String(ruta).replace(/^\//, ""));
    const opciones = {
      widths: [1200],
      formats: ["jpeg"],
      outputDir: "./_site/img/",
      urlPath: "/img/",
      filenameFormat: (id, src, width, format) => `og-${id}-${width}.${format}`,
    };
    let r = null;
    try {
      // Se dispara la generación (asíncrona, escribe el archivo) y se piden
      // los datos de forma síncrona para poder devolver la URL ya en esta
      // pasada de la plantilla.
      Image(archivo, opciones);
      const stats = Image.statsSync(archivo, opciones);
      const jpeg = stats && stats.jpeg && stats.jpeg[stats.jpeg.length - 1];
      if (jpeg) r = { url: jpeg.url, width: jpeg.width, height: jpeg.height };
    } catch (e) {
      r = null; // Si falla, la plantilla cae al original: mejor eso que nada.
    }
    ogCache.set(ruta, r);
    return r;
  });

  // ID de YouTube a partir de una URL completa o del ID pelado
  eleventyConfig.addFilter("ytId", (value) => {
    if (!value) return "";
    const m = String(value).match(
      /(?:youtube\.com\/(?:watch\?.*v=|embed\/|shorts\/|live\/)|youtu\.be\/)([\w-]{6,})/
    );
    return m ? m[1] : String(value).trim();
  });

  // URL de embed de Spotify a partir del enlace normal de un episodio/show.
  // Valida dominio y forma: cualquier otra cosa (incluido javascript:) devuelve
  // cadena vacía y la plantilla no pinta el iframe. También tolera el segmento
  // regional /intl-es/ que trae el enlace al copiarlo desde Spotify en español.
  eleventyConfig.addFilter("spotifyEmbed", (value) => {
    if (!value) return "";
    const limpio = String(value).trim().split("?")[0];
    const m = limpio.match(
      /^https:\/\/open\.spotify\.com\/(?:intl-[a-zA-Z-]+\/)?(episode|show|track|album|playlist)\/([A-Za-z0-9]+)\/?$/
    );
    return m ? `https://open.spotify.com/embed/${m[1]}/${m[2]}` : "";
  });

  // Selección determinística de anuncio: misma página → mismo anuncio,
  // páginas/categorías distintas → rotación distinta. `excluirId` evita
  // repetir un anuncio ya mostrado en la misma página. La categoría es un
  // filtro DURO: si ningún anuncio compró esa categoría, no se muestra nada
  // (así se cumple lo que promete el hint del CMS al anunciante).
  eleventyConfig.addFilter("anuncioPara", (lista, categoria, semilla, excluirId) => {
    const activos = (lista || []).filter(
      (a) => a.activo !== false && !(excluirId != null && a.id === excluirId)
    );
    if (!activos.length) return null;
    const cat = String(categoria || "").toLowerCase();
    const pool = activos.filter((a) =>
      (a.categorias || []).some((c) => String(c).toLowerCase() === cat)
    );
    if (!pool.length) return null;
    const s = String(semilla || "");
    let h = 0;
    for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
    return pool[h % pool.length];
  });

  // Notas de una categoría, de la más reciente a la más vieja.
  eleventyConfig.addFilter("porCategoria", (lista, categoria, cuantas) => {
    const cat = String(categoria || "").toLowerCase();
    const encontradas = (lista || [])
      .filter((p) => String(p.data.categoria || "").toLowerCase() === cat)
      .sort((a, b) => new Date(b.date) - new Date(a.date));
    return cuantas ? encontradas.slice(0, cuantas) : encontradas;
  });

  // Guías y glosarios: contenido de consulta permanente, marcado con
  // "guia: true" en el front matter.
  eleventyConfig.addFilter("soloGuias", (lista, cuantas) => {
    const encontradas = (lista || [])
      .filter((p) => p.data.guia)
      .sort((a, b) => new Date(b.date) - new Date(a.date));
    return cuantas ? encontradas.slice(0, cuantas) : encontradas;
  });

  // Orden de la portada. Las notas fijadas en _data/portada.json van primero y
  // en ese orden; el resto sigue por fecha, de la más reciente a la más vieja.
  // Con la lista vacía la portada se comporta como siempre, así que fijar es
  // opcional. Un slug que ya no exista (nota borrada, despublicada o todavía en
  // borrador) se ignora en silencio: la portada nunca queda con un hueco.
  eleventyConfig.addFilter("ordenarPortada", (lista, destacadas) => {
    const notas = lista || [];
    const slugDe = (p) => (p.page && p.page.fileSlug) || p.fileSlug || "";
    const fijadas = [];
    (destacadas || []).forEach((slug) => {
      const nota = notas.find((p) => slugDe(p) === slug);
      if (nota && !fijadas.includes(nota)) fijadas.push(nota);
    });
    const resto = notas
      .filter((p) => !fijadas.includes(p))
      .sort((a, b) => new Date(b.date) - new Date(a.date));
    return fijadas.concat(resto);
  });

  // Todas las secciones del portal, en el orden en que se muestran. Sale de
  // _data/secciones.json para que la taxonomía viva en un solo lugar: el
  // menú, la portada y las páginas de sección leen de aquí.
  eleventyConfig.addCollection("secciones", (api) => {
    const datos = require("./src/_data/secciones.json");
    return [].concat(datos.principales, datos.complementarias);
  });

  // Notas para seguir leyendo al final de un artículo: primero las de la
  // misma categoría (de la más reciente a la más vieja) y luego el resto,
  // siempre sin repetir la que se está leyendo.
  eleventyConfig.addFilter("relacionadas", (lista, urlActual, categoria, cuantas) => {
    const otras = (lista || []).filter((p) => p.url !== urlActual);
    const reciente = (a, b) => new Date(b.date) - new Date(a.date);
    const cat = String(categoria || "").toLowerCase();
    const mismas = otras
      .filter((p) => String(p.data.categoria || "").toLowerCase() === cat)
      .sort(reciente);
    const demas = otras
      .filter((p) => String(p.data.categoria || "").toLowerCase() !== cat)
      .sort(reciente);
    return mismas.concat(demas).slice(0, cuantas || 3);
  });

  eleventyConfig.addGlobalData("eleventyComputed", {
    description: (data) => data.description || data.excerpt,
  });

  return {
    dir: {
      input: "src",
      output: "_site",
      includes: "_includes",
    },
  };
};
