<script setup>
import { computed, onMounted, ref } from "vue";
import AppHeader from "./components/AppHeader.vue";
import CategoryTabs from "./components/CategoryTabs.vue";
import ProductCard from "./components/ProductCard.vue";
import CartBar from "./components/CartBar.vue";
import CheckoutDrawer from "./components/CheckoutDrawer.vue";
import { fetchCatalogo } from "./lib/api.js";
import { useCart } from "./composables/useCart.js";

const productos = ref([]);
const cargando = ref(true);
const error = ref(null);
const categoriaActiva = ref("todos");
const drawerAbierto = ref(false);

const {
  itemsEnriquecidos,
  itemsEnCarrito,
  totalUnidades,
  totalPrecio,
  increment,
  decrement,
  setCantidad,
  limpiar,
} = useCart(productos);

onMounted(async () => {
  try {
    productos.value = await fetchCatalogo();
    error.value = null;
  } catch (e) {
    error.value = e.message;
  } finally {
    cargando.value = false;
  }
});

/** Conteos por categoria para los badges de los chips. */
const counts = computed(() =>
  itemsEnriquecidos.value.reduce((acc, item) => {
    acc[item.categoria] = (acc[item.categoria] || 0) + 1;
    return acc;
  }, {})
);

const visibles = computed(() =>
  categoriaActiva.value === "todos"
    ? itemsEnriquecidos.value
    : itemsEnriquecidos.value.filter((p) => p.categoria === categoriaActiva.value)
);

const hayProductos = computed(() => visibles.value.length > 0);

function abrirDrawer() {
  drawerAbierto.value = true;
}

/** Cambia la cantidad desde el drawer (delta). */
function actualizarDesdeDrawer(codigo, delta) {
  const item = itemsEnriquecidos.value.find((p) => p.codigo === codigo);
  if (!item) return;
  setCantidad(codigo, item.cantidad + delta);
}
</script>

<template>
  <div class="min-h-dvh bg-canvas text-ink">
    <AppHeader />

    <main class="mx-auto max-w-2xl px-4 pb-8">
      <CategoryTabs v-model="categoriaActiva" :counts="counts" />

      <!-- Estados de carga / error -->
      <div v-if="cargando" class="py-16 text-center">
        <div class="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-rose-200 border-t-rose-500" />
        <p class="mt-3 text-sm text-ink-muted">Cargando catalogo...</p>
      </div>

      <div v-else-if="error" class="py-16 text-center">
        <div class="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-rose-100">
          <svg class="h-6 w-6 text-rose-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
            <path d="M12 8v5M12 16h.01" />
            <circle cx="12" cy="12" r="9" />
          </svg>
        </div>
        <p class="mt-3 text-sm font-semibold text-ink">No pudimos cargar el catalogo</p>
        <p class="mx-auto mt-1 max-w-xs text-xs text-ink-muted">{{ error }}</p>
        <button
          type="button"
          @click="location.reload()"
          class="mt-4 rounded-full bg-rose-400 px-5 py-2 text-xs font-bold text-white shadow-card transition active:scale-95"
        >
          Reintentar
        </button>
      </div>

      <div v-else-if="!hayProductos" class="py-16 text-center">
        <p class="text-sm font-semibold text-ink">No hay items en esta categoria</p>
        <p class="mt-1 text-xs text-ink-muted">Proba con otra seccion del catalogo.</p>
      </div>

      <!-- Grilla de productos -->
      <div v-else class="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <ProductCard
          v-for="producto in visibles"
          :key="producto.codigo"
          :producto="producto"
          :cantidad="producto.cantidad"
          @increment="increment(producto.codigo)"
          @decrement="decrement(producto.codigo)"
        />
      </div>
    </main>

    <CartBar
      :total-items="totalUnidades"
      :total-precio="totalPrecio"
      @open="abrirDrawer"
      @clear="limpiar"
    />

    <CheckoutDrawer
      :open="drawerAbierto"
      :items="itemsEnCarrito"
      :total-precio="totalPrecio"
      :total-unidades="totalUnidades"
      @close="drawerAbierto = false"
      @update-quantity="actualizarDesdeDrawer"
      @clear="limpiar"
    />
  </div>
</template>
