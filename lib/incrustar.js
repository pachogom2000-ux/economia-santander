// Incrustaciones: convierte el enlace de una plataforma en el contenido ya
// montado dentro de la nota.
//
// Cómo se usa desde el CMS: se pega la dirección SOLA en su propio párrafo. El
// build la reconoce y la reemplaza por el video, el podcast o la publicación.
// Un enlace escrito dentro de una frase sigue siendo un enlace normal, y uno
// con texto ([ver el video](...)) también: solo se transforma el párrafo que no
// tiene nada más.
//
// Por qué NO se usa el script que ofrece cada red (embed.js de TikTok,
// widgets.js de X, sdk.js de Facebook):
//
//   1. Son cientos de kilobytes de JavaScript ajeno por publicación, y se
//      cargan aunque el lector nunca mire el video. Este portal se lee en el
//      celular y con datos.
//   2. Rastrean. El aviso de /legal/cookies/ promete que quien rechaza deja de
//      ser medido; cargar el SDK de Facebook en cada nota rompería esa promesa
//      sin que nadie lo note.
//   3. Reservan el alto DESPUÉS de cargar, así que el texto salta bajo el dedo
//      del lector: eso es el CLS que mide Google.
//
// En su lugar, cada incrustación se pinta como una tapa estática con la medida
// ya reservada. El marco real —un iframe, sin scripts— solo se crea cuando el
// lector toca. Hasta ese momento no se conecta con nadie.
//
// Añadir una plataforma nueva: una entrada más en `reconocer()`. Si el enlace
// es de una red conocida pero no se puede sacar el identificador (los enlaces
// cortos que reparte la app de TikTok, por ejemplo), se devuelve una tarjeta
// que lleva a la publicación en vez de un marco roto.

const esc = (valor) =>
  String(valor == null ? "" : valor)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");

const urlDe = (enlace) => {
  try {
    return new URL(String(enlace).trim());
  } catch (e) {
    return null;
  }
};

// "1h2m30s" o "125" -> 3750 / 125. YouTube acepta los dos formatos en ?t=
const segundos = (valor) => {
  if (!valor) return 0;
  const t = String(valor).trim();
  if (/^\d+$/.test(t)) return Number(t);
  const m = t.match(/^(?:(\d+)h)?(?:(\d+)m)?(?:(\d+)s)?$/i);
  if (!m) return 0;
  return Number(m[1] || 0) * 3600 + Number(m[2] || 0) * 60 + Number(m[3] || 0);
};

// Alto del reproductor de Spotify según lo que se incruste. Son las medidas del
// propio generador de Spotify: por debajo, el reproductor se recorta.
const ALTO_SPOTIFY = { episode: 232, show: 352, track: 152, album: 380, playlist: 380 };

const ES_VIDEO = /\.(mp4|webm|m4v)$/i;
const ES_AUDIO = /\.(mp3|m4a|ogg|wav)$/i;

