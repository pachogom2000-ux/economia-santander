# Estrategia de tráfico — economiasantander.com

> Base: auditoría en cinco frentes + verificación adversarial en tres lentes (hechos, factibilidad, retorno). De 63 recomendaciones en bruto, **37 murieron en la verificación y 26 llegaron aquí**. Las muertas están en la sección 6, que vale tanto como el resto.
> Fecha de corte de los datos: 30 de julio de 2026. Correcciones de la crítica de completitud: 31 de julio (sección 9).
>
> **Ya ejecutado al escribir esto:** el arreglo del póster de los videos (fila 4 de la tabla final) está hecho, verificado y en producción. Y se corrigió un dato falso heredado: **Netlify sí despliega** — se comprobaron siete despliegues seguidos, todos en vivo en menos de 45 segundos.

---

## 1. La verdad incómoda, antes de cualquier plan

El dominio se registró el **26 de julio de 2026**. Al momento de esta auditoría tenía **cinco días de vida**, **15 notas** y **una sola persona escribiendo**. Eso impone tres límites que ningún ajuste técnico levanta:

**Primero: no hay histórico de nada.** No hay tráfico contra el cual medir, no hay posiciones que defender, no hay una base de la que partir. Cualquier cifra de "visitas esperadas" en este documento sería inventada, y por eso no hay ninguna.

**Segundo: el nombre del portal compite contra un banco global.** El autocompletado de Google para `santander economia` devuelve casi puro Banco Santander de España y Brasil; `economia santander colombia` aparece en sexto lugar y ya con el desambiguador. Consecuencia operativa: **no va a haber tráfico de marca**. Nadie va a buscar el medio por su nombre. Todo el tráfico tiene que venir de que el portal sea la respuesta a consultas que la gente ya hace por otra razón: pico y placa, predial, arriendo, renta, tarifas de transporte.

**Tercero: la velocidad no compra posiciones.** Google dice textualmente que *"There is no single signal"* y que *"Google Search always seeks to show the most relevant content, even if the page experience is sub-par"* (developers.google.com/search/docs/appearance/page-experience). Los arreglos técnicos de este plan sirven para que el lector que ya llegó no se vaya, y para no tener que rehacerlos cuando el sitio sí tenga contenido que posicionar. No son una palanca de captación.

**Qué se puede esperar, dicho sin adornos:**

- **Semanas 1 a 4:** saber si Google lo tiene indexado (hoy es una pregunta abierta), dejar de perder al lector que llega por WhatsApp, y tener publicada la primera página de consulta permanente. Tráfico orgánico esperado: no medible.
- **Meses 2 a 3:** entre cuatro y seis páginas de consulta permanente vivas, con fecha de vigencia visible y mantenimiento programado. Es cuando empieza a haber algo que pueda posicionar.
- **Más allá:** depende de que el mantenimiento se sostenga y de que alguien enlace el dominio. El cuello de botella real de un portal de cinco días no es técnico: **es que nadie lo enlaza todavía**.

**Lo único favorable, y es grande:** hay un hueco defendible verificado. Vanguardia publica **menos de dos notas de economía local por semana** y su artillería está en un anuario. Los nacionales solo entran cuando hay crisis (Portafolio concentró casi toda su cobertura de Santander en el paro de avalúos de abril). El Tiempo dedica **9%** de su cobertura de Santander a economía. Q'hubo no tiene sección de economía. El Frente llena la suya con Microsoft. **Nadie hace cobertura económica sostenida de Santander, nadie cubre empresa por empresa, y nadie cubre económicamente las provincias.** Ese es el terreno.

---

## 2. Cómo se lee este documento: quién hace qué

Si esto no queda separado, no lo hace nadie.

| Etiqueta | Quién | Qué cubre |
|---|---|---|
| **[CÓDIGO]** | Claude | Plantillas, `.eleventy.js`, JSON-LD, imágenes, CSS, feed, `config.yml`. Se despliega con el push habitual a `main`. |
| **[EDITORIAL]** | Francisco | Escribir, verificar cifras, llamar a fuentes, decidir qué se publica y qué se archiva. Nada de esto lo puede hacer otra persona. |
| **[CONSOLAS]** | Edwin | Cuentas, verificaciones de propiedad, Search Console, Bing, Resend, DNS. Trabajo de una sola vez. |

---

## 3. Esta semana

Cabe en: **~40 minutos de Edwin**, **medio día de código**, **una pieza escrita por Francisco**.

### 3.1 [CONSOLAS] Dar de alta el sitio en Search Console y Bing — 30 a 40 minutos

**Por qué:** hoy **no se puede responder si el sitio está indexado en Google**. Se intentó y la herramienta de búsqueda disponible no honra el operador `site:` (devolvió resultados del Banco Santander de Chile y Brasil). En Bing sí aparecen ya la portada, `/noticias/tres-fondos-inmobiliarios-bucaramanga/` y `/quien-soy/`, o sea el sitio no es invisible. En Google: **NO VERIFICADO**.

Search Console es la única fuente gratuita de consultas de búsqueda, impresiones, posición media y estado de indexación. GA4 (`G-HVC4Z011SY`) ya está instalado y mide visitas, pero no sabe nada de la búsqueda.

**Cómo, con las correcciones que salieron de la verificación:**

1. **NO verificar por registro TXT de DNS.** La recomendación original decía "TXT en name.com". Es falso por dos lados: el RDAP de Verisign devuelve **GoDaddy** como registrador, y la zona autoritativa **no está en ningún panel de registrador**: los nameservers son `dns1..dns4.p02.nsone.net`, que es Netlify DNS. Un TXT en name.com no haría absolutamente nada. Y aunque se pusiera en Netlify, la migración a Cloudflare Workers que está en curso (Fase B, con el dominio todavía en Netlify) lo borraría y se perdería la propiedad con todo su histórico.
2. **Crear propiedad de prefijo de URL** para `https://economiasantander.com/` y verificarla por **método Google Analytics** (GA4 ya está en el sitio) o por **archivo HTML commiteado al repo**. Si se usa el archivo: hay que añadir `eleventyConfig.addPassthroughCopy("src/googleXXXX.html")` en `.eleventy.js`, porque si no Eleventy lo renderiza como plantilla y sale en `/googleXXXX/index.html`, que no es la ruta que Google pide.
3. **Enviar** `https://economiasantander.com/sitemap.xml` (responde 200, 39 URLs).
4. **Pedir indexación de 3 o 4 URLs, no de las 14.** Google dice literalmente: *"there's a quota for submitting individual URLs and requesting a recrawl multiple times for the same URL won't get it crawled any faster"*. Pida: portada, `declaracion-renta-2026-vencimientos-agosto`, `uvr-que-es-como-afecta-credito-hipotecario`, `donde-rinde-mas-tu-plata-cdt-santander`. El resto entra por el sitemap.
5. **No pida indexación de** `santander-mas-alla-ecopetrol-palma-mapa-productivo`: es borrador (`eleventyExcludeFromCollections: true`, fecha 2026-08-03), sale con `noindex,nofollow` y no está en el sitemap. Gastaría cupo para nada.
6. **Bing: no verificar a mano.** En Bing Webmaster Tools, **importar desde Search Console**; queda verificado automáticamente y arrastra el sitemap. Ahí sí vale enviar las URLs a mano: el límite oficial es 10.000 por dominio al día.
7. **Opcional, 10 minutos:** archivo de clave IndexNow en la raíz (nombre `{clave}.txt`, 8-128 caracteres, contenido = la clave). Cubre Bing, Yandex, Naver, Seznam y Yep. **Google no participa.** También necesita su `addPassthroughCopy`.

**Expectativa honesta, para dejarla por escrito:** esto **no trae ni una visita**. Es instrumentación. Y el informe de Core Web Vitals va a decir "No data available" durante meses, porque se alimenta de CrUX y CrUX exige un mínimo de usuarios reales que un dominio nuevo no tiene. Para medir velocidad se usa PageSpeed Insights, no Search Console.

### 3.2 [CÓDIGO] Los tres arreglos que hoy están rotos a la vista — medio día

**a) El póster de los videos: `poster="[object Object]"` en la portada y en `/multimedia/`.**

Causa probada con build real del Eleventy 3.1.6 del proyecto: `src/_data/portada.json` crea la variable global `portada`, que le gana al `portada:` del front matter de los `.md` de multimedia. Arreglo, **tres archivos, no dos**:

1. `git mv src/_data/portada.json src/_data/destacadas.json`
2. `src/index.njk:8` → `ordenarPortada(destacadas.destacadas)`
3. `src/admin/config.yml:19` → `file: "src/_data/destacadas.json"`

