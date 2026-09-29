// Limpieza compartida por el buscador del archivo (/archivo/).
//
// El navegador aplica EXACTAMENTE la misma normalización a lo que escribe el
// lector (src/assets/archivo.js). Si se cambia aquí, hay que cambiarla allá:
// si no coinciden, "credito" deja de encontrar "crédito".

// Minúsculas y sin tildes. La eñe también se pierde (ñ -> n), a propósito:
// en el teléfono mucha gente escribe "pequenos" y "companias".
function normalizarBusqueda(texto) {
  return String(texto || "")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase();
}

// Palabras que no ayudan a encontrar nada y solo engordan el índice.
const VACIAS = new Set(
  (
    "que los las del con por para una uno unos unas como mas pero sus este esta estos estas ese esa " +
    "eso esos esas son fue fueron ser han hay sin sobre entre desde hasta tambien cuando donde " +
    "porque segun cada otro otra otros otras muy ya asi aun solo todo toda todos todas nos les " +
    "mismo misma lo al el la de en y a o u e se su no si le"
  ).split(" ")
);

// Texto de una nota en Markdown -> palabras únicas, normalizadas, separadas por
// espacio. Es lo que se busca además del titular y el resumen. Se guardan
// palabras sueltas y sin repetir: el índice de las ~100 notas pesa decenas de
// KB en vez de cientos, y para "¿esta nota habla de cacao?" basta.
function palabrasDeNota(markdown) {
  const limpio = String(markdown || "")
    .replace(/^---[\s\S]*?\n---/, " ") // front matter
    .replace(/<[^>]+>/g, " ") // HTML suelto
    .replace(/\]\([^)]*\)/g, "] ") // destino de los enlaces [texto](url)
    .replace(/https?:\/\/\S+/g, " "); // direcciones pegadas solas (incrustaciones)
  const unicas = new Set();
  for (const p of normalizarBusqueda(limpio).split(/[^a-z0-9]+/)) {
    if (p.length >= 3 && !VACIAS.has(p)) unicas.add(p);
  }
  return [...unicas].join(" ");
}

module.exports = { normalizarBusqueda, palabrasDeNota };