// Devuelve qué es el enlace, o null si no es de ninguna plataforma conocida
// (entonces se queda como enlace de texto, que es lo correcto).
function reconocer(enlace) {
  // Se recorta la puntuación pegada al final. Al escribir, la dirección suele
  // quedar con el punto de la frase detrás, y `new URL` se lo traga: el
  // identificador salía con el punto dentro y el marco quedaba roto.
  const crudo = String(enlace || "").trim().replace(/[.,;:!?]+$/, "");
  if (!crudo) return null;

  // Archivos del propio portal: se sirven directos, sin tapa ni terceros.
  if (crudo.startsWith("/assets/")) {
    if (ES_VIDEO.test(crudo)) return { clase: "propio", medio: "video", src: crudo };
    if (ES_AUDIO.test(crudo)) return { clase: "propio", medio: "audio", src: crudo };
    return null;
  }

  const u = urlDe(crudo);
  if (!u) return null;
  if (u.protocol !== "http:" && u.protocol !== "https:") return null;

  // Se le quitan los prefijos que no cambian a qué plataforma se apunta: los
  // de dispositivo (m, mobile, web) y los regionales que reparten LinkedIn y
  // Facebook según el idioma del navegador (co.linkedin.com, es-la.facebook.com).
  const host = u.hostname
    .toLowerCase()
    .replace(/^(www|m|mobile|web)\./, "")
    .replace(/^[a-z]{2}(-[a-z]{2,3})?\.(?=(linkedin|facebook)\.com$)/, "");
  const ruta = u.pathname;
  const original = u.href;

  // ---------- YouTube ----------
  if (
    host === "youtube.com" ||
    host === "youtube-nocookie.com" ||
    host === "music.youtube.com" ||
    host === "youtu.be"
  ) {
    let id = "";
    let vertical = false;
    if (host === "youtu.be") {
      id = ruta.slice(1);
    } else if (ruta === "/watch") {
      id = u.searchParams.get("v") || "";
    } else {
      const m = ruta.match(/^\/(embed|shorts|live|v)\/([^/?#]+)/);
      if (m) {
        id = m[2];
        vertical = m[1] === "shorts";
      }
    }
    id = String(id).split("/")[0];
    // "videoseries" pasa la validación de forma pero no es un video: es como
    // YouTube nombra una lista de reproducción, y el marco sale vacío.
    if (id === "videoseries" || !/^[\w-]{6,20}$/.test(id)) {
      return { clase: "enlace", red: "youtube", nombre: "YouTube", enlace: original };
    }
    const desde = segundos(u.searchParams.get("t") || u.searchParams.get("start"));
    return {
      clase: "marco",
      red: "youtube",
      nombre: "YouTube",
      // youtube-nocookie: no deja cookies de publicidad mientras nadie reproduzca.
      src:
        "https://www.youtube-nocookie.com/embed/" +
        id +
        "?autoplay=1&rel=0" +
        (desde ? "&start=" + desde : ""),
      enlace: original,
      ratio: vertical ? "9 / 16" : "16 / 9",
      ancho: vertical ? 360 : null,
      // La miniatura la sirve el CDN de imágenes de YouTube, que no identifica
      // a nadie: es la misma que ya usan las tarjetas de /multimedia/.
      miniatura: "https://i.ytimg.com/vi/" + id + "/hqdefault.jpg",
      reproducible: true,
      accion: "Reproducir el video",
    };
  }

  // ---------- Vimeo ----------
  if (host === "vimeo.com" || host === "player.vimeo.com") {
    // Anclada a propósito. Sin anclar tomaba el PRIMER número de la ruta, que
    // en vimeo.com/showcase/7654321/video/76979871 es el del escaparate: se
    // incrustaba otro video y nada avisaba. Primero la forma con /video(s)/ y
    // después la dirección corta; una colección sin video (/showcase/7654321)
    // no engancha en ninguna y cae en la tarjeta con el enlace.
    const m =
      ruta.match(/\/videos?\/(\d+)/) ||
      ruta.match(/^\/(?:channels\/[^/]+\/)?(\d+)(?:\/|$)/);
    if (!m) return { clase: "enlace", red: "vimeo", nombre: "Vimeo", enlace: original };
    return {
      clase: "marco",
      red: "vimeo",
      nombre: "Vimeo",
      src: "https://player.vimeo.com/video/" + m[1] + "?autoplay=1",
      enlace: original,
      ratio: "16 / 9",
      reproducible: true,
      accion: "Reproducir el video",
    };
  }

  // ---------- TikTok ----------
  if (host === "tiktok.com" || host === "vm.tiktok.com" || host === "vt.tiktok.com") {
    const m = ruta.match(/\/video\/(\d{6,})/) || ruta.match(/\/embed\/v2\/(\d{6,})/);
    // Los enlaces cortos (vm.tiktok.com/ZM8…) son los que reparte la app al
    // compartir y no llevan el número dentro: no hay forma de resolverlos en el
    // build sin salir a internet. Se ofrece la tarjeta con el enlace.
    if (!m) return { clase: "enlace", red: "tiktok", nombre: "TikTok", enlace: original };
    return {
      clase: "marco",
      red: "tiktok",
      nombre: "TikTok",
      src: "https://www.tiktok.com/embed/v2/" + m[1],
      enlace: original,
      alto: 580,
      ancho: 325,
      reproducible: true,
      accion: "Ver el video de TikTok",
    };
  }

  // ---------- Instagram ----------
  if (host === "instagram.com" || host === "instagr.am") {
    // Dos formas: /p/CODIGO/ y la que entrega el perfil, /usuario/reel/CODIGO/.
    const m = ruta.match(/(?:^|\/)(p|reel|reels|tv)\/([\w-]+)/);
    if (!m) return { clase: "enlace", red: "instagram", nombre: "Instagram", enlace: original };
    const tipo = m[1] === "reels" ? "reel" : m[1];
    return {
      clase: "marco",
      red: "instagram",
      nombre: "Instagram",
      src: "https://www.instagram.com/" + tipo + "/" + m[2] + "/embed/",
      enlace: original,
      alto: 640,
      ancho: 420,
      accion: "Ver la publicación de Instagram",
    };
  }

  // ---------- Threads ----------
  if (host === "threads.net" || host === "threads.com") {
    const m = ruta.match(/^\/(@[\w.]+)\/post\/([\w-]+)/);
    if (!m) return { clase: "enlace", red: "threads", nombre: "Threads", enlace: original };
    return {
      clase: "marco",
      red: "threads",
      nombre: "Threads",
      src: "https://www.threads.net/" + m[1] + "/post/" + m[2] + "/embed",
      enlace: original,
      alto: 560,
      ancho: 500,
      accion: "Ver la publicación de Threads",
    };
  }

  // ---------- Facebook ----------
  if (host === "facebook.com" || host === "fb.watch" || host === "fb.com") {
    const rutaLimpia = ruta.replace(/\/$/, "");
    const esVideo =
      host === "fb.watch" ||
      /\/videos?\//.test(ruta) ||
      /^\/reel\//.test(ruta) ||
      // Lo que reparte hoy la app de Facebook al compartir: /share/v/ para un
      // video y /share/r/ para un reel.
      /^\/share\/(v|r)\//.test(ruta) ||
      rutaLimpia === "/video.php" ||
      (rutaLimpia === "/watch" && !!u.searchParams.get("v"));
    const esPublicacion =
      /\/posts?\//.test(ruta) ||
      /\/photos?\//.test(ruta) ||
      /^\/share\/p\//.test(ruta) ||
      rutaLimpia === "/permalink.php" ||
      rutaLimpia === "/story.php" ||
      /^\/groups\/[^/]+\/(posts|permalink)\//.test(ruta) ||
      /^\/notes\//.test(ruta) ||
      // Las formas viejas que todavía circulan llevan el identificador en la
      // consulta, no en la ruta: photo.php?fbid=…, permalink.php?story_fbid=…
      !!u.searchParams.get("story_fbid") ||
      !!u.searchParams.get("fbid");
    // Sin esto, CUALQUIER dirección de facebook.com montaba un marco: la de una
    // página, la de un perfil o la portada de Facebook. El complemento devuelve
    // un recuadro vacío y el lector se queda mirando una caja gris de 620px.
    if (!esVideo && !esPublicacion) {
      return { clase: "enlace", red: "facebook", nombre: "Facebook", enlace: original };
    }
    // El complemento oficial resuelve él mismo la dirección, incluidos los
    // enlaces cortos de fb.watch. Por eso se le pasa la original entera.
    const base = esVideo
      ? "https://www.facebook.com/plugins/video.php?show_text=false&href="
      : "https://www.facebook.com/plugins/post.php?show_text=true&width=500&href=";
    return {
      clase: "marco",
      red: "facebook",
      nombre: "Facebook",
      src: base + encodeURIComponent(original),
      enlace: original,
      ratio: esVideo ? "16 / 9" : null,
      alto: esVideo ? null : 620,
      ancho: esVideo ? null : 500,
      reproducible: esVideo,
      accion: esVideo ? "Reproducir el video de Facebook" : "Ver la publicación de Facebook",
    };
  }

  // ---------- X (antes Twitter) ----------
  if (host === "twitter.com" || host === "x.com") {
    const m = ruta.match(/\/status(?:es)?\/(\d+)/);
    if (!m) return { clase: "enlace", red: "x", nombre: "X", enlace: original };
    // dnt=true le pide a X que no use la visita para personalizar publicidad.
    return {
      clase: "marco",
      red: "x",
      nombre: "X",
      src: "https://platform.twitter.com/embed/Tweet.html?id=" + m[1] + "&dnt=true&lang=es",
      enlace: original,
      alto: 560,
      ancho: 550,
      accion: "Ver la publicación en X",
    };
  }

  // ---------- LinkedIn ----------
  if (host === "linkedin.com") {
    // Dos formas: la dirección de un post (…-activity-7123456789012345678-AbCd)
    // y la que ya viene en formato urn.
    const urn = ruta.match(/urn:li:(activity|share|ugcPost):(\d+)/);
    const suelto = ruta.match(/-activity-(\d+)/);
    // Se conserva el tipo de urn: un share y un ugcPost no son un activity, y
    // pedirlos como activity devuelve un marco vacío.
    const tipoUrn = urn ? urn[1] : "activity";
    const id = urn ? urn[2] : suelto ? suelto[1] : null;
    if (!id) return { clase: "enlace", red: "linkedin", nombre: "LinkedIn", enlace: original };
    return {
      clase: "marco",
      red: "linkedin",
      nombre: "LinkedIn",
      src: "https://www.linkedin.com/embed/feed/update/urn:li:" + tipoUrn + ":" + id,
      enlace: original,
      alto: 560,
      ancho: 550,
      accion: "Ver la publicación de LinkedIn",
    };
  }

  // ---------- Spotify ----------
  if (host === "open.spotify.com") {
    const m = ruta.match(/^\/(?:intl-[a-zA-Z-]+\/)?(episode|show|track|album|playlist)\/([A-Za-z0-9]+)/);
    if (!m) return { clase: "enlace", red: "spotify", nombre: "Spotify", enlace: original };
    return {
      clase: "marco",
      red: "spotify",
      nombre: "Spotify",
      src: "https://open.spotify.com/embed/" + m[1] + "/" + m[2],
      enlace: original,
      alto: ALTO_SPOTIFY[m[1]] || 232,
      reproducible: true,
      accion: "Escuchar en Spotify",
    };
  }

  // ---------- SoundCloud ----------
  if (host === "soundcloud.com") {
    return {
      clase: "marco",
      red: "soundcloud",
      nombre: "SoundCloud",
      src:
        "https://w.soundcloud.com/player/?url=" +
        encodeURIComponent(original) +
        "&color=%230b6e3b&hide_related=true&show_comments=false&show_teaser=false",
      enlace: original,
      alto: 166,
      reproducible: true,
      accion: "Escuchar en SoundCloud",
    };
  }

  // ---------- Archivo suelto en otro servidor ----------
  if (ES_VIDEO.test(ruta)) return { clase: "propio", medio: "video", src: original };
  if (ES_AUDIO.test(ruta)) return { clase: "propio", medio: "audio", src: original };

  return null;
}

// Convierte lo reconocido en HTML. `opciones.pie` pone un pie propio en vez del
// enlace a la fuente, y `opciones.portada` una tapa propia (la usa la ficha de
// multimedia, que ya tiene una imagen subida).
function incrustar(enlace, opciones) {
  const o = opciones || {};
  const dato = reconocer(enlace);
  if (!dato) return null;

  const pie = o.pie ? '<figcaption class="incrusta-pie">' + esc(o.pie) + "</figcaption>" : "";

  // Archivos propios: no hay terceros a los que avisar, se pintan directos.
  if (dato.clase === "propio") {
    const cuerpo =
      dato.medio === "video"
        ? '<video class="incrusta-medio" controls preload="none" playsinline' +
          (o.portada ? ' poster="' + esc(o.portada) + '"' : "") +
          ' src="' +
          esc(dato.src) +
          '"></video>'
        : '<audio class="incrusta-audio" controls preload="none" src="' + esc(dato.src) + '"></audio>';
    return '<figure class="incrusta incrusta-propio incrusta-' + dato.medio + '">' + cuerpo + pie + "</figure>";
  }

  const verEn =
    '<a class="incrusta-fuente" href="' +
    esc(dato.enlace) +
    '" target="_blank" rel="noopener noreferrer">Ver en ' +
    esc(dato.nombre) +
    "</a>";

  // Red conocida sin identificador utilizable: tarjeta con el enlace. Mejor eso
  // que un marco que se queda en blanco.
  if (dato.clase === "enlace") {
    const corto = String(dato.enlace).replace(/^https?:\/\/(www\.)?/, "").replace(/\/$/, "");
    return (
      '<figure class="incrusta incrusta-tarjeta incrusta-red-' +
      esc(dato.red) +
      '"><a class="incrusta-tarjeta-caja" href="' +
      esc(dato.enlace) +
      '" target="_blank" rel="noopener noreferrer">' +
      '<span class="incrusta-marca">' +
      esc(dato.nombre) +
      "</span>" +
      '<span class="incrusta-titular">Ver la publicación en ' +
      esc(dato.nombre) +
      "</span>" +
      '<span class="incrusta-url">' +
      esc(corto) +
      "</span></a>" +
      pie +
      "</figure>"
    );
  }

  const estilo = [];
  if (dato.ratio) estilo.push("--inc-ratio:" + dato.ratio);
  if (dato.alto) estilo.push("--inc-alto:" + dato.alto + "px");
  if (dato.ancho) estilo.push("--inc-ancho:" + dato.ancho + "px");

  const portada = o.portada || dato.miniatura;
  // La miniatura de YouTube es la única imagen del sitio que llega de fuera. El
  // plugin del build también se la baja y la sirve desde aquí —así ni siquiera
  // eso se le pide al servidor de Google—, pero si un día el build no tiene
  // red, el atributo se queda apuntando al original: por eso esa lleva medidas
  // declaradas (480x360 es el tamaño real de hqdefault) y no se queda sin
  // relación de aspecto. Las tapas propias van sin medidas, como manda el
  // resto del sitio, para que el plugin genere varias y elija el navegador.
  const remota = /^https?:\/\//i.test(String(portada || ""));
  const tapa = portada
    ? '<img class="incrusta-foto" src="' +
      esc(portada) +
      '" alt="" loading="lazy" decoding="async"' +
      (remota ? ' width="480" height="360"' : ' sizes="(max-width: 720px) 92vw, 760px"') +
      ">"
    : "";

  return (
    '<figure class="incrusta incrusta-red-' +
    esc(dato.red) +
    " " +
    (dato.ratio ? "incrusta-video" : "incrusta-fijo") +
    (portada ? " incrusta-con-foto" : "") +
    '"' +
    (estilo.length ? ' style="' + esc(estilo.join(";")) + '"' : "") +
    '><div class="incrusta-caja">' +
    '<button type="button" class="incrusta-abrir" data-src="' +
    esc(dato.src) +
    '" data-titulo="' +
    esc(o.titulo || dato.accion) +
    '" aria-label="' +
    esc(dato.accion + " (se conecta con " + dato.nombre + ")") +
    '">' +
    tapa +
    // Triángulo de reproducir SOLO donde de verdad se reproduce algo. Una
    // publicación de Instagram o de X no se reproduce: se abre. Prometer un
    // botón de play sobre un texto es el mismo defecto del sello "EN VIVO"
    // que llevaba a ninguna parte.
    '<span class="' + (dato.reproducible ? "incrusta-play" : "incrusta-abre") + '" aria-hidden="true"></span>' +
    '<span class="incrusta-marca">' +
    esc(dato.nombre) +
    "</span>" +
    '<span class="incrusta-aviso">Toque para cargar</span>' +
    "</button></div>" +
    (pie || '<figcaption class="incrusta-pie">' + verEn + "</figcaption>") +
    "</figure>"
  );
}

module.exports = { incrustar, reconocer };