**El paso 3 es obligatorio.** Sin él, la primera vez que Francisco entre a "Orden de la portada" en Decap y guarde, se recrea `portada.json` y el bug vuelve solo, en silencio.

**Reclasificado con honestidad:** esto **no trae tráfico**. La cifra original de "147 KB de basura por visita" está inflada: las tres etiquetas apuntan a la misma URL y el navegador la deduplica, así que es **una** petición 404. Y después del arreglo la página va a pesar *más*, porque empezará a bajar los tres pósters reales (77 + 56 + 34 KB). Se hace porque cuesta cinco minutos y hoy la sección se ve como tres rectángulos negros. Es credibilidad, no captación.

**b) El autor de las notas está desconectado de la ficha del periodista.**

`layout.njk:119-139` declara un nodo `Person` impecable con `@id .../#periodista`: veinte años, `jobTitle`, `alumniOf` (UNAB, Externado), dos premios, `sameAs` a Valora Analitik. Y `noticia.njk` emite en cada nota `"author": {"@type":"Person","name":"Francisco Gómez - Director"}` — que para Google es **otra persona**, y además mete el cargo dentro del nombre. Peor: una nota publica el texto de relleno `"[Nombre del periodista]"`.

Arreglo de una línea: `"author": { "@id": "https://economiasantander.com/#periodista" }`. El activo más valioso del portal es quién firma, y hoy ese capital no llega a ninguna nota.

**c) Fechas incoherentes que Google lee directo del JSON-LD.**

- `santander-mas-alla-ecopetrol-palma-mapa-productivo` publica `datePublished 2026-08-03`: fechada en el futuro. Como la portada y el sitemap ordenan por fecha, se queda clavada arriba hasta esa fecha.
- `cafe-especial-santander-mercados-europeos` publica `dateModified 2026-07-28` y `datePublished 2026-07-29`: dice que se modificó **antes de existir**. Origen: `updated` se escribe como fecha pelada y el filtro `isoDate` la convierte en medianoche UTC.
- De las 11 notas con `updated`, **nueve lo tienen idéntico a `date`**: `git log -S` muestra que entraron todas de un solo golpe en el commit que creó las notas. No es un registro de correcciones, es un sello masivo.

Arreglo: borrar `updated` donde es igual a `date` y donde es anterior; dejarlo solo en `licencias-construccion` y `tres-fondos-inmobiliarios`, que son las dos que sí se corrigieron después. Y en `noticia.njk:83`, cambiar `(updated or date)` por el **máximo** de los dos, nunca el `or`.

### 3.3 [EDITORIAL] Verificar la vigencia del pico y placa — una llamada

`src/_data/picoyplaca.json` declara la vigencia como *"Julio, agosto y septiembre de 2026"*. La imagen que publica la Dirección de Tránsito de Bucaramanga se llama `pico-y-placa-julio-a-octubre-2026-dias.png`, lo que sugiere que el periodo oficial es de julio a **octubre**. **NO VERIFICADO**: no se leyó la Resolución 854 de 2025 completa.

Esto importa porque la siguiente acción del plan —la más rentable de todas— vive o muere por la exactitud de esa fecha. **Antes de publicar, hay que confirmarlo con la fuente.**

---

## 4. Este mes

### 4.1 [CÓDIGO + EDITORIAL] La página `/pico-y-placa/` — la acción de mayor retorno de todo el plan

**Estado actual, verificado:** el dato de la rotación vigente **ya está en el repositorio** (`src/_data/picoyplaca.json`, con rotación desde 2026-07-06, horarios 6:00-20:00 entre semana y 9:00-13:00 sábados). Se inyecta como `window.__PICO_Y_PLACA__` y se pinta con JavaScript **en una franja del encabezado**. No existe ningún archivo con `permalink: /pico-y-placa/`. Es decir: **el activo de mayor demanda recurrente de la ciudad está en el repo, se usa como adorno del header, y Google no tiene ninguna URL que indexar por él.**

**Por qué trae tráfico, y esta vez sí hay argumento:**

1. **Ni la fuente oficial ni el competidor publican los dígitos en texto.** La página de la Dirección de Tránsito de Bucaramanga tiene el detalle por día **dentro de un archivo de imagen**: el texto de la página no contiene los dígitos, ni los horarios, ni si aplica sábados, ni motos, ni taxis. La página permanente de Vanguardia (`vanguardia.com/pico-y-placa-bucaramanga/`) tiene exactamente el mismo problema: encabezado, infografía, y nada en texto. **Publicar lo mismo en HTML plano, con tabla y fecha de vigencia, es una ventaja estructural que no depende de presupuesto.**
2. **Existe una industria entera dedicada solo a esto.** Una búsqueda devuelve seis dominios cuyo modelo de negocio es únicamente esa consulta, cada uno con página propia para Bucaramanga: calendariodecolombia.com, grupor5.com, pyphoy.com, picoyplacaya.com.co, horapico.co, picoplacahoy.co. Nadie mantiene una granja de páginas por ciudad para una consulta sin volumen. *(No hay volumen exacto y no se va a inventar: la evidencia es la existencia y especialización del mercado.)*
3. **La cola larga es mucho más profunda que "particulares".** El autocompletado de Google (datos de consultas reales, no estimaciones) devuelve clusters propios y separados para: `pico y placa bucaramanga taxis` (hoy, mañana, esta semana, por mes), `pico y placa bucaramanga motos`, `excepciones pico y placa bucaramanga` (2026, peaje, metropolitano), `pico y placa solidario bucaramanga` (cuánto vale, dónde se paga) y `pico y placa floridablanca` (hoy, mañana, 2026). **El JSON del repo solo modela particulares de Bucaramanga.**

**Qué se construye:**

- `/pico-y-placa/` con tabla en HTML plano, dígitos, horarios, sábados, fecha de vigencia visible y la resolución citada.
- Ampliar `picoyplaca.json` con **motos**, **taxis** y **excepciones**.
- Páginas hermanas para **Floridablanca**, **Girón** y **Piedecuesta** (tienen cluster propio de autocompletado).
- `BreadcrumbList` (hoy no existe en ninguna página del sitio, aunque la jerarquía Portada > Sección > Nota ya está montada y funcionando).

### 4.2 [EDITORIAL] Las otras páginas de consulta permanente

Todas verificadas con fuente citable. En orden de prioridad:

**a) Predial del área metropolitana.** Cuatro clusters independientes en el autocompletado (Bucaramanga, Floridablanca, Girón, Piedecuesta), todos con terminaciones de trámite: `consultar`, `pagar`, `por cédula`, `paz y salvo`, `pago en línea`, `pse`, `descuento`. Quienes rankean hoy **no son medios**: son `impuestos-gov.com`, `certificadodetradicion.com.co` y una inmobiliaria. El calendario 2026 es verificable: descuento del 10% hasta el 31 de marzo, 5% hasta el 30 de abril, incremento del 3% para la vigencia, pago diferido en cuatro cuotas del 31 de marzo al 30 de junio.

**b) Aumento del arriendo.** Base legal citable y no inventable: **Ley 820 de 2003, artículo 20** — se puede subir el canon una vez cada doce meses hasta el 100% del IPC del año calendario anterior, con obligación de notificar monto y fecha por servicio postal autorizado, so pena de inoponibilidad; **artículo 18** — el canon mensual no puede exceder el 1% del valor comercial del inmueble. El autocompletado pide `calculadora`, `ipc`, `porcentaje` y, con fuerza, el ángulo que casi nadie cubre: `cuanto puede subir el arriendo de un local comercial en colombia 2026`. **Para local comercial esa regla no aplica: ese es exactamente el vacío.**

**c) Industria y Comercio de Bucaramanga.** Calendario 2026 verificable: declaración de la vigencia 2025 del 2 al 24 de marzo según último dígito del documento; régimen general en tres cuotas (31 marzo, 30 junio, 30 septiembre); régimen preferencial en dos (27 febrero, 30 junio). El autocompletado pide `pago`, `pse`, `inscripción`, `recibo de pago`, `horario`: **la gente busca cómo pagar, no qué es el impuesto.** Encaja en la sección "Impuestos y regulación" que ya existe.

**d) Tarifas de transporte.** En enero de 2026 El Espectador, El Tiempo, BluRadio, La República, Vanguardia y otros publicaron todos la misma pieza. Cifras verificables: Metrolínea a $3.000 rutas cortas y $3.600 largas, alza de $300 frente a 2025; mínima del taxi subió alrededor de 16%. El autocompletado confirma consulta viva todo el año (`tarifa taxi bucaramanga aeropuerto`, `calcular tarifa taxi bucaramanga`, `cuanto vale el pasaje en bus bucaramanga`). **Ellos publican la nota una vez en enero; quien mantenga la tabla se queda con los doce meses.**

