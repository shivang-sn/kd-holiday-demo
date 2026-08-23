/* Downloads the Instagram reels listed in scripts/instagram-reels-source.json
   into src/images/instagram/ and writes src/_data/instagramReels.json for the
   homepage "Reels From Our Instagram" slider to consume.

   To feature new reels later: edit instagram-reels-source.json with fresh
   {shortCode, url, videoUrl, displayUrl} entries (videoUrl/displayUrl are the
   direct CDN links from an Instagram export — they expire, so re-scrape and
   run this script again rather than reusing old links) and re-run:
     node scripts/generate-instagram-reels.js
*/
const https = require("https");
const fs = require("fs");
const path = require("path");

const sourcePath = path.join(__dirname, "instagram-reels-source.json");
const imagesDir = path.join(__dirname, "..", "src", "images", "instagram");
const dataPath = path.join(__dirname, "..", "src", "_data", "instagramReels.json");

const source = JSON.parse(fs.readFileSync(sourcePath, "utf8"));

function download(url, destPath) {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(destPath);
    https
      .get(url, (res) => {
        if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
          file.close();
          fs.unlinkSync(destPath);
          return download(res.headers.location, destPath).then(resolve, reject);
        }
        if (res.statusCode !== 200) {
          file.close();
          fs.unlinkSync(destPath);
          return reject(new Error(`HTTP ${res.statusCode} for ${url}`));
        }
        res.pipe(file);
        file.on("finish", () => file.close(resolve));
      })
      .on("error", (err) => {
        file.close();
        if (fs.existsSync(destPath)) fs.unlinkSync(destPath);
        reject(err);
      });
  });
}

async function main() {
  fs.mkdirSync(imagesDir, { recursive: true });
  const entries = [];

  for (const reel of source) {
    const videoFile = `reel-${reel.shortCode}.mp4`;
    const thumbFile = `insta-${reel.shortCode}.jpg`;
    const videoDest = path.join(imagesDir, videoFile);
    const thumbDest = path.join(imagesDir, thumbFile);

    console.log("Downloading", reel.shortCode, "...");
    await download(reel.videoUrl, videoDest);
    await download(reel.displayUrl, thumbDest);

    entries.push({
      shortCode: reel.shortCode,
      url: reel.url,
      video: `/images/instagram/${videoFile}`,
      thumb: `/images/instagram/${thumbFile}`,
    });
  }

  fs.writeFileSync(dataPath, JSON.stringify(entries, null, 2) + "\n");
  console.log(`Wrote ${entries.length} reels to ${path.relative(process.cwd(), dataPath)}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
