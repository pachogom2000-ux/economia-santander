const markdownIt = require("markdown-it");

module.exports = function (eleventyConfig) {
  eleventyConfig.addPassthroughCopy("src/assets");
  eleventyConfig.addPassthroughCopy("src/admin");
  eleventyConfig.addPassthroughCopy("src/robots.txt");

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