**e) Las 360 empresas más grandes de Santander.** La Cámara de Comercio de Bucaramanga publica el ranking (esas 360 sumaron $30,9 billones en ventas, 67,7% de los ingresos de todas las empresas, ~51,9% del PIB departamental). Vanguardia lo convierte en nota cada julio, **como nota, no como tabla consultable**. El autocompletado pide `empresas mas grandes de santander`, `500 empresas mas grandes de santander`, `las 100 empresas más grandes de santander`. Una tabla buscable y ordenable se actualiza una vez al año.

### 4.3 [CÓDIGO] Sacar las guías de `/noticias/`

Tres archivos llevan `guia: true` (`declarar-renta-independientes-santander`, `glosario-ipc-dtf-usura-spread-bancario`, `uvr-que-es-como-afecta-credito-hipotecario`), pero ese campo **solo pinta un módulo en la portada**. La URL sigue siendo `/noticias/<slug>/`, el layout es `noticia.njk`, imprime la firma "Por Francisco Gómez · <fecha>" y el JSON-LD las declara `NewsArticle`.

Resultado: una guía que debería competir como página de consulta permanente compite como noticia del 28 de julio, y **envejece a la vista del lector y del buscador**. Hay que darles ruta propia, layout sin fecha de publicación en la firma (con "actualizada el" en su lugar) y tipo de contenido acorde.

Lo mismo aplica a tres notas que ya son páginas vivas disfrazadas de noticia, y el autocompletado lo confirma con patrón mes a mes o día a día:
- `mejor cdt 2026` → una consulta distinta cada mes (enero, febrero… julio 2026). Ya existe `donde-rinde-mas-tu-plata-cdt-santander`.
- `tasa de usura` → febrero a julio 2026, más "hoy". Ya existe el glosario con tablero de tasas.
- `precio del cafe hoy` → literalmente `precio del cafe hoy 30 de julio 2026`, `...29 de julio 2026`, `...28 de julio 2026`, `precio del cafe hoy carga`, `precio del cafe hoy por kilo`. **Demanda diaria con fecha explícita.** Ya existe `cafe-especial-santander-mercados-europeos` con la carga a $2.210.000.

**Las tres están congeladas en una fecha de julio y quedarán obsoletas en semanas.** Convertirlas en páginas con fecha de actualización visible es más barato que escribir tres notas nuevas.

### 4.4 [EDITORIAL] Enlaces internos desde el cuerpo de las notas

Análisis del cuerpo (`<div class="noticia-cuerpo">`) de una nota típica: **cero enlaces internos**, dos externos. La página tiene 54 URLs internas distintas, pero **todas son plantilla**: menú, submenú de 15 secciones, pie y bloque "Sigue leyendo". Un enlace que aparece igual en las 39 páginas no le dice nada a Google sobre de qué trata *esta* nota.

Lo caro es la oportunidad perdida: el glosario y la nota de UVR son justo el tipo de página que capta consultas de cola larga durante años, y **no reciben un solo enlace desde el cuerpo de ninguna nota**, aunque hay notas que hablan de UVR, IPC y DTF sin enlazarlas.

Esto lo hace Francisco desde el CMS, es texto, y no requiere código.

### 4.5 [CÓDIGO] Peso de página: imágenes primero, fuentes después

**Imágenes (primero, porque es donde está el daño).** Medido con navegador real a 412 px sobre `/noticias/comercio-consumo-santander-2026/`: la página descarga entre **4,68 MB y 6,4 MB** según la medición, y **4,5 MB de eso es una sola foto** (`pexels-hangers-1850082.jpg`, 8688×5792 px reales) que se pinta a **276×161 px**. Sin `srcset`, y encima `layout.njk:40` la marca con `<link rel="preload" as="image" fetchpriority="high">`: el sitio está gastando su máxima prioridad de red en el archivo más pesado. En la portada el elemento LCP es la foto del café de 1,8 MB pintada a 356×208 px.

Método corregido: **no editar `srcset` a mano**. Instalar `@11ty/eleventy-image` v6 (CommonJS, encaja con el `.eleventy.js` actual; la v7 es solo ESM y exige Node 22+) y activar su HTML Transform, que reescribe **todas** las `<img>` del build. Cubre de un golpe las cuatro superficies: hero de nota, hero de portada (`index.njk:17`, donde está el LCP medido), miniaturas de "Sigue leyendo" (`noticia.njk:62`, que hoy bajan el original de 1,8 MB para pintarlo a 110 px) e imágenes de cuerpo en markdown (`.eleventy.js:50`).

**Dos trampas que hay que desarmar en el mismo commit o el arreglo empeora la página:**
- **Borrar o reapuntar el preload de `layout.njk:40`.** El HTML Transform reescribe `<img>` y `<picture>`, no `<link rel=preload>`. Si queda, el navegador baja el original de 4,5 MB **más** la variante optimizada.
- **Quitar los `width`/`height` fijos** (`noticia.njk:23`, `index.njk:18`, `noticia.njk:62` y la regla de markdown en `.eleventy.js`). Comprobado empíricamente: con ellos puestos, el plugin emite **una sola** variante y no hay `srcset`. El plugin repone las dimensiones con la relación de aspecto real, así que el CLS sigue cubierto — pero hay que revisar `object-fit`/`aspect-ratio` en el CSS o algunas fotos se deforman (la del autor pasa de 84×84 a 84×132).

Resultado medido con ffmpeg sobre los archivos reales: el hero de comercio pasa de **4.653.759 B a 44.250 B** en WebP a 1000 px. La nota queda alrededor de 200 KB.

**Mantener el tope en 1600 px, nunca por debajo de 1200:** Discover exige oficialmente imágenes de *"at least 1200 px wide"* y más de 300.000 píxeles totales. Y **no poner el `og:image` en WebP**: WhatsApp es el canal real de este portal.

**Fuentes (después).** `src/assets/style.css` pesa 235.121 bytes y **148.478 de ellos (63%) son cinco `@font-face` en base64**. Como base64 es binario ya comprimido, el CSS casi no comprime: 106.073 bytes en el cable. Sin las fuentes, brotli lo deja en **14.226 bytes**. Y **Oswald 600 y 700 son el mismo binario** (md5 `5f49329007`, 21.472 bytes cada uno): 21 KB tirados en cada primera visita.

A/B medido con Playwright + CDP en 4G lenta (1,6 Mbps / 150 ms RTT, CPU 4x): en una nota, FCP **2272 → 1532 ms** y LCP **2272 → 1604 ms**. En la portada, FCP baja pero el LCP se queda en 11 segundos, porque ahí manda otra cosa: 1,90 MB de JPEG. **Por eso las imágenes van primero.**

Correcciones al plan original:
- **No borrar el `@font-face` de Oswald 700.** Dejar las dos reglas (600 y 700) apuntando al **mismo archivo**. Se ahorran los mismos bytes duplicados y se evita la negrita sintética en los titulares (hay 39-41 reglas con `font-weight: 700`).
- **Precargar dos caras, no una:** Barlow 400 (cuerpo) y Oswald 600 (titulares, es el LCP de las notas). Con una sola, el CLS medido sube.
- **Poner huella en el nombre** (`barlow-400.<hash>.woff2`) antes de aplicar `immutable`. Sin huella, `immutable` congela el archivo un año y contradice la regla que el propio `src/_headers` documenta en sus líneas 30-31.
- La regla `/assets/fonts/*` en `_headers` **no existe hoy, hay que añadirla** y es obligatoria: el default de Cloudflare Workers es `max-age=0, must-revalidate`.

**Enunciado honesto:** los bytes totales apenas bajan (las fuentes reaparecen como peticiones aparte). Lo que cambia es que **89 KB dejan de bloquear el pintado** en las 43 páginas. Y en imágenes sí hay ahorro real y enorme.

### 4.6 [CÓDIGO] Sitemap: `lastmod` correcto, sin inventar fechas

Estado: `sitemap.njk:21` usa `n.date` (publicación) para el `lastmod`, no `updated`. `licencias-construccion-bucaramanga-crecen` le dice al sitemap "modificada el 22 de julio" mientras la propia página dice en el JSON-LD "dateModified 2026-07-28". Dos señales contradictorias.

