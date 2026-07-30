/**
 * Worker de Cloudflare para Economía Santander.
 *
 * Hace dos cosas:
 *   1. Sirve el sitio estático que genera Eleventy en _site (vía el binding
 *      ASSETS). Esas peticiones NO invocan este código y no se cobran.
 *   2. Atiende la función de bolsa, que antes vivía en Netlify Functions.
 *
 * La ruta vieja /.netlify/functions/quote se conserva a propósito: así el
 * sitio funciona igual en Netlify y en Cloudflare durante la convivencia, sin
 * tocar src/assets/indicadores.js. Cuando Cloudflare quede como único hosting
 * se puede pasar el front a /api/quote y retirar la ruta vieja.
 */
const PERMITIDOS = new Set(["EC", "CIB", "TGLS", "BZ=F", "^GSPC", "ICOLCAP.CL"]);
const RANGOS = new Set(["1mo", "3mo", "6mo", "1y", "5y"]);
const RUTAS_QUOTE = new Set(["/.netlify/functions/quote", "/api/quote"]);

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    const esPrueba = url.hostname.endsWith(".workers.dev");

    // Mientras Cloudflare y Netlify convivan hay dos copias del sitio en
    // internet. A la de pruebas se le cierra la puerta a los buscadores para
    // que no compita con el portal. Se hace por robots.txt y no con una
    // cabecera en cada página a propósito: Cloudflare sirve los archivos
    // estáticos SIN ejecutar este código (por eso no se cobran), así que una
    // cabecera por página no llegaría a las páginas — comprobado — y forzarla
    // exigiría `run_worker_first` a secas, que vuelve cobrable todo el sitio.
    // Por eso wrangler.jsonc encamina solo /robots.txt hacia aquí.
    // Al pasar al dominio propio esto deja de aplicar solo.
    if (esPrueba && url.pathname === "/robots.txt") {
      return new Response("User-agent: *\nDisallow: /\n", {
        status: 200,
        headers: {
          "Content-Type": "text/plain; charset=utf-8",
          "X-Robots-Tag": "noindex, nofollow",
          "Cache-Control": "no-store",
        },
      });
    }

    // Todo lo que no sea la función lo resuelve el sitio estático.
    if (!RUTAS_QUOTE.has(url.pathname)) {
      const respuesta = await env.ASSETS.fetch(request);
      if (!esPrueba) return respuesta;
      // Lo que sí pasa por aquí (la 404, por ejemplo) se marca también.
      const copia = new Response(respuesta.body, respuesta);
      copia.headers.set("X-Robots-Tag", "noindex, nofollow");
      return copia;
    }

    const symbol = String(url.searchParams.get("symbol") || "").toUpperCase();
    const pedido = url.searchParams.get("range");
    const range = RANGOS.has(pedido) ? pedido : "6mo";

    const headers = {
      "Content-Type": "application/json; charset=utf-8",
      "Access-Control-Allow-Origin": "*",
      "Cache-Control": "public, max-age=900, s-maxage=900",
    };

    if (!PERMITIDOS.has(symbol)) {
      return new Response(JSON.stringify({ error: "símbolo no permitido" }), {
        status: 400,
        headers,
      });
    }

    try {
      const destino =
        "https://query1.finance.yahoo.com/v8/finance/chart/" +
        encodeURIComponent(symbol) +
        "?range=" + range + "&interval=1d";

      // cacheTtl evita mandarle a Yahoo una petición por cada visita.
      const r = await fetch(destino, {
        headers: { "User-Agent": "Mozilla/5.0 (compatible; EconomiaSantander/1.0)" },
        cf: { cacheTtl: 900, cacheEverything: true },
      });
      if (!r.ok) throw new Error("upstream " + r.status);

      const j = await r.json();
      const res = j && j.chart && j.chart.result && j.chart.result[0];
      if (!res || !res.timestamp) throw new Error("sin datos");

      const close = (res.indicators && res.indicators.quote[0].close) || [];
      const puntos = [];
      for (let i = 0; i < res.timestamp.length; i++) {
        if (close[i] != null) puntos.push({ t: res.timestamp[i], v: close[i] });
      }

      const body = {
        symbol,
        currency: res.meta && res.meta.currency,
        precio: res.meta && res.meta.regularMarketPrice,
        cierrePrevio: res.meta && res.meta.chartPreviousClose,
        puntos,
      };
      return new Response(JSON.stringify(body), { status: 200, headers });
    } catch (e) {
      return new Response(JSON.stringify({ error: String((e && e.message) || e) }), {
        status: 502,
        headers: Object.assign({}, headers, { "Cache-Control": "no-store" }),
      });
    }
  },
};
