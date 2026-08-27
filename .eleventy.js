const fs = require("fs");
const path = require("path");

module.exports = function (eleventyConfig) {
  // Static passthrough
  eleventyConfig.addPassthroughCopy("src/css");
  eleventyConfig.addPassthroughCopy("src/js");
  eleventyConfig.addPassthroughCopy("src/images");
  eleventyConfig.addPassthroughCopy("src/pdfs");
  eleventyConfig.addPassthroughCopy("src/robots.txt");

  // Inlines an SVG file's raw markup at build time (relative to src/), so
  // its paths can be targeted by id/class and animated with JS — unlike
  // an <img src="...">, which renders in an isolated, unreachable document.
  eleventyConfig.addShortcode("inlineSvg", function (relPath) {
    return fs.readFileSync(path.join(__dirname, "src", relPath), "utf8");
  });

  // Currency filter — renders a clear TODO instead of guessing a number
  eleventyConfig.addFilter("currency", function (value) {
    if (value === null || value === undefined || value === "") return "Price on request";
    return "₹" + Number(value).toLocaleString("en-IN");
  });

  eleventyConfig.addFilter("whatsappLink", function (phone, message) {
    const digits = String(phone || "").replace(/[^\d]/g, "");
    const text = message ? `?text=${encodeURIComponent(message)}` : "";
    return `https://wa.me/${digits}${text}`;
  });

  eleventyConfig.addFilter("telLink", function (phone) {
    return `tel:${String(phone || "").replace(/[^\d+]/g, "")}`;
  });

  eleventyConfig.addFilter("slugTag", function (value) {
    return String(value || "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
  });

  eleventyConfig.addFilter("json", function (value) {
    return JSON.stringify(value);
  });

  // Destinations collection, alphabetical
  eleventyConfig.addCollection("destinations", function (collectionApi) {
    return collectionApi
      .getFilteredByGlob("src/destinations/*.md")
      .sort((a, b) => a.data.title.localeCompare(b.data.title));
  });

  eleventyConfig.addShortcode("year", () => `${new Date().getFullYear()}`);

  // Counts destination collection items carrying a given tag — keeps
  // "N packages" labels honest and wired to real content instead of invented numbers.
  eleventyConfig.addFilter("tagCount", function (destinations, tag) {
    if (!Array.isArray(destinations)) return 0;
    return destinations.filter((d) => (d.data.tags || []).includes(tag)).length;
  });

  eleventyConfig.addFilter("regionCount", function (destinations, region) {
    if (!Array.isArray(destinations)) return 0;
    return destinations.filter((d) => d.data.region === region).length;
  });

  return {
    dir: {
      input: "src",
      includes: "_includes",
      data: "_data",
      output: "_site",
    },
    markdownTemplateEngine: "njk",
    htmlTemplateEngine: "njk",
    templateFormats: ["njk", "md"],
  };
};
