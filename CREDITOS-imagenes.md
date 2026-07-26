# Créditos de imágenes

Ambas fotos son **CC0 1.0 (dominio público)**: se pueden usar con fines
comerciales y **no exigen atribución**. Se dejan los datos por trazabilidad.

| Archivo | Foto | Fuente | Licencia |
|---|---|---|---|
| `ad-tinto.jpg` | "Black Coffee in Cafe" | [rawpixel](https://www.rawpixel.com/image/5970087/black-coffee-cafe) | CC0 1.0 |
| `ad-pirotecnia.jpg` | "Sparklers Fireworks" — Birch Landing Home | [StockSnap](https://stocksnap.io/photo/sparklers-fireworks-KOV9JBMTTR) | CC0 1.0 |

Encontradas vía la API de [Openverse](https://openverse.org). Reprocesadas con
ffmpeg (`-q:v 4`) para bajar el peso: 36 KB y 74 KB.

## Cómo reemplazarlas

Las fotos se pintan como capa absoluta (`.ad-media`), así que **cambiar el
archivo no altera el tamaño del aviso en pantalla**. Para sustituir una:

1. Deja el archivo nuevo en esta carpeta con el mismo nombre.
2. Actualiza `width`/`height` en el `<img>` correspondiente de `index.html`
   si cambian las proporciones.

Lo ideal para un aviso local sería una foto real del negocio (el dueño de la
Tienda Sin Estrés sirviendo el tinto, o el mostrador de El Vaquero): tiene más
fuerza comercial que una foto de banco.
