/**
 * Verificacion local de la capa de datos y del formateo del pedido.
 * Corre con: node --env-file=.env.local api/_lib/verify.js
 */

import assert from "node:assert/strict";
import { fetchAllProducts } from "./products.js";
import { categorizarProducto } from "../../src/config/categorias.js";
import { buildPedidoMessage, buildWhatsappUrl } from "../../src/lib/whatsapp.js";

let fallos = 0;
function check(nombre, fn) {
  try {
    fn();
    console.log(`  ok  ${nombre}`);
  } catch (e) {
    fallos += 1;
    console.error(`  FAIL ${nombre}\n       ${e.message}`);
  }
}

console.log("\n1. Login + lectura de la API");
const productos = await fetchAllProducts();

check("trae productos", () => assert.ok(productos.length > 0, "lista vacia"));
check("precio es number, no string", () =>
  assert.equal(typeof productos[0].precio, "number")
);
check("stock es number", () =>
  assert.equal(typeof productos[0].cantidadDisponible, "number")
);
check("codigo es string", () => assert.equal(typeof productos[0].codigo, "string"));
check("imagen es null o URL absoluta", () =>
  productos.forEach((p) =>
    assert.ok(
      p.imagen === null || /^https?:\/\//.test(p.imagen),
      `imagen invalida: ${p.imagen}`
    )
  )
);

console.log("\n2. Cache de token (no debe reloguear en la 2da llamada)");
const t0 = Date.now();
await fetchAllProducts();
const primera = Date.now() - t0;
assert.ok(primera < 1500, `2da llamada tardo ${primera}ms (esperaba cache)`);
console.log(`  ok  2da llamada en ${primera}ms (token reusado)`);

console.log("\n3. Categorizacion por heuristica");
check("AMPOLLAS -> tratamientos", () =>
  assert.equal(categorizarProducto("AMPOLLAS CAVIAR"), "tratamientos")
);
check("CREMA -> tratamientos", () =>
  assert.equal(categorizarProducto("CREMAS NEGRAS BTX"), "tratamientos")
);
check("SERUM -> tratamientos", () =>
  assert.equal(categorizarProducto("SERUM ELIXIR OIL ARGAN"), "tratamientos")
);
check("SHAMPOO -> productos", () =>
  assert.equal(categorizarProducto("SHAMPOO NEGRO BTX FRILAYP"), "productos")
);
check("PEINE -> productos", () =>
  assert.equal(categorizarProducto("PEINE DE CORTE LARGO CRBONO"), "productos")
);
check("ALISADO -> servicios", () =>
  assert.equal(categorizarProducto("ALISADO KERATINA"), "servicios")
);
check("COMBO -> combos (prioridad sobre servicios)", () =>
  assert.equal(categorizarProducto("COMBO ALISADO + SHAMPOO"), "combos")
);
check("desconocido cae en productos", () =>
  assert.equal(categorizarProducto("XYZ DESCONOCIDO 123"), "productos")
);

console.log("\n4. Mensaje de WhatsApp");
const mensajeCrudo = buildPedidoMessage({
  items: [
    {
      nombre: "AMPOLLAS CAVIAR",
      nombrePresentacion: "Ampollas Caviar",
      precio: 3000,
      cantidad: 2,
      categoria: "tratamientos",
    },
    {
      nombre: "ALISADO KERATINA",
      nombrePresentacion: "Alisado Keratina",
      precio: 45000,
      cantidad: 1,
      categoria: "servicios",
    },
  ],
  cliente: { nombre: "Maria Gomez", telefono: "11 1234 5678" },
  entregaId: "turno",
  total: 51000,
  unidades: 3,
});

// Intl "es-AR" separa el simbolo con espacio duro (U+00A0). Se normaliza para
// poder comparar contra patrones legibles.
const mensaje = mensajeCrudo.replace(/\u00a0/g, "");

check("el mensaje crudo usa el formato de moneda", () =>
  assert.match(mensajeCrudo, /\$[\u00a0 ]3\.000/)
);
check("usa el nombre presentacion, no el de la API en mayusculas", () => {
  assert.match(mensaje, /1\. Ampollas Caviar/);
  assert.doesNotMatch(mensaje, /AMPOLLAS CAVIAR/);
});
check("calcula el subtotal del item", () => assert.match(mensaje, /2 x \$3\.000 = \*\$6\.000\*/));
check("incluye el total", () => assert.match(mensaje, /\*Total: \$51\.000\*/));
check("marca el turno", () => assert.match(mensaje, /\(coordinar turno\)/));
check("incluye el tipo de entrega", () => assert.match(mensaje, /\*Entrega:\* Agendar turno/));
check("incluye nombre y telefono", () =>
  assert.match(mensaje, /\*Nombre:\* Maria Gomez/) && assert.match(mensaje, /\*Telefono:\* 11 1234 5678/)
);

console.log("\n5. URL de WhatsApp");
const url = buildWhatsappUrl({
  items: [{ nombre: "Shampoo", nombrePresentacion: "Shampoo", precio: 5500, cantidad: 1 }],
  cliente: { nombre: "Ana", telefono: "298 555 1111" },
  entregaId: "retiro",
  total: 5500,
  unidades: 1,
});

check("arranca con wa.me/ y el numero internacional", () =>
  assert.match(url, /^https:\/\/wa\.me\/5492966227320\?text=/)
);
check("el mensaje va codificado (sin espacios crudos ni saltos)", () =>
  assert.ok(!/[ \n]/.test(url.split("?text=")[1]), "mensaje no encodeURIComponent")
);
check("el mensaje se decodifica igual al original", () => {
  const decodificado = decodeURIComponent(url.split("?text=")[1]);
  assert.match(decodificado, /1\. Shampoo/);
  assert.match(decodificado, /\*Entrega:\* Retiro por local/);
});

console.log(fallos === 0 ? "\nTodo OK\n" : `\n${fallos} fallo(s)\n`);
process.exit(fallos === 0 ? 0 : 1);
