<script setup>
/**
 * Placeholder vectorial para productos sin imagen.
 * Se elige el SVG segun la categoria para que la grilla se vea coherente
 * mientras la API no trae imagenes.
 */
defineProps({
  categoria: { type: String, default: "productos" },
  nombre: { type: String, default: "" },
});
</script>

<template>
  <div
    class="relative flex h-full w-full items-center justify-center overflow-hidden bg-gradient-to-br from-rose-50 via-rose-100/60 to-rose-200/70"
  >
    <!-- Halo decorativo -->
    <div class="absolute -right-6 -top-6 h-24 w-24 rounded-full bg-white/50 blur-2xl" />
    <div class="absolute -bottom-8 -left-4 h-28 w-28 rounded-full bg-rose-300/30 blur-2xl" />

    <!-- Frasco / tratamiento -->
    <svg
      v-if="categoria === 'tratamientos'"
      viewBox="0 0 64 64"
      class="relative h-16 w-16 text-rose-400"
      fill="none"
      stroke="currentColor"
      stroke-width="2"
      stroke-linecap="round"
      stroke-linejoin="round"
    >
      <path d="M26 10h12v8l5 8v20a4 4 0 0 1-4 4H25a4 4 0 0 1-4-4V26l5-8z" />
      <path d="M21 34h22" />
      <path d="M27 10h10" />
    </svg>

    <!-- Botella / producto de mantenimiento -->
    <svg
      v-else-if="categoria === 'productos'"
      viewBox="0 0 64 64"
      class="relative h-16 w-16 text-rose-400"
      fill="none"
      stroke="currentColor"
      stroke-width="2"
      stroke-linecap="round"
      stroke-linejoin="round"
    >
      <path d="M24 8h16v10l6 6v22a4 4 0 0 1-4 4H22a4 4 0 0 1-4-4V24l6-6z" />
      <path d="M22 32h20" />
      <path d="M28 8h8v6h-8z" />
    </svg>

    <!-- Turno / servicio -->
    <svg
      v-else-if="categoria === 'servicios'"
      viewBox="0 0 64 64"
      class="relative h-16 w-16 text-rose-400"
      fill="none"
      stroke="currentColor"
      stroke-width="2"
      stroke-linecap="round"
      stroke-linejoin="round"
    >
      <rect x="12" y="16" width="40" height="36" rx="4" />
      <path d="M12 26h40M22 10v8M42 10v8" />
      <path d="M24 36l5 5 11-11" />
    </svg>

    <!-- Combo / promo -->
    <svg
      v-else
      viewBox="0 0 64 64"
      class="relative h-16 w-16 text-rose-400"
      fill="none"
      stroke="currentColor"
      stroke-width="2"
      stroke-linecap="round"
      stroke-linejoin="round"
    >
      <rect x="10" y="26" width="44" height="28" rx="4" />
      <path d="M10 36h44M32 26v28" />
      <path d="M32 26c-8 0-14-4-14-9 6-2 14 2 14 9zM32 26c8 0 14-4 14-9-6-2-14 2-14 9z" />
    </svg>
  </div>
</template>
