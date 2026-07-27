module.exports = function (eleventyConfig) {
  eleventyConfig.addPassthroughCopy("src/assets");
  eleventyConfig.addPassthroughCopy("src/admin");
  eleventyConfig.addPassthroughCopy("src/robots.txt");

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

  // URL de embed de Spotify a partir del enlace normal de un episodio/show
  eleventyConfig.addFilter("spotifyEmbed", (value) => {
    if (!value) return "";
    return String(value).split("?")[0].replace("open.spotify.com/", "open.spotify.com/embed/");
  });

  // Selección determinística de anuncio: misma página → mismo anuncio,
  // páginas/categorías distintas → rotación distinta. `excluirId` evita
  // repetir un anuncio ya mostrado en la misma página.
  eleventyConfig.addFilter("anuncioPara", (lista, categoria, semilla, excluirId) => {
    const activos = (lista || []).filter((a) => a.activo !== false && a.id !== excluirId);
    if (!activos.length) return null;
    const cat = String(categoria || "").toLowerCase();
    let pool = activos.filter((a) =>
      (a.categorias || []).some((c) => String(c).toLowerCase() === cat)
    );
    if (!pool.length) pool = activos;
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
