/**
 * Genera los iconos PWA y la imagen de Open Graph desde src/logo.jpg.
 *
 *   npm run iconos
 *
 * Se ejecuta a mano cuando cambia el logo. Los archivos generados quedan
 * versionados en public/, asi que el build de produccion no necesita sharp.
 */

import sharp from "sharp";
import { mkdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const RAIZ = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const FUENTE = path.join(RAIZ, "src", "logo.jpg");
const ICONOS_DIR = path.join(RAIZ, "public", "icons");
const OG_PATH = path.join(RAIZ, "public", "og-cover.png");

// Rosa soft del branding (#E8A0BF): fondo de los iconos donde el logo
// necesita un fondo y no lo trae.
const FONDO = "#E8A0BF";

async function main() {
  const metadata = await sharp(FUENTE).metadata();
  console.log(`Logo fuente: ${metadata.width}x${metadata.height} ${metadata.format}`);

  await mkdir(ICONOS_DIR, { recursive: true });

  // --- Iconos "any" y "maskable" ------------------------------------------
  // El icono estandar se recorta a cuadrado con cover, sin distortions.
  // El maskable lleva el logo al 80% centrado sobre fondo rosa: Android
  // recorta los bordes al aplicar la mascara y sin este margen el logo
  // quedaria cortado.
  for (const size of [192, 512]) {
    await sharp(FUENTE)
      .resize(size, size, { fit: "cover", position: "centre" })
      .png({ quality: 90, compressionLevel: 9 })
      .toFile(path.join(ICONOS_DIR, `icon-${size}.png`));
    console.log(`  icons/icon-${size}.png`);
  }

  const MARGEN = 0.1; // 10% de aire por lado -> logo al 80% del lienzo
  for (const size of [192, 512]) {
    const interior = Math.round(size * (1 - MARGEN * 2));
    const logo = await sharp(FUENTE)
      .resize(interior, interior, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } })
      .png()
      .toBuffer();

    await sharp({
      create: {
        width: size,
        height: size,
        channels: 4,
        background: FONDO,
      },
    })
      .composite([{ input: logo, gravity: "centre" }])
      .png({ quality: 90, compressionLevel: 9 })
      .toFile(path.join(ICONOS_DIR, `maskable-${size}.png`));
    console.log(`  icons/maskable-${size}.png`);
  }

  // --- Apple touch icon ----------------------------------------------------
  // iOS no acepta transparencia en el home screen: se compone sobre rosa.
  {
    const interior = 180;
    const logo = await sharp(FUENTE)
      .resize(interior, interior, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } })
      .png()
      .toBuffer();

    await sharp({ create: { width: 180, height: 180, channels: 4, background: FONDO } })
      .composite([{ input: logo, gravity: "centre" }])
      .png()
      .toFile(path.join(RAIZ, "public", "apple-touch-icon.png"));
    console.log("  apple-touch-icon.png");
  }

  // --- Open Graph ----------------------------------------------------------
  // 1200x630: la vista previa que se ve al compartir el link en redes.
  {
    const ancho = 1200;
    const alto = 630;
    const logoAlto = 300;
    const logo = await sharp(FUENTE)
      .resize(logoAlto, logoAlto, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } })
      .png()
      .toBuffer();

    const svg = `<svg width="${ancho}" height="${alto}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stop-color="#FDF5F8"/>
          <stop offset="100%" stop-color="#EFB6D0"/>
        </linearGradient>
      </defs>
      <rect width="${ancho}" height="${alto}" fill="url(#bg)"/>
      <text x="${ancho / 2}" y="${alto / 2 + 30}" text-anchor="middle"
        font-family="Segoe UI, Helvetica, Arial, sans-serif" font-size="86"
        font-weight="700" fill="#1A1A1A">Alisados Yohaa</text>
      <text x="${ancho / 2}" y="${alto / 2 + 105}" text-anchor="middle"
        font-family="Segoe UI, Helvetica, Arial, sans-serif" font-size="34"
        fill="#4A4A4A">Especialistas en Alisados y Cuidado Capilar</text>
      <rect x="${ancho / 2 - 150}" y="${alto / 2 + 150}" width="300" height="56" rx="28" fill="#25D366"/>
      <text x="${ancho / 2}" y="${alto / 2 + 188}" text-anchor="middle"
        font-family="Segoe UI, Helvetica, Arial, sans-serif" font-size="26"
        font-weight="600" fill="#FFFFFF">Pedidos por WhatsApp</text>
    </svg>`;

    await sharp(Buffer.from(svg))
      .composite([{ input: logo, left: Math.round((ancho - logoAlto) / 2), top: 60 }])
      .png({ compressionLevel: 9 })
      .toFile(OG_PATH);
    console.log("  og-cover.png");
  }

  // --- Reporte de tamaños --------------------------------------------------
  const { stat } = await import("node:fs/promises");
  console.log("\nArchivos generados:");
  const generados = [
    ["icons/icon-192.png", path.join(ICONOS_DIR, "icon-192.png")],
    ["icons/icon-512.png", path.join(ICONOS_DIR, "icon-512.png")],
    ["icons/maskable-192.png", path.join(ICONOS_DIR, "maskable-192.png")],
    ["icons/maskable-512.png", path.join(ICONOS_DIR, "maskable-512.png")],
    ["apple-touch-icon.png", path.join(RAIZ, "public", "apple-touch-icon.png")],
    ["og-cover.png", OG_PATH],
  ];
  for (const [nombre, ruta] of generados) {
    const { size } = await stat(ruta);
    console.log(`  public/${nombre} — ${(size / 1024).toFixed(1)} kB`);
  }
}

main().catch((error) => {
  console.error("Error generando iconos:", error.message);
  process.exit(1);
});
