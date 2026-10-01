<script setup>
import { computed, onBeforeUnmount, reactive, ref, watch } from "vue";
import {
  cerrarSesionApi,
  guardarProductoApi,
  iniciarSesionApi,
} from "../lib/adminApi.js";

const props = defineProps({
  productos: { type: Array, default: () => [] },
});

const emit = defineEmits(["close", "updated"]);

const MAX_IMAGE_BYTES = 3 * 1024 * 1024;
const usuario = ref("");
const clave = ref("");
const autenticado = ref(false);
const ocupada = ref(false);
const pestana = ref("editar");
const codigoSeleccionado = ref("");
const fotoEdicion = ref(null);
const fotoNuevo = ref(null);
const error = ref("");
const aviso = ref("");
const productosOrdenados = computed(() =>
  [...props.productos].sort((a, b) => a.nombre.localeCompare(b.nombre))
);

const productoEdicion = computed(
  () => props.productos.find((producto) => producto.codigo === codigoSeleccionado.value) ?? null
);

const formularioEdicion = reactive({
  codigo: "",
  nombre: "",
  descripcion: "",
  precio: "",
  cantidad_disponible: "",
});

const formularioNuevo = reactive({
  codigo: "",
  nombre: "",
  descripcion: "",
  precio: "",
  cantidad_disponible: "0",
});

watch(
  () => props.productos,
  (productos) => {
    if (!codigoSeleccionado.value && productos.length) {
      codigoSeleccionado.value = productos[0].codigo;
    }
  },
  { immediate: true }
);

watch(productoEdicion, (producto) => {
  if (!producto) return;
  Object.assign(formularioEdicion, {
    codigo: producto.codigo,
    nombre: producto.nombre,
    descripcion: producto.descripcion,
    precio: String(producto.precio),
    cantidad_disponible: String(producto.cantidadDisponible),
  });
  fotoEdicion.value = null;
}, { immediate: true });

async function validarAcceso() {
  error.value = "";
  aviso.value = "";
  ocupada.value = true;
  try {
    await iniciarSesionApi(usuario.value, clave.value);
    autenticado.value = true;
    usuario.value = "";
    clave.value = "";
  } catch (cause) {
    error.value = cause.message;
    cerrarSesionApi();
  } finally {
    ocupada.value = false;
  }
}

function seleccionarFoto(event, destino) {
  const file = event.target.files?.[0] ?? null;
  error.value = "";
  aviso.value = "";

  if (file && file.size > MAX_IMAGE_BYTES) {
    event.target.value = "";
    destino.value = null;
    error.value = "La foto debe pesar menos de 3 MB.";
    return;
  }

  destino.value = file;
}

function seleccionarFotoEdicion(event) {
  seleccionarFoto(event, fotoEdicion);
}

function seleccionarFotoNuevo(event) {
  seleccionarFoto(event, fotoNuevo);
}

async function guardarProducto(action) {
  error.value = "";
  aviso.value = "";
  ocupada.value = true;

  try {
    const esEdicion = action === "editar";
    const form = esEdicion ? formularioEdicion : formularioNuevo;
    const foto = esEdicion ? fotoEdicion.value : fotoNuevo.value;
    const product = {
      codigo: form.codigo.trim(),
      nombre: form.nombre.trim(),
      descripcion: form.descripcion.trim(),
      precio: Number(form.precio),
      cantidad_disponible: Number(form.cantidad_disponible),
    };
    await guardarProductoApi(
      action,
      product,
      foto,
      esEdicion ? codigoSeleccionado.value : null
    );

    aviso.value = esEdicion ? "Producto actualizado." : "Producto agregado.";
    if (esEdicion) fotoEdicion.value = null;
    else {
      fotoNuevo.value = null;
      Object.assign(formularioNuevo, {
        codigo: "",
        nombre: "",
        descripcion: "",
        precio: "",
        cantidad_disponible: "0",
      });
    }
    emit("updated");
  } catch (cause) {
    error.value = cause.message;
    if (cause.status === 401) {
      cerrarSesionApi();
      autenticado.value = false;
      usuario.value = "";
      clave.value = "";
    }
  } finally {
    ocupada.value = false;
  }
}

function cerrarSesion() {
  cerrarSesionApi();
  autenticado.value = false;
  usuario.value = "";
  clave.value = "";
  error.value = "";
  aviso.value = "";
}

onBeforeUnmount(cerrarSesionApi);
</script>

