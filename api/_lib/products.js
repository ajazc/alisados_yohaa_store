/**
 * Normalizacion de productos y resolucion de imagenes.
 * Corre en el servidor (serverless), no en el navegador.
 */

import { API_BASE_URL, apiFetch } from "./apiClient.js";

/**
 * La API devuelve el precio como string ("8000.00") y no siempre incluye
 * `imagen` (la ausencia total de la clave es distinta de null).
 */
function normalizeProduct(raw) {
  return {
    codigo: String(raw.codigo ?? ""),
    nombre: (raw.nombre ?? "").trim(),
    descripcion: (raw.descripcion ?? "").trim(),
    precio: Number.parseFloat(raw.precio ?? "0") || 0,
    cantidadDisponible: Number.parseInt(raw.cantidad_disponible ?? "0", 10) || 0,
    imagen: raw.imagen ? absolutizeImage(raw.imagen) : null,
  };
}

/** Convierte rutas relativas de /media/... en URLs absolutas de la API. */
function absolutizeImage(value) {
  if (/^https?:\/\//i.test(value)) return value;
  return `${API_BASE_URL}${value.startsWith("/") ? "" : "/"}${value}`;
}

/**
 * DRF pagina por defecto. Se piden paginas grandes y se recorren `next` hasta
 * cubrir el catalogo completo para no truncar productos en el cliente.
 */
async function fetchAllProducts() {
  const products = [];
  let url = "/api/productos/?page_size=100";

  // Tope de seguridad para no loopear infinitamente si la API devuelve `next` en ciclo.
  for (let page = 0; url && page < 20; page += 1) {
    const payload = await apiFetch(url);
    const results = Array.isArray(payload) ? payload : payload?.results ?? [];
    products.push(...results.map(normalizeProduct));

    const next = Array.isArray(payload) ? null : payload?.next;
    url = next ? next.replace(API_BASE_URL, "") : null;
  }

  return products;
}

export { fetchAllProducts };
