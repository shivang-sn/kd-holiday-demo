/**
 * KD Holidayz — itinerary PDF generator
 *
 * Builds one branded PDF quote per destination straight from its source
 * markdown (src/destinations/*.md), so the PDF always matches what's on the
 * live page — no separate data to keep in sync.
 *
 * Fixed layout on every page:
 *   - A 20%-opacity KD Holidayz logo watermark, centered on the page
 *   - Header: logo (left) · "New Website Enquiry" (center) · generation date (right)
 *   - Package title (large), details chips (price/group/rating), days badge,
 *     subheading, then the full "About This Package" copy from the
 *     destination's markdown body — the same text as the site's About section
 *   - A "prices may change at booking / sample itinerary" notice
 *   - Activities Included — one per line, full width
 *   - Detailed Itinerary (left) + Top Places to Visit sidebar (right)
 *   - Footer on every page: same footer logo + both office addresses &
 *     contact numbers used in the site footer
 *
 * Run with: npm run generate:pdfs
 */

const PDFDocument = require("pdfkit");
const fs = require("fs");
const path = require("path");
const matter = require("gray-matter");

const rootDir = path.join(__dirname, "..");
const srcDir = path.join(rootDir, "src");
const destinationsDir = path.join(srcDir, "destinations");
const outDir = path.join(srcDir, "pdfs");
fs.mkdirSync(outDir, { recursive: true });

const company = require(path.join(srcDir, "_data", "company.json"));

// ---------- palette + page geometry ----------
const FOREST = "#365F1E";
const CHARCOAL = "#333333";
const MUTED = "#6B6B6B";
const GOLD = "#B9790A";
const CHIP_BG = "#F4F6F2";
const NOTICE_BG = "#FFF4EC";
const NOTICE_BORDER = "#F0C9AD";
const NOTICE_TEXT = "#8F2905";
const RULE = "#E2E8F0";

const PAGE_WIDTH = 595.28; // A4 — height is read off doc.page.height, since it's a per-page value
const MARGIN = { top: 118, bottom: 148, left: 50, right: 50 };
const CONTENT_WIDTH = PAGE_WIDTH - MARGIN.left - MARGIN.right;

// ---------- source data ----------
function loadDestinations() {
  return fs
    .readdirSync(destinationsDir)
    .filter((f) => f.endsWith(".md"))
    .map((f) => {
      const parsed = matter(fs.readFileSync(path.join(destinationsDir, f), "utf8"));
      // `content` is the markdown body below the front matter — the same
      // "About This Package" copy the destination page renders.
      return { ...parsed.data, fullDescription: parsed.content.trim() };
    })
    .filter((d) => d && d.pdfFile);
}

