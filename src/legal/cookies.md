---
layout: legal.njk
tituloLegal: Cookies y analítica
title: Política de cookies | Economía Santander
description: Qué cookies usa Economía Santander, para qué sirven y cómo rechazarlas. Analítica de Google Analytics 4 y, si se activa y usted lo acepta, publicidad de Google AdSense.
resumen: Este sitio usa cookies de analítica y, cuando la publicidad de Google esté activa, cookies publicitarias solo si usted las acepta por separado. No hay venta de datos. Puede rechazarlas y el portal funciona igual.
actualizado: 17 de septiembre de 2026
---

## Qué es una cookie, sin rodeos

Es un archivo diminuto que una página guarda en su navegador para recordar algo. Algunas son inofensivas y necesarias; otras sirven para seguirlo por internet y venderle cosas.

**Aquí solo hay de las primeras.**

## Las que usa este sitio

### Analítica — Google Analytics 4

| | |
|---|---|
| **Quién la pone** | Google (`_ga`, `_ga_*`) |
| **Para qué** | Contar visitantes, saber qué notas se leen y desde dónde |
| **Duración** | Hasta 2 años |
| **¿Se puede rechazar?** | Sí, y el sitio funciona igual |

Sirve para saber si vale la pena seguir escribiendo sobre cacao o si nadie lo lee. No se usa para identificarlo, ni para armarle un perfil, ni para mostrarle publicidad.

**La medición está activa mientras usted no la rechace.** Es lo que hace cualquier sitio que usted abra desde el celular, y en Colombia la ley pide informarlo y permitirle rechazarlo, que es justamente lo que hace el aviso que aparece la primera vez que entra.

**Si prefiere que no lo midan, apáguelo y listo.** Desde ese momento las herramientas de medición dejan de registrar su navegación en este portal. No pierde nada: el sitio funciona exactamente igual.

### Analítica — Ahrefs Web Analytics

| | |
|---|---|
| **Quién la pone** | Ahrefs |
| **Para qué** | Medir audiencia y el desempeño del portal en buscadores |
| **¿Usa cookies?** | **No.** No guarda nada en su navegador |
| **¿Se puede rechazar?** | Sí, con el mismo interruptor |

Es una herramienta de analítica **sin cookies**: cuenta visitas de forma agregada y no deja rastro en su equipo. Se usa para ver cómo se comporta el portal en los buscadores, que es de donde llega la mayoría de los lectores.

Aunque no usa cookies y la ley no obligaría a pedir permiso para ella, **se apaga con el mismo botón que Google Analytics**. El aviso de este sitio promete que quien rechaza deja de ser medido, y esa promesa vale para las dos herramientas, no solo para la que guarda cookies.

### Almacenamiento local — el cupón del tinto

No es propiamente una cookie, pero conviene declararlo. La promoción del tinto guarda una marca en la memoria de su navegador (`localStorage`) para impedir que se reclame dos veces desde el mismo dispositivo.

**Ese dato nunca sale de su equipo.** No viaja a ningún servidor, yo no lo veo y no se puede asociar con usted. Se borra cuando limpia los datos de navegación.

### Publicidad — Google AdSense

{% if publicidad.adsense.activo and publicidad.adsense.cliente %}
**Está activa.** En dos espacios de la portada se muestran anuncios servidos por Google. Cómo funcionan depende de lo que usted decida en el aviso de cookies:

| | |
|---|---|
| **Quién la pone** | Google (`_gcl_*`, `IDE`, `test_cookie` y similares) |
| **Para qué** | Mostrar anuncios y, si usted acepta, elegirlos según su navegación |
| **Duración** | Hasta 13 meses |
| **¿Se puede rechazar?** | Sí. Los anuncios salen igual, pero sin cookies y sin basarse en lo que usted ve |

- Si elige **"Aceptar todo"**, Google puede guardar cookies publicitarias y mostrarle anuncios personalizados.
- Si elige **"Solo medición"** o **"Rechazar"**, Google no guarda cookies publicitarias en su navegador y los anuncios que vea son genéricos: dependen de la página, no de usted.

Es una decisión separada de la analítica, y se cambia cuando quiera con el botón de abajo. Los anuncios los sirve Google bajo sus [condiciones de privacidad](https://policies.google.com/technologies/ads); este portal bloquea desde el panel de AdSense las categorías de préstamos rápidos, criptomonedas, apuestas y "hágase rico", porque no caben en un medio que explica cómo cuidar la plata.
{% else %}
**Hoy no está activa.** Los avisos que ve —Tienda Sinestrés y Central de Pirotecnia— son imágenes y enlaces fijos: no vienen de una red de anunciantes y no lo rastrean.

El portal está preparado para incorporar publicidad servida por Google AdSense, que sí usa cookies. Cuando se active, esta página lo dirá aquí mismo y el aviso de cookies le pedirá **una decisión aparte** para la publicidad, distinta de la de analítica. Rechazarla no quita los anuncios: los deja genéricos y sin cookies.
{% endif %}

### Lo que NO hay

Vale la pena decirlo porque es raro:

- **No hay botones de redes sociales** incrustados que reporten su visita a Facebook o a X.
- **No hay mapas de calor, grabación de sesión ni herramientas que reconstruyan lo que usted hace en la pantalla.** Las herramientas de medición cuentan visitas de forma agregada; ninguna reproduce su sesión.
- **No se venden ni se ceden sus datos a nadie.**

## Cómo cambiar de opinión

La decisión no es definitiva. Puede apagar o volver a encender la medición cuando quiera, aquí o desde el enlace "Preferencias de cookies" que está en el pie de todas las páginas:

<p><button type="button" class="btn-cookies" data-abrir-cookies>Cambiar mis preferencias de cookies</button></p>

También puede hacerlo desde su navegador, que le da control total:

- **Chrome:** Configuración → Privacidad y seguridad → Cookies
- **Safari:** Preferencias → Privacidad
- **Firefox:** Configuración → Privacidad y seguridad
- **Edge:** Configuración → Privacidad, búsqueda y servicios

Y si quiere bloquear Google Analytics en todos los sitios que visita, Google ofrece un [complemento de inhabilitación para navegadores](https://tools.google.com/dlpage/gaoptout).

## Base legal

El tratamiento de la información recogida por cookies se rige por la **Ley 1581 de 2012** y el **Decreto 1074 de 2015**. Los detalles sobre sus derechos, los plazos de respuesta y cómo ejercerlos están en la [política de tratamiento de datos personales](/legal/datos-personales/).