**Qué sí hacer:**
- Usar el **máximo** entre `updated` y `date`, no `(updated or date)`. Con el `or`, la nota del café **retrocedería** su `lastmod` de 29 a 28 de julio.
- Limpiar antes los `updated` sucios (ver 3.2.c). Sin eso, el cambio mueve dos URLs y estropea una.
- Añadir `lastmod` **solo a las 15 URLs de sección**, con la fecha de su nota más reciente. Ese dato es verificable: la página de sección sí cambia cuando entra una nota.
- Declarar `updated` en `src/admin/config.yml` como `widget: datetime`, `required: false`, **con `default: ""`** (hasta Decap 3.2.1 el widget datetime se autorrellenaba con la fecha actual, y el admin carga `decap-cms@^3.0.0` desde unpkg, versión flotante — sin esa línea, cada guardado estamparía una corrección falsa). Con un `hint` explícito: *"Llénela SOLO si corrigió o amplió la nota después de publicarla."*
- Quitar `<changefreq>` y `<priority>`: Google dice textualmente *"Google ignores `<priority>` and `<changefreq>` values"*. Son 78 líneas de ruido.

**Qué NO hacer:** ver sección 6.

### 4.7 [CÓDIGO] Feed RSS — con la justificación correcta

Crear `src/feed.njk` → `/feed.xml` con las notas más recientes, enlace absoluto, fecha y excerpt; `<link rel="alternate">` en el `<head>` y enlace visible en el pie.

**Aclaración para no vender humo:** el feed **no es para Google News**. Google News no pide feed ni alta manual, e incluso **dejó de leer feeds en Publisher Center desde marzo de 2025**. El feed sirve para otra cosa, y es real: **es la única entrada mecánica para automatizar el boletín por correo** y para agregadores. Por sí solo no trae tráfico.

### 4.8 [EDITORIAL + CONSOLAS] Canal de WhatsApp y boletín

**Canal de WhatsApp** [EDITORIAL]. Se crea gratis desde el teléfono, **no expone el número de Francisco**, no tiene tope de seguidores, genera enlace y código QR para pegar en el sitio, admite enlaces, y hay directorio filtrado por país.

Lo que hay hoy (`layout.njk:307` y `:329`) es un enlace a `wa.me/573112865169` — **el número personal de Francisco** — que desemboca en listas de difusión, con **tope de 256 contactos** y con el requisito de que **cada lector tenga guardado su celular**. El canal no tiene ninguno de los dos problemas.

**No hay API oficial para publicar en Canales.** Las APIs de terceros operan sobre el protocolo web no oficial y llevan riesgo de bloqueo de cuenta. **Se publica a mano. No hay atajo de n8n legítimo.** Y las difusiones de marketing de WhatsApp Business ahora **se pagan por mensaje entregado**.

**Boletín** [CONSOLAS + CÓDIGO]. Hoy es un `mailto:` (`layout.njk:308`): obliga a copiar direcciones a mano, no tiene desuscripción, y con Gmail personal no hay envío masivo viable. No hay formulario de suscripción en ninguna parte.

Resend gratis alcanza para arrancar: 100 correos/día y 3.000/mes en el lado transaccional; el lado de marketing da *"unlimited emails to up to 1,000 contacts per month"*, maneja las desuscripciones solo, y su API de Broadcasts programa envíos (`scheduled_at`). **Matiz honesto:** la documentación no dice si un Broadcast a 1.000 contactos consume el tope de 100/día del lado transaccional. **Hay que comprobarlo en el primer envío real.**

La infraestructura ya está: el plan gratuito de Cloudflare Workers da 100.000 peticiones/día y 5 cron triggers, el repo ya corre un Worker, y `wrangler.jsonc` documenta el patrón: añadir `/api/suscribir` es una línea en `run_worker_first` más un handler. **Ojo con la advertencia del propio archivo:** poner `run_worker_first` en `true` a secas volvería cobrable todo el sitio.

### 4.9 [EDITORIAL] Poner el enlace donde ya hay autoridad

Su ficha de autor en Valora Analitik está viva, con biografía extensa, premios y ocho notas, y enlaza a Twitter `@pachogom2000` e Instagram `@pachogom`. **No enlaza a economiasantander.com.** Y en el propio sitio, `src/_data/redes.json` tiene los cinco perfiles con la URL vacía: los handles públicos existen afuera y faltan adentro.

El cuello de botella de un dominio de cinco días es que nadie lo enlaza. Este es el enlace más fácil de conseguir que existe.

### 4.10 [CÓDIGO] Seis notas sin imagen

`glosario-ipc-dtf-usura-spread-bancario`, `licencias-construccion-bucaramanga-crecen`, `santander-mas-alla-ecopetrol-palma-mapa-productivo`, `tres-fondos-inmobiliarios-bucaramanga`, `turismo-santander-hoteleria-2026` y `uvr-que-es-como-afecta-credito-hipotecario` no tienen campo `imagen:`. Como `noticia.njk:81` envuelve `image` en un `{% if imagen %}`, esas notas publican un `NewsArticle` **sin `image`**. Y heredan como `og:image` una foto de empleo formal: un glosario de IPC compartido con una foto de empleo es exactamente la *"misleading preview content"* que Discover dice evitar, y en WhatsApp es la diferencia entre que toquen el enlace o no.

**Dos de esas seis (el glosario y la de UVR) son las piezas evergreen con más recorrido.**

Además, `og:image:width` y `og:image:height` están **quemados en 1200×700** para todo el sitio (`layout.njk:32-33`), sin importar el archivo real, que va de 724×483 a 8688×5792. Y dos fotos (`financiero.jpg`, `gettyimages-878980416.jpg`) miden 724×483, **por debajo del mínimo de 1200 px de Discover** — justamente en las dos notas de temporada de renta.

---

## 5. En tres meses

### 5.1 [EDITORIAL] La serie de diez entregas, con nombre y con casa

El borrador `santander-mas-alla-ecopetrol-palma-mapa-productivo.md` anuncia en el cuerpo: *"Esta serie recorre esas diez cadenas, una por entrega"*. Pero (a) **la serie no tiene nombre propio**, (b) **no existe colección ni página hub** que las agrupe — `.eleventy.js` solo registra la colección `secciones` —, y (c) el front matter dice `autor: "[Nombre del periodista]"`, un marcador de posición que, si se publica así, se imprime en el `<meta name="author">` y en el JSON-LD de las diez notas.

**Es la apuesta editorial más grande del repositorio y hoy no puede acumular autoridad porque no es un objeto con nombre.** Ponerle nombre, hub propio y navegación entre entregas es lo que convierte diez notas sueltas en un activo.

### 5.2 [CÓDIGO + EDITORIAL] Industrializar el dataset de la Cámara de Comercio

Dataset `wf53-j577` de datos.gov.co, verificado por consulta directa a la API Socrata: **67.982 empresas**, sin llave, sin costo, consultable con SoQL. Campos: `nit`, `razon_social`, `tipo_juridico`, `estado`, `fecha_matricula`, `desc_ciiu1`, `ciudad`, `departamento`, `tamano_empresa`.

Estados: 62.662 ACTIVO, 4.859 CANCELADO, 203 cambio de domicilio, 113 pérdida calidad comerciante, 80 en disolución anticipada, 43 disolución por vigencia, 9 en liquidación judicial, 8 disolución Ley 1727, 4 liquidación por adjudicación, 1 en concordato.

Granularidad municipal: Bucaramanga 34.338, Floridablanca 8.502, Girón 4.901, Piedecuesta 4.814, San Gil 2.693, Barbosa 1.738, Lebrija 1.266, Socorro 1.154, Vélez 737, Málaga 691, Rionegro 553, Barichara 420.

Las cohortes de supervivencia funcionan: matriculadas en 2019 = 3.119 activas / 251 canceladas; 2020 = 3.521 / 297; 2021 = 4.209 / 445. **Francisco ya publicó una nota con esta lógica** (`emprendimiento-pymes-bucaramanga-2026`), así que no es un experimento: es industrializar lo que ya hace.

**CAVEAT DURO, respételo o la cifra sale mal:**
1. `fecha_matricula` está guardada como **texto**, no como fecha: `date_trunc_y` devuelve `query.soql.type-mismatch`. Hay que agrupar con `substring(fecha_matricula,1,4)` o filtrar con `starts_with`.
2. **El corte está desactualizado:** `max(fecha_matricula)` = 2026-03-05, y todo 2026 tiene apenas **25 registros**, contra 11.236 de 2025 y 8.031 de 2024. **Un "nuevas empresas de este mes" construido sobre esto sería falso.** Sirve para análisis estructural y cohortes históricas, no para coyuntura mensual.

### 5.3 [EDITORIAL] Los PDF de la Cámara que nadie convierte en periodismo

La CCB publica un flujo constante de informes en PDF que se quedan ahí: *Dinámica Empresarial en Provincia de Yariguíes 2025* (17-jul-2026), *Provincia de Soto Norte 2025* (8-jul-2026), *Provincia Metropolitana 2025* (24-jun-2026), *Supervivencia empresarial en Santander 2025*, *Encuesta Ritmo Empresarial Santander 2026 – I semestre*, e informes sectoriales de Construcción, Metalmecánica y TI 2025.

Y su página de indicadores lista, **toda en PDF**: exportaciones (trimestral, serie desde 2014), PIB departamental (anual, desde 1990), **Índice de Competitividad Municipal (anual, 29 municipios de Santander, desde 2018)**, dinámicas empresariales, nuevas empresas constituidas, comportamiento de las 360 mayores y balance de construcción.

**Un PDF no compite por una búsqueda como "competitividad de San Gil" ni se lee en celular.** Las cifras existen y son públicas; lo que falta es la versión web. Es materia prima gratis, fechada y con marca institucional.

Contexto que refuerza el hueco: **La República ha cubierto a la Cámara de Comercio de Bucaramanga tres veces entre 2018 y 2024.** La institución que produce toda la data empresarial de la región recibe cobertura nacional cada varios años.

### 5.4 [EDITORIAL] Las provincias

La sección Región de Vanguardia (22 al 29 de julio, nueve notas) nombró **únicamente a Bucaramanga y Los Santos**. San Gil, Socorro, Barbosa, Vélez, Málaga y Barichara **no aparecen económicamente en ninguna parte**, ni en Vanguardia ni en los nacionales — ni siquiera cuando la propia CCB les publica un informe dedicado.

Y el dataset ya da el número de empresas de cada uno (ver 5.2). Es la combinación de un punto ciego total con un dato público que nadie está usando.

### 5.5 [EDITORIAL] Lo único que ni una IA ni un pasante de Bogotá pueden replicar

El sitio de Fenalco Santander no tiene publicaciones fechadas ni indicadores regionales propios (la *Bitácora Económica* es un producto **nacional** de Fenalco, no santandereano). ANDI Seccional Santander (91 empresas afiliadas) sí produce boletines mensuales, pero **son para afiliados**.

**El termómetro gremial de Santander no está en internet. Solo existe si alguien llama.** Eso no se puede scrapear. Es el activo que veinte años de trayectoria sí compran.

### 5.6 [EDITORIAL] El calendario que hace posible que una persona sola sostenga páginas vivas

Este es el argumento operativo de por qué el plan es factible: **el calendario de actualización lo fija el DANE, no la coyuntura.**

- **IPC:** quinto día hábil de cada mes (el de enero 2026 salió el 6 de febrero; el de abril, el 8 de mayo). Doce fechas al año que se pueden poner en el calendario con un año de anticipación.
- **GEIH del área metropolitana de Bucaramanga:** mensual (7,9% de desempleo febrero-abril 2026; 8,4% enero-marzo).
- **Boletín Económico Regional del Banco de la República:** trimestral. **Ojo:** Santander va dentro de "Nororiente", junto con Boyacá y otros, con ~2,3 meses de rezago (el del IV trimestre de 2025 salió el 9 de marzo de 2026). **Nadie desagrega la lectura santandereana de ese boletín.** La fuente oficial existe, pero llega mezclada y tarde: ese trabajo de separación está vacante.

No hay que "estar pendiente". Se sabe con semanas de anticipación qué día sale cada cifra regional.

---

## 6. Lo que NO vamos a hacer, y por qué

Esta sección vale tanto como la anterior. Todo lo de aquí se propuso y se descartó con fuente.

### Canales muertos o inaccesibles

**Registrarse en Google News.** No existe la solicitud. Cita oficial: *"Google automatically considers all web content for inclusion in Google News, so you don't need to apply"* y *"Publishers are automatically considered for 'Top stories' or the News tab of Search."* Cualquier consejo que diga "registre el portal en Google News" está desactualizado.

**Enviar el feed o la "web location" a Publisher Center.** Google publicó: *"Google News will no longer use RSS feeds or web locations that were submitted in Publisher Center"*, y las páginas de publicación creadas a mano dejaron de mostrarse. Lo único vivo ahí es News Showcase (por invitación) y Reader Revenue Manager.

**MSN / Microsoft Start.** Dos razones oficiales: *"MSN Partner Hub is invitation-only"* y *"News sites must publish a minimum of 10 articles daily, including live/breaking coverage."* Una persona sola no publica diez notas diarias.

**Apple News.** Solo existe en Australia, Canadá, Reino Unido y Estados Unidos. **No hay nada que solicitar desde Colombia.**

**El botón "Seguir" de Chrome/Discover.** Según el resumen de la documentación, está disponible en inglés y solo en EE. UU., Nueva Zelanda, Sudáfrica, Reino Unido, Canadá y Australia. **NO VERIFICADO de primera mano** (la URL oficial devolvió 404). Si el dato es correcto, deja sin efecto el argumento de "haga feed para que lo sigan desde Chrome" en Colombia.

**Agregadores colombianos.** No se encontró ninguno vivo que admita nuevos medios y reparta audiencia; lo que aparece son directorios comerciales de feeds. **Esto es ausencia de hallazgo, no prueba de que no exista** — Francisco tiene contactos en el gremio y puede saber de algo que la búsqueda pública no muestra.

### Redes que no llevan tráfico

**YouTube Shorts como fuente de visitas.** Documentación oficial: los enlaces **no son clicables** en *"Shorts comments and descriptions"*. Lo único clicable sin condiciones es el perfil del canal. Un Short construye marca, no manda gente al portal.

**TikTok.** **NO VERIFICADO** el requisito para poner enlace en la bio: la página oficial de soporte no entrega contenido legible ni por fetch ni por navegador automatizado, y lo de "1.000 seguidores o cuenta de empresa" solo aparece en blogs. **Sin enlace clicable confirmado, TikTok no puede sostener una promesa de tráfico.**

**Instagram más allá de Stories.** El único enlace clicable garantizado es el sticker de Stories (anuncio oficial del 27 de octubre de 2021, sin requisito de seguidores). Los pies de publicación siguen sin enlace clicable. Lo de enlaces clicables en pies para suscriptores de Meta Verified: solo reportes de prensa, **NO VERIFICADO**.

**Diseñar la estrategia de LinkedIn alrededor de la "penalización por enlaces salientes".** LinkedIn **nunca ha publicado tal penalización**. Su ayuda oficial solo dice que *"hundreds of signals"* determinan el feed, sin mencionar enlaces externos. Las cifras que circulan ("los enlaces cuestan 60% de alcance", "-18,8% de mediana") son de blogs de marketing: **NO VERIFICADAS**. No se diseña alrededor de una regla que la plataforma nunca enunció.

**Listas de difusión de WhatsApp.** Tope de **256 contactos** por lista, y *"Solo las personas que tengan tu número de teléfono guardado como contacto recibirán tu mensaje de difusión"*. Dos muros insalvables.

**Difusiones de marketing de WhatsApp Business.** *"Con los mensajes de marketing, pagas por cada mensaje que se entrega a un destinatario."* Cierra la puerta al camino "difusión masiva gratis".

**Automatizar el Canal de WhatsApp.** No existe API oficial. Las de terceros operan sobre el protocolo web no oficial, con riesgo de bloqueo. Se publica a mano.

### Ejecuciones técnicas que se descartaron por dañinas o inútiles

**Verificar Search Console por TXT de DNS.** El registrador no es name.com (RDAP de Verisign devuelve **GoDaddy**) y la zona autoritativa está en **Netlify DNS** (`nsone.net`). Un TXT en el panel del registrador no resolvería. Y cuando se corten los nameservers a Cloudflare en la Fase B, el TXT desaparece y **se pierde la propiedad con todo su histórico**.

**Pedir indexación de las 14 o 15 notas una por una.** Google: *"there's a quota for submitting individual URLs and requesting a recrawl multiple times for the same URL won't get it crawled any faster"* y *"If you have large numbers of URLs, submit a sitemap."* Tres o cuatro URLs, una vez.

**Esperar el informe de Core Web Vitals en Search Console.** Se alimenta de CrUX, que exige un mínimo de usuarios reales en una ventana de 28 días. *"If a URL group does not have a minimum amount of reporting data for both LCP and CLS, the URL is omitted from the report."* Va a decir "No data available" durante meses.

**Poner `lastmod` con la fecha del último despliegue** en `/quien-soy/`, `/multimedia/`, `/indicadores/`, `/dolar-hoy/` y las cinco legales. Google: *"The `<lastmod>` value should reflect the date and time of the last significant update to the page… an update to the copyright date is not [significant]"*, y *"Google uses the `<lastmod>` value if it's consistently and verifiably accurate."* El repo lleva 108 commits, siete en un solo día. Jurarle a Google que la política de cookies cambió siete veces hoy es exactamente lo que hace que **descarte el `lastmod` de todo el sitemap** — anulando la única parte donde sí servía. Además `/indicadores/` y `/dolar-hoy/` se arman de `mercado.json`, un archivo commiteado: su HTML no cambia por desplegar. **Omitir el `lastmod` es válido y honesto; ponerlo falso es dañino.**

