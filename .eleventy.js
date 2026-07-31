const markdownIt = require("markdown-it");
const { eleventyImageTransformPlugin } = require("@11ty/eleventy-img");

module.exports = function (eleventyConfig) {
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

  eleventyConfig.addFilter("jsonify", (value) => JSON.stringify(value));

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
