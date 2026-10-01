/**
 * Categorias del catalogo.
 *
 * La API no expone categorias (no hay endpoint /api/categorias/ ni campo
 * categoria en los productos), asi que se derivan del nombre del producto por
 * palabras clave. Para cambiar o sumar una categoria alcanza con editar las
 * reglas de `PATRONES` o el label en `CATEGORIAS`.
 */

export const CATEGORIAS = [
  { id: "todos", label: "Todos", icon: "grid" },
  { id: "servicios", label: "Servicios / Turnos", icon: "calendar" },
  { id: "tratamientos", label: "Tratamientos Capilares", icon: "droplet" },
  { id: "productos", label: "Productos & Mantenimiento", icon: "bottle" },
  { id: "combos", label: "Combos / Promos", icon: "gift" },
];

/**
 * Se evalua en ORDEN: la primera categoria cuyo patron coincide gana. El orden
 * importa porque los nombres de la API son短短 y pueden contener keywords de
 * dos categorias a la vez.
 *
 * Los productos con nombre propio van antes que los servicios. Ejemplo real
 * que motiva el orden: "PEINE DE CORTE LARGO CRBONO" contiene
 * "corte" (servicio) y "peine" (producto). El item es un peine, asi que las
 * keywords de productos se evaluan antes que las de servicios.
 * Los servicios van antes que tratamientos porque "ALISADO CON CREMA" es un
 * servicio, no un producto.
 */
const PATRONES = [
  {
    categoria: "combos",
    palabras: ["combo", "promo", "pack", "kit ", "kit de"],
  },
  {
    // Productos con nombre propio: sin ambigüedad posible.
    categoria: "productos",
    palabras: [
      "shampoo",
      "champu",
      "acondicionador",
      "peine",
      "secador",
      "plancha",
      "pinza",
      "horquilla",
      "esponja",
      "toalla",
      "guante",
      "cepillo",
    ],
  },
  {
    categoria: "servicios",
    palabras: [
      "alisado",
      "aliser",
      "brushing",
      "corte",
      "coloracion",
      "balayage",
      "mechas",
      "platinado",
      "keratiniz",
      "turno",
      "sesion",
      "service",
    ],
  },
  {
    categoria: "tratamientos",
    palabras: [
      "ampolla",
      "crema",
      "serum",
      "tratamiento",
      "mascarilla",
      "cera",
      "aceite",
      "oil",
      "reparador",
      "nutritivo",
      "tonico",
      "reconstructor",
    ],
  },
];

/**
 * Clasifica un producto. Si nada coincide cae en "productos", que es el
 * bucket mas sensato para un item de venta suelto.
 */
export function categorizarProducto(nombre = "") {
  const texto = String(nombre).toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");

  for (const { categoria, palabras } of PATRONES) {
    if (palabras.some((palabra) => texto.includes(palabra.replace(/[\u0300-\u036f]/g, "")))) {
      return categoria;
    }
  }

  return "productos";
}

/** Texto por defecto cuando la API devuelve `descripcion` vacia. */
export const DESCRIPCION_POR_DEFECTO = {
  servicios: "Reservá tu turno y coordinamos la fecha por WhatsApp.",
  tratamientos: "Tratamiento capilar Leave-in. Aplicar sobre cabello limpio y seco.",
  productos: "Producto de mantenimiento para tu rutina diaria.",
  combos: "Promo combinada. Consultá disponibilidad por WhatsApp.",
};
