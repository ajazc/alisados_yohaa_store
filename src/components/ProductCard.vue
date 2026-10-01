<script setup>
import { computed, ref } from "vue";
import ProductArtwork from "./ProductArtwork.vue";
import { formatPrice } from "../lib/format.js";
import { DESCRIPCION_POR_DEFECTO } from "../config/categorias.js";

const props = defineProps({
  producto: { type: Object, required: true },
  cantidad: { type: Number, default: 0 },
});

const emit = defineEmits(["increment", "decrement"]);

const imagenFallida = ref(false);

// El nombre llega en MAYUSCULAS desde la API; se pasa a Title Case para la card.
const nombreBonito = computed(() =>
  props.producto.nombre
    .toLowerCase()
    .replace(/\b\w/g, (c) => c.toUpperCase())
);

const descripcion = computed(
  () =>
    props.producto.descripcion ||
    DESCRIPCION_POR_DEFECTO[props.producto.categoria] ||
    DESCRIPCION_POR_DEFECTO.productos
);

const sinStock = computed(() => props.producto.cantidadDisponible <= 0);
const agotado = computed(() => sinStock.value || props.cantidad >= props.producto.cantidadDisponible);

/** El placeholder se usa si la API no trae imagen o si el archivo falla en cargar. */
const usarPlaceholder = computed(() => !props.producto.imagen || imagenFallida.value);
</script>

<template>
  <article
    class="flex flex-col overflow-hidden rounded-2xl border border-rose-100 bg-surface shadow-card"
    :class="{ 'opacity-60': sinStock }"
  >
    <!-- Imagen / placeholder -->
    <div class="relative aspect-[4/3] w-full overflow-hidden bg-rose-50">
      <img
        v-if="!usarPlaceholder"
        :src="producto.imagen"
        :alt="nombreBonito"
        loading="lazy"
        decoding="async"
        class="h-full w-full object-cover"
        @error="imagenFallida = true"
      />
      <ProductArtwork v-else :categoria="producto.categoria" :nombre="nombreBonito" />

      <!-- Badge de stock -->
      <span
        v-if="sinStock"
        class="absolute left-2 top-2 rounded-full bg-ink/85 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white"
      >
        Sin stock
      </span>
      <span
        v-else
        class="absolute left-2 top-2 rounded-full bg-white/90 px-2 py-0.5 text-[10px] font-bold text-ink-soft shadow-sm"
      >
        Stock: {{ producto.cantidadDisponible }}
      </span>
    </div>

    <!-- Cuerpo -->
    <div class="flex flex-1 flex-col p-3">
      <h3 class="text-sm font-semibold leading-snug text-ink">
        {{ nombreBonito }}
      </h3>
      <p class="mt-1 line-clamp-2 text-xs leading-relaxed text-ink-muted">
        {{ descripcion }}
      </p>

      <div class="mt-auto pt-3">
        <p class="text-base font-bold text-rose-600">
          {{ formatPrice(producto.precio) }}
        </p>

        <!-- Paso a cantidad: siempre visible para que el CTA sea predecible -->
        <div class="mt-2 flex items-center gap-2">
          <button
            v-if="cantidad > 0"
            type="button"
            aria-label="Quitar uno"
            :disabled="sinStock"
            @click="emit('decrement')"
            class="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-rose-200 bg-surface text-ink-soft transition active:scale-90 disabled:opacity-40"
          >
            <svg class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round">
              <path d="M5 12h14" />
            </svg>
          </button>

          <span
            v-if="cantidad > 0"
            class="w-6 shrink-0 text-center text-sm font-bold tabular-nums text-ink"
          >
            {{ cantidad }}
          </span>

          <button
            type="button"
            :disabled="agotado"
            @click="emit('increment')"
            class="flex h-9 flex-1 items-center justify-center rounded-full text-xs font-bold transition active:scale-95 disabled:cursor-not-allowed disabled:opacity-50"
            :class="
              cantidad > 0
                ? 'bg-rose-100 text-rose-700 hover:bg-rose-200'
                : sinStock
                  ? 'bg-ink/10 text-ink-muted'
                  : 'bg-rose-400 text-white shadow-card hover:bg-rose-500'
            "
          >
            <template v-if="agotado">
              {{ sinStock ? "Sin stock" : "Maximo alcanzado" }}
            </template>
            <template v-else-if="cantidad > 0">
              <span class="text-base leading-none">+</span>
              <span class="ml-1">Agregar</span>
            </template>
            <template v-else>Agregar</template>
          </button>
        </div>
      </div>
    </div>
  </article>
</template>
