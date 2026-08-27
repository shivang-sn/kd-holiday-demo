const PDFDocument = require("pdfkit");
const fs = require("fs");
const path = require("path");

const outDir = path.join(__dirname, "..", "src", "pdfs");
fs.mkdirSync(outDir, { recursive: true });

const FOREST = "#365F1E";
const CHARCOAL = "#333333";
const MUTED = "#6B6B6B";
const GOLD = "#E0A400";

const destinations = [
  {
    file: "char-dham-yatra.pdf",
    title: "Char Dham Yatra",
    subtitle: "The Himalayan pilgrimage circuit — Yamunotri, Gangotri, Kedarnath & Badrinath",
    duration: "9 Nights / 10 Days",
    price: "Starting Rs. 30,000 per person",
  },
  {
    file: "bali.pdf",
    title: "Bali",
    subtitle: "Island of the Gods — a customised honeymoon and leisure escape",
    duration: "6 Nights / 7 Days",
    price: "Starting Rs. 45,999 per person",
  },
  {
    file: "kerala.pdf",
    title: "Kerala",
    subtitle: "God's Own Country — backwaters, hill stations & houseboats",
    duration: "6 Nights / 7 Days",
    price: "Starting Rs. 22,500 per person",
  },
  {
    file: "europe-switzerland-paris.pdf",
    title: "Europe — Switzerland & Paris",
    subtitle: "Alpine scenery meets the City of Love, thoughtfully curated end to end",
    duration: "8 Nights / 9 Days",
    price: "Starting Rs. 1,65,000 per person",
  },
  {
    file: "dubai.pdf",
    title: "Dubai",
    subtitle: "Premium desert safari, city icons & an Abu Dhabi day trip — the complete UAE experience",
    duration: "5 Nights / 6 Days",
    price: "Starting Rs. 64,999 per person",
  },
  {
    file: "dubai-affordable.pdf",
    title: "Dubai Affordable",
    subtitle: "Budget-friendly desert safari, Burj Khalifa & Dubai Frame — the essential UAE experience",
    duration: "5 Nights / 6 Days",
    price: "Starting Rs. 46,500 per person",
  },
  {
    file: "dubai-deluxe.pdf",
    title: "Dubai Deluxe",
    subtitle: "Premium desert safari, Miracle Garden & Global Village — the fuller Dubai experience",
    duration: "5 Nights / 6 Days",
    price: "Starting Rs. 52,000 per person",
  },
  {
    file: "bali-honey.pdf",
    title: "Bali Honey",
    subtitle: "Kuta, Ubud & the Gili Islands — beaches, culture and island-hopping in one trip",
    duration: "7 Nights / 8 Days",
    price: "Starting Rs. 47,000 per person",
  },
  {
    file: "bali-dreams.pdf",
    title: "Bali Dreams",
    subtitle: "Kuta beaches & an Ubud private pool villa — a relaxed, culture-rich escape",
    duration: "6 Nights / 7 Days",
    price: "Starting Rs. 42,000 per person",
  },
  {
    file: "bali-delight.pdf",
    title: "Bali Delight",
    subtitle: "Nusa Penida, Tanah Lot & the Handara Gate — Bali's icons on a value itinerary",
    duration: "6 Nights / 7 Days",
    price: "Starting Rs. 35,500 per person",
  },
  {
    file: "gujarat.pdf",
    title: "Gujarat",
    subtitle: "Statue of Unity, Saputara, Gir's lions & Beyt Dwarka — heritage, hills and coast in one circuit",
    duration: "7 Nights / 8 Days",
    price: "Starting Rs. 24,999 per person",
  },
  {
    file: "rajasthan.pdf",
    title: "Rajasthan",
    subtitle: "Amber Fort, Pushkar, Mount Abu & the Thar Desert — royal Rajasthan across six cities",
    duration: "8 Nights / 9 Days",
    price: "Starting Rs. 24,999 per person",
  },
];

function buildPdf(dest) {
  const doc = new PDFDocument({ size: "A4", margins: { top: 70, bottom: 70, left: 60, right: 60 } });
  const outPath = path.join(outDir, dest.file);
  doc.pipe(fs.createWriteStream(outPath));

  // Header
  doc
    .fillColor(FOREST)
    .font("Helvetica-Bold")
    .fontSize(20)
    .text("KD Holidayz", { continued: false });
  doc
    .fillColor(MUTED)
    .font("Helvetica")
    .fontSize(10)
    .text("A Dream Quest Explorers!", { continued: false });

  doc.moveDown(2);
  doc
    .strokeColor("#E2E8F0")
    .lineWidth(1)
    .moveTo(60, doc.y)
    .lineTo(535, doc.y)
    .stroke();
  doc.moveDown(1.5);

  // Title
  doc
    .fillColor(CHARCOAL)
    .font("Helvetica-Bold")
    .fontSize(26)
    .text(dest.title);
  doc.moveDown(0.4);
  doc
    .fillColor(MUTED)
    .font("Helvetica")
    .fontSize(12)
    .text(dest.subtitle);

  doc.moveDown(1);
  doc
    .fillColor(GOLD)
    .font("Helvetica-Bold")
    .fontSize(11)
    .text(`${dest.duration}   •   ${dest.price}`);

  doc.moveDown(2);

  // Sample-content notice
  const noticeY = doc.y;
  doc.roundedRect(60, noticeY, 475, 70, 6).fillAndStroke("#FFF4EC", "#F0C9AD");
  doc
    .fillColor("#8F2905")
    .font("Helvetica-Bold")
    .fontSize(11)
    .text("Sample Itinerary — Placeholder Content", 76, noticeY + 14, { width: 445 });
  doc
    .fillColor("#8F2905")
    .font("Helvetica")
    .fontSize(9.5)
    .text(
      "This document is a placeholder generated for website development purposes. Final day-by-day itinerary, inclusions, exclusions, and pricing will be confirmed with KD Holidayz before publishing.",
      76,
      noticeY + 32,
      { width: 445 }
    );

  doc.y = noticeY + 90;
  doc.moveDown(1);

  doc
    .fillColor(CHARCOAL)
    .font("Helvetica-Bold")
    .fontSize(14)
    .text("About This Package");
  doc.moveDown(0.5);
  doc
    .fillColor(MUTED)
    .font("Helvetica")
    .fontSize(11)
    .text(
      `Thank you for your interest in ${dest.title}. KD Holidayz plans every journey around a real conversation with you — your dates, budget, and pace — rather than a fixed template. A member of our team will follow up shortly with a detailed, personalised itinerary.`,
      { align: "left", lineGap: 4 }
    );

  doc.moveDown(1.5);
  doc
    .fillColor(CHARCOAL)
    .font("Helvetica-Bold")
    .fontSize(14)
    .text("Get in Touch");
  doc.moveDown(0.5);
  doc
    .fillColor(MUTED)
    .font("Helvetica")
    .fontSize(11)
    .text("Head Office: \"Hreehan Complex\", Patel Samaj, Jamnagar, Gujarat, India", { lineGap: 3 })
    .text("Phone: +91 9429799355")
    .text("Email: info@kdholidayz.in")
    .text("Website: www.kdholidayz.in");

  doc.end();
}

destinations.forEach(buildPdf);
console.log("Generated", destinations.length, "PDFs in", outDir);