**Borrar el `@font-face` de Oswald 700.** Dejaría ~39 reglas con `font-weight: 700` sin cara exacta y el navegador puede sintetizar la negrita. Se deja la regla apuntando al mismo archivo que la 600.

**Aplicar `Cache-Control: immutable` a archivos sin huella en el nombre.** Contradice la regla que el propio `src/_headers` documenta en sus líneas 30-31, y este proyecto **ya sufrió el problema de servir una hoja de estilos vieja**.

**Redimensionar cinco fotos a mano.** Decap no comprime al subir y Eleventy solo copia `src/assets`. La sexta foto vuelve a pesar 5 MB y nadie se entera. Va en el build o no va.

**Arreglar títulos y meta descripciones.** Se revisaron las 44 páginas generadas: los `<title>` son únicos uno por uno, la mayoría entre 54 y 63 caracteres, las notas no repiten la marca y las páginas de servicio sí (que es lo correcto). Las meta descripciones también son únicas, escritas a mano y con cifra concreta. Solo dos matices menores (un título de 100 caracteres, algunas descripciones sobre 160). **No es un hueco de tráfico. No gaste horas de Francisco aquí.**

**Arreglar el `SearchAction` y el `logo` del `NewsMediaOrganization`.** El sitio declara un buscador en `/?s=` que no existe y que `robots.txt` además bloquea; impacto en tráfico prácticamente nulo. Y sobre el `publisher`: la documentación de Article hoy dice textualmente *"There are no required properties"* y ni siquiera lista `publisher` entre las recomendadas. **No es cierto que Google lo exija.** Ponerlo es barato, pero no se vende como hueco de tráfico.

### Editorial que no se hace

**Más notas cuyo gancho sea "la inflación de Bucaramanga".** Este es el hallazgo incómodo: el sitio tiene tres notas construidas sobre el dato de que Bucaramanga lidera la inflación del país con 7,05%, y periodísticamente es el mejor dato que tiene. Pero el autocompletado de `inflacion bucaramanga` devuelve **dos sugerencias** y el de `canasta familiar bucaramanga` devuelve **una: la propia semilla**. Cuando Google no tiene variantes que sugerir es porque casi nadie escribe esa frase. **Sirve como argumento dentro de otras páginas —encarece el arriendo, define el CDT real, fija el tope del canon— pero no sostiene una página de consulta por sí mismo.**

**Seguir gastando inventario en macro nacional.** De las 15 notas, **seis** compiten de frente contra Portafolio, La República y el propio cable de Vanguardia: renta, CDT, glosario, UVR, tasa de intervención. Vanguardia ya publica exactamente esos temas. Las otras nueve (calzado, café, licencias, empleo formal, turismo, comercio, pymes, fondos inmobiliarios, mapa productivo) sí están en el hueco defendible. **40% del inventario está en el terreno más saturado del país.**

**Atacar de frente las "500 Empresas Generadoras de Desarrollo" de Vanguardia.** Va en su edición 23 y viene con evento de premiación. No hay cómo igualar veintitrés años de relaciones ni el evento. Pero deja libre **once meses del año sin cobertura empresarial sostenida**: ahí es donde se juega.

**Cambiar el nombre del portal.** La colisión con Banco Santander es real, pero la consecuencia operativa no es rebautizar: es no apoyar la estrategia en tráfico de marca.

**Buscar alianza con un observatorio económico de la UNAB o la UIS.** Se buscó expresamente y **no se encontró ninguno**. La UNAB centraliza publicaciones en su Sistema de Bibliotecas y tiene revistas académicas, ninguna de coyuntura económica. **NO VERIFICADO.** Si Francisco quiere explorarlo, es llamada en frío, no un activo existente.

**Arreglarle el póster a los videos como táctica de tráfico.** Se hace por credibilidad (cinco minutos), no por visitas: `src/multimedia/multimedia.json` tiene `"permalink": false`, así que los tres videos **no tienen URL propia** y no están en el sitemap. Google exige que *"the video must be embedded on a watch page"* y que *"the watch page must be indexed"*. Además no hay marcado `VideoObject` en ninguna parte, y los tres videos son metraje de banco (el propio front matter dice *"Video: Pexels · licencia de uso libre"* y *"Video: Mixkit"*). **Antes de invertir en video hay que tener video propio y URL propia; el póster es lo último de la lista.**

**Usar el dataset de la CCB como contador mensual de empresas nuevas.** Ver el caveat de 5.2: el corte es 2026-03-05 y todo 2026 tiene 25 registros. Sería una cifra falsa.

---

## 7. Todo lo que quedó NO VERIFICADO

No está escondido en el cuerpo del documento; está aquí junto.

| Qué | Estado | Consecuencia |
|---|---|---|
| **Si Google tiene el sitio indexado** | NO VERIFICADO. La herramienta de búsqueda disponible no honra el operador `site:`. En Bing sí aparecen portada, `/noticias/tres-fondos-inmobiliarios-bucaramanga/` y `/quien-soy/`. | Es la primera pregunta que Search Console responde. Lo que **sí** está verificado es que nada lo impide: `robots.txt` 200 con `Allow: /`, sitemap 200 y válido, `index, follow, max-image-preview:large`, canonical absolutos, 404 real. |
| **Vigencia real del pico y placa** | NO VERIFICADO. El JSON dice "julio, agosto y septiembre"; el nombre del archivo oficial sugiere "julio a octubre". No se leyó la Resolución 854 de 2025 completa. | **Confirmar antes de publicar `/pico-y-placa/`.** Una página de consulta vive o muere por su fecha de vigencia. |
| **Volumen de búsqueda de cualquier consulta** | NO VERIFICADO, y no se va a estimar. | Todo lo que sostiene las prioridades es cualitativo: autocompletado de Google (formulaciones reales, no volúmenes) y existencia de un mercado especializado. |
| **Requisito de TikTok para enlace en bio** | NO VERIFICADO. La página oficial no entrega contenido legible. | TikTok no entra al plan. |
| **Enlaces clicables en pies de Instagram con Meta Verified** | NO VERIFICADO. Solo reportes de prensa. | Solo se cuenta con el sticker de Stories. |
| **La "penalización" de LinkedIn a enlaces salientes** | NO VERIFICADA. Cifras de blogs de marketing, no de LinkedIn. | No se diseña alrededor de ella. |
| **Disponibilidad del botón "Seguir" de Chrome en Colombia** | NO VERIFICADO de primera mano (URL oficial devolvió 404). | No se usa como argumento para el feed. |
| **Si un Broadcast de Resend a 1.000 contactos consume el tope de 100/día** | NO VERIFICADO. La documentación no lo dice. | Comprobarlo en el primer envío real del boletín. |
| **Existencia de un agregador colombiano de feeds regionales** | SIN EVIDENCIA (ausencia de hallazgo, no prueba de inexistencia). | Francisco puede saber de alguno por el gremio. |
| **Observatorio económico UNAB o UIS** | NO VERIFICADO. No se encontró ninguno. | No se construyó ninguna recomendación sobre una alianza universitaria. |
| **Que cualquiera de estas acciones "traiga X visitas"** | NO VERIFICADO, y no se puede verificar: no hay histórico de tráfico. | Ninguna cifra de tráfico esperado aparece en este documento. |

---

## 8. Primeros siete días

Orden exacto. Cada fila cabe en el tiempo indicado.

