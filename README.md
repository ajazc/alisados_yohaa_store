# Alisados Yohaa — WebApp de catálogo y pedidos por WhatsApp

PWA mobile-first (Vue 3 + Vite + Tailwind) para el catálogo de **Alisados Yohaa**.
El carrito arma un mensaje de pedido y lo envía por `wa.me`.

---

## Arquitectura

```
Navegador (Vue/Vite) ── HTTPS + CORS ──► https://ajazc.com.ar/api/...
                                      Django REST Framework + JWT
```

El navegador consulta el catálogo público y se autentica contra la API para
administrar productos. Las credenciales se ingresan en el panel, se envían por
HTTPS al endpoint de login y no se guardan; el JWT queda solo en memoria y se
borra al cerrar el panel. La API debe aplicar permisos de lectura pública y
escritura autenticada; CORS no reemplaza la autorización.

El origen público `VITE_API_BASE_URL` se incluye en el bundle, pero no es un
secreto. Nunca configures usuario, clave ni tokens con prefijo `VITE_`.

### Estructura

```
src/
  App.vue                 Estado: carga, filtro de categoría, carrito
  config/business.js      Datos del negocio editables
  config/categorias.js    Tabs + heurística de categorización
  composables/useCart.js  Carrito reactivo + persistencia en localStorage
  lib/api.js              Cliente HTTP directo para el catálogo
  lib/adminApi.js         Login JWT y operaciones administrativas
  lib/whatsapp.js         Arma el mensaje y la URL de wa.me
  lib/format.js           ARS con Intl
  components/
    AppHeader.vue         Header fijo: avatar, badge, accesos rápidos
    CategoryTabs.vue      Chips scrolleables con contador
    ProductCard.vue       Card + stepper [−] n [+]
    ProductArtwork.vue    Placeholder SVG por categoría
    CartBar.vue           Barra flotante con total
    CheckoutDrawer.vue    Drawer: resumen + formulario + envío

public/                   manifest e íconos PWA
```

---

## Puesta en marcha

```bash
npm install
npm run dev
```

### Variables de entorno

| Variable | Lado | Para qué |
| --- | --- | --- |
| `VITE_API_BASE_URL` | cliente | URL pública de la API Django; por defecto `https://ajazc.com.ar` |
| `VITE_WHATSAPP_NUMBER` | cliente | Destino de los pedidos. Internacional, solo dígitos: `5492966227320` |

La API debe permitir el origen del sitio en `CORS_ALLOWED_ORIGINS`. El endpoint
de catálogo debe permitir `GET` público; las operaciones de administración
requieren JWT.

### Administración del catálogo

El botón **Admin** del encabezado abre las secciones **Editar producto** y
**Nuevo producto**. El panel solicita las credenciales de la API y realiza el
login directamente desde el navegador. La clave se descarta tras iniciar
sesión y el token solo se mantiene en memoria mientras el panel está abierto:

- Crear: `POST /api/productos/`.
- Editar: `PATCH /api/productos/<codigo>/editar/`.
- Foto: archivo JPG, PNG, WebP, AVIF o GIF de hasta 3 MB, enviado como
  `imagen` multipart.

### Iconos

Los iconos PWA y la imagen de Open Graph se generan desde `src/logo.jpg`:

```bash
npm run iconos          # genera public/icons/*, apple-touch-icon y og-cover
node scripts/verificar-iconos.mjs   # valida dimensiones y transparencia
```

El script produce dos variantes por tamaño. La normal recorta el logo a
cuadrado; la `maskable` lo reduce al 80% sobre fondo rosa, porque Android
recorta los bordes al aplicar la máscara y sin ese margen el logo quedaría
cortado. El `apple-touch-icon` va sobre fondo sólido porque iOS no acepta
transparencia en el home screen.

**Si cambiás el logo**, reemplazá `src/logo.jpg` y volvé a correr `npm run
iconos`. Los archivos de `public/` están versionados, así que el build de
producción no necesita `sharp` (que es solo una devDependency).

### WhatsApp

El número de WhatsApp es `5492966227320`,
ambos con valor por defecto en el código. Para cambiarlos:

- **Logo**: reemplazá `src/logo.jpg`. Al estar importado desde `src/`, Vite le
  genera un hash de contenido, así que el caché se invalida solo. Para usar una
  ruta en `public/` en su lugar, poné `avatar: "/mi-logo.png"` en
  `config/business.js`.
- **WhatsApp**: `VITE_WHATSAPP_NUMBER` en formato internacional, solo dígitos,
  sin `+` ni `0` inicial, con el `9` de móvil después del `54`.

---

## Verificación

```bash
node scripts/verify.js
```

Comprueba la lectura pública y normalización del catálogo, la categorización,
el mensaje de pedido y la URL de WhatsApp. Requiere conexión con la API.

```bash
node scripts/verificar-iconos.mjs
```

Valida que los iconos generados tengan las dimensiones que declara el
manifest y que las esquinas de los `maskable` e iOS sean opacas.

---

## Decisiones sobre la API

La API no modela categorías ni imágenes. Lo que hace la app:

- **Categorías**: no existe `/api/categorias/` (`404`) ni campo `categoria`.
  Se derivan del nombre por palabras clave en `config/categorias.js`, editable.
  El **orden importa**: los nombres pueden contener keywords de dos categorías
  (ej. `PEINE DE CORTE LARGO CRBONO` tiene "corte" = servicio y "peine" =
  producto); las keywords de producto se evalúan primero porque el ítem es un
  peine, no un corte.

  Con el catálogo actual: 6 tratamientos, 4 productos, 0 servicios, 0 combos.
  Los tabs de Servicios y Combos aparecen vacíos hasta que se carguen ítems
  que coincidan.

- **Imágenes**: el campo `imagen` no viene en las respuestas (ni como `null`).
  Cuando falta, o si el archivo falla al cargar, se muestra un SVG placeholder
  con degradado nude, distinto según la categoría. Si más adelante la API
  devuelve `imagen`, la card la usa sin cambios.

- **Descripciones**: vienen vacías en los 10 productos. Se sustituye por un
  texto por categoría (`DESCRIPCION_POR_DEFECTO`).

- **Precios**: la API los devuelve como string (`"8000.00"`). Se convierten a
  `number` en el cliente y se formatean con `Intl` en es-AR.

- **Stock**: `cantidad_disponible` acota el carrito. Al llegar al tope el botón
  queda en "Maximo alcanzado".

- **Paginación**: DRF pagina por defecto; el cliente recorre `next` para traer
  el catálogo completo.

---

## Accesibilidad y mobile

- Stepper con `aria-label` en `−` / `+`; tabs con `aria-pressed`.
- El drawer marca `role="dialog"`, `aria-modal`, y bloquea el scroll del body.
- `viewport-fit=cover` + `dvh` para notch y barra de URL móvil.
- El carrito persiste en `localStorage`, con fallback silencioso en modo privado.
- Respetado `prefers-reduced-motion` en las transiciones principales.
