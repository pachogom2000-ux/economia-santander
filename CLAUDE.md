# Economía Santander

Portal de noticias económicas del departamento de Santander (Colombia). Lo dirige Francisco Gómez, periodista económico con más de 20 años de trayectoria. El objetivo es posicionar su marca personal con crecimiento orgánico y buen SEO.

- **Sitio:** https://economiasantander.com
- **CMS:** https://economiasantander.com/admin/
- **Planeación editorial y costos:** [Notion](https://app.notion.com/p/3a98bdb28047818bbe34c102cc5271b8)

---

## Regla número uno: no inventes cifras

Esto es periodismo económico. Un dato falso destruye la credibilidad y puede llevar a alguien a tomar una mala decisión con su plata.

- Toda cifra debe venir de una fuente consultada, con enlace y fecha.
- Si no encuentras el dato, escribe el vacío o deja `[VERIFICAR: pendiente con Fedecacao]`. Nunca estimes para rellenar.
- Si dos fuentes se contradicen (pasa mucho entre cifras oficiales y gremiales), presenta ambas y explica la diferencia. No escojas la más conveniente.
- No inventes declaraciones ni entrevistas. Si la nota necesita una voz, indica a quién llamar.

## Fuentes, en orden de preferencia

- **Macro:** DANE, Banco de la República, Superintendencia Financiera.
- **Gremios:** Fedecacao, Fenavi, Fedegán, Federación Nacional de Cafeteros, ACICAM, Camacol, Fenalco, ANM, Asoovinos.
- **Regional:** Cámara de Comercio de Bucaramanga, Alcaldía de Bucaramanga, IMEBU, Gobernación de Santander.
- **Prensa económica** (La República, Portafolio, Vanguardia, El Colombiano): sirve para ubicar el dato, pero cita la fuente primaria cuando puedas llegar a ella.

---

## Política editorial

**80% contenido propio, 20% recirculado.** Toda nota recirculada cita la fuente de forma visible y nunca se presenta como propia: se reescriben titular y primer párrafo, y se añade el ángulo santandereano.

## Tono

- La cifra va adelante, no al final del párrafo.
- Párrafos de 2 o 3 frases, máximo 40-50 palabras. El lector está en el celular.
- Cero adjetivos de relleno: nada de "importante repunte" ni "significativo crecimiento".
- Voz activa, frases cortas, español de Colombia, no tutear al lector, en la cultura santandereana se habla de usted, por respeto.
- **Tercera persona.** La nota narra, no conversa: nada de "como ya vimos" ni "te contamos". Cuando haya que dirigirse al lector —en una guía o una recomendación— es de usted: "consulte", "revise", "tenga en cuenta". Nunca "consulta" ni "revisa".
- Aterriza las cifras grandes: "$4 billones al año" dice poco; "uno de cada cuatro huevos que se comen en Colombia" dice mucho.
- Busca la tensión o la paradoja del dato. Santander es el mayor productor de cacao pero no el mayor exportador: ahí está la nota.

## SEO

- **Titular:** máximo 60 caracteres, palabra clave al inicio. Es el H1.
- **Resumen (`excerpt`):** 145-155 caracteres. Es la meta descripción.
- **Slug:** minúsculas, guiones, sin palabras vacías (el, la, de, en), con la palabra clave.
- **H2:** responden preguntas que la gente busca de verdad.
- **Negritas** solo en entidades, cifras y nombres de empresas.
- **2 o 3 enlaces internos** por nota, con texto ancla descriptivo. Nunca "haz clic aquí".
- **Enlaces externos** a la fuente primaria. Se abren en pestaña nueva automáticamente (configurado en `.eleventy.js`); no agregues atributos.
- **Un solo H1 por página.** En la portada es el nombre del medio; en una nota es el titular.

## Imágenes

**El build las optimiza solo.** `@11ty/eleventy-img` reescribe todas las `<img>` y genera WebP y JPEG en 400, 800, 1200 y 1600 px. No hay que redimensionar nada a mano.

- **Mínimo 1200 px de ancho.** Google Discover exige ese mínimo; por debajo, la nota no aparece. El peso del original da igual: el build lo reduce.
- **NUNCA declarar `width` ni `height` fijos en las plantillas.** Con ellos el plugin emite una sola medida y no hay `srcset`. Él mismo repone las dimensiones con la relación de aspecto real de cada archivo, así que el CLS queda cubierto (medido: 0,0021).
- La foto de arriba lleva `loading="eager"` explícito. El plugin pone `lazy` por defecto, y en la imagen que mide el LCP eso pelea con el `fetchpriority`.
- **No preargar (`<link rel="preload">`) las fotos.** El plugin reescribe `<img>` pero no los `preload`, así que el navegador se bajaría el original completo además de la versión optimizada.
- El `og:image` se queda como el **JPEG original**, no WebP: WhatsApp es el canal real de este portal.
- Nombre descriptivo con guiones: `empleo-formal-bucaramanga-2026.jpg`. Nunca `IMG_1234.jpg`.
- Van en `src/assets/uploads/`.
- Siempre con `imagenAlt`, `imagenTitle`, `imagenPie` e `imagenCredito`.
- **Toda nota necesita `imagen:`.** Sin ella hereda la foto de otra nota como vista previa, que es justo lo que Discover llama *misleading preview content*, y en WhatsApp decide si tocan el enlace.

---

## Arquitectura

Sitio estático con **Eleventy 3** y **Decap CMS**, desplegado en Netlify desde GitHub.

```
src/
  index.njk              portada
  _includes/
    layout.njk           cabezote, pico y placa, cinta bursátil, avisos, pie, scripts
    noticia.njk          plantilla de nota + JSON-LD NewsArticle
  noticias/*.md          las notas
  assets/style.css       todo el CSS
  assets/uploads/        imágenes del CMS
  admin/config.yml       configuración de Decap CMS
.eleventy.js             config; enlaces externos abren en pestaña nueva
```

### Comandos

```bash
npm install
npx @11ty/eleventy        # compila a _site/
npm start                 # previsualiza en local, en http://localhost:8080
```

Verifica siempre que compile antes de hacer push: Netlify construye desde GitHub y un error deja el sitio sin actualizar.

### Previsualizar una nota antes de publicarla

Con `npm start` corriendo, **http://localhost:8080/borradores/** lista todas las notas del repositorio, marcando cuáles son borradores y cuáles están en portada, con enlace a cada una. Sirve para abrir una nota y verla montada, con su plantilla y su diseño, antes de hacer push.

Esa página la genera `src/borradores.11ty.js` y **solo existe en local**: en el build de producción devuelve `permalink: false`, así que Eleventy no la escribe y no aparece en el sitemap.

Un borrador con `eleventyExcludeFromCollections: true` no sale en la portada, pero sí tiene página propia en `/noticias/<slug>/`. Ojo con eso: una vez en `main`, esa URL es pública aunque no esté enlazada. Para que un borrador no llegue a producción, la vía es el *editorial workflow* del CMS, que lo deja en una rama con su *deploy preview*.

### Front matter de una nota

```yaml
---
layout: noticia.njk
title: "Titular de máximo 60 caracteres con la keyword al inicio"
date: 2026-08-03
categoria: "Agro"
chipTipo: "propio"          # "recirc" si es recirculado
chipLabel: "Redacción propia"  # "Fuente: DANE" si es recirculado
excerpt: "Resumen de 145 a 155 caracteres."
autor: "Francisco Gómez - Director"
tags: noticias
eleventyExcludeFromCollections: true   # quitar cuando se apruebe
---
```

**Categorías válidas** (alineadas una a una con la propiedad `Sección` de la base Publicaciones en Notion; si añades una aquí, añádela también allá):

Inversión · Educación financiera · Empleo · Finanzas personales · Construcción · Industria · Agro · Comercio y consumo · Turismo y hotelería · Emprendimiento y pymes · Impuestos y regulación · Indicadores económicos · Opinión · Entrevistas · Glosario y guías

`eleventyExcludeFromCollections: true` mantiene la nota fuera de la portada mientras es borrador. **Se quita solo cuando Francisco aprueba.** La decisión de publicar es del director.

### Flujo de publicación del CMS

Decap está en `publish_mode: editorial_workflow`. Los guardados van a una rama con pull request, no directo a `main`. Redactar y revisar genera *deploy previews*, que no consumen créditos de Netlify; solo el paso final a "Listo" publica y cuesta un despliegue de producción.

### Datos editables sin tocar código

`src/_data/picoyplaca.json` guarda los dígitos de la franja superior y se edita desde el CMS, en "Datos del sitio". Medellín rota por semestres y Bucaramanga por trimestres: se añade la rotación nueva con su fecha de inicio y el sitio cambia solo ese día. No borres la anterior.

`src/_data/destacadas.json` fija el orden de la portada, también desde "Datos del sitio". (Se llamaba `portada.json` y hubo que renombrarlo: creaba una variable global `portada` que le ganaba al front matter de multimedia y dejaba `poster="[object Object]"`. Si algún día se revierte el nombre, el fallo vuelve solo.) La primera nota de `destacadas` es la principal y las siguientes ocupan los cuatro huecos de al lado; lo que no esté en la lista aparece debajo por fecha. Con la lista vacía manda la fecha, como siempre. Un slug que ya no exista se ignora, así que borrar o despublicar una nota nunca deja hueco. **Es una decisión editorial, no técnica: hay que soltar la nota cuando deje de ser relevante, o la portada se congela.**

---

## Cosas que ya nos pasaron

- **Netlify puede bloquear despliegues** por créditos agotados ("account credit usage exceeded"). No es error de código. Hay una **migración a Cloudflare Workers** en curso —no Pages, que es el camino secundario— documentada en [`docs/migracion-cloudflare.md`](docs/migracion-cloudflare.md): las dos plataformas publican del mismo repositorio y el corte es un cambio de DNS. Lee ese documento antes de tocar `worker.js`, `wrangler.jsonc`, `src/_headers`, `src/404.njk` o `src/admin/`.
- **Hay más de una sesión trabajando sobre este repo.** Haz `git fetch` antes de empezar y `rebase` antes de hacer push. **Nunca hagas force push**: borrarías trabajo ajeno.
- **`_site/` no se limpia solo.** Si renombras o borras una nota, quedan carpetas huérfanas en el build local. Borra `_site/` y recompila.
- **Los datos del ticker y las tasas tienen fecha.** Solo el dólar, el oro y el bitcoin se actualizan en vivo; el resto son valores fijos que hay que refrescar a mano.
- **Isagén no cotiza en la BVC** desde 2017 y **Bancolombia cotiza como Grupo Cibest**. Ojo al citar acciones.
