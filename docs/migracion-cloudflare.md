# Migración de Netlify a Cloudflare

Diseño técnico · 28 de julio de 2026
Estado: **propuesta, sin ejecutar**

---

## 1. La decisión, en corto

Mover `economiasantander.com` de **Netlify** a **Cloudflare Workers con Static Assets**.

El motivo es concreto: Netlify bloquea los despliegues cuando la cuenta agota créditos (*account credit usage exceeded*). Cloudflare no tiene ese modelo: el plan gratuito cobra por peticiones al Worker, y **servir archivos estáticos es gratis e ilimitado**.

**No hay emergencia.** El bloqueo de créditos de Netlify impide *desplegar*, pero el sitio ya publicado se sigue sirviendo con normalidad. Eso significa que la migración se puede planear con calma y ejecutar en un día tranquilo, no a las carreras.

### Por qué Workers y no Pages

Cloudflare lo dice por escrito en su documentación de buenas prácticas:

> *Workers Static Assets is the recommended way to deploy static sites… If you are starting a new project, use Workers instead of Pages. Pages continues to work, but new features and optimizations are focused on Workers.*

Pages **no está deprecado** y funcionaría, pero es el camino secundario. Además existe una guía oficial específica [Migrate from Netlify to Workers](https://developers.cloudflare.com/workers/static-assets/migration-guides/netlify-to-workers/), actualizada en abril de 2026.

Una ventaja práctica para este proyecto: con Workers, **un solo Worker sirve el sitio y atiende la función** de la bolsa. No hay que separar hosting y funciones.

---

## 2. Qué depende hoy de Netlify

Inventario real del repositorio, no supuestos:

| Pieza | Hoy | Al migrar |
|---|---|---|
| Hosting estático | Netlify (`netlify.toml`) | Workers Static Assets |
| Build | `npx @11ty/eleventy` → `_site` | igual, en Workers Builds |
| Despliegue en cada push | Netlify + GitHub | Workers Builds + GitHub |
| Vistas previas de PR | Deploy previews | Preview URLs (hay que activarlas) |
| Función de bolsa | `netlify/functions/quote.js` | dentro del Worker |
| **Autenticación del CMS** | **Netlify Identity + git-gateway** | **⚠️ no existe en Cloudflare** |
| DNS | Netlify DNS (NS1) | Cloudflare DNS |
| Registrador | GoDaddy | GoDaddy (no se toca) |
| HSTS | lo pone Netlify solo | ⚠️ hay que reponerlo |
| Correo | **no hay MX ni TXT** | nada que romper |

---

## 3. El nudo real: el CMS

Esto es lo único que puede dejar a Francisco sin poder publicar, y es donde se concentra el riesgo.

Decap CMS usa hoy `backend: git-gateway` con **Netlify Identity**. Fuera de Netlify eso no existe. Y la propia documentación de Decap lo da por muerto:

> *Git Gateway is deprecated. While Git Gateway continues to function for sites that currently have it enabled, new Git Gateway configurations are not recommended.*

### Opciones evaluadas

| Opción | Veredicto |
|---|---|
| **Decap con `backend: github` + proxy OAuth propio en un Worker** | ✅ **Recomendada** |
| DecapBridge (servicio externo, plan gratis 3 sitios / 10 colaboradores) | Alternativa válida; añade dependencia de un tercero |
| Sveltia CMS | ❌ **Descartada**: no implementa `editorial_workflow`, que es justo el flujo que usa este sitio. Está en su hoja de ruta sin fecha firme |

### Por qué la opción recomendada es limpia aquí

El backend `github` de Decap exige que todo usuario tenga permiso de escritura en el repositorio. Normalmente eso es una fricción — pero **en este caso no aplica**:

- El repositorio `pachogom2000-ux/economia-santander` **es de Francisco**: figura como propietario con permisos de administrador.
- O sea: **ya tiene cuenta de GitHub y ya tiene todos los permisos**. No hay que crear cuentas, ni invitar a nadie, ni darle acceso nuevo a nada.

Lo único que cambia para él es **cómo entra a `/admin`**: en vez de usuario y contraseña de Netlify Identity, entrará con su cuenta de GitHub.

### El detalle que no se puede pasar por alto

Si se cambia `git-gateway` por `github` sin más, Decap sigue mandando el login **a los servidores de Netlify**: cuando falta `base_url`, su valor por defecto es `https://api.netlify.com`. Se saldría de Netlify por la puerta y se volvería a entrar por la ventana.

La configuración correcta es:

```yaml
backend:
  name: github
  repo: pachogom2000-ux/economia-santander
  branch: main
  base_url: https://<nuestro-proxy>.workers.dev   # ← obligatorio
  auth_endpoint: auth
```

El proxy OAuth es un Worker pequeño (existe plantilla mantenida: `sterlingwes/decap-proxy`) que guarda el *client secret* de una GitHub OAuth App. El secreto nunca puede viajar al navegador; por eso hace falta.

**`editorial_workflow` sigue funcionando** con el backend `github`: se mantienen las ramas, los pull requests y el botón de publicar.

---

## 4. Tres cosas que hay que arreglar antes de mover nada

Son deudas que hoy tapa Netlify y que Cloudflare deja al descubierto.

### 4.1 El sitio no tiene página 404

Netlify sirve un 404 genérico. Workers, si no se le declara una, puede caer en modo aplicación de una sola página y devolver **200 con la portada** para cualquier URL inexistente. Para Google eso son *soft 404* masivos: veneno para el SEO.

Hay una trampa específica de Eleventy comprobada en este repo: crear `src/404.html` **no** produce `_site/404.html`, sino `_site/404/index.html` (Eleventy aplica permalinks "bonitos"). Cloudflare exige el archivo en la raíz de la salida.

La solución es forzar el permalink:

```njk
---
permalink: /404.html
layout: layout.njk
title: Página no encontrada | Economía Santander
---
```

Y el criterio de aceptación no es "existe el archivo fuente" sino:

```bash
npx @11ty/eleventy && ls _site/404.html
```

### 4.2 El HSTS desaparece en silencio

El sitio hoy envía `Strict-Transport-Security: max-age=31536000` — un año. Esa cabecera **la pone la plataforma de Netlify**: no está en el repositorio (no hay `_headers` ni bloque `[[headers]]`).

Dos consecuencias:

1. En Cloudflare hay que **volver a activarla** (SSL/TLS → Edge Certificates → Enable HSTS, o un archivo `_headers`). Si no, se pierde una protección sin que nadie lo note, porque el sitio se ve igual.
2. Ese año de HSTS ya está grabado en el navegador de los lectores recurrentes: **si tras el corte hay un error de certificado, no podrán saltárselo**. Esto convierte el certificado en el punto crítico del corte (§5.4).

### 4.3 La caché por defecto de Cloudflare

Cloudflare Free trae *Browser Cache TTL* en 4 horas. Este proyecto **ya tuvo el problema** de servir CSS viejo. Hay que:

- Poner Browser Cache TTL en **"Respect Existing Headers"**.
- **Nunca** crear una regla de tipo *Cache Everything* sobre el HTML.

Queda anotado como prohibición permanente en `CLAUDE.md`.

---

## 5. Plan por fases

Regla de oro: **el cambio de hosting y el cambio de DNS nunca el mismo día.**

### Fase 0 — Línea base (antes de tocar nada)

Medir cómo se comporta el sitio hoy, para poder comparar después:

```bash
curl -sI https://economiasantander.com/ | grep -i "strict-transport\|cache-control\|server"
curl -sI https://economiasantander.com/una-url-que-no-existe | head -1     # ¿404 o 200?
curl -sI https://economiasantander.com/assets/style.css | grep -i cache
curl -s "https://economiasantander.com/.netlify/functions/quote?symbol=EC&range=1mo" | head -c 200
```

Y exportar la zona DNS desde Netlify (aunque esté casi vacía: sin MX, sin TXT).

### Fase 1 — Código (sin tocar producción)

1. Crear la página 404 con su permalink (§4.1).
2. Crear `wrangler.jsonc` y el Worker (§6).
3. **Prueba crítica y bloqueante**: desplegar solo el Worker a su URL `*.workers.dev` y comprobar que Yahoo Finanzas responde desde las IP de Cloudflare:

   ```bash
   curl "https://<worker>.workers.dev/.netlify/functions/quote?symbol=EC&range=6mo"
   ```

   Si devuelve 429 o 403, **parar la migración** y replantear la fuente de las gráficas. Es el único riesgo que no se puede verificar sin desplegar.
4. Montar la GitHub OAuth App y el Worker proxy; cambiar `src/admin/config.yml` y quitar el widget de Identity de `src/admin/index.html`.

### Fase 2 — Montaje en Cloudflare (DNS todavía en Netlify)

5. Conectar el repositorio a **Workers Builds** (build: `npx @11ty/eleventy`).
6. Activar *builds for non-production branches* para tener vistas previas de los PR.
7. Probar **todo** en la URL `*.workers.dev` contra la línea base de la Fase 0: 404 real, gráficas de `/indicadores/`, cabeceras de caché.
8. **Probar el CMS con Francisco delante**: que entre con GitHub, cree un borrador, lo pase por el flujo editorial y publique. No se avanza hasta que él publique sin ayuda.

### Fase 3 — El corte de DNS

El orden importa y no es intuitivo:

9. Crear la **zona** de `economiasantander.com` en Cloudflare. Al importar, **borrar los registros A heredados de Netlify** (`18.208.88.157`, `98.84.224.111`) — si quedan, el dominio seguiría resolviendo a Netlify o daría error 522.
10. Añadir el dominio personalizado (apex y `www`) en el proyecto de Workers. Quedará *pendiente*: es lo esperado.
11. Bajar el TTL en la zona de Netlify a **300 s** y esperar a que expire el TTL viejo. Esto reduce la ventana de reversión de una hora a cinco minutos.
12. Cambiar los **nameservers en GoDaddy** a los que asigne Cloudflare. *(No se transfiere el registrador: ICANN lo bloquea hasta ~24 de septiembre por ser un dominio registrado el 26 de julio. Cambiar nameservers sí se puede.)*
13. **Vigilar los primeros 15 minutos**: que la zona pase a *Active* y que el certificado Universal SSL quede emitido. Cloudflare solo lo emite **después** de que el dominio esté activo, así que no se puede pre-validar. Si a los 15 minutos no hay certificado válido → revertir nameservers (§8).
14. Crear el redirect `www` → apex con una **Redirect Rule** (no con `_redirects`: ese archivo no maneja redirecciones a nivel de dominio).
15. Activar **HSTS** (§4.2).

### Fase 4 — Después

16. Repetir la batería de `curl` de la Fase 0 contra el dominio real.
17. Search Console: reenviar el `sitemap.xml` e inspeccionar la portada y dos o tres notas. **No** usar la herramienta de Cambio de Dirección: el dominio no cambia.
18. Activar Cloudflare Web Analytics si se quiere métrica (gratis, sin cookies).
19. **No borrar nada de Netlify durante un mes.**
20. A las dos semanas estable: borrar `netlify.toml` y `netlify/`, y actualizar `CLAUDE.md`.

---

## 6. El código

### `wrangler.jsonc`

```jsonc
{
  "name": "economia-santander",
  "main": "worker.js",
  "compatibility_date": "2026-07-01",
  "assets": {
    "directory": "./_site",
    "binding": "ASSETS",
    "not_found_handling": "404-page"
  }
}
```

⚠️ **No añadir `"cache": { "enabled": true }`.** Suena bien pero es una trampa de facturación: la documentación de Workers advierte que al habilitarlo *toda* petición al Worker se cobra a tarifa estándar, **incluidas las de archivos estáticos, que normalmente son gratis**. En el plan gratuito eso puede tumbar el sitio entero al pasar de 100.000 peticiones diarias. Sin ese bloque, los estáticos siguen siendo gratis e ilimitados y solo se cuentan las llamadas reales a la función.

### El Worker

Conserva **la ruta vieja** `/.netlify/functions/quote`, así que **no hay que tocar `src/assets/indicadores.js`**. Se añade `/api/quote` como ruta nueva para migrar el front con calma, después.

```js
// worker.js — sirve el sitio estático y atiende la función de bolsa.
const PERMITIDOS = new Set(["EC", "CIB", "TGLS", "BZ=F", "^GSPC", "ICOLCAP.CL"]);
const RANGOS = new Set(["1mo", "3mo", "6mo", "1y", "5y"]);
// La ruta de Netlify se conserva para no tocar el JavaScript del portal.
const RUTAS_QUOTE = new Set(["/.netlify/functions/quote", "/api/quote"]);

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (!RUTAS_QUOTE.has(url.pathname)) {
      return env.ASSETS.fetch(request);   // el resto lo sirve el sitio estático
    }

    const symbol = String(url.searchParams.get("symbol") || "").toUpperCase();
    const rangoPedido = url.searchParams.get("range");
    const range = RANGOS.has(rangoPedido) ? rangoPedido : "6mo";

    const headers = {
      "Content-Type": "application/json; charset=utf-8",
      "Access-Control-Allow-Origin": "*",
      "Cache-Control": "public, max-age=900, s-maxage=900",
    };

    if (!PERMITIDOS.has(symbol)) {
      return new Response(JSON.stringify({ error: "símbolo no permitido" }), {
        status: 400, headers,
      });
    }

    try {
      const destino =
        "https://query1.finance.yahoo.com/v8/finance/chart/" +
        encodeURIComponent(symbol) + "?range=" + range + "&interval=1d";
      // cacheTtl protege a Yahoo de recibir una petición por visita.
      const r = await fetch(destino, {
        headers: { "User-Agent": "Mozilla/5.0 (compatible; EconomiaSantander/1.0)" },
        cf: { cacheTtl: 900, cacheEverything: true },
      });
      if (!r.ok) throw new Error("upstream " + r.status);

      const j = await r.json();
      const res = j?.chart?.result?.[0];
      if (!res || !res.timestamp) throw new Error("sin datos");

      const close = res.indicators.quote[0].close || [];
      const puntos = [];
      for (let i = 0; i < res.timestamp.length; i++) {
        if (close[i] != null) puntos.push({ t: res.timestamp[i], v: close[i] });
      }

      return new Response(JSON.stringify({
        symbol,
        currency: res.meta?.currency,
        precio: res.meta?.regularMarketPrice,
        cierrePrevio: res.meta?.chartPreviousClose,
        puntos,
      }), { status: 200, headers });
    } catch (e) {
      return new Response(JSON.stringify({ error: String(e?.message || e) }), {
        status: 502,
        headers: { ...headers, "Cache-Control": "no-store" },
      });
    }
  },
};
```

---

## 7. Límites y costo

Plan **gratuito** de Cloudflare Workers:

- **Peticiones al Worker**: 100.000 al día. Solo cuentan las llamadas a la función de bolsa, no las páginas ni los assets.
- **Archivos estáticos**: gratis e ilimitados.
- **CPU**: 10 ms por invocación (el proxy hace un `fetch` y transforma JSON: sobra).
- **Ancho de banda**: sin límite publicado.
- **Builds**: Workers Builds tiene su propia cuota; muy por encima del ritmo de este portal.

El sitio pesa ~10 MB en 66 archivos: cabe de sobra.

**Resultado sobre el motivo de la migración**: sí, desaparece el bloqueo por créditos agotados. El riesgo cambia de naturaleza — ya no es "no puedo desplegar", sería "superé 100.000 llamadas diarias a la función", algo lejísimos del tráfico actual.

---

## 8. Reversión

Tres niveles, según qué falle:

| Falla | Cómo se revierte | Cuánto tarda |
|---|---|---|
| Un despliegue malo en Cloudflare | Rollback en el panel a la versión anterior | Inmediato |
| Cloudflare responde mal, con DNS ya movido | Volver los nameservers en GoDaddy a `dns1..4.p02.nsone.net` | 5 min si se bajó el TTL |
| El CMS falla tras cambiar el backend | Revertir en git el commit de `src/admin/` | Un push |

Por eso **el sitio de Netlify no se toca durante un mes** y el cambio del CMS se prueba en `*.workers.dev` **antes** del corte, no después.

---

## 9. Lo que no cambia

Para que quede claro qué NO es un riesgo:

- El contenido: sigue siendo markdown en GitHub. Nada que exportar ni importar.
- El flujo editorial: ramas, pull requests, vistas previas y botón de publicar.
- Eleventy, las plantillas, el CSS, las imágenes: intactos.
- El registrador (GoDaddy) y la titularidad del dominio.
- El correo: no hay registros MX ni TXT que perder.
- `indicadores.js` y el resto del JavaScript del portal.

---

## 10. Lista de comprobación antes del corte

Todo en verde antes de tocar los nameservers:

- [ ] `_site/404.html` existe y devuelve 404 real en `*.workers.dev`
- [ ] La función devuelve datos reales desde Cloudflare (Yahoo no bloquea sus IP)
- [ ] Las 6 gráficas de `/indicadores/` se pintan
- [ ] Francisco entró a `/admin` con GitHub y publicó una nota de prueba de principio a fin
- [ ] El login del CMS apunta a nuestro proxy, **no** a `api.netlify.com`
- [ ] La zona DNS está creada y **sin** los registros A de Netlify
- [ ] El dominio está añadido en el proyecto de Workers
- [ ] Browser Cache TTL en "Respect Existing Headers", sin reglas *Cache Everything*
- [ ] TTL bajado a 300 s en la zona de Netlify y expirado el anterior
- [ ] El sitio de Netlify sigue vivo y desplegando

Y después del corte, en los primeros minutos:

- [ ] Zona *Active* y certificado Universal SSL emitido
- [ ] `https://` carga sin error de certificado (crítico por el HSTS)
- [ ] `www` redirige al apex
- [ ] HSTS activado de nuevo

---

## 11. Esfuerzo estimado

| Fase | Trabajo |
|---|---|
| 0 · Línea base | 30 min |
| 1 · Código (404, Worker, OAuth) | 3–4 h |
| 2 · Montaje y pruebas | 2 h + sesión con Francisco |
| 3 · Corte de DNS | 1 h de trabajo, 24 h de vigilancia |
| 4 · Cierre y limpieza | 1 h, dos semanas después |

Lo más largo no es el hosting: es el CMS y las pruebas con Francisco.

---

*Investigado con documentación oficial de Cloudflare y Decap CMS consultada el 28 de julio de 2026, con una segunda pasada de verificación que corrigió siete afirmaciones incorrectas del análisis inicial (entre ellas la trampa de facturación de `cache.enabled`, la ruta de salida del 404 en Eleventy y el `base_url` que dejaba el login en Netlify).*
