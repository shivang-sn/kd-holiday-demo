/**
 * Post-build step: minifies the site's own hand-written CSS/JS in _site
 * (not third-party vendor files, which ship already-minified). Run after
 * `eleventy` via `npm run build` — never during `eleventy --serve`, so the
 * dev server keeps serving readable, unminified source for debugging.
 */
const fs = require("fs");
const path = require("path");
const CleanCSS = require("clean-css");
const { minify } = require("terser");

const SITE_DIR = path.join(__dirname, "..", "_site");

const CSS_FILES = ["css/tokens.css", "css/base.css", "css/components.css"];
const JS_FILES = ["js/main.js"];

async function run() {
  var totalBefore = 0;
  var totalAfter = 0;

  for (const rel of CSS_FILES) {
    const file = path.join(SITE_DIR, rel);
    if (!fs.existsSync(file)) continue;
    const source = fs.readFileSync(file, "utf8");
    const result = new CleanCSS({ level: 2 }).minify(source);
    if (result.errors.length) {
      console.error("CSS minify errors in " + rel + ":", result.errors);
      continue;
    }
    fs.writeFileSync(file, result.styles);
    totalBefore += source.length;
    totalAfter += result.styles.length;
    console.log("minified " + rel + ": " + source.length + " -> " + result.styles.length + " bytes");
  }

  for (const rel of JS_FILES) {
    const file = path.join(SITE_DIR, rel);
    if (!fs.existsSync(file)) continue;
    const source = fs.readFileSync(file, "utf8");
    const result = await minify(source, { compress: true, mangle: true });
    if (result.error) {
      console.error("JS minify error in " + rel + ":", result.error);
      continue;
    }
    fs.writeFileSync(file, result.code);
    totalBefore += source.length;
    totalAfter += result.code.length;
    console.log("minified " + rel + ": " + source.length + " -> " + result.code.length + " bytes");
  }

  console.log("Total: " + totalBefore + " -> " + totalAfter + " bytes (" + Math.round((1 - totalAfter / totalBefore) * 100) + "% smaller)");
}

run().catch(function (err) {
  console.error(err);
  process.exit(1);
});
