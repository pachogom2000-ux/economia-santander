# Migración de Netlify a Cloudflare

Diseño técnico · versión 2 · 30 de julio de 2026
Estado: **correcciones aplicadas en el repositorio; sin tocar producción**

---

## 1. La idea: convivencia, no salto al vacío

No se apaga Netlify para encender Cloudflare. **Los dos publican el mismo sitio al mismo tiempo**, desde el mismo repositorio, con el mismo contenido, durante el tiempo que haga falta.

```
                    GitHub (main)
                    /          \
            Netlify              Cloudflare
                |                     |
    economiasantander.com      *.workers.dev
     (lo que ve el lector)      (idéntico, para probar)
```

Cada push despliega en **las dos** plataformas. Se comparan lado a lado, se prueba todo en Cloudflare con calma, y **el corte es una sola decisión tuya**: cambiar a dónde apunta el dominio. Si algo sale mal, se devuelve en cinco minutos porque Netlify sigue vivo e intacto.

**No hay urgencia.** El bloqueo por créditos agotados de Netlify impide *desplegar*, pero el sitio publicado se sigue sirviendo con normalidad. Esto se puede hacer sin prisa.

### El destino: Workers, no Pages

Cloudflare lo dice por escrito en su documentación de buenas prácticas:

> *Workers Static Assets is the recommended way to deploy static sites… If you are starting a new project, use Workers instead of Pages.*

Pages no está deprecado y funcionaría, pero es el camino secundario. Ventaja práctica aquí: **un solo Worker sirve el sitio y atiende la función** de la bolsa; no hay que separar hosting y funciones.

---

## 2. Qué depende hoy de Netlify

| Pieza | Hoy | Estado |
|---|---|---|
| Hosting estático | Netlify (`netlify.toml`) | ✅ ya hay `wrangler.jsonc` en paralelo |
| Build | `npx @11ty/eleventy` → `_site` | ✅ idéntico en las dos |
| Función de bolsa | `netlify/functions/quote.js` | ✅ ya está en `worker.js`, misma ruta |
| Página 404 | no existía | ✅ creada con permalink correcto |
| Cabeceras y HSTS | las ponía Netlify sola | ✅ ahora en `src/_headers`, las leen las dos |
| **Autenticación del CMS** | **Netlify Identity + git-gateway** | 🔸 proxy escrito y probado, **falta desplegarlo** |
| DNS | Netlify DNS (NS1) | pendiente, es el corte |
| Registrador | GoDaddy | no se toca |
| Correo | **no hay MX ni TXT** | nada que romper |

---

## 3. Lo que ya quedó hecho en el repositorio

Estas son las correcciones que salieron de la investigación y que **ya están aplicadas**. Todas funcionan igual en Netlify, así que no rompen nada hoy.

### 3.1 Página 404 (`src/404.njk`)

El sitio no tenía. Sin ella, Cloudflare devolvería **200 con la portada** para cualquier URL inexistente: *soft 404* en masa y castigo en buscadores.

Trampa específica de Eleventy, comprobada en este repositorio: crear `src/404.html` genera `_site/404/index.html`, **no** `_site/404.html`. Cloudflare exige el archivo en la raíz. Por eso el archivo lleva `permalink: /404.html` explícito.

Criterio de aceptación, ya verificado:

```bash
npx @11ty/eleventy && ls _site/404.html   # debe existir
```

La página usa el diseño del portal y lista las cinco notas más recientes y todas las secciones, para que quien caiga ahí no se vaya.

### 3.2 Cabeceras propias (`src/_headers`)

El sitio hoy envía `Strict-Transport-Security: max-age=31536000`. **Esa cabecera la pone la plataforma de Netlify**, no el repositorio: al migrar habría desaparecido en silencio.

Ahora está declarada en un archivo que **leen igual Netlify y Cloudflare**, junto con el resto de la política de caché: HTML y CSS siempre revalidan (este proyecto ya sufrió servir una hoja de estilos vieja), e imágenes y videos se guardan una semana.

### 3.3 El Worker (`worker.js` + `wrangler.jsonc`)

Traduce la función de Netlify a la firma de Cloudflare y **conserva la ruta vieja** `/.netlify/functions/quote`, así que el mismo `indicadores.js` funciona en las dos plataformas sin tocar una línea. Se añadió `/api/quote` para migrar el front con calma, después.

Dos decisiones que hay que respetar y están comentadas en el código:

