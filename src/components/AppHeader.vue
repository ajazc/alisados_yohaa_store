<script setup>
import { ref, computed } from "vue";
import { BUSINESS } from "../config/business.js";
import logoUrl from "../logo.jpg";

/**
 * Estado local: el header decide por si mismo cuando su avatar no se pudo
 * cargar. No hace falta lift-earlo al padre.
 */
const avatarFailed = ref(false);

// Importar desde src/ (y no copiar a public/) da a Vite un archivo con hash de
// contenido: al cambiar el logo el cache se invalida solo.
const avatarSrc = computed(() => BUSINESS.avatar || logoUrl);

/**
 * Un asset faltante llega normalmente como 404 (dispara @error), pero si
 * hubiera un rewrite SPA que devuelve index.html con 200, el navegador no
 * dispara @error y deja una imagen rota. onLoad cubre ese segundo caso.
 */
function onAvatarLoad(event) {
  if (event.target.naturalWidth === 0) avatarFailed.value = true;
}
</script>

<template>
  <header
    class="sticky top-0 z-30 border-b border-rose-100 bg-canvas/85 backdrop-blur-md"
  >
    <div class="mx-auto max-w-2xl px-4 pb-3 pt-3">
      <div class="flex items-center gap-3">
        <!-- Avatar / Logo -->
        <div class="relative shrink-0">
          <img
            v-if="!avatarFailed"
            :src="avatarSrc"
            alt="Logo de Alisados Yohaa"
            class="h-14 w-14 rounded-full border-2 border-rose-200 bg-white object-cover shadow-card"
            loading="eager"
            @error="avatarFailed = true"
            @load="onAvatarLoad"
          />
          <div
            v-else
            class="flex h-14 w-14 items-center justify-center rounded-full border-2 border-rose-200 bg-gradient-to-br from-rose-200 to-rose-400 text-lg font-bold text-white shadow-card"
          >
            AY
          </div>
        </div>

        <div class="min-w-0 flex-1">
          <h1 class="truncate text-lg font-bold leading-tight text-ink">
            {{ BUSINESS.nombre }}
          </h1>
          <p class="truncate text-xs text-ink-muted">
            {{ BUSINESS.subtitulo }}
          </p>

          <!-- Badge de estado -->
          <span
            v-if="BUSINESS.abierto"
            class="mt-1 inline-flex items-center gap-1.5 rounded-full bg-wa-tint px-2 py-0.5 text-[11px] font-semibold text-wa-dark"
          >
            <span class="relative flex h-1.5 w-1.5">
              <span class="absolute inline-flex h-full w-full animate-ping rounded-full bg-wa opacity-75" />
              <span class="relative inline-flex h-1.5 w-1.5 rounded-full bg-wa" />
            </span>
            {{ BUSINESS.estadoTexto }}
          </span>
          <span
            v-else
            class="mt-1 inline-flex rounded-full bg-rose-100 px-2 py-0.5 text-[11px] font-semibold text-rose-700"
          >
            Cerrado | No aceptamos pedidos
          </span>
        </div>
      </div>

      <!-- Accesos rapidos -->
      <div class="mt-3 grid grid-cols-3 gap-2">
        <a
          :href="BUSINESS.instagram"
          target="_blank"
          rel="noopener noreferrer"
          class="flex items-center justify-center gap-1.5 rounded-full border border-rose-200 bg-surface py-1.5 text-xs font-medium text-ink-soft transition active:scale-95"
        >
          <svg class="h-3.5 w-3.5 text-rose-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <rect x="2" y="2" width="20" height="20" rx="5" />
            <circle cx="12" cy="12" r="4" />
            <circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none" />
          </svg>
          Instagram
        </a>
        <a
          :href="BUSINESS.whatsapp"
          target="_blank"
          rel="noopener noreferrer"
          class="flex items-center justify-center gap-1.5 rounded-full border border-wa/30 bg-wa-tint py-1.5 text-xs font-semibold text-wa-dark transition active:scale-95"
        >
          <svg class="h-3.5 w-3.5" viewBox="0 0 24 24" fill="currentColor">
            <path d="M17.5 14.4c-.3-.2-1.8-.9-2-1-.3-.1-.5-.2-.7.1-.2.3-.7 1-.9 1.2-.2.2-.3.2-.6.1-.3-.2-1.2-.5-2.3-1.4-.9-.8-1.4-1.7-1.6-2-.2-.3 0-.5.1-.6l.5-.5c.1-.2.2-.3.3-.5 0-.2 0-.4-.1-.5l-1-2.4c-.2-.6-.5-.5-.7-.5h-.6c-.2 0-.5.1-.8.4-.3.3-1 1-1 2.5s1.1 2.9 1.2 3.1c.2.2 2.1 3.2 5.1 4.5.7.3 1.3.5 1.7.6.7.2 1.4.2 1.9.1.6-.1 1.8-.7 2-1.4.3-.7.3-1.3.2-1.4-.1-.2-.3-.2-.6-.3z" />
            <path d="M12 2a10 10 0 0 0-8.6 15L2 22l5.2-1.4A10 10 0 1 0 12 2zm0 18.2c-1.6 0-3-.4-4.3-1.2l-.3-.2-3.1.8.8-3-.2-.3A8.2 8.2 0 1 1 12 20.2z" />
          </svg>
          WhatsApp
        </a>
        <a
          :href="BUSINESS.ubicacion"
          target="_blank"
          rel="noopener noreferrer"
          class="flex items-center justify-center gap-1.5 rounded-full border border-rose-200 bg-surface py-1.5 text-xs font-medium text-ink-soft transition active:scale-95"
        >
          <svg class="h-3.5 w-3.5 text-rose-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0z" />
            <circle cx="12" cy="10" r="3" />
          </svg>
          Ubicacion
        </a>
      </div>
    </div>
  </header>
</template>
