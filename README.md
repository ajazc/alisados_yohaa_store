# Alisados Yohaa — WebApp de catálogo y pedidos por WhatsApp

PWA mobile-first (Vue 3 + Vite + Tailwind) para el catálogo de **Alisados Yohaa**.
El carrito arma un mensaje de pedido y lo envía por `wa.me`.

---

## Arquitectura

```
Navegador ──► /api/productos (serverless Vercel) ──► https://ajazc.com.ar/api/...
   (Vue)          corre en el SERVIDOR                    Django + DRF + JWT
```

**El navegador nunca habla directo con la API Django.** Es una decisión de
seguridad, no una preferencia:

- La API **no envía headers CORS**, así que un `fetch` desde `*.vercel.app` a
  `ajazc.com.ar` sería bloqueado por el navegador.
- `GET /api/productos/` **exige un JWT**, pese a que el README de `api-ajazc`
  afirma que las lecturas son públicas (verificado: `401` sin token).
- El access token **vence a los 60 minutos**.

Si las credenciales de la API estuvieran embebidas en el bundle, cualquier
visitante podría leerlas y con ese mismo token ejecutar `POST /api/productos/`,
`PATCH /api/productos/<codigo>/editar/` y `DELETE /api/productos/<codigo>/`,
es decir **modificar o borrar el catálogo completo**. Las credenciales viven
solo en variables de entorno del servidor, y no tienen valor por defecto en el
código: si faltan, la función serverless falla con un error explícito en los
logs en vez de usar un fallback hardcodeado.

### Estructura

```
api/
  productos.js            Endpoint serverless: cachea y normaliza
  _lib/apiClient.js       Login JWT + cache en memoria + refresh <5 min
  _lib/products.js        Paginado DRF + normalización de tipos
  _lib/verify.js          Verificación (ver abajo)

src/
  App.vue                 Estado: carga, filtro de categoría, carrito
  config/business.js      Datos del negocio editables
  config/categorias.js    Tabs + heurística de categorización
  composables/useCart.js  Carrito reactivo + persistencia en localStorage
  lib/api.js              Cliente HTTP del navegador
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
cp .env.example .env.local   # completar credenciales
npm run vercel dev           # incluye las funciones serverless
```

### Variables de entorno

| Variable | Lado | Para qué |
| --- | --- | --- |
| `API_BASE_URL` | servidor | Base de la API Django |
| `API_USERNAME` | servidor | Usuario del login |
| `API_PASSWORD` | servidor | Password del login |
| `VITE_WHATSAPP_NUMBER` | cliente | Destino de los pedidos. Internacional, solo dígitos: `5492966227320` |

> **Nunca prefixar con `VITE_` las credenciales de la API.** Toda variable
> `VITE_` se compila dentro del bundle y queda visible para cualquier visitante.

En Vercel: *Project → Settings → Environment Variables*.

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
Vercel no necesita `sharp` (que es solo una devDependency).

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
node --env-file-if-exists=.env.local api/_lib/verify.js
```

Ejecuta 25 checks contra la API real: tipos normalizados, cache del token,
categorización por heurística, contenido del mensaje de WhatsApp y encoding de
la URL de `wa.me`. Requiere `API_USERNAME` / `API_PASSWORD` en el entorno.

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
  `number` en el serverless y se formatean con `Intl` en es-AR.

- **Stock**: `cantidad_disponible` acota el carrito. Al llegar al tope el botón
  queda en "Maximo alcanzado".

- **Paginación**: DRF pagina por defecto; el serverless recorre `next` para
  traer el catálogo completo en una sola respuesta.

---

## Accesibilidad y mobile

- Stepper con `aria-label` en `−` / `+`; tabs con `aria-pressed`.
- El drawer marca `role="dialog"`, `aria-modal`, y bloquea el scroll del body.
- `viewport-fit=cover` + `dvh` para notch y barra de URL móvil.
- El carrito persiste en `localStorage`, con fallback silencioso en modo privado.
- Respetado `prefers-reduced-motion` en las transiciones principales.
