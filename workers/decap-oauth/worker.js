/**
 * Proxy de autenticación para Decap CMS — Economía Santander.
 *
 * ¿Por qué existe? El CMS usa hoy `git-gateway` + Netlify Identity, que está
 * deprecado y solo funciona dentro de Netlify. Al pasar a `backend: github`,
 * Decap necesita alguien que haga el intercambio de OAuth con GitHub, porque
 * ese paso exige un secreto que no puede vivir en el navegador. Eso es este
 * Worker: recibe al usuario, lo manda a GitHub, y devuelve el token al CMS.
 *
 * Se despliega APARTE del sitio (es su propio Worker) y no toca el portal.
 *
 * Flujo:
 *   1. Decap abre una ventana en  /auth?provider=github
 *   2. Aquí se redirige a GitHub con un `state` aleatorio guardado en cookie
 *   3. GitHub devuelve al usuario a /callback?code=...&state=...
 *   4. Se compara el state (anti-CSRF), se cambia el código por un token
 *   5. Se le pasa el token a la ventana del CMS con postMessage y se cierra
 *
 * Variables que necesita (ver README.md):
 *   GITHUB_CLIENT_ID      — pública, va en wrangler.jsonc
 *   GITHUB_CLIENT_SECRET  — SECRETA: `wrangler secret put`, nunca en el repo
 *   ORIGENES_PERMITIDOS   — de dónde se acepta el CMS, separados por coma
 */

const ORIGENES_POR_DEFECTO = [
  "https://economiasantander.com",
  "https://www.economiasantander.com",
];

const COOKIE_STATE = "__Host-decap-state";

function origenesPermitidos(env) {
  const crudo = String(env.ORIGENES_PERMITIDOS || "");
  const extra = crudo
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  return new Set(ORIGENES_POR_DEFECTO.concat(extra));
}

function leerCookie(request, nombre) {
  const cookies = request.headers.get("Cookie") || "";
  for (const parte of cookies.split(";")) {
    const [k, ...v] = parte.trim().split("=");
    if (k === nombre) return v.join("=");
  }
  return null;
}

// Comparación en tiempo constante: comparar strings con === filtra por el
// primer carácter distinto y deja medir el state a fuerza de intentos.
function igualSeguro(a, b) {
  if (typeof a !== "string" || typeof b !== "string") return false;
  if (a.length !== b.length) return false;
  let d = 0;
  for (let i = 0; i < a.length; i++) d |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return d === 0;
}

function paginaDeCierre(payload, origenes) {
  // El token viaja dentro de una cadena que Decap sabe leer. Solo se manda a
  // orígenes de la lista blanca: si no, cualquier página que abriera este
  // Worker en una ventana hija podría quedarse con el token.
  const permitidos = JSON.stringify(Array.from(origenes));
  const mensaje = JSON.stringify(payload);
  return `<!doctype html>
<html lang="es">
<head><meta charset="utf-8"><title>Entrando…</title></head>
<body style="font:16px system-ui;padding:2rem;color:#111">
<p>Listo. Puedes cerrar esta ventana.</p>
<script>
(function () {
  var permitidos = ${permitidos};
  var mensaje = ${mensaje};
  function responder(e) {
    if (permitidos.indexOf(e.origin) === -1) return;
    window.opener.postMessage(mensaje, e.origin);
    window.removeEventListener("message", responder, false);
  }
  window.addEventListener("message", responder, false);
  // Decap escucha este aviso y contesta; su respuesta nos da el origen real
  // al que hay que mandar el token.
  if (window.opener) window.opener.postMessage("authorizing:github", "*");
})();
</script>
</body></html>`;
}

const HTML = { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "no-store" };

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const ruta = url.pathname.replace(/\/+$/, "") || "/";
    const origenes = origenesPermitidos(env);

    // Se dice CUÁL falta: el mensaje genérico obligaba a adivinar entre una
    // variable que está en el repositorio y un secreto que no se puede leer.
    // Ninguno de los dos nombres es información sensible.
    if (!env.GITHUB_CLIENT_ID || !env.GITHUB_CLIENT_SECRET) {
      const faltan = [
        env.GITHUB_CLIENT_ID ? null : "GITHUB_CLIENT_ID (va en wrangler.jsonc)",
        env.GITHUB_CLIENT_SECRET ? null : "GITHUB_CLIENT_SECRET (npm run oauth:secret)",
      ].filter(Boolean);
      return new Response(`Falta configurar: ${faltan.join(" y ")}.`, {
        status: 500,
        headers: HTML,
      });
    }

    // Paso 1: el CMS manda al usuario aquí.
    if (ruta === "/auth") {
      const state = crypto.randomUUID();
      const destino = new URL("https://github.com/login/oauth/authorize");
      destino.searchParams.set("client_id", env.GITHUB_CLIENT_ID);
      destino.searchParams.set("redirect_uri", `${url.origin}/callback`);
      // `repo` es el mínimo con el que Decap puede leer y escribir el
      // contenido, crear ramas y abrir los pull requests del flujo editorial.
      destino.searchParams.set("scope", url.searchParams.get("scope") || "repo");
      destino.searchParams.set("state", state);

      return new Response(null, {
        status: 302,
        headers: {
          Location: destino.toString(),
          // __Host- obliga a Secure y Path=/; Lax deja que la cookie viaje en
          // la vuelta de GitHub, que es una navegación normal.
          "Set-Cookie": `${COOKIE_STATE}=${state}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=600`,
          "Cache-Control": "no-store",
        },
      });
    }

    // Paso 2: GitHub devuelve al usuario con un código de un solo uso.
    if (ruta === "/callback") {
      const code = url.searchParams.get("code");
      const state = url.searchParams.get("state");
      const esperado = leerCookie(request, COOKIE_STATE);

      const borrarCookie = `${COOKIE_STATE}=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0`;
      const fallo = (texto) =>
        new Response(
          paginaDeCierre(`authorization:github:error:${JSON.stringify({ message: texto })}`, origenes),
          { status: 400, headers: Object.assign({}, HTML, { "Set-Cookie": borrarCookie }) }
        );

      if (!code) return fallo("GitHub no devolvió el código de autorización.");
      if (!esperado || !igualSeguro(state || "", esperado)) {
        return fallo("La sesión no coincide. Vuelve a intentar desde /admin/.");
      }

      let token;
      try {
        const r = await fetch("https://github.com/login/oauth/access_token", {
          method: "POST",
          headers: { Accept: "application/json", "Content-Type": "application/json" },
          body: JSON.stringify({
            client_id: env.GITHUB_CLIENT_ID,
            client_secret: env.GITHUB_CLIENT_SECRET,
            code,
            redirect_uri: `${url.origin}/callback`,
          }),
        });
        const datos = await r.json();
        if (datos.error || !datos.access_token) {
          return fallo(datos.error_description || datos.error || "GitHub no entregó el token.");
        }
        token = datos.access_token;
      } catch (e) {
        return fallo("No se pudo hablar con GitHub: " + String((e && e.message) || e));
      }

      const payload = `authorization:github:success:${JSON.stringify({ token, provider: "github" })}`;
      return new Response(paginaDeCierre(payload, origenes), {
        status: 200,
        headers: Object.assign({}, HTML, { "Set-Cookie": borrarCookie }),
      });
    }

    // Sirve para comprobar que el Worker está vivo sin exponer nada.
    if (ruta === "/") {
      return new Response("Proxy de autenticación de Economía Santander. Entra por /admin/.", {
        status: 200,
        headers: { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "no-store" },
      });
    }

    return new Response("No encontrado", { status: 404, headers: HTML });
  },
};