<template>
  <section
    class="fixed inset-0 z-50 overflow-y-auto bg-canvas text-ink"
    role="dialog"
    aria-modal="true"
    aria-labelledby="admin-title"
  >
    <div class="mx-auto min-h-dvh max-w-2xl px-4 pb-10">
      <header class="sticky top-0 z-10 -mx-4 flex items-center justify-between border-b border-rose-100 bg-canvas/95 px-4 py-3 backdrop-blur">
        <div>
          <p class="text-[11px] font-semibold uppercase tracking-wider text-rose-600">Alisados Yohaa</p>
          <h2 id="admin-title" class="text-lg font-bold">Administración</h2>
        </div>
        <div class="flex items-center gap-2">
          <button
            v-if="autenticado"
            type="button"
            class="rounded-full px-3 py-2 text-xs font-semibold text-ink-soft hover:bg-rose-50"
            @click="cerrarSesion"
          >
            Salir
          </button>
          <button
            type="button"
            aria-label="Cerrar administración"
            title="Cerrar administración"
            class="flex h-10 w-10 items-center justify-center rounded-full border border-rose-200 bg-surface text-ink-soft"
            @click="emit('close')"
          >
            <svg class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
              <path d="m6 6 12 12M18 6 6 18" />
            </svg>
          </button>
        </div>
      </header>

      <div v-if="!autenticado" class="mx-auto max-w-sm py-12">
        <div class="mb-6 flex h-12 w-12 items-center justify-center rounded-full bg-rose-100 text-rose-700">
          <svg class="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <rect x="4" y="10" width="16" height="11" rx="2" />
            <path d="M8 10V7a4 4 0 0 1 8 0v3" />
          </svg>
        </div>
        <h3 class="text-xl font-bold">Ingresá a tu cuenta de la API</h3>
        <form class="mt-6 space-y-4" autocomplete="off" @submit.prevent="validarAcceso">
          <label class="block text-sm font-semibold" for="admin-usuario">
            Usuario
            <input
              id="admin-usuario"
              v-model="usuario"
              name="admin-usuario"
              autocomplete="off"
              required
              class="mt-1.5 block min-h-11 w-full rounded-lg border border-rose-200 bg-white px-3 text-sm font-normal outline-none focus:border-rose-400"
            />
          </label>
          <label class="block text-sm font-semibold" for="admin-clave">
            Clave
            <input
              id="admin-clave"
              v-model="clave"
              name="admin-clave"
              type="password"
              autocomplete="new-password"
              required
              class="mt-1.5 block min-h-11 w-full rounded-lg border border-rose-200 bg-white px-3 text-sm font-normal outline-none focus:border-rose-400"
            />
          </label>
          <p v-if="error" role="alert" class="text-sm text-red-700">{{ error }}</p>
          <button
            type="submit"
            :disabled="ocupada"
            class="flex min-h-11 w-full items-center justify-center gap-2 rounded-lg bg-rose-500 px-4 text-sm font-bold text-white transition hover:bg-rose-600 disabled:cursor-wait disabled:opacity-60"
          >
            {{ ocupada ? "Verificando..." : "Ingresar" }}
          </button>
        </form>
      </div>

      <div v-else class="py-6">
        <div class="grid grid-cols-2 gap-2 rounded-xl bg-rose-100 p-1" aria-label="Secciones de productos">
          <button
            type="button"
            :aria-pressed="pestana === 'editar'"
            class="min-h-11 rounded-lg px-3 text-sm font-bold transition"
            :class="pestana === 'editar' ? 'bg-white text-ink shadow-sm' : 'text-ink-soft'"
            @click="pestana = 'editar'; error = ''; aviso = ''"
          >
            Editar producto
          </button>
          <button
            type="button"
            :aria-pressed="pestana === 'crear'"
            class="min-h-11 rounded-lg px-3 text-sm font-bold transition"
            :class="pestana === 'crear' ? 'bg-white text-ink shadow-sm' : 'text-ink-soft'"
            @click="pestana = 'crear'; error = ''; aviso = ''"
          >
            Nuevo producto
          </button>
        </div>

        <form v-if="pestana === 'editar'" class="mt-6 space-y-4" @submit.prevent="guardarProducto('editar')">
          <label class="block text-sm font-semibold" for="producto-existente">
            Producto
            <select
              id="producto-existente"
              v-model="codigoSeleccionado"
              required
              class="mt-1.5 block min-h-11 w-full rounded-lg border border-rose-200 bg-white px-3 text-sm font-normal"
            >
              <option v-for="producto in productosOrdenados" :key="producto.codigo" :value="producto.codigo">
                {{ producto.nombre }} ({{ producto.codigo }})
              </option>
            </select>
          </label>

          <p v-if="!productosOrdenados.length" class="rounded-lg bg-rose-50 p-3 text-sm text-ink-soft">
            No se encontraron productos para editar.
          </p>

          <template v-if="productoEdicion">
            <div class="grid gap-4 sm:grid-cols-2">
              <label class="block text-sm font-semibold" for="editar-codigo">
                Código
                <input id="editar-codigo" v-model="formularioEdicion.codigo" required class="admin-input" />
              </label>
              <label class="block text-sm font-semibold" for="editar-nombre">
                Nombre
                <input id="editar-nombre" v-model="formularioEdicion.nombre" required class="admin-input" />
              </label>
            </div>
            <label class="block text-sm font-semibold" for="editar-descripcion">
              Descripción
              <textarea id="editar-descripcion" v-model="formularioEdicion.descripcion" rows="4" class="admin-input resize-y" />
            </label>
            <div class="grid gap-4 sm:grid-cols-2">
              <label class="block text-sm font-semibold" for="editar-precio">
                Precio
                <input id="editar-precio" v-model="formularioEdicion.precio" type="number" min="0" step="0.01" required class="admin-input" />
              </label>
              <label class="block text-sm font-semibold" for="editar-cantidad">
                Cantidad disponible
                <input id="editar-cantidad" v-model="formularioEdicion.cantidad_disponible" type="number" min="0" step="1" required class="admin-input" />
              </label>
            </div>
            <label class="block text-sm font-semibold" for="editar-foto">
              Foto del producto
              <span v-if="productoEdicion.imagen" class="mt-2 flex items-center gap-3 font-normal text-ink-muted">
                <img :src="productoEdicion.imagen" :alt="productoEdicion.nombre" class="h-14 w-14 rounded-md border border-rose-100 bg-white object-cover" />
                Foto actual
              </span>
              <input id="editar-foto" type="file" accept="image/jpeg,image/png,image/webp,image/avif,image/gif" class="admin-input file:mr-3 file:rounded-md file:border-0 file:bg-rose-100 file:px-3 file:py-1.5 file:text-xs file:font-semibold file:text-rose-800" @change="seleccionarFotoEdicion" />
              <span v-if="fotoEdicion" class="mt-1 block text-xs font-normal text-ink-muted">{{ fotoEdicion.name }}</span>
            </label>
          </template>

          <p v-if="error" role="alert" class="text-sm text-red-700">{{ error }}</p>
          <p v-if="aviso" role="status" class="text-sm font-semibold text-green-800">{{ aviso }}</p>
          <button
            type="submit"
            :disabled="ocupada || !productoEdicion"
            class="min-h-11 w-full rounded-lg bg-rose-500 px-4 text-sm font-bold text-white transition hover:bg-rose-600 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {{ ocupada ? "Guardando..." : "Guardar cambios" }}
          </button>
        </form>

        <form v-else class="mt-6 space-y-4" @submit.prevent="guardarProducto('crear')">
          <div class="grid gap-4 sm:grid-cols-2">
            <label class="block text-sm font-semibold" for="nuevo-codigo">
              Código
              <input id="nuevo-codigo" v-model="formularioNuevo.codigo" required class="admin-input" />
            </label>
            <label class="block text-sm font-semibold" for="nuevo-nombre">
              Nombre
              <input id="nuevo-nombre" v-model="formularioNuevo.nombre" required class="admin-input" />
            </label>
          </div>
          <label class="block text-sm font-semibold" for="nuevo-descripcion">
            Descripción
            <textarea id="nuevo-descripcion" v-model="formularioNuevo.descripcion" rows="4" class="admin-input resize-y" />
          </label>
          <div class="grid gap-4 sm:grid-cols-2">
            <label class="block text-sm font-semibold" for="nuevo-precio">
              Precio
              <input id="nuevo-precio" v-model="formularioNuevo.precio" type="number" min="0" step="0.01" required class="admin-input" />
            </label>
            <label class="block text-sm font-semibold" for="nuevo-cantidad">
              Cantidad disponible
              <input id="nuevo-cantidad" v-model="formularioNuevo.cantidad_disponible" type="number" min="0" step="1" required class="admin-input" />
            </label>
          </div>
          <label class="block text-sm font-semibold" for="nuevo-foto">
            Foto del producto
            <input id="nuevo-foto" type="file" accept="image/jpeg,image/png,image/webp,image/avif,image/gif" class="admin-input file:mr-3 file:rounded-md file:border-0 file:bg-rose-100 file:px-3 file:py-1.5 file:text-xs file:font-semibold file:text-rose-800" @change="seleccionarFotoNuevo" />
            <span v-if="fotoNuevo" class="mt-1 block text-xs font-normal text-ink-muted">{{ fotoNuevo.name }}</span>
          </label>
          <p v-if="error" role="alert" class="text-sm text-red-700">{{ error }}</p>
          <p v-if="aviso" role="status" class="text-sm font-semibold text-green-800">{{ aviso }}</p>
          <button
            type="submit"
            :disabled="ocupada"
            class="min-h-11 w-full rounded-lg bg-rose-500 px-4 text-sm font-bold text-white transition hover:bg-rose-600 disabled:cursor-wait disabled:opacity-50"
          >
            {{ ocupada ? "Guardando..." : "Agregar producto" }}
          </button>
        </form>
      </div>
    </div>
  </section>
</template>