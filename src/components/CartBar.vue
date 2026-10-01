<script setup>
import { computed } from "vue";
import { formatPrice } from "../lib/format.js";

const props = defineProps({
  totalItems: { type: Number, required: true },
  totalPrecio: { type: Number, required: true },
});

const emit = defineEmits(["open", "clear"]);

// Limpio para no mostrar la barra cuando no hay nada agregado.
const visible = computed(() => props.totalItems > 0);
</script>

<template>
  <!-- Espacio para que la barra fija no tape la ultima fila -->
  <div v-if="visible" class="h-24" />

  <Transition
    enter-active-class="transition-transform duration-300 ease-out"
    enter-from-class="translate-y-full"
    leave-active-class="transition-transform duration-200 ease-in"
    leave-to-class="translate-y-full"
  >
    <div
      v-if="visible"
      class="fixed inset-x-0 bottom-0 z-40 border-t border-rose-100 bg-surface/95 shadow-bar backdrop-blur-md"
    >
      <div class="mx-auto flex max-w-2xl items-center gap-3 px-4 py-3">
        <button
          type="button"
          @click="emit('clear')"
          aria-label="Vaciar carrito"
          class="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-rose-200 text-ink-muted transition active:scale-90"
        >
          <svg class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M3 6h18M8 6V4h8v2M6 6l1 14h10l1-14" />
          </svg>
        </button>

        <button
          type="button"
          @click="emit('open')"
          class="flex flex-1 items-center justify-between gap-3 rounded-full bg-ink px-4 py-2.5 text-left transition active:scale-[0.98]"
        >
          <span class="flex items-center gap-2">
            <span
              class="flex h-6 min-w-6 items-center justify-center rounded-full bg-rose-400 px-1.5 text-xs font-bold text-white"
            >
              {{ totalItems }}
            </span>
            <span class="text-xs font-medium text-white/70">Ver pedido</span>
          </span>

          <span class="flex items-center gap-1.5 text-sm font-bold text-white">
            {{ formatPrice(totalPrecio) }}
            <svg class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <path d="M9 6l6 6-6 6" />
            </svg>
          </span>
        </button>
      </div>
    </div>
  </Transition>
</template>