function readLocalImage(sitePath) {
  if (!sitePath) return null;
  const localPath = path.join(srcDir, sitePath.replace(/^\//, ""));
  return fs.existsSync(localPath) ? fs.readFileSync(localPath) : null;
}

function formatINR(n) {
  return typeof n === "number" ? n.toLocaleString("en-IN") : String(n || "—");
}

// ---------- drawing helpers ----------
function ensureSpace(doc, needed) {
  if (doc.y + needed > doc.page.height - doc.page.margins.bottom) doc.addPage();
}

// Large, faint, centered logo behind everything else on the page. Must be
// drawn before the header/body content so it stays underneath (PDF content
// paints in call order).
function drawWatermark(doc, logoImg) {
  if (!logoImg) return;
  const w = 320;
  const h = w * (logoImg.height / logoImg.width);
  doc.save();
  doc.opacity(0.2);
  doc.image(logoImg, (PAGE_WIDTH - w) / 2, (doc.page.height - h) / 2, { width: w });
  doc.opacity(1);
  doc.restore();
}

// Logo (left) · "New Website Enquiry" (center) · generation date (right).
function drawHeader(doc, logoImg) {
  const top = 26;
  if (logoImg) doc.image(logoImg, MARGIN.left, top, { height: 38 });

  doc
    .fillColor(FOREST)
    .font("Helvetica-Bold")
    .fontSize(11)
    // Core PDF fonts can't render the ✨ emoji (WinAnsi has no glyph for it —
    // it silently comes out as garbled characters), so this omits it and
    // keeps the tagline text, matching src/_data/company.json's `tagline`.
    .text("A Dream Quest Explorers!", 0, top + 14, { width: PAGE_WIDTH, align: "center" });

  const dateStr = new Date().toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" });
  doc
    .fillColor(MUTED)
    .font("Helvetica")
    .fontSize(9)
    .text(dateStr, PAGE_WIDTH - MARGIN.right - 200, top + 15, { width: 200, align: "right" });

  doc
    .strokeColor(RULE)
    .lineWidth(1)
    .moveTo(MARGIN.left, top + 60)
    .lineTo(PAGE_WIDTH - MARGIN.right, top + 60)
    .stroke();

  doc.x = MARGIN.left;
  doc.y = MARGIN.top;
}

function drawOfficeColumn(doc, office, x, width, y) {
  let cy = y;
  doc
    .fillColor(GOLD)
    .font("Helvetica-Bold")
    .fontSize(9)
    .text(`${office.label} — ${office.country}`, x, cy, { width });
  cy += 13;

  doc.fillColor(MUTED).font("Helvetica").fontSize(8.5);
  const addrHeight = doc.heightOfString(office.address, { width, lineGap: 1 });
  doc.text(office.address, x, cy, { width, lineGap: 1 });
  cy += addrHeight + 4;

  doc.text(`Tel: ${office.phones.join(" / ")}`, x, cy, { width });
  cy += 12;
  doc.text(`Email: ${office.email}`, x, cy, { width });
}

// Both office addresses + contact details, same content as the site footer.
function drawFooter(doc, footerLogoImg, pageNum, pageCount) {
  const y0 = doc.page.height - 130;
  doc
    .strokeColor(RULE)
    .lineWidth(1)
    .moveTo(MARGIN.left, y0)
    .lineTo(PAGE_WIDTH - MARGIN.right, y0)
    .stroke();

  if (footerLogoImg) doc.image(footerLogoImg, MARGIN.left, y0 + 10, { height: 28 });

  const colWidth = (CONTENT_WIDTH - 20) / 2;
  const columnsY = y0 + 44;
  drawOfficeColumn(doc, company.offices[0], MARGIN.left, colWidth, columnsY);
  drawOfficeColumn(doc, company.offices[1], MARGIN.left + colWidth + 20, colWidth, columnsY);

  doc
    .fillColor(MUTED)
    .font("Helvetica")
    .fontSize(8)
    .text(
      `${company.website.replace(/^https?:\/\//, "")}  •  Rates are indicative and subject to change  •  Page ${pageNum} of ${pageCount}`,
      MARGIN.left,
      y0 + 112,
      { width: CONTENT_WIDTH, align: "center" }
    );
}

function drawChip(doc, x, y, w, h, label, value) {
  doc.roundedRect(x, y, w, h, 6).fillColor(CHIP_BG).fill();
  doc
    .fillColor(MUTED)
    .font("Helvetica-Bold")
    .fontSize(7.5)
    .text(label.toUpperCase(), x + 10, y + 9, { width: w - 20, characterSpacing: 0.4 });
  doc
    .fillColor(CHARCOAL)
    .font("Helvetica-Bold")
    .fontSize(10.5)
    .text(value, x + 10, y + 22, { width: w - 20 });
}

// Activities Included — one activity per line (a small square bullet + name),
// with generous spacing between lines. Uses ensureSpace per line, same
// pattern as the itinerary days, so it paginates safely regardless of length.
function drawActivityList(doc, labels) {
  const lineH = 22;
  labels.forEach((label) => {
    ensureSpace(doc, lineH);
    const y = doc.y;
    doc.roundedRect(MARGIN.left, y + 6, 6, 6, 1.5).fillColor(GOLD).fill();
    doc.fillColor(CHARCOAL).font("Helvetica").fontSize(10.5).text(label, MARGIN.left + 16, y + 2, { width: CONTENT_WIDTH - 16 });
    doc.y = y + lineH;
  });
}

// ---- Top Places to Visit — rendered as a sidebar next to the itinerary.
// Takes an explicit (x, y, width) and returns the y it finished at, so it can
// be measured and drawn independently of the itinerary column beside it.
function measureNamedEntriesHeight(doc, entries, width) {
  let h = 0;
  entries.forEach((entry, idx) => {
    doc.font("Helvetica-Bold").fontSize(11);
    h += doc.heightOfString(entry.name || "", { width }) + 2;
    if (entry.description) {
      doc.font("Helvetica").fontSize(9.5);
      h += doc.heightOfString(entry.description, { width, lineGap: 2 }) + 2;
    }
    h += 8;
    if (idx < entries.length - 1) h += 6;
  });
  return h;
}

// Named places/highlights with a short description each.
function drawNamedEntriesAt(doc, entries, x0, y0, width) {
  let y = y0;
  entries.forEach((entry, idx) => {
    doc.fillColor(FOREST).font("Helvetica-Bold").fontSize(11);
    doc.text(entry.name || "", x0, y, { width });
    y += doc.heightOfString(entry.name || "", { width }) + 2;

    if (entry.description) {
      doc.fillColor(MUTED).font("Helvetica").fontSize(9.5);
      doc.text(entry.description, x0, y, { width, lineGap: 2 });
      y += doc.heightOfString(entry.description, { width, lineGap: 2 }) + 2;
    }
    y += 8;

    if (idx < entries.length - 1) {
      doc.strokeColor(RULE).lineWidth(0.5).moveTo(x0, y).lineTo(x0 + width, y).stroke();
      y += 6;
    }
  });
  return y;
}

// ---------- per-destination PDF ----------
async function buildPdf(dest) {
  const outPath = path.join(outDir, path.basename(dest.pdfFile));
  const doc = new PDFDocument({ size: "A4", margins: MARGIN, bufferPages: true });
  const stream = fs.createWriteStream(outPath);
  doc.pipe(stream);

  const headerLogoBuf = readLocalImage("/images/brand/logo-header.png");
  const footerLogoBuf = readLocalImage("/images/brand/logo-footer.png");
  // Open each logo once per document and reuse the returned image object on
  // every placement (header × N pages, watermark × N pages, footer × N
  // pages) — passing a raw Buffer to doc.image() re-embeds it each time.
  const headerLogoImg = headerLogoBuf ? doc.openImage(headerLogoBuf) : null;
  const footerLogoImg = footerLogoBuf ? doc.openImage(footerLogoBuf) : null;

  const paintChrome = () => {
    drawWatermark(doc, headerLogoImg);
    drawHeader(doc, headerLogoImg);
  };
  paintChrome();
  doc.on("pageAdded", paintChrome);

  // ---- package title ----
  doc.fillColor(CHARCOAL).font("Helvetica-Bold").fontSize(28).text(dest.title);
  doc.moveDown(0.6);

  // ---- package details (starting price, group type, rating) ----
  ensureSpace(doc, 56);
  const chips = [{ label: "Starting From", value: `Rs. ${formatINR(dest.startingPrice)}` }];
  if (dest.groupType) chips.push({ label: "Group Type", value: dest.groupType });
  if (dest.rating) chips.push({ label: "Rating", value: `${dest.rating} / 5 (${dest.reviewCount || 0})` });
  const chipY = doc.y;
  const chipW = (CONTENT_WIDTH - (chips.length - 1) * 10) / chips.length;
  chips.forEach((c, i) => drawChip(doc, MARGIN.left + i * (chipW + 10), chipY, chipW, 46, c.label, c.value));
  doc.y = chipY + 46;
  doc.moveDown(0.7);

  // ---- days ----
  const daysText =
    dest.durationNights && dest.durationDays
      ? `${dest.durationNights} Nights / ${dest.durationDays} Days`
      : "Flexible Duration";
  doc.font("Helvetica-Bold").fontSize(12.5);
  const badgeW = doc.widthOfString(daysText) + 32;
  const badgeY = doc.y;
  doc.roundedRect(MARGIN.left, badgeY, badgeW, 28, 14).fillColor(FOREST).fill();
  doc.fillColor("#FFFFFF").text(daysText, MARGIN.left, badgeY + 7.5, { width: badgeW, align: "center" });
  doc.y = badgeY + 28;
  doc.moveDown(0.8);

  // ---- subheading ----
  if (dest.subtitle) {
    doc.fillColor(GOLD).font("Helvetica-Bold").fontSize(12.5).text(dest.subtitle, { lineGap: 2 });
    doc.moveDown(0.5);
  }

  // ---- full description, the same "About This Package" copy as the site ----
  if (dest.fullDescription) {
    doc.fillColor(CHARCOAL).font("Helvetica-Bold").fontSize(12.5).text("About This Package");
    doc.moveDown(0.3);
    doc.fillColor(MUTED).font("Helvetica").fontSize(10.5).text(dest.fullDescription, { lineGap: 3 });
    doc.moveDown(0.8);
  }

  // ---- price / sample-content notice ----
  ensureSpace(doc, 76);
  const noticeY = doc.y;
  doc.roundedRect(MARGIN.left, noticeY, CONTENT_WIDTH, 62, 6).fillAndStroke(NOTICE_BG, NOTICE_BORDER);
  doc
    .fillColor(NOTICE_TEXT)
    .font("Helvetica-Bold")
    .fontSize(10.5)
    .text("Please Note", MARGIN.left + 16, noticeY + 12, { width: CONTENT_WIDTH - 32 });
  doc
    .fillColor(NOTICE_TEXT)
    .font("Helvetica")
    .fontSize(9.5)
    .text(
      `Prices shown may change at the time of booking — this is a sample itinerary for ${dest.title}, not a confirmed quote. Final inclusions, exclusions, and cost will be shared by our travel consultant.`,
      MARGIN.left + 16,
      noticeY + 28,
      { width: CONTENT_WIDTH - 32, lineGap: 2 }
    );
  doc.x = MARGIN.left;
  doc.y = noticeY + 76;

  // ---- activities included — one per line, full width ----
  const activityLabels = Array.isArray(dest.activities) ? dest.activities.map((a) => a.name).filter(Boolean) : [];
  if (activityLabels.length) {
    ensureSpace(doc, 30);
    doc.fillColor(CHARCOAL).font("Helvetica-Bold").fontSize(14).text("Activities Included", MARGIN.left, doc.y);
    doc.moveDown(0.5);
    drawActivityList(doc, activityLabels);
    doc.moveDown(0.6);
  }

  // ---- detailed day-by-day itinerary (left) + top places to visit (right) ----
  // The itinerary is the long, variable-length side, so it stays in normal
  // auto-paginating flow (just narrowed to the left column's width) — the
  // same safe per-day pattern as before. Top Places is always short, so it's
  // safe to lay out once, in full, as a fixed sidebar next to where the
  // itinerary starts.
  const places = Array.isArray(dest.topPlaces) ? dest.topPlaces : [];
  const hasItinerary = Array.isArray(dest.itinerary) && dest.itinerary.length;
  if (hasItinerary || places.length) {
    const colGap = 24;
    const rightColWidth = places.length ? 170 : 0;
    const leftColWidth = CONTENT_WIDTH - (places.length ? rightColWidth + colGap : 0);
    const rightX = MARGIN.left + leftColWidth + colGap;

    ensureSpace(doc, places.length ? measureNamedEntriesHeight(doc, places, rightColWidth) + 24 : 30);
    const startY = doc.y;

    if (places.length) {
      doc.fillColor(CHARCOAL).font("Helvetica-Bold").fontSize(13).text("Top Places to Visit", rightX, startY, { width: rightColWidth });
      drawNamedEntriesAt(doc, places, rightX, startY + 20, rightColWidth);
    }

    if (hasItinerary) {
      doc.fillColor(CHARCOAL).font("Helvetica-Bold").fontSize(15).text("Detailed Itinerary", MARGIN.left, startY, { width: leftColWidth });
      doc.y = startY + 24;

      dest.itinerary.forEach((day, idx) => {
        ensureSpace(doc, 40);
        const rowY = doc.y;
        const dayLabel = `DAY ${day.day}`;
        doc.font("Helvetica-Bold").fontSize(8.5);
        const dw = doc.widthOfString(dayLabel) + 16;
        doc.roundedRect(MARGIN.left, rowY, dw, 18, 9).fillColor(FOREST).fill();
        doc.fillColor("#FFFFFF").text(dayLabel, MARGIN.left, rowY + 4.5, { width: dw, align: "center" });
        doc
          .fillColor(CHARCOAL)
          .font("Helvetica-Bold")
          .fontSize(11.5)
          .text(day.title || "", MARGIN.left + dw + 10, rowY + 2, { width: leftColWidth - dw - 10 });
        doc.y = rowY + 24;

        doc
          .fillColor(MUTED)
          .font("Helvetica")
          .fontSize(9.5)
          .text(day.description || "", MARGIN.left, doc.y, { width: leftColWidth, lineGap: 2 });
        doc.moveDown(0.6);

        if (idx < dest.itinerary.length - 1) {
          doc.strokeColor(RULE).lineWidth(0.5).moveTo(MARGIN.left, doc.y).lineTo(MARGIN.left + leftColWidth, doc.y).stroke();
          doc.moveDown(0.6);
        }
      });
    }
  }

  // ---- footer, drawn on every page once pagination is final ----
  // The footer lives inside the reserved bottom margin, and pdfkit's text
  // flow auto-adds a page the instant it writes below `page.height -
  // margins.bottom` — even for absolutely-positioned text. Zero the bottom
  // margin out for the duration of each footer draw so it doesn't trigger
  // that (restoring it right after, since `doc.page` is reused by reference).
  const range = doc.bufferedPageRange();
  for (let i = range.start; i < range.start + range.count; i++) {
    doc.switchToPage(i);
    const savedBottomMargin = doc.page.margins.bottom;
    doc.page.margins.bottom = 0;
    drawFooter(doc, footerLogoImg, i - range.start + 1, range.count);
    doc.page.margins.bottom = savedBottomMargin;
  }

  doc.end();
  await new Promise((resolve, reject) => {
    stream.on("finish", resolve);
    stream.on("error", reject);
  });
}

async function main() {
  const destinations = loadDestinations();
  for (const dest of destinations) {
    console.log("Generating", dest.pdfFile);
    await buildPdf(dest);
  }
  console.log("Generated", destinations.length, "PDFs in", outDir);
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
