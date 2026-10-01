<script setup>
import { computed, nextTick, ref, watch } from "vue";
import { ENTREGAS } from "../config/business.js";
import { buildWhatsappUrl } from "../lib/whatsapp.js";
import { formatPrice } from "../lib/format.js";

const props = defineProps({
  open: { type: Boolean, default: false },
  items: { type: Array, default: () => [] },
  totalPrecio: { type: Number, default: 0 },
  totalUnidades: { type: Number, default: 0 },
});

const emit = defineEmits(["close", "update-quantity", "clear"]);

const cliente = ref({ nombre: "", telefono: "" });
const entregaId = ref("retiro");
const errores = ref({});
const panel = ref(null);

// --- Validacion -------------------------------------------------------------

/** Solo digitos para comparar; el formato se muestra como lo escribe la clienta. */
const soloDigitos = computed(() => cliente.value.telefono.replace(/\D/g, ""));

function validar() {
  const nuevos = {};

  if (cliente.value.nombre.trim().length < 3) {
    nuevos.nombre = "Ingresa tu nombre y apellido";
  }

  // Argentina: 10 digitos con el 15. Se acepta el 0 inicial y el +54 opcional.
  if (soloDigitos.value.length < 10) {
    nuevos.telefono = "Ingresa un telefono valido (ej: 11 1234 5678)";
  }

  errores.value = nuevos;
  return Object.keys(nuevos).length === 0;
}

// --- Comportamiento ---------------------------------------------------------

/** Bloquea el scroll del body mientras el drawer esta abierto. */
watch(
  () => props.open,
  async (abierto) => {
    document.body.style.overflow = abierto ? "hidden" : "";
    if (abierto) {
      panel.value?.focus();
      // Autofocus en el primer campo cuando ya se eligio entrega.
      await nextTick();
    }
  }
);

const whatsappUrl = computed(() => {
  if (!props.items.length) return "#";
  return buildWhatsappUrl({
    items: props.items,
    cliente: cliente.value,
    entregaId: entregaId.value,
    total: props.totalPrecio,
    unidades: props.totalUnidades,
  });
});

function enviar() {
  if (!validar()) return;
  window.open(whatsappUrl.value, "_blank", "noopener");
}

/** Limpia los datos del form al cerrar, sin tocar el carrito. */
function cerrar() {
  cliente.value = { nombre: "", telefono: "" };
  entregaId.value = "retiro";
  errores.value = {};
  emit("close");
}
</script>

