const API_BASE_URL = (import.meta.env?.VITE_API_BASE_URL || "https://ajazc.com.ar")
  .replace(/\/+$/, "");
const API_ORIGIN = new URL(API_BASE_URL).origin;

function normalizeProduct(raw) {
  const image = raw.imagen ?? null;
  return {
    codigo: String(raw.codigo ?? ""),
    nombre: String(raw.nombre ?? "").trim(),
    descripcion: String(raw.descripcion ?? "").trim(),
    precio: Number.parseFloat(raw.precio ?? "0") || 0,
    cantidadDisponible: Number.parseInt(raw.cantidad_disponible ?? "0", 10) || 0,
    imagen: image
      ? /^https?:\/\//i.test(image)
        ? image
        : new URL(image, `${API_BASE_URL}/`).href
      : null,
  };
}

export async function fetchCatalogo({ signal, fresh = false } = {}) {
  const productos = [];
  let endpoint = new URL("/api/productos/?page_size=100", API_BASE_URL);

  for (let page = 0; endpoint && page < 20; page += 1) {
    if (fresh) endpoint.searchParams.set("_", String(Date.now()));
    const response = await fetch(endpoint, {
      signal,
      cache: fresh ? "no-store" : "default",
      headers: { Accept: "application/json" },
    });

    if (!response.ok) {
      let detail = "";
      try {
        const payload = await response.json();
        detail = payload?.detail || payload?.error || "";
      } catch {
        // Se conserva el status HTTP si la API no devuelve JSON.
      }
      throw new Error(detail || `No se pudo cargar el catalogo (${response.status})`);
    }

    const payload = await response.json();
    const results = Array.isArray(payload) ? payload : payload?.results ?? [];
    productos.push(...results.map(normalizeProduct));

    if (Array.isArray(payload) || !payload?.next) {
      endpoint = null;
      continue;
    }

    const next = new URL(payload.next, API_BASE_URL);
    if (next.origin !== API_ORIGIN) {
      throw new Error("La API devolvio una pagina fuera del dominio configurado.");
    }
    endpoint = next;
  }

  return productos;
}

export { API_BASE_URL };