- `not_found_handling: "404-page"` es obligatorio y explícito.
- **No activar `"cache": { "enabled": true }`** en `wrangler.jsonc`. Suena a optimización pero es una trampa de facturación: al activarlo, Cloudflare cobra *todas* las peticiones al Worker a tarifa estándar, **incluidas las de archivos estáticos, que por defecto son gratis e ilimitadas**. El caché que sí conviene ya está en el `fetch` a Yahoo (`cf.cacheTtl`).

### 3.4 El proxy de autenticación del CMS (`workers/decap-oauth/`)

Escrito y probado, **sin desplegar**. Es lo único que faltaba para poder sacar el CMS de Netlify. Instrucciones completas en `workers/decap-oauth/README.md`.

Comprobado en local contra credenciales falsas: redirige bien a GitHub, la cookie de `state` sale `__Host-` + `HttpOnly` + `Secure` + `SameSite=Lax`, rechaza el `callback` con `state` inventado y también con `state` bueno pero sin cookie, el *client secret* no aparece en ninguna respuesta ni cabecera, y el token se entrega **solo a orígenes de una lista blanca** — nunca con `postMessage(..., "*")`, que es el error habitual de estos proxys.

### 3.5 Comprobador de paridad (`scripts/comprobar-paridad.mjs`)

La prueba de aceptación de la migración, automatizada. Compara el sitio candidato contra el publicado y **no da verde hasta que se comportan igual**: las 39 páginas del sitemap, la 404 real, las cabeceras, los seis símbolos de la función de bolsa, el rechazo de símbolos fuera de la lista blanca, y el HTML byte a byte.

```bash
npm run cf:check                                              # contra el Worker local
node scripts/comprobar-paridad.mjs https://<worker>.workers.dev   # contra Cloudflare
node scripts/comprobar-paridad.mjs https://economiasantander.com  # después del corte
```

### 3.6 Scripts (`package.json`)

```bash
npm run cf:dev        # probar en local: eleventy + wrangler dev
npm run cf:check      # comprobador de paridad
npm run cf:deploy     # publicar el sitio a Cloudflare
npm run cf:preview    # subir una versión de prueba
npm run oauth:deploy  # publicar el proxy de autenticación
npm run oauth:secret  # cargar el client secret (cifrado, fuera del repo)
```

---

## 3.bis Resultado de la prueba en local

El Worker completo se levantó con `wrangler dev` y se le pasó el comprobador. **Todo en verde**, sin ninguna excepción:

```
1. Paridad de páginas
  ✓ las 39 páginas del sitemap responden 200
  ✓ ninguna difiere de lo publicado
2. Página de error
  ✓ una URL inexistente devuelve 404, no 200
  ✓ sirve la 404 del portal, no una en blanco
3. Cabeceras
  ✓ HSTS presente y de un año   ✓ nosniff
  ✓ el HTML revalida siempre    ✓ la hoja de estilos revalida siempre
4. Función de bolsa
  ✓ EC  ✓ CIB  ✓ TGLS  ✓ BZ=F  ✓ ^GSPC  ✓ ICOLCAP.CL
  ✓ rechaza símbolos fuera de la lista blanca
5. Contenido idéntico
  ✓ /  ✓ /quien-soy/  ✓ /dolar-hoy/  ✓ /multimedia/
```

Wrangler además confirmó que lee nuestras cabeceras: *"Parsed 9 valid header rules"*. Y las páginas salen **idénticas byte a byte** a las que sirve Netlify hoy.

---

## 3.ter Fase B hecha: Cloudflare ya está vivo en paralelo

**https://economia-santander.digitautom.workers.dev**

Desplegado el 30 de julio de 2026 en la cuenta `edwinjojojo@gmail.com`. El comprobador de paridad da **todo en verde contra producción**: las 39 páginas, la 404 real, las cabeceras, los seis símbolos de bolsa y el HTML idéntico byte a byte.

**El riesgo que no se podía verificar sin desplegar quedó despejado: Yahoo Finanzas NO bloquea las IP de Cloudflare.** Los seis símbolos devuelven los mismos datos que por Netlify.

El dominio sigue apuntando a Netlify. El lector no ha notado nada y no notará nada hasta que se decida el corte.

### Lo que se aprendió desplegando (y no estaba en el diseño)

**Cloudflare NO ejecuta el Worker para los archivos estáticos.** Comprobado: una cabecera añadida en el código aparece en la 404 y en la función, pero no en las páginas ni en el CSS. Esto confirma de primera mano por qué los archivos estáticos son gratis — no es una tarifa especial, es que el código sencillamente no corre.

