<script setup>
import { ref, watch, nextTick } from "vue";
import { CATEGORIAS } from "../config/categorias.js";

const props = defineProps({
  modelValue: { type: String, default: "todos" },
  counts: { type: Object, default: () => ({}) },
});

const emit = defineEmits(["update:modelValue"]);

const scroller = ref(null);
const activeEl = ref(null);

/** Centra el chip activo al cambiar de tab (o al tocar la barra). */
async function centerActive(smooth = true) {
  await nextTick();
  const container = scroller.value;
  const chip = activeEl.value;
  if (!container || !chip) return;

  const target = chip.offsetLeft - container.clientWidth / 2 + chip.clientWidth / 2;
  container.scrollTo({ left: target, behavior: smooth ? "smooth" : "auto" });
}

watch(
  () => props.modelValue,
  () => centerActive()
);

defineExpose({ centerActive });
</script>

<template>
  <div class="sticky top-[132px] z-20 -mx-4 bg-canvas/85 px-4 py-2 backdrop-blur-md">
    <div
      ref="scroller"
      class="flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
    >
      <button
        v-for="categoria in CATEGORIAS"
        :key="categoria.id"
        :ref="categoria.id === modelValue ? (el) => (activeEl = el?.$el ?? el) : undefined"
        type="button"
        :aria-pressed="categoria.id === modelValue"
        @click="emit('update:modelValue', categoria.id)"
        class="shrink-0 rounded-full border px-3.5 py-1.5 text-xs font-semibold transition active:scale-95"
        :class="
          categoria.id === modelValue
            ? 'border-transparent bg-rose-400 text-white shadow-card'
            : 'border-rose-200 bg-surface text-ink-soft hover:border-rose-300'
        "
      >
        {{ categoria.label }}
        <span
          v-if="categoria.id !== 'todos' && counts[categoria.id]"
          class="ml-1 text-[10px] opacity-70"
        >
          {{ counts[categoria.id] }}
        </span>
      </button>
    </div>
  </div>
</template>
