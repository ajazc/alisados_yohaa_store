import { BUSINESS, ENTREGAS } from "../config/business.js";
import { formatPrice } from "./format.js";

/**
 * Arma el mensaje de WhatsApp con el desglose del pedido.
 * Se codifica con encodeURIComponent porque wa.me espera el texto en el query string.
 */
export function buildPedidoMessage({ items, cliente, entregaId, total, unidades }) {
  const entrega = ENTREGAS.find((e) => e.id === entregaId);
  const lineas = [];

  lineas.push(`Hola! Vengo de la web de *${BUSINESS.nombre}*.`);
  lineas.push("");
  lineas.push("*Mi pedido*");
  lineas.push("─────────────────");

  items.forEach((item, index) => {
    // La API devuelve los nombres en MAYUSCULAS: se usa la version presentation
    // (Title Case) que ya muestran las cards y el drawer.
    lineas.push(`${index + 1}. ${item.nombrePresentacion ?? item.nombre}`);
    lineas.push(
      `   ${item.cantidad} x ${formatPrice(item.precio)} = *${formatPrice(item.precio * item.cantidad)}*`
    );
    if (item.categoria === "servicios") {
      lineas.push("   _(coordinar turno)_");
    }
  });

  lineas.push("─────────────────");
  lineas.push(`*Total: ${formatPrice(total)}*`);
  lineas.push(`${unidades} ${unidades === 1 ? "producto" : "productos"}`);
  lineas.push("");
  lineas.push("*Entrega:* " + (entrega?.label ?? "A coordinar"));
  lineas.push(`*Nombre:* ${cliente.nombre}`);
  lineas.push(`*Telefono:* ${cliente.telefono}`);

  return lineas.join("\n");
}

/** Construye el href final de wa.me con el mensaje codificado. */
export function buildWhatsappUrl(datos) {
  const mensaje = buildPedidoMessage(datos);
  return `https://wa.me/${BUSINESS.whatsapp.split("/").pop()}?text=${encodeURIComponent(mensaje)}`;
}