De ahí salió `run_worker_first`, y con él un susto que conviene dejar escrito: **esa lista es exhaustiva, no un añadido.** Al ponerla con una sola ruta, la función de bolsa dejó de responder y empezó a devolver la página de error, porque todo lo que no esté en la lista deja de llegar al Worker. Ahora están las tres rutas que lo necesitan:

```jsonc
"run_worker_first": ["/api/quote", "/.netlify/functions/quote", "/robots.txt"]
```

Puesta como `true` a secas en vez de lista, todo el sitio pasaría por el Worker y **todo pasaría a ser cobrable**.

### La copia de pruebas no compite con el portal

Mientras los dos convivan hay dos copias del sitio en internet. La de `workers.dev` sirve un `robots.txt` propio con `Disallow: /` — de ahí que robots.txt esté en la lista de arriba. El portal real conserva el suyo intacto. Además, todas las páginas ya traían la etiqueta canónica apuntando al dominio real.

Al pasar al dominio propio esto deja de aplicar solo, sin tener que acordarse de quitarlo.

### Sobre la cuenta

Quedó en la cuenta personal de Edwin, con el subdominio `digitautom.workers.dev`. **Conviene decidir antes del corte si el sitio debe vivir en una cuenta de Francisco**, ya que el repositorio y el dominio son suyos. Moverlo después de cortar es más incómodo que hacerlo ahora.

---

## 4. Lo que falta: el CMS

Es el único bloqueante real y donde se concentra el riesgo, porque es lo que puede dejar a Francisco sin poder publicar.

Decap usa hoy `backend: git-gateway` con **Netlify Identity**. La propia documentación de Decap lo da por muerto:

> *Git Gateway is deprecated. […] new Git Gateway configurations are not recommended.*

### La solución, y por qué aquí es fácil

Cambiar a `backend: github` con un proxy OAuth propio en un Worker. El backend `github` exige que el usuario tenga permiso de escritura en el repositorio — normalmente una fricción, pero **aquí no aplica**:

> El repositorio `pachogom2000-ux/economia-santander` **es de Francisco**: figura como propietario con permisos de administrador. Ya tiene cuenta de GitHub y ya tiene todos los permisos. No hay que crear ni invitar a nadie.

Lo único que cambia para él: entra a `/admin` **con su cuenta de GitHub** en vez de usuario y contraseña de Netlify.

### El detalle que no se puede pasar por alto

Si se cambia `git-gateway` por `github` sin más, Decap sigue mandando el login **a los servidores de Netlify**: cuando falta `base_url`, su valor por defecto es `https://api.netlify.com`. Se saldría de Netlify por la puerta y se volvería a entrar por la ventana.

```yaml
backend:
  name: github
  repo: pachogom2000-ux/economia-santander
  branch: main
  base_url: https://<nuestro-proxy>.workers.dev   # ← obligatorio
  auth_endpoint: auth
```

`editorial_workflow` **sigue funcionando**: ramas, pull requests y botón de publicar, igual que hoy.

**Sveltia CMS queda descartada**: no implementa `editorial_workflow`, que es justo el flujo de este sitio. Está en su hoja de ruta sin fecha firme.

### La jugada que quita el riesgo

**Migrar el CMS primero, mientras el sitio todavía está en Netlify.** El backend `github` funciona igual en Netlify que en Cloudflare — solo cambia cómo se autentica, no dónde vive el sitio.

Así, cuando llegue el corte de DNS, el CMS ya lleva semanas funcionando y probado. Y si el cambio de CMS falla, se revierte con un `git revert` sin que el hosting tenga nada que ver.

---

## 5. Plan por fases

### Fase A — CMS a GitHub *(sitio sigue en Netlify)*

> El Worker proxy **ya está escrito y probado** en `workers/decap-oauth/` (§3.4). Falta desplegarlo, que requiere los pasos de navegador.

1. Crear una **GitHub OAuth App** en la cuenta de Francisco *(navegador)*.
2. Pegar el Client ID en `workers/decap-oauth/wrangler.jsonc` y desplegar: `npm run oauth:deploy`, luego `npm run oauth:secret`.
3. Cambiar `src/admin/config.yml` al backend `github` **con `base_url`**, y quitar el widget de Identity de `src/admin/index.html`. *(El bloque exacto está en el README del proxy.)*
4. **Probar con Francisco delante**: que entre con GitHub, cree un borrador, lo pase por el flujo editorial y publique. Sitio todavía en Netlify.
5. Dejarlo rodar unos días.

