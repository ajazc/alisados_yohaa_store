/**
 * Verifica dimensiones y transparencia de los iconos generados.
 * Corre con: node scripts/verificar-iconos.mjs
 */
import sharp from "sharp";
import path from "node:path";
import { fileURLToPath } from "node:url";

const PUBLIC = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "public");

// [archivo, ancho esperado, alto esperado]
const ESPERADOS = [
  ["icons/icon-192.png", 192, 192],
  ["icons/icon-512.png", 512, 512],
  ["icons/maskable-192.png", 192, 192],
  ["icons/maskable-512.png", 512, 512],
  ["apple-touch-icon.png", 180, 180],
  ["og-cover.png", 1200, 630],
];

let fallos = 0;

for (const [archivo, w, h] of ESPERADOS) {
  const ruta = path.join(PUBLIC, archivo);
  const meta = await sharp(ruta).metadata();
  const okDim = meta.width === w && meta.height === h;

  // Rango real del canal alfa: [min, max] con valores 0..255
  const { data, info } = await sharp(ruta).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  let minA = 255;
  let maxA = 0;
  for (let i = 3; i < data.length; i += info.channels) {
    if (data[i] < minA) minA = data[i];
    if (data[i] > maxA) maxA = data[i];
  }

  if (!okDim) fallos++;
  console.log(
    `${okDim ? "  ok " : "  FAIL"} ${archivo.padEnd(24)} ${meta.width}x${meta.height} ` +
      `${meta.format} alfa[${minA}..${maxA}]${meta.hasAlpha ? "" : " (opaco)"}`
  );
}

// El icono estandar y el apple DEBEN conservar la transparencia del logo
// (maxA 255 y minA bajo = hay zonas transparentes).
// Los maskable y apple NO pueden ser transparentes en los bordes: iOS y Android
// recortan, y un borde transparente se ve negro en el home screen.
console.log("");
for (const archivo of ["icons/maskable-512.png", "apple-touch-icon.png"]) {
  const ruta = path.join(PUBLIC, archivo);
  const { data, info } = await sharp(ruta).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  // muestrea las 4 esquinas
  const esquina = (x, y) => data[(y * info.width + x) * info.channels + 3];
  const corners = [esquina(1, 1), esquina(info.width - 2, 1), esquina(1, info.height - 2), esquina(info.width - 2, info.height - 2)];
  const opacas = corners.every((a) => a === 255);
  if (!opacas) fallos++;
  console.log(`${opacas ? "  ok " : "  FAIL"} ${archivo.padEnd(24)} esquinas opacas (esperado en maskable/iOS)`);
}

console.log(fallos === 0 ? "\nIconos OK\n" : `\n${fallos} fallo(s)\n`);
process.exit(fallos === 0 ? 0 : 1);