| # | Día | Quién | Acción | Tiempo | Por qué |
|---|---|---|---|---|---|
| 1 | 1 | **Edwin** | Search Console: propiedad de **prefijo de URL** verificada por GA4 (`G-HVC4Z011SY`) o archivo HTML commiteado. **No por DNS TXT.** | 15 min | Es la única fuente de consultas, posiciones y estado de indexación. Sin DNS para que la migración a Cloudflare no la tumbe. |
| 2 | 1 | **Edwin** | Enviar `sitemap.xml` en Search Console. Pedir indexación de 4 URLs: portada, `declaracion-renta-2026-vencimientos-agosto`, `uvr-que-es-como-afecta-credito-hipotecario`, `donde-rinde-mas-tu-plata-cdt-santander`. | 10 min | Empujón puntual. Más no acelera nada: Google dice que hay cuota y que repetir no sirve. |
| 3 | 1 | **Edwin** | Bing Webmaster Tools: **importar desde Search Console** (verifica solo). Enviar las 14 URLs por URL Submission. | 10 min | Bing ya tiene indexado el sitio y su límite es 10.000 URLs/día, sin la cuota mezquina de Google. |
| 4 | 1 | **Claude** | Bug del póster: `portada.json` → `destacadas.json` + `index.njk:8` + **`admin/config.yml:19`**. | 10 min | Hoy la portada y `/multimedia/` muestran tres rectángulos negros. Sin el paso de `config.yml` el bug vuelve solo al primer guardado en Decap. |
| 5 | 2 | **Claude** | JSON-LD del autor → `{"@id": "https://economiasantander.com/#periodista"}`. Borrar el placeholder `"[Nombre del periodista]"`. | 20 min | Veinte años, dos premios y la ficha de Valora hoy no llegan a ninguna nota: Google ve dos personas distintas. |
| 6 | 2 | **Claude** | Limpiar fechas: quitar `updated` donde es igual o anterior a `date`; cambiar `(updated or date)` por el máximo en `noticia.njk:83`. | 30 min | Hoy una nota le dice a Google que se modificó **antes de publicarse**. |
| 7 | 2 | **Francisco** | Decidir qué pasa con `santander-mas-alla-ecopetrol-palma-mapa-productivo`: está fechada el 3 de agosto (futuro), en `noindex`, fuera del sitemap, con la firma en blanco, y es la primera entrega de la serie de diez. Publicarla bien o archivarla. | 20 min | Es la apuesta editorial más grande del repo y hoy está en un limbo: responde 200 pero Google no la puede indexar. |
| 8 | 3 | **Claude** | `@11ty/eleventy-image` v6 + HTML Transform. **Borrar el preload de `layout.njk:40`** y quitar los `width`/`height` fijos. Revisar `aspect-ratio`/`object-fit`. | 2-3 h | Una nota pesa hasta 6,4 MB y 4,5 MB son una foto que se pinta a 276 px. Sin borrar el preload, el arreglo deja la página **más** pesada. |
| 9 | 3 | **Francisco** | Llamar a la Dirección de Tránsito de Bucaramanga y confirmar la vigencia exacta de la Resolución 854 de 2025. | 20 min | La página de pico y placa vive o muere por esa fecha, y hoy el JSON dice algo distinto a lo que sugiere la fuente. |
| 10 | 4 | **Claude** | Fuentes fuera del CSS: 4 archivos `.woff2` únicos con huella en el nombre, Oswald 600 y 700 al **mismo** archivo, preload de Barlow 400 **y** Oswald 600, regla nueva en `_headers`. | 1-2 h | El CSS bloqueante baja de 106 KB a ~14 KB en el cable. Medido: FCP de una nota, 2272 → 1532 ms en 4G lenta. |
| 11 | 4-5 | **Francisco** | Escribir `/pico-y-placa/`: dígitos por día en **texto**, horarios, sábados, excepciones, multa, fecha de vigencia y resolución citada. Con lo que dé la llamada del día 3. | media jornada | Ni la Dirección de Tránsito ni Vanguardia publican los dígitos en texto: los publican dentro de una imagen. Es una ventaja estructural que no cuesta plata. |
| 12 | 5 | **Claude** | Montar `/pico-y-placa/` con `permalink` propio, ampliar `picoyplaca.json` (motos, taxis, excepciones) y añadir `BreadcrumbList` al sitio. | 2-3 h | Hoy el dato está en el repo pero **no existe ninguna URL indexable** con él. Y no hay breadcrumbs en ninguna página, aunque la jerarquía ya está montada. |
| 13 | 6 | **Francisco** | Desde el CMS, meter enlaces en el **cuerpo** de cinco notas hacia el glosario y hacia la nota de UVR. | 40 min | Hoy el cuerpo de las notas tiene **cero** enlaces internos. Hay notas que hablan de UVR, IPC y DTF sin enlazar las dos piezas evergreen del portal. |
| 14 | 6 | **Francisco** | Crear el **Canal de WhatsApp** desde el teléfono y publicar la primera nota. Pasarle a Claude el enlace y el QR. | 20 min | Gratis, no expone su número, sin tope de seguidores y admite enlaces. Lo que hay hoy es su celular personal con tope de 256 y exigiendo que lo guarden. |
| 15 | 6 | **Francisco** | Pedir en Valora Analitik que su ficha de autor enlace a economiasantander.com. Pasarle a Claude sus handles para llenar `redes.json` (hoy las cinco URLs están vacías). | 15 min | El cuello de botella de un dominio de cinco días es que nadie lo enlaza. Este es el enlace más fácil que existe. |
| 16 | 7 | **Claude** | Reemplazar el `<link>` y el QR del canal en `layout.njk:307,329`. Añadir `imagen:` a las seis notas que no la tienen (empezando por el glosario y la de UVR). Corregir `og:image:width/height` quemados en 1200×700. | 1 h | Un glosario de IPC compartido con una foto de empleo formal es la *"misleading preview content"* que Discover dice evitar, y en WhatsApp decide si tocan el enlace. |
| 17 | 7 | **Edwin** | Abrir Search Console y leer el informe de **Indexación de páginas**. Anotar cuántas de las 39 URLs están indexadas y cuántas en "Descubierta: actualmente sin indexar". | 15 min | Es la primera medición real que va a tener el proyecto. A partir de ahí se deja de trabajar a ciegas. |

**Lo que NO cabe en estos siete días y no se intenta:** el boletín por correo, el feed, las otras páginas de consulta (predial, arriendo, ICA, tarifas), la serie de diez entregas, el dataset de la Cámara y las llamadas a los gremios. Todo eso está en los horizontes de mes y de tres meses. Meterlo en la semana uno es la forma más rápida de que no se haga nada.

---

## 9. Correcciones tras la crítica de completitud

El plan de arriba pasó por un crítico cuyo único encargo era encontrarle huecos. Encontró catorce. Uno era falso, dos ya estaban resueltos, y once entran aquí. Se dejan aparte en vez de disolverlos en el texto para que se vea qué se corrigió y por qué.

### 9.1 El "bloqueante" era falso, y venía de un documento nuestro

El crítico paró el cronograma entero: *"el plan asume que se puede desplegar; hoy no se puede"*, citando `docs/migracion-cloudflare.md`, que decía que un bloqueo por créditos agotados de Netlify lo impedía.

**Comprobado: es falso.** Se hicieron siete despliegues seguidos el 30 y el 31 de julio y todos salieron en vivo en menos de 45 segundos. El dato erróneo estaba en nuestro propio documento de migración, ya corregido allí.

Vale la pena dejarlo escrito: **una frase equivocada en un documento interno estuvo a punto de reordenar un plan de tres meses.**

### 9.2 Lo que ya está hecho

- **Póster de los videos.** Arreglado y en producción. La causa era la que el diagnóstico identificó: `_data/portada.json` creaba una variable global que le ganaba al campo `portada:` del front matter de multimedia. Se renombró a `destacadas.json` en los tres sitios —incluido `admin/config.yml`, sin el cual el fallo volvía solo al primer guardado en Decap—. Verificado antes y después con build real.
- **Botones de compartir.** Cada nota lleva ahora dos barras (bajo la firma y al final) con WhatsApp, Facebook, LinkedIn, Gmail, Instagram, TikTok y copiar enlace. Es infraestructura de distribución que el plan da por supuesta.

### 9.3 `/dolar-hoy/` publica una página vacía al buscador — hueco real

El plan diagnostica con acierto que el pico y placa está en el repo sin URL indexable, pero se le pasó que **aquí el problema es peor: la URL existe y sirve un valor en blanco.**

Comprobado en el HTML que recibe el rastreador de `https://economiasantander.com/dolar-hoy/`: cuatro guiones en compra, venta y comparativos; `Cargando…` en la TRM; y `Cargando la serie histórica…` en la gráfica.

Todo se pinta con JavaScript desde APIs externas. Google puede ejecutar JavaScript, pero lo hace en una segunda pasada y sin garantía. **Lo que se indexa hoy es una página que dice "Cargando".** Y `mercado.json` fija en texto *"Cierres del 24 y 25 de julio"*, que envejece a la vista.

**Qué hacer [CÓDIGO]:** renderizar en el build el último valor conocido de TRM con su fecha dentro del HTML, y dejar que el JavaScript solo lo actualice. Mismo tratamiento para `/indicadores/`. Va al mismo nivel de prioridad que `/pico-y-placa/`, no después.

### 9.4 Mover las guías sin redirección tiraría lo poco que se logre

La sección 4.3 propone sacar las guías de `/noticias/` y darles ruta propia. La sección 8 pide, el día 1, indexar dos de esas mismas URLs. **Y en ninguna parte aparece la palabra redirección.**