> Reversión: `git revert` del commit de `src/admin/`. Vuelve Identity y ya.

### Fase B — Cloudflare en paralelo *(nadie lo nota)*

6. Conectar el repositorio a **Workers Builds** (build: `npx @11ty/eleventy`).
7. Activar *builds for non-production branches* para tener vistas previas de los PR.
8. **Prueba bloqueante**: comprobar que Yahoo Finanzas no bloquea las IP de Cloudflare.

   ```bash
   curl "https://<worker>.workers.dev/.netlify/functions/quote?symbol=EC&range=6mo"
   ```

   Si devuelve 429 o 403, **parar** y replantear la fuente de las gráficas. Es el único riesgo que no se puede verificar sin desplegar. *(El comprobador de §3.5 lo detecta y lo avisa por su cuenta.)*
9. Comparar `*.workers.dev` contra el sitio real, punto por punto:

   ```bash
   node scripts/comprobar-paridad.mjs https://economia-santander.<sub>.workers.dev
   ```

   Mientras esto no dé **todo en verde**, no se pasa a la Fase C.

> Aquí ya hay **dos sitios idénticos y vivos**. El lector sigue entrando por Netlify sin enterarse de nada.

### Fase C — Preparar el corte *(sin cambiar a dónde apunta el dominio)*

Esta fase es la que hace que el corte final no tenga ventana de riesgo.

10. Crear la **zona** de `economiasantander.com` en Cloudflare.
11. Al importar los registros, **borrar los A heredados de Netlify** (`18.208.88.157`, `98.84.224.111`) y volver a crearlos **en modo "DNS only" (nube gris) apuntando a Netlify**.
12. Bajar el TTL a **300 segundos**.
13. Cambiar los **nameservers en GoDaddy** a los de Cloudflare.

**¿Qué pasa aquí?** El DNS pasa a Cloudflare pero **sigue mandando el tráfico a Netlify**. Para el lector no cambia absolutamente nada. Y mientras tanto la zona queda *Active*, que es la condición para que Cloudflare emita el **certificado Universal SSL**.

Eso es lo importante: el certificado queda emitido **antes** del corte. Sin este truco, el certificado solo se emite después de mover el dominio, y como el sitio manda HSTS de un año, un error de certificado dejaría a los lectores recurrentes **sin poder saltárselo**.

> *(No se transfiere el registrador: ICANN lo bloquea hasta ~24 de septiembre por ser un dominio registrado el 26 de julio. Cambiar nameservers sí se puede.)*

### Fase D — El corte *(tu decisión, cuando quieras)*

14. Añadir el dominio personalizado (apex y `www`) en el proyecto de Workers. Eso reapunta el DNS al Worker.
15. Activar la **nube naranja** (proxy).
16. Crear el redirect `www` → apex con una **Redirect Rule**.
17. Poner *Browser Cache TTL* en **"Respect Existing Headers"** y confirmar que no exista ninguna regla *Cache Everything*.
18. Activar **HSTS** en la zona.

Tiempo real del corte: minutos. Certificado ya emitido, contenido ya probado, CMS ya migrado. **El lector no nota nada.**

### Fase E — Después

19. Repetir la batería de comprobación (§7) contra el dominio real.
20. Search Console: reenviar `sitemap.xml`. **No** usar Cambio de Dirección: el dominio no cambia.
21. **No borrar nada de Netlify durante un mes.**
22. A las dos semanas estable: borrar `netlify.toml` y `netlify/`, y actualizar `CLAUDE.md`.

---

## 6. ¿Cuánto va a costar Cloudflare?

**Cero pesos, con el tráfico de este portal y bastante margen por encima.**

| Concepto | Plan gratuito | Qué consume este sitio |
|---|---|---|
| **Archivos estáticos** (páginas, CSS, imágenes, videos) | **gratis e ilimitado** | todo el tráfico normal |
| **Peticiones al Worker** | 100.000 al día | solo `/api/quote` |
| CPU por invocación | 10 ms | el proxy hace un `fetch`: sobra |
| Ancho de banda | sin límite publicado | 10 MB de sitio |
| DNS | gratis | — |
| Certificado SSL | gratis | — |
| Web Analytics | gratis | opcional |
| Builds automáticos | incluidos | ~2 al día |

