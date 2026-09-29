// Índice de palabras del archivo: /archivo/indice.json
//
// El buscador de /archivo/ encuentra por titular y resumen con lo que ya viene
// en la página. Este archivo le añade el TEXTO de cada nota, para que "cacao"
// encuentre también la nota de exportaciones que solo lo menciona en el cuerpo.
//
// El navegador lo pide solo cuando el lector empieza a buscar: quien entra al
// archivo a mirar la lista no se lo baja.
//
// Sale de collections.noticias, así que un borrador
// (eleventyExcludeFromCollections: true) no deja rastro de su texto aquí.
const fs = require("node:fs");
const { palabrasDeNota } = require("../lib/buscar");

module.exports = class {
  data() {
    return {
      permalink: "/archivo/indice.json",
      eleventyExcludeFromCollections: true,
    };
  }

  render({ collections }) {
    const indice = {};
    for (const nota of collections.noticias || []) {
      let md = "";
      try {
        md = fs.readFileSync(nota.inputPath, "utf8");
      } catch {
        // Sin el archivo la nota se sigue encontrando por titular y resumen.
      }
      indice[nota.url] = palabrasDeNota(md);
    }
    return JSON.stringify(indice);
  }
};
