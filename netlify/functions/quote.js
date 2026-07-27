// Proxy mínimo hacia Yahoo Finanzas para las gráficas de /indicadores/.
// Necesario porque el navegador no puede consultar a Yahoo directamente (CORS).
// Solo se permiten los símbolos que usa el portal.
const PERMITIDOS = new Set(["EC", "CIB", "TGLS", "BZ=F", "^GSPC", "ICOLCAP.CL"]);
const RANGOS = new Set(["1mo", "3mo", "6mo", "1y", "5y"]);

exports.handler = async (event) => {
  const params = event.queryStringParameters || {};
  const symbol = String(params.symbol || "").toUpperCase();
  const range = RANGOS.has(params.range) ? params.range : "6mo";

  const headers = {
    "Content-Type": "application/json; charset=utf-8",
    "Access-Control-Allow-Origin": "*",
    "Cache-Control": "public, max-age=900",
  };

  if (!PERMITIDOS.has(symbol)) {
    return { statusCode: 400, headers, body: JSON.stringify({ error: "símbolo no permitido" }) };
  }

  try {
    const url =
      "https://query1.finance.yahoo.com/v8/finance/chart/" +
      encodeURIComponent(symbol) +
      "?range=" + range + "&interval=1d";
    const r = await fetch(url, {
      headers: { "User-Agent": "Mozilla/5.0 (compatible; EconomiaSantander/1.0)" },
    });
    if (!r.ok) throw new Error("upstream " + r.status);
    const j = await r.json();
    const res = j && j.chart && j.chart.result && j.chart.result[0];
    if (!res || !res.timestamp) throw new Error("sin datos");
    const close = res.indicators.quote[0].close || [];
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
    return { statusCode: 200, headers, body: JSON.stringify(body) };
  } catch (e) {
    return {
      statusCode: 502,
      headers: { ...headers, "Cache-Control": "no-store" },
      body: JSON.stringify({ error: String((e && e.message) || e) }),
    };
  }
};