**Qué hacer [CÓDIGO]:** si se mueven, en el mismo commit van el mapa de URLs viejas a nuevas en `_redirects` (lo leen igual Netlify y Cloudflare Workers), el canonical y el sitemap. Si no se quiere asumir eso, **la alternativa válida es no mover nada y solo cambiar el layout**: se gana casi lo mismo sin tocar URLs. Decidirlo antes del día 1, no después.

### 9.5 Para qué es el tráfico: el portal ya vende publicidad

`src/_data/anuncios.json` tiene **dos campañas activas**, el pie enlaza "Pautar en el portal" y hay una página legal de publicidad. El plan no menciona anunciantes ni una vez.

Importa porque cambia el orden: **el anunciante local de un portal nuevo no compra tráfico orgánico, compra la audiencia cualificada que Francisco ya tiene en el celular.** Si la meta a 90 días es vender pauta, el canal de WhatsApp y la lista de correo suben por encima de las páginas de trámite. Si la meta es orgánico, el orden del plan se queda como está.

**Es una decisión de Edwin y Francisco, y hay que tomarla antes de la semana 2.**

### 9.6 Palancas que nadie consideró

- **Sus propias cuentas.** `@pachogom2000` en X y `@pachogom` en Instagram están vivas, con veinte años de red profesional detrás, y el plan solo las usa para llenar `redes.json`. X, Facebook y Telegram no aparecen ni siquiera entre los canales descartados, y son donde de verdad circula la noticia local en Colombia: X para el gremio, grupos de Facebook de Bucaramanga, grupos de WhatsApp gremiales.
- **Publicar en Valora Analitik.** El plan pide que su ficha de autor allá lo enlace. Escribir allá una nota que enlace al portal vale más, y ya está a su alcance.
- **Mandarle la nota a la fuente citada.** `declaraciones.json` ya tiene a Almeyda (Fenalco), Peñaranda (Camacol) y Rincón (CCB) con nombre y cargo. Enviarles la nota donde salen es el bucle de difusión más barato que existe para un periodista.
- **Podcast.** El CMS ya tiene el tipo "Podcast" con campo de Spotify y de MP3, y la tarjeta ya lo renderiza. Spotify no aparece en todo el análisis de canales. Dos minutos de audio sobre la cifra del día es lo único que un competidor no puede clonar, y **empata con el banco de voz que ya se está grabando**.
- **Hub de declaraciones.** `declaraciones.json` no tiene página propia. El plan dice que *"el termómetro gremial solo existe si alguien llama"* sin ver que la estructura para acumularlo ya está en el repo.

### 9.7 Ninguna página viva tiene dueño de actualización

El plan propone entre cuatro y seis páginas de consulta permanente y **no le asigna a ninguna quién la revisa, cada cuánto y contra qué fuente**. El propio documento reconoce que la vigencia del pico y placa puede terminar en octubre.

Sin eso, en tres meses hay cuatro páginas mintiendo. Y el pasivo no es solo reputacional: **quien lea el dígito equivocado paga una multa, y quien lea un calendario de predial vencido paga recargo.**

**Contrato de publicación obligatorio para esas páginas [CÓDIGO + EDITORIAL]:** fecha de vigencia visible, resolución o fuente citada, campo "última verificación" en la página, aviso de que la fuente oficial manda, y una línea de mantenimiento con dueño y frecuencia. Y un límite: **cuántas de estas páginas antes de que el portal deje de parecer un medio y empiece a parecer una granja de consultas.**

### 9.8 Riesgo de credibilidad que hay que resolver esta semana

`src/multimedia/video-reporteria-en-calle.md` se titula *"Así se cubre una nota en la calle: la reportería en primera persona"* y el archivo es **metraje de banco de Mixkit**. El crédito está, en letra pequeña, pero el título se lee como si fuera su trabajo.

Un portal cuyo único activo es la firma de quien lo escribe no puede ilustrar "su" reportería con material de archivo. **No es tarea de tráfico, es de integridad, y cuesta diez minutos:** o se reencuadra el título para que no reclame autoría, o `/multimedia/` sale del menú hasta que haya material propio. **Decisión de Francisco.**

### 9.9 La cadencia editorial no está en ninguna parte

El plan dice que el 40% del inventario está en el terreno equivocado, pero **nunca dice cuántas notas por semana se escriben de ahora en adelante, ni de qué tipo, ni qué se deja de escribir.** Publicar 15 notas en cinco días y luego callarse es el fracaso típico de este formato.

**Regla propuesta [EDITORIAL]:** dos notas por semana, una de ellas de calle o de fuente propia, cero macro nacional, ancladas al calendario del DANE de la sección 5.6. Y tres piezas evergreen escritas y guardadas en la recámara para las semanas malas — porque una persona sola es un punto único de falla, y enfermarse o viajar no puede apagar el portal.

### 9.10 Las reglas del repo van a revertir el trabajo solas

`CLAUDE.md` ordena hoy, en sus líneas 56 y 60: *"1200 x 700 píxeles"* y *"Declarar width=1200 height=700 en la plantilla protege el CLS"*. La sección 4.5 manda exactamente lo contrario, porque con las dimensiones fijas el plugin de imágenes emite una sola variante y no hay `srcset`.

**La próxima sesión que lea `CLAUDE.md` deshará el trabajo.** Hay que actualizarlo en el mismo commit.

Igual con los enlaces internos: la línea 50 ya exige *"2 o 3 enlaces internos por nota"*. **La regla existe y lleva 15 notas incumplida.** Eso no se arregla con una pasada de 40 minutos el día 6; se arregla con una lista de verificación en el momento de publicar.

### 9.11 El comprobador de paridad se va a poner en rojo por diseño

`scripts/comprobar-paridad.mjs` compara el HTML **byte a byte** contra producción. Los cambios de imágenes y fuentes reescriben todas las `<img>` y el CSS, así que la prueba de aceptación de la migración a Cloudflare dará rojo — y ahí es cuando alguien la ignora "porque es lo esperado" y se cuela un fallo real.

**Decidir el orden:** o se corta a Cloudflare con el sitio como está y luego se optimiza, o se rebaselina el comprobador explícitamente en el commit de imágenes. Lo primero es más limpio.

### 9.12 El corte de DNS es el mayor riesgo del trimestre y no estaba en el plan

El sitio manda `HSTS` de un año. Si el certificado falla en el corte, **el lector recurrente no puede saltarse el error**: sitio caído justo en el mes en que se está pidiendo indexación. El diseño de migración ya lo previene emitiendo el certificado antes de cortar, pero el riesgo tiene que estar declarado aquí también, con ventana fuera de horario y TTL en 300.

Y sigue pendiente la decisión de titularidad: **la cuenta de Cloudflare está a nombre de Edwin, no de Francisco.**

### 9.13 Sin medición por canal, el día 15 nadie sabrá qué funcionó

GA4 mide páginas vistas y nada más. No hay eventos de clic al canal de WhatsApp, ni UTM en los enlaces del canal y del boletín, ni evento de salida a `/legal/publicidad/`. Y después del día 7 **no hay ninguna rutina de revisión ni criterio de abandono.**

**Qué añadir:** UTM en canal y boletín, tres eventos de GA4, quince minutos de Search Console fijos cada lunes, y un umbral escrito de fracaso — qué número, a los 90 días, obligaría a cambiar el plan en vez de insistir.

### 9.14 Detalle del día 1 que puede quemar el paso más importante

El plan ofrece verificar Search Console por GA4 o por archivo HTML. Pero `gtag.js` **no está en el HTML**: se inyecta con JavaScript tras leer `localStorage` por el consentimiento de cookies. Si el verificador de Google no ejecuta esa ruta, la verificación falla.

**Ir directo al archivo HTML commiteado** (con su `addPassthroughCopy`, como el propio plan advierte) y dejar GA4 como plan B, no al revés.

---

### Resumen de lo que cambia en los primeros siete días

| Fila del plan | Corrección |
|---|---|
| 1 — Search Console | Verificar por **archivo HTML**, no por GA4. |
| 4 — Póster de los videos | **Ya está hecho y en producción.** |
| Nueva | Decidir si las guías se mueven de URL. Si sí, `_redirects` en el mismo commit. |
| Nueva | Renderizar la TRM en el HTML de `/dolar-hoy/`, al mismo nivel que pico y placa. |
| Nueva | Reencuadrar o retirar el video que reclama reportería propia siendo metraje de banco. |
| Nueva | Actualizar `CLAUDE.md` en el commit de imágenes, o se revierte solo. |
| Nueva | Fijar la cadencia editorial y escribir tres piezas evergreen de reserva. |
