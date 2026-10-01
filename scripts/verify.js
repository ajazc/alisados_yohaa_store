import assert from "node:assert/strict";
import { fetchCatalogo } from "../src/lib/api.js";
import { categorizarProducto } from "../src/config/categorias.js";
import { buildPedidoMessage, buildWhatsappUrl } from "../src/lib/whatsapp.js";

let fallos = 0;

function check(nombre, fn) {
  try {
    fn();
    console.log(`  ok  ${nombre}`);
  } catch (error) {
    fallos += 1;
    console.error(`  FAIL ${nombre}\n       ${error.message}`);
  }
}

console.log("\n1. Catalogo publico de la API");
let productos = [];
try {
  productos = await fetchCatalogo({ fresh: true });
  check("trae productos", () => assert.ok(productos.length > 0, "lista vacia"));
  check("precio normalizado a number", () =>
    assert.equal(typeof productos[0].precio, "number")
  );
  check("stock normalizado a number", () =>
    assert.equal(typeof productos[0].cantidadDisponible, "number")
  );
  check("codigo normalizado a string", () =>
    assert.equal(typeof productos[0].codigo, "string")
  );
  check("imagen es null o URL absoluta", () =>
    productos.forEach((producto) =>
      assert.ok(
        producto.imagen === null || /^https?:\/\//.test(producto.imagen),
        `imagen invalida: ${producto.imagen}`
      )
    )
  );
} catch (error) {
  fallos += 1;
  console.error(`  FAIL lectura de API\n       ${error.message}`);
}

console.log("\n2. Categorizacion por heuristica");
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
check("COMBO -> combos", () =>
  assert.equal(categorizarProducto("COMBO ALISADO + SHAMPOO"), "combos")
);
check("desconocido cae en productos", () =>
  assert.equal(categorizarProducto("XYZ DESCONOCIDO 123"), "productos")
);

console.log("\n3. Mensaje y URL de WhatsApp");
const mensaje = buildPedidoMessage({
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
const mensajeNormalizado = mensaje.replace(/\u00a0/g, "");

check("formatea moneda", () => assert.match(mensaje, /\$[\u00a0 ]3\.000/));
check("usa nombre de presentacion", () => {
  assert.match(mensajeNormalizado, /1\. Ampollas Caviar/);
  assert.doesNotMatch(mensajeNormalizado, /AMPOLLAS CAVIAR/);
});
check("calcula subtotal", () =>
  assert.match(mensajeNormalizado, /2 x \$3\.000 = \*\$6\.000\*/)
);
check("incluye total", () =>
  assert.match(mensajeNormalizado, /\*Total: \$51\.000\*/)
);
check("incluye datos del cliente", () =>
  assert.match(mensajeNormalizado, /\*Nombre:\* Maria Gomez/) &&
  assert.match(mensajeNormalizado, /\*Telefono:\* 11 1234 5678/)
);

const url = buildWhatsappUrl({
  items: [{ nombre: "Shampoo", nombrePresentacion: "Shampoo", precio: 5500, cantidad: 1 }],
  cliente: { nombre: "Ana", telefono: "298 555 1111" },
  entregaId: "retiro",
  total: 5500,
  unidades: 1,
});

check("genera URL wa.me", () =>
  assert.match(url, /^https:\/\/wa\.me\/5492966227320\?text=/)
);
check("codifica el mensaje", () => {
  const encodedMessage = url.split("?text=")[1];
  assert.ok(!/[ \n]/.test(encodedMessage));
  assert.match(decodeURIComponent(encodedMessage), /\*Entrega:\* Retiro por local/);
});

console.log(fallos === 0 ? "\nTodo OK\n" : `\n${fallos} fallo(s)\n`);
process.exitCode = fallos === 0 ? 0 : 1;