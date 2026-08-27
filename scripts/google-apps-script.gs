/**
 * KD Holidayz — form submission handler (Google Apps Script Web App)
 *
 * This is the live script backing src/_data/formConfig.json's
 * googleSheetsWebAppUrl. It receives POSTs from the site's three forms
 * (Quick Enquiry drawer, Custom Tour, Contact — see src/js/main.js
 * `submitToSheet`), appends each submission as a row to the sheet, emails
 * a detailed notification to ADMIN_EMAIL for every submission, and sends
 * the visitor a "we'll connect soon" auto-reply when they left an email.
 * Both emails go out through sendBrandedEmail_, which appends a shared
 * footer (logo + both office locations + contacts) pulled from COMPANY.
 *
 * Uses the Gmail send scope (MailApp) and the external-request scope
 * (UrlFetchApp, to fetch the footer logo) — re-authorize when prompted
 * after pasting this in.
 *
 * Keep this file in sync with whatever is pasted into the Apps Script
 * editor (script.google.com) — it's not deployed automatically from here.
 */

var ADMIN_EMAIL = "kdholidayz@gmail.com";

// Company details rendered into the branded footer of every outgoing email.
// Keep in sync with src/_data/company.json. `logoUrl` must be a public URL on
// the live site (used as an inline cid: image — see getLogoBlob_).
var COMPANY = {
  name: "KD Holidayz",
  tagline: "A Dream Quest Explorers!",
  website: "https://www.kdholidayz.in",
  whatsapp: "+91 94297 99355",
  instagram: "https://www.instagram.com/kdholidayz_jamnagar/",
  logoUrl: "https://www.kdholidayz.in/images/brand/logo-full.png",
  offices: [
    {
      label: "Head Office — Jamnagar, India",
      address: "\"Hreehan Complex\", Patel Samaj, Jamnagar, Gujarat, India",
      phone: "+91 94297 99355",
      email: "info@kdholidayz.in"
    },
    {
      label: "Branch Office — Eldoret, Kenya",
      address: "Ronald Ngala Street, P.O. Box 4309-30100, Eldoret, Kenya",
      phone: "+254 731062066 / +91 8660401151",
      email: "maithri.shah@kdholidayz.in"
    }
  ]
};

var FIELD_LABELS = {
  submittedAt: "Timestamp",
  formType: "Form Type",
  name: "Full Name",
  phone: "Phone",
  email: "Email",
  destination: "Destination",
  dateFrom: "Travel Date From",
  dateTo: "Travel Date To",
  adults: "Adults",
  children: "Children",
  childrenAges: "Children Ages",
  departureCity: "Departure City",
  hotelPreference: "Hotel Preference",
  budget: "Budget",
  budgetType: "Budget Type",
  preferredPackage: "Preferred Package",
  specialRequirements: "Special Requirements",
  specialRequirementsOther: "Special Requirements (Other)",
  notes: "Notes",
  recaptchaToken: "Recaptcha Token"
};

// The order new columns get created in, for a first-time / empty sheet.
var COLUMN_ORDER = [
  "submittedAt", "formType", "name", "phone", "email", "destination",
  "dateFrom", "dateTo", "adults", "children", "childrenAges",
  "departureCity", "hotelPreference", "budget", "budgetType",
  "preferredPackage", "specialRequirements", "specialRequirementsOther",
  "notes", "recaptchaToken"
];

function doPost(e) {
  var lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Sheet1")
      || SpreadsheetApp.getActiveSpreadsheet().getSheets()[0];

    var payload = JSON.parse(e.postData.contents);

    var lastCol = Math.max(sheet.getLastColumn(), 1);
    var headerRange = sheet.getRange(1, 1, 1, lastCol);
    var headers = sheet.getLastRow() === 0 ? [] : headerRange.getValues()[0];

    // First run on a blank sheet: seed the full header row in a sensible order.
    if (headers.length === 0 || (headers.length === 1 && headers[0] === "")) {
      headers = COLUMN_ORDER.map(function (key) { return FIELD_LABELS[key] || key; });
      sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
      sheet.getRange(1, 1, 1, headers.length).setFontWeight("bold");
    }

    // Case/whitespace-insensitive match so near-identical existing headers
    // (e.g. "Timestamp " vs "Timestamp") get reused instead of duplicated.
    function normalize(s) { return String(s || "").trim().toLowerCase(); }
    function findHeaderIndex(label) {
      var target = normalize(label);
      for (var i = 0; i < headers.length; i++) {
        if (normalize(headers[i]) === target) return i;
      }
      return -1;
    }

    // Append any column present in this payload but missing from the sheet.
    Object.keys(payload).forEach(function (key) {
      var label = FIELD_LABELS[key] || key;
      if (findHeaderIndex(label) === -1) {
        headers.push(label);
        sheet.getRange(1, headers.length).setValue(label).setFontWeight("bold");
      }
    });

    // Build the row in header order.
    var row = headers.map(function (label) {
      var key = Object.keys(FIELD_LABELS).filter(function (k) { return normalize(FIELD_LABELS[k]) === normalize(label); })[0] || label;
      var value = payload[key];
      return value === undefined || value === null ? "" : value;
    });

    sheet.appendRow(row);

    // Notify the team by email. Wrapped so a mail failure (e.g. missing
    // Gmail scope authorization) never breaks the sheet write or the
    // response the client gets back.
    try {
      sendAdminNotification(payload, headers, row);
    } catch (mailErr) {
      console.error("sendAdminNotification: " + mailErr);
    }

    // Auto-reply / acknowledgement to the customer. Wrapped separately so a
    // failure here (bad address, quota) never breaks the sheet write, the
    // admin notification, or the response the client gets back.
    try {
      sendCustomerAcknowledgement(payload);
    } catch (ackErr) {
      console.error("sendCustomerAcknowledgement: " + ackErr);
    }

    return ContentService.createTextOutput(JSON.stringify({ ok: true }))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({ ok: false, error: String(err) }))
      .setMimeType(ContentService.MimeType.JSON);
  } finally {
    lock.releaseLock();
  }
}

// Lets you sanity-check the deployment URL directly in a browser (GET),
// since the site's actual submissions use no-cors POST and never show you the response.
function doGet(e) {
  return ContentService.createTextOutput(JSON.stringify({ ok: true, message: "KD Holidayz form endpoint is live." }))
    .setMimeType(ContentService.MimeType.JSON);
}

function sendAdminNotification(payload, headers, row) {
  var destination = payload.destination || "(not specified)";
  var name = payload.name || "Unknown";
  var formType = payload.formType || "Enquiry";
  var subject = "New " + formType + " — " + name + " — " + destination;

  var rowsHtml = headers.map(function (label, i) {
    var value = row[i] === undefined || row[i] === null || row[i] === "" ? "—" : row[i];
    return (
      '<tr>' +
      '<td style="padding:6px 12px;border-bottom:1px solid #e5e5e5;font-weight:600;color:#333;white-space:nowrap;">' + escapeHtml_(label) + '</td>' +
      '<td style="padding:6px 12px;border-bottom:1px solid #e5e5e5;color:#111;">' + escapeHtml_(value) + '</td>' +
      '</tr>'
    );
  }).join("");

  var htmlBody =
    '<div style="font-family:Arial,Helvetica,sans-serif;max-width:640px;margin:0 auto;">' +
    '<h2 style="color:#0b3d5c;margin-bottom:4px;">📩 New Website Enquiry</h2>' +
    '<p style="color:#555;margin-top:0;">A visitor submitted the <strong>' + escapeHtml_(formType) + '</strong> form on kdholidayz.com.</p>' +
    (payload.email ? '' : '<p style="color:#b02a2a;font-weight:600;">⚠️ No email address was provided — follow up by phone.</p>') +
    '<table style="border-collapse:collapse;width:100%;margin-top:12px;">' + rowsHtml + '</table>' +
    '</div>';

  var plainBody = headers.map(function (label, i) {
    return label + ": " + (row[i] || "—");
  }).join("\n");

  sendBrandedEmail_({
    to: ADMIN_EMAIL,
    subject: subject,
    plainBody: plainBody,
    htmlBody: htmlBody,
    name: "KD Holidayz Website",
    replyTo: payload.email || ADMIN_EMAIL
  });
}

// Sends a "we got your enquiry, a consultant will connect soon" auto-reply to
// the address the visitor entered in the form (payload.email). Silently skips
// when no / an invalid email was provided (Contact & Custom Tour make it
// optional). Sends from the script owner (kdholidayz@gmail.com); replies route
// back to the same inbox.
function sendCustomerAcknowledgement(payload) {
  var to = String(payload.email || "").trim();
  if (!to || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(to)) return;

  var firstName = String(payload.name || "there").trim().split(/\s+/)[0];
  var destination = payload.destination && payload.destination !== "Other"
    ? payload.destination : null;
  var formType = String(payload.formType || "enquiry").toLowerCase();

  var subject = "Thanks for reaching out to KD Holidayz ✈️";

  var htmlBody =
    '<div style="font-family:Arial,Helvetica,sans-serif;max-width:560px;margin:0 auto;color:#1a1a1a;">' +
      '<h2 style="color:#0b3d5c;margin-bottom:8px;">Thank you, ' + escapeHtml_(firstName) + '! 🙏</h2>' +
      '<p>We’ve received your ' + escapeHtml_(formType) +
        (destination ? ' for <strong>' + escapeHtml_(destination) + '</strong>' : '') + '.</p>' +
      '<p>One of our travel consultants will personally connect with you within ' +
        '<strong>24 hours</strong> to start planning your trip.</p>' +
      '<p>If it’s urgent, just reply to this email and we’ll prioritise it.</p>' +
      '<p style="margin-top:24px;">Warm regards,<br><strong>Team KD Holidayz</strong><br>' +
        '<span style="color:#666;">A Dream Quest Explorers</span></p>' +
    '</div>';

  var plainBody =
    "Thank you, " + firstName + "!\n\n" +
    "We’ve received your " + formType +
      (destination ? " for " + destination : "") + ".\n\n" +
    "One of our travel consultants will personally connect with you within 24 hours " +
    "to start planning your trip. If it’s urgent, just reply to this email.\n\n" +
    "Warm regards,\nTeam KD Holidayz\nA Dream Quest Explorers";

  sendBrandedEmail_({
    to: to,
    subject: subject,
    plainBody: plainBody,
    htmlBody: htmlBody,
    name: "KD Holidayz",
    replyTo: ADMIN_EMAIL
  });
}

/**
 * Single send path for all outgoing mail. Appends the shared branded footer
 * (logo + office locations + contacts) to both the HTML and plain-text
 * bodies, embeds the logo as an inline cid: image when it can be fetched,
 * and falls back to a text logo when it can't.
 *
 * opts: { to, subject, plainBody, htmlBody, name, replyTo }
 */
function sendBrandedEmail_(opts) {
  var logoBlob = getLogoBlob_();
  var message = {
    to: opts.to,
    subject: opts.subject,
    name: opts.name || COMPANY.name,
    replyTo: opts.replyTo || ADMIN_EMAIL,
    body: opts.plainBody + buildEmailFooterText_(),
    htmlBody: opts.htmlBody + buildEmailFooterHtml_(!!logoBlob)
  };
  if (logoBlob) message.inlineImages = { kdlogo: logoBlob };
  MailApp.sendEmail(message);
}

// Fetches the footer logo from the live site as an image Blob for embedding
// as an inline (cid:) image. Cached 6h to avoid re-fetching on every submit.
// Returns null if the fetch fails — callers then render a text logo instead.
function getLogoBlob_() {
  var cache = CacheService.getScriptCache();
  try {
    var cached = cache.get("footerLogoB64");
    if (cached) return Utilities.newBlob(Utilities.base64Decode(cached), "image/png", "logo.png");
  } catch (e) { /* fall through to a fresh fetch */ }

  try {
    var resp = UrlFetchApp.fetch(COMPANY.logoUrl, { muteHttpExceptions: true });
    if (resp.getResponseCode() !== 200) return null;
    var blob = resp.getBlob().setName("logo.png");
    var bytes = blob.getBytes();
    if (bytes.length < 95000) { // CacheService caps values at 100KB
      try { cache.put("footerLogoB64", Utilities.base64Encode(bytes), 21600); } catch (e) {}
    }
    return blob;
  } catch (e) {
    console.error("getLogoBlob_: " + e);
    return null;
  }
}

// Branded HTML footer. `hasLogo` => emit the cid:kdlogo <img>, else a text logo.
function buildEmailFooterHtml_(hasLogo) {
  var officesHtml = COMPANY.offices.map(function (o) {
    return (
      '<div style="margin-top:12px;">' +
        '<div style="font-weight:700;color:#0b3d5c;">' + escapeHtml_(o.label) + '</div>' +
        '<div style="color:#444;">' + escapeHtml_(o.address) + '</div>' +
        '<div style="color:#444;">Phone: ' + escapeHtml_(o.phone) + '</div>' +
        '<div style="color:#444;">Email: <a href="mailto:' + escapeHtml_(o.email) + '" style="color:#0b3d5c;">' + escapeHtml_(o.email) + '</a></div>' +
      '</div>'
    );
  }).join("");

  var siteLabel = COMPANY.website.replace(/^https?:\/\//, "");

  return (
    '<div style="font-family:Arial,Helvetica,sans-serif;max-width:640px;margin:28px auto 0;border-top:2px solid #0b3d5c;padding-top:16px;font-size:13px;line-height:1.55;">' +
      (hasLogo
        ? '<img src="cid:kdlogo" alt="' + escapeHtml_(COMPANY.name) + '" height="52" style="display:block;margin-bottom:8px;">'
        : '<div style="font-size:18px;font-weight:800;color:#0b3d5c;margin-bottom:4px;">' + escapeHtml_(COMPANY.name) + '</div>') +
      '<div style="color:#777;font-style:italic;margin-bottom:4px;">' + escapeHtml_(COMPANY.tagline) + '</div>' +
      officesHtml +
      '<div style="margin-top:14px;color:#444;">' +
        'Web: <a href="' + COMPANY.website + '" style="color:#0b3d5c;">' + escapeHtml_(siteLabel) + '</a>' +
        '&nbsp;&nbsp;|&nbsp;&nbsp;WhatsApp: ' + escapeHtml_(COMPANY.whatsapp) +
        '&nbsp;&nbsp;|&nbsp;&nbsp;<a href="' + COMPANY.instagram + '" style="color:#0b3d5c;">Instagram</a>' +
      '</div>' +
      '<div style="margin-top:10px;color:#999;font-size:11px;">This is an automated message from the KD Holidayz website.</div>' +
    '</div>'
  );
}

// Plain-text equivalent of the footer, appended to every text body.
function buildEmailFooterText_() {
  var lines = ["", "--", COMPANY.name + " - " + COMPANY.tagline];
  COMPANY.offices.forEach(function (o) {
    lines.push("");
    lines.push(o.label);
    lines.push(o.address);
    lines.push("Phone: " + o.phone);
    lines.push("Email: " + o.email);
  });
  lines.push("");
  lines.push("Web: " + COMPANY.website + "  |  WhatsApp: " + COMPANY.whatsapp);
  return lines.join("\n");
}

function escapeHtml_(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
