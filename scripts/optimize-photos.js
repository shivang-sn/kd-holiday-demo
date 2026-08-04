const sharp = require("sharp");
const fs = require("fs");
const path = require("path");

const dir = path.join(__dirname, "..", "src", "images", "photos");
const files = fs.readdirSync(dir).filter((f) => /\.(jpe?g)$/i.test(f));

async function main() {
  for (const file of files) {
    const full = path.join(dir, file);
    const buffer = fs.readFileSync(full);
    const out = await sharp(buffer)
      .resize({ width: 1600, withoutEnlargement: true })
      .jpeg({ quality: 76, mozjpeg: true })
      .toBuffer();
    fs.writeFileSync(full, out);
    console.log(file, "->", (out.length / 1024).toFixed(0) + "KB");
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