<template>
  <Teleport to="body">
    <Transition
      enter-active-class="transition-opacity duration-200"
      enter-from-class="opacity-0"
      leave-active-class="transition-opacity duration-200"
      leave-to-class="opacity-0"
    >
      <div
        v-if="open"
        class="fixed inset-0 z-50 bg-ink/45 backdrop-blur-[2px]"
        @click="cerrar"
      />
    </Transition>

    <Transition
      enter-active-class="transition-transform duration-300 ease-out"
      enter-from-class="translate-y-full"
      leave-active-class="transition-transform duration-200 ease-in"
      leave-to-class="translate-y-full"
    >
      <section
        v-if="open"
        ref="panel"
        tabindex="-1"
        role="dialog"
        aria-modal="true"
        aria-label="Resumen del pedido"
        class="fixed inset-x-0 bottom-0 z-50 flex max-h-[92vh] flex-col rounded-t-3xl bg-canvas shadow-sheet"
      >
        <!-- Handle -->
        <div class="flex shrink-0 justify-center pt-3">
          <span class="h-1 w-10 rounded-full bg-rose-200" />
        </div>

        <!-- Header del drawer -->
        <header class="flex shrink-0 items-center justify-between px-4 pb-3 pt-3">
          <div>
            <h2 class="text-base font-bold text-ink">Tu pedido</h2>
            <p class="text-xs text-ink-muted">
              {{ totalUnidades }} {{ totalUnidades === 1 ? "producto" : "productos" }}
            </p>
          </div>
          <div class="flex items-center gap-1">
            <button
              type="button"
              @click="emit('clear')"
              class="rounded-full px-2.5 py-1 text-xs font-medium text-ink-muted transition active:scale-95"
            >
              Vaciar
            </button>
            <button
              type="button"
              aria-label="Cerrar"
              @click="cerrar"
              class="flex h-8 w-8 items-center justify-center rounded-full bg-rose-100 text-ink-soft transition active:scale-90"
            >
              <svg class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round">
                <path d="M6 6l12 12M18 6L6 18" />
              </svg>
            </button>
          </div>
        </header>

        <!-- Contenido scrollable -->
        <div class="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 pb-4">
          <!-- Items -->
          <ul class="divide-y divide-rose-100 overflow-hidden rounded-2xl border border-rose-100 bg-surface">
            <li
              v-for="item in items"
              :key="item.codigo"
              class="flex items-center gap-3 p-3"
            >
              <div class="min-w-0 flex-1">
                <p class="truncate text-sm font-semibold text-ink">
                  {{ item.nombrePresentacion }}
                </p>
                <p class="mt-0.5 text-xs text-ink-muted">
                  {{ formatPrice(item.precio) }} c/u
                  <span
                    v-if="item.categoria === 'servicios'"
                    class="ml-1 rounded-full bg-rose-100 px-1.5 py-0.5 text-[10px] font-semibold text-rose-700"
                  >
                    Turno
                  </span>
                </p>
              </div>

              <div class="flex items-center gap-1">
                <button
                  type="button"
                  aria-label="Quitar uno"
                  @click="emit('update-quantity', item.codigo, -1)"
                  class="flex h-7 w-7 items-center justify-center rounded-full border border-rose-200 text-ink-soft transition active:scale-90"
                >
                  <svg class="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round">
                    <path d="M5 12h14" />
                  </svg>
                </button>
                <span class="w-5 text-center text-xs font-bold tabular-nums text-ink">
                  {{ item.cantidad }}
                </span>
                <button
                  type="button"
                  aria-label="Agregar uno"
                  @click="emit('update-quantity', item.codigo, 1)"
                  class="flex h-7 w-7 items-center justify-center rounded-full border border-rose-200 text-ink-soft transition active:scale-90 disabled:opacity-40"
                  :disabled="item.cantidad >= item.cantidadDisponible"
                >
                  <svg class="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round">
                    <path d="M12 5v14M5 12h14" />
                  </svg>
                </button>
              </div>

              <p class="w-20 shrink-0 text-right text-sm font-bold text-ink">
                {{ formatPrice(item.precio * item.cantidad) }}
              </p>
            </li>
          </ul>

          <!-- Formulario -->
          <form class="mt-4 space-y-3" @submit.prevent="enviar">
            <div>
              <label for="nombre" class="mb-1 block text-xs font-semibold text-ink-soft">
                Nombre y apellido
              </label>
              <input
                id="nombre"
                v-model="cliente.nombre"
                type="text"
                autocomplete="name"
                placeholder="Ej: Maria Gomez"
                :aria-invalid="!!errores.nombre"
                class="w-full rounded-xl border bg-surface px-3 py-2.5 text-sm text-ink outline-none transition placeholder:text-ink-muted/70 focus:ring-2"
                :class="
                  errores.nombre
                    ? 'border-red-300 focus:border-red-400 focus:ring-red-100'
                    : 'border-rose-200 focus:border-rose-400 focus:ring-rose-100'
                "
              />
              <p v-if="errores.nombre" class="mt-1 text-[11px] text-red-500">
                {{ errores.nombre }}
              </p>
            </div>

            <div>
              <label for="telefono" class="mb-1 block text-xs font-semibold text-ink-soft">
                Telefono de contacto
              </label>
              <input
                id="telefono"
                v-model="cliente.telefono"
                type="tel"
                inputmode="tel"
                autocomplete="tel"
                placeholder="11 1234 5678"
                :aria-invalid="!!errores.telefono"
                class="w-full rounded-xl border bg-surface px-3 py-2.5 text-sm text-ink outline-none transition placeholder:text-ink-muted/70 focus:ring-2"
                :class="
                  errores.telefono
                    ? 'border-red-300 focus:border-red-400 focus:ring-red-100'
                    : 'border-rose-200 focus:border-rose-400 focus:ring-rose-100'
                "
              />
              <p v-if="errores.telefono" class="mt-1 text-[11px] text-red-500">
                {{ errores.telefono }}
              </p>
            </div>

            <!-- Tipo de entrega -->
            <fieldset>
              <legend class="mb-1.5 text-xs font-semibold text-ink-soft">
                Tipo de entrega
              </legend>
              <div class="space-y-2">
                <label
                  v-for="opcion in ENTREGAS"
                  :key="opcion.id"
                  class="flex cursor-pointer items-center gap-3 rounded-xl border bg-surface p-3 transition active:scale-[0.99]"
                  :class="
                    entregaId === opcion.id
                      ? 'border-rose-400 ring-2 ring-rose-100'
                      : 'border-rose-100'
                  "
                >
                  <input
                    v-model="entregaId"
                    type="radio"
                    name="entrega"
                    :value="opcion.id"
                    class="h-4 w-4 shrink-0 accent-rose-500"
                  />
                  <span class="min-w-0">
                    <span class="block text-sm font-semibold text-ink">
                      {{ opcion.label }}
                    </span>
                    <span class="block text-[11px] text-ink-muted">
                      {{ opcion.descripcion }}
                    </span>
                  </span>
                </label>
              </div>
            </fieldset>

            <!-- Total -->
            <div class="flex items-center justify-between rounded-2xl bg-rose-100/70 px-4 py-3">
              <span class="text-sm font-semibold text-ink-soft">Total estimado</span>
              <span class="text-lg font-bold text-rose-600">
                {{ formatPrice(totalPrecio) }}
              </span>
            </div>

            <!-- CTA -->
            <button
              type="submit"
              :disabled="!items.length"
              class="flex w-full items-center justify-center gap-2 rounded-full bg-wa px-4 py-3.5 text-sm font-bold text-white shadow-lg shadow-wa/25 transition active:scale-[0.98] disabled:opacity-50"
            >
              <svg class="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2a10 10 0 0 0-8.6 15L2 22l5.2-1.4A10 10 0 1 0 12 2zm0 18.2c-1.6 0-3-.4-4.3-1.2l-.3-.2-3.1.8.8-3-.2-.3A8.2 8.2 0 1 1 12 20.2z" />
              </svg>
              Enviar Pedido por WhatsApp
            </button>

            <p class="pb-2 text-center text-[11px] leading-relaxed text-ink-muted">
              El pago y la confirmacion se coordinan por chat.
            </p>
          </form>
        </div>
      </section>
    </Transition>
  </Teleport>
</template>
