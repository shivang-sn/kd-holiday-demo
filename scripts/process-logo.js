const sharp = require("sharp");
const path = require("path");

const src = "C:\\Users\\Lenovo\\Downloads\\logo.jpg.jpeg";
const outDir = path.join(__dirname, "..", "src", "images", "brand");

async function main() {
  const img = sharp(src);
  const trimmed = img.trim({ threshold: 10 });
  const buffer = await trimmed.png().toBuffer();
  const meta = await sharp(buffer).metadata();
  console.log("Trimmed size:", meta.width, meta.height);

  await sharp(buffer).toFile(path.join(outDir, "logo-full.png"));

  // Header-sized version, transparent-safe padding, height ~64px @2x for retina
  await sharp(buffer)
    .resize({ height: 160 })
    .toFile(path.join(outDir, "logo-header.png"));

  // Footer (on ocean-blue dark bg) — keep as-is since logo has white bg by design (used inside a white pill / white footer badge)
  await sharp(buffer)
    .resize({ height: 200 })
    .toFile(path.join(outDir, "logo-footer.png"));
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
