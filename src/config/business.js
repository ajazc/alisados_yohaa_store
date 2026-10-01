/**
 * Datos de negocio editables sin tocar componentes.
 * Las variables VITE_ se compilan en el bundle: solo datos publicos aqui.
 */

// Optional chaining para que el modulo tambien importe en Node (verificacion
// de la capa de datos), donde import.meta.env no esta definido.
//
// Celular de Trelew / Chubut. wa.me exige formato internacional: solo digitos,
// sin + ni 0 inicial, y con el 9 de movil despues del 54 -> 54 9 2966 227320.
const PHONE = import.meta.env?.VITE_WHATSAPP_NUMBER || "5492966227320";

export const BUSINESS = {
  nombre: "Alisados Yohaa",
  subtitulo: "Especialistas en Alisados y Cuidado Capilar",
  // Override opcional del logo. Si queda en null se usa src/logo.jpg (importado
  // por AppHeader, con hash de cache). Poné una ruta como "/logo.png" para
  // forzar otra imagen.
  avatar: null,
  instagram: `https://instagram.com/${import.meta.env?.VITE_INSTAGRAM_HANDLE || "alisados_yohaa"}`,
  whatsapp: `https://wa.me/${PHONE}`,
  ubicacion: "https://maps.google.com/?q=Alisados+Yohaa",
  // Badge del header. Se puede cambiar a "cerrado" segun el horario real.
  abierto: true,
  estadoTexto: "Abierto | Aceptando pedidos",
  moneda: "ARS",
};

export const ENTREGAS = [
  {
    id: "retiro",
    label: "Retiro por local",
    descripcion: "Retiras tu pedido en el salon.",
  },
  {
    id: "envio",
    label: "Envio a domicilio",
    descripcion: "Coordinamos el envio por WhatsApp.",
  },
  {
    id: "turno",
    label: "Agendar turno",
    descripcion: "Reservamos fecha y horario.",
  },
];
