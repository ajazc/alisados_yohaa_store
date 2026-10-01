/**
 * Cliente HTTP del navegador.
 *
 * Habla contra /api/productos (la funcion serverless de Vercel), nunca contra
 * ajazc.com.ar directamente: la API no tiene CORS y exige un JWT que el
 * navegador no debe conocer.
 */

const ENDPOINT = "/api/productos";

export async function fetchCatalogo({ signal } = {}) {
  const response = await fetch(ENDPOINT, { signal, headers: { Accept: "application/json" } });

  if (!response.ok) {
    let detalle = "";
    try {
      detalle = (await response.json())?.error ?? "";
    } catch {
      // Respuesta sin JSON (ej. 502 del edge). Se usa el status.
    }
    throw new Error(detalle || `No se pudo cargar el catalogo (${response.status})`);
  }

  const { productos } = await response.json();
  return Array.isArray(productos) ? productos : [];
}
