/**
 * GET /api/productos
 * Devuelve el catalogo normalizado al cliente.
 *
 * Cache corta en CDN (s-maxage) para que un reload no golpee la API.
 * La API es la fuente de verdad para precio y stock.
 */

import { fetchAllProducts } from "./_lib/products.js";

export default async function handler(req, res) {
  if (req.method !== "GET" && req.method !== "HEAD") {
    res.setHeader("Allow", "GET, HEAD");
    return res.status(405).json({ error: "Metodo no permitido" });
  }

  try {
    const productos = await fetchAllProducts();

    // 5 min en CDN/navegador: los precios no cambian minuto a minuto y evita
    // que cada visitante dispare un login contra la API.
    res.setHeader("Cache-Control", "public, s-maxage=300, stale-while-revalidate=600");
    return res.status(200).json({ productos, total: productos.length });
  } catch (error) {
    console.error("[api/productos]", error.message);
    return res.status(502).json({
      error: "No se pudo obtener el catalogo",
      detail: error.message,
    });
  }
}