**La cuenta que importa:** lo único que se cobra son las llamadas a la función de la bolsa. Una visita a `/indicadores/` dispara hasta 6. Con 100.000 al día, eso da margen para unas **16.000 visitas diarias a esa página específica** antes de rozar el límite — y las páginas normales no cuentan para nada.

Dicho de otro modo: para que Cloudflare te empiece a cobrar, el portal tendría que crecer varios órdenes de magnitud. Si algún día pasa, el plan Workers Paid cuesta **US$5 al mes** y sube el cupo a 10 millones de peticiones mensuales.

**Lo que sí seguirás pagando** es la renovación del dominio en GoDaddy, igual que hoy. Eso no cambia.

**Y lo que dejas de tener**: el modelo de créditos de Netlify que bloquea despliegues. Ese problema desaparece.

---

## 7. Comprobación antes y después del corte

Lo automático, que es lo que decide:

```bash
node scripts/comprobar-paridad.mjs https://economia-santander.<sub>.workers.dev
```

Y a mano, si se quiere mirar una cosa suelta:

```bash
S=https://economiasantander.com          # o la URL de workers.dev

curl -sI $S/ | head -1                                    # 200
curl -sI $S/una-url-que-no-existe | head -1               # 404, NO 200
curl -sI $S/ | grep -i strict-transport                   # HSTS presente
curl -sI $S/assets/style.css | grep -i cache-control      # must-revalidate
curl -s "$S/.netlify/functions/quote?symbol=EC&range=1mo" | head -c 120
curl -sI $S/quien-soy/ | head -1                          # 200
```

Y en el navegador: que las gráficas de `/indicadores/` se pinten y que el convertidor de `/dolar-hoy/` calcule.

### Lista de verificación

Antes de la Fase D (el corte):

- [ ] El CMS lleva días funcionando con GitHub y Francisco publicó sin ayuda
- [ ] El login del CMS apunta a nuestro proxy, **no** a `api.netlify.com`
- [ ] La función devuelve datos reales desde Cloudflare (Yahoo no bloquea sus IP)
- [ ] `404` real, HSTS, caché y gráficas verificados en `*.workers.dev`
- [ ] Zona en Cloudflare *Active* y **certificado Universal SSL emitido**
- [ ] TTL en 300 s y expirado el anterior
- [ ] Netlify sigue vivo y desplegando

Después del corte, en los primeros minutos:

- [ ] `https://` carga sin error de certificado
- [ ] `www` redirige al apex
- [ ] HSTS activado
- [ ] La batería de `curl` da igual que antes

---

## 8. Reversión

| Falla | Cómo se revierte | Cuánto tarda |
|---|---|---|
| Un despliegue malo en Cloudflare | Rollback en el panel | inmediato |
| Cloudflare responde mal, ya cortado | Poner el registro del apex de nuevo en **DNS only** apuntando a Netlify | ~5 min (TTL 300) |
| Todo Cloudflare falla | Devolver los nameservers en GoDaddy a `dns1..4.p02.nsone.net` | horas (NS propagan lento) |
| El CMS falla | `git revert` del commit de `src/admin/` | un push |

Por eso el corte de la Fase D es tan seguro: **la reversión rápida no depende de los nameservers** sino de un registro DNS que ya vive en Cloudflare y se cambia en un clic.

---

## 9. Lo que no cambia

- El contenido: markdown en GitHub. Nada que exportar ni importar.
- El flujo editorial: ramas, pull requests, vistas previas, botón de publicar.
- Eleventy, plantillas, CSS, imágenes: intactos.
- Las URLs: idénticas. Ningún enlace se rompe, ningún lector nota el cambio.
- El registrador y la titularidad del dominio.
- El correo: no hay MX ni TXT que perder.

---

## 10. Esfuerzo

| Fase | Trabajo |
|---|---|
| A · CMS a GitHub | 2–3 h + sesión con Francisco |
| B · Cloudflare en paralelo | 1–2 h |
| C · Preparar el corte | 30 min + esperar propagación |
| D · El corte | 20 min |
| E · Cierre | 1 h, dos semanas después |

Lo más largo no es el hosting: es el CMS y probarlo con Francisco.

---

*Investigado con documentación oficial de Cloudflare y Decap CMS consultada el 28 de julio de 2026, con una segunda pasada de verificación que corrigió siete afirmaciones incorrectas del análisis inicial — entre ellas la trampa de facturación de `cache.enabled`, la ruta de salida del 404 en Eleventy, el `base_url` que dejaba el login en Netlify y el orden de emisión del certificado, que es lo que motivó el esquema de dos fases del DNS.*
