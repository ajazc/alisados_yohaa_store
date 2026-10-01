import { computed, reactive, watch } from "vue";
import { categorizarProducto } from "../config/categorias.js";

const STORAGE_KEY = "yohaa:carrito:v1";

/**
 * Estado del carrito: cantidades por codigo de producto.
 *
 * Vive fuera del componente para que el carrito sobreviva al unmount del
 * drawer y se comparta entre vistas.
 */
const cantidades = reactive({});

/** Carga inicial desde localStorage (guard para SSR/no browser). */
function hydrate() {
  if (typeof window === "undefined") return;
  try {
    const guardado = JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");
    Object.entries(guardado).forEach(([codigo, cantidad]) => {
      cantidades[codigo] = Number(cantidad) || 0;
    });
  } catch {
    // JSON corrupto: se empieza con el carrito vacio.
  }
}

function persist() {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(cantidades));
  } catch {
    // Modo privado / cuota llena: el carrito sigue funcionando en memoria.
  }
}

hydrate();
watch(cantidades, persist, { deep: true });

/**
 * Enriquece los productos de la API con la categoria derivada y la cantidad
 * elegida. `nombrePresentacion` en Title Case para el resumen.
 */
export function useCart(items) {
  const itemsEnriquecidos = computed(() =>
    items.value.map((producto) => {
      const cantidad = cantidades[producto.codigo] || 0;
      return {
        ...producto,
        categoria: producto.categoria ?? categorizarProducto(producto.nombre),
        nombrePresentacion: producto.nombre
          .toLowerCase()
          .replace(/\b\w/g, (c) => c.toUpperCase()),
        cantidad,
        subtotal: producto.precio * cantidad,
      };
    })
  );

  const itemsEnCarrito = computed(() =>
    itemsEnriquecidos.value.filter((item) => item.cantidad > 0)
  );

  const totalUnidades = computed(() =>
    itemsEnCarrito.value.reduce((suma, item) => suma + item.cantidad, 0)
  );

  const totalPrecio = computed(() =>
    itemsEnCarrito.value.reduce((suma, item) => suma + item.subtotal, 0)
  );

  /** No supera el stock disponible que reporta la API. */
  function setCantidad(codigo, cantidad) {
    const producto = items.value.find((p) => p.codigo === codigo);
    const tope = producto?.cantidadDisponible ?? 0;
    cantidades[codigo] = Math.max(0, Math.min(cantidad, tope));
  }

  function increment(codigo) {
    setCantidad(codigo, (cantidades[codigo] || 0) + 1);
  }

  function decrement(codigo) {
    setCantidad(codigo, (cantidades[codigo] || 0) - 1);
  }

  function limpiar() {
    Object.keys(cantidades).forEach((codigo) => delete cantidades[codigo]);
  }

  return {
    itemsEnriquecidos,
    itemsEnCarrito,
    totalUnidades,
    totalPrecio,
    increment,
    decrement,
    setCantidad,
    limpiar,
  };
}
