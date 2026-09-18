// ads.txt de Google AdSense. Google exige este archivo en la raíz del dominio
// para pagar lo que se muestre en el sitio; sin él, los anuncios salen pero el
// ingreso queda retenido. Solo se escribe cuando hay un identificador de
// editor en _data/publicidad.json; mientras tanto no existe.
module.exports = class {
  data() {
    return {
      eleventyExcludeFromCollections: true,
      permalink: (data) =>
        data.publicidad && data.publicidad.adsense.cliente ? "/ads.txt" : false,
    };
  }
  render(data) {
    const editor = data.publicidad.adsense.cliente.replace(/^ca-/, "");
    return `google.com, ${editor}, DIRECT, f08c47fec0942fa0\n`;
  }
};
