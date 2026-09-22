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
 * signature block (Regards / proprietor / logo + office + contacts, an
 * automated-message disclaimer) pulled from COMPANY.
 *
 * Mail is sent via the Zoho Mail API (as info@kdholidayz.in), not Gmail —
 * see the "Zoho Mail" section below for the OAuth setup this needs and
 * where the credentials live. Everything else (sheet writing, the two
 * message-building functions, the branded footer) is unchanged.
 *
 * Uses the external-request scope (UrlFetchApp, for the Zoho OAuth token
 * exchange and the send-mail call) — re-authorize when prompted after
 * pasting this in.
 *
 * Keep this file in sync with whatever is pasted into the Apps Script
 * editor (script.google.com) — it's not deployed automatically from here.
 */

var ADMIN_EMAIL = "info@kdholidayz.in";

// Company details rendered into the branded signature block of every
// outgoing email. Keep in sync with src/_data/company.json. `logoUrl` must
// be a public URL — it's referenced as a plain external <img src>, since
// Zoho's send-mail API has no attachment/inline-image field to embed it.
// Currently pointed at the Vercel demo deployment (the production site at
// kdholidayz.in hasn't been redeployed with the new /images/brand/ assets
// yet) — switch this to https://www.kdholidayz.in/images/brand/logo-full.png
// once that deploy happens.
var COMPANY = {
  name: "KD Holidayz",
  tagline: "A Dream Quest Explorers!",
  website: "https://www.kdholidayz.in",
  proprietor: "Dhaval Gudhka",
  proprietorTitle: "Proprietor",
  logoUrl: "https://kd-holiday-demo.vercel.app/images/brand/logo-full.png",
  office: {
    address: "\"Hreehan Complex\", Opp. Patel Samaj, Jamnagar, Gujarat, India",
    mobile: "+91 9429799355",
    email: "info@kdholidayz.in"
  }
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

    // Notify the team by email. Wrapped so a mail failure (e.g. a stale
    // Zoho refresh token, or Script Properties not set up yet) never
    // breaks the sheet write or the response the client gets back.
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
    '<h2 style="color:#0b3d5c;margin-bottom:4px;">📩 New ' + escapeHtml_(formType) + '</h2>' +
    '<p style="color:#555;margin-top:0;">A visitor submitted the <strong>' + escapeHtml_(formType) + '</strong> form on kdholidayz.com.</p>' +
    (payload.email ? '' : '<p style="color:#b02a2a;font-weight:600;">⚠️ No email address was provided — follow up by phone.</p>') +
    '<table style="border-collapse:collapse;width:100%;margin-top:12px;">' + rowsHtml + '</table>' +
    '</div>';

  sendBrandedEmail_({
    to: ADMIN_EMAIL,
    subject: subject,
    htmlBody: htmlBody
  });
}

// Sends a "we got your enquiry, a consultant will connect soon" auto-reply to
// the address the visitor entered in the form (payload.email). Silently skips
// when no / an invalid email was provided (Contact & Custom Tour make it
// optional). Sends via Zoho as info@kdholidayz.in.
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
    '</div>';

  sendBrandedEmail_({
    to: to,
    subject: subject,
    htmlBody: htmlBody
  });
}

/**
 * Single send path for all outgoing mail. Appends the shared signature
 * block (Regards / proprietor / logo + office + contacts) and sends via
 * the Zoho Mail API as info@kdholidayz.in.
 *
 * opts: { to, subject, htmlBody }
 *
 * Note: Zoho's send-mail API has no reply-to field (confirmed against
 * Zoho's own API docs — fromAddress/toAddress/cc/bcc/subject/content/
 * mailFormat/askReceipt is the full set) and no plain-text alternative
 * body, so this only sends HTML. Practical effect on the admin
 * notification: hitting "reply" goes back to info@kdholidayz.in itself,
 * not straight to the customer the way it did on Gmail (where replyTo
 * was set to the customer's address). The customer's email is already in
 * the notification's table, and the subject includes their name.
 */
function sendBrandedEmail_(opts) {
  sendViaZoho_({
    to: opts.to,
    subject: opts.subject,
    htmlBody: opts.htmlBody + buildEmailFooterHtml_()
  });
}

/* ==================== Zoho Mail (OAuth) ====================
 * Sends outgoing mail through the Zoho Mail API, authenticated as
 * info@kdholidayz.in via OAuth (refresh-token flow — see setup below).
 * Credentials live in this script's Script Properties (Project Settings
 * → Script Properties in the Apps Script editor), never in this file:
 *   ZOHO_CLIENT_ID       — from the Self Client's "Client Secret" tab
 *   ZOHO_CLIENT_SECRET   — same tab
 *   ZOHO_REFRESH_TOKEN   — generated once via the Self Client's
 *                          "Generate Code" flow (see the one-time setup
 *                          steps documented alongside this file)
 *   ZOHO_ACCOUNTS_SERVER — e.g. "https://accounts.zoho.in" — must match
 *                          the data center the Zoho account lives on.
 *                          The mail API's own host is derived from this
 *                          (accounts.zoho.X → mail.zoho.X) rather than
 *                          taken from the token response's `api_domain`
 *                          field — verified directly against the live
 *                          account: that field comes back as
 *                          www.zohoapis.in, which 404s on the mail
 *                          endpoints; mail.zoho.in is what actually works.
 *   ZOHO_ACCOUNT_ID      — this mailbox's numeric account id (fetched via
 *                          GET {mail-host}/api/accounts — see
 *                          logZohoAccountInfo_() below if it's ever
 *                          needed again, e.g. after switching mailboxes)
 */

function zohoMailHost_(accountsServer) {
  return accountsServer.replace("accounts.zoho", "mail.zoho");
}

function getZohoAccessToken_() {
  var props = PropertiesService.getScriptProperties();
  var cache = CacheService.getScriptCache();
  var cached = cache.get("zohoAccessToken");
  if (cached) return cached;

  var accountsServer = props.getProperty("ZOHO_ACCOUNTS_SERVER");
  var resp = UrlFetchApp.fetch(accountsServer + "/oauth/v2/token", {
    method: "post",
    muteHttpExceptions: true,
    payload: {
      client_id: props.getProperty("ZOHO_CLIENT_ID"),
      client_secret: props.getProperty("ZOHO_CLIENT_SECRET"),
      refresh_token: props.getProperty("ZOHO_REFRESH_TOKEN"),
      grant_type: "refresh_token"
    }
  });

  var data = JSON.parse(resp.getContentText());
  if (!data.access_token) throw new Error("Zoho token refresh failed: " + resp.getContentText());

  // Valid for 3600s per Zoho; cache a little short of that so a
  // near-expiry token is never handed to a caller mid-request.
  cache.put("zohoAccessToken", data.access_token, 3300);
  return data.access_token;
}

function sendViaZoho_(opts) {
  var props = PropertiesService.getScriptProperties();
  var accountId = props.getProperty("ZOHO_ACCOUNT_ID");
  var accountsServer = props.getProperty("ZOHO_ACCOUNTS_SERVER");
  if (!accountId || !accountsServer) {
    throw new Error("Zoho not configured yet — set ZOHO_ACCOUNT_ID and ZOHO_ACCOUNTS_SERVER in Script Properties.");
  }

  var resp = UrlFetchApp.fetch(zohoMailHost_(accountsServer) + "/api/accounts/" + accountId + "/messages", {
    method: "post",
    contentType: "application/json",
    muteHttpExceptions: true,
    headers: { Authorization: "Zoho-oauthtoken " + getZohoAccessToken_() },
    payload: JSON.stringify({
      fromAddress: ADMIN_EMAIL,
      toAddress: opts.to,
      subject: opts.subject,
      content: opts.htmlBody,
      mailFormat: "html",
      askReceipt: "no"
    })
  });

  var data = JSON.parse(resp.getContentText());
  if (!data.status || data.status.code !== 200) {
    throw new Error("Zoho send failed: " + resp.getContentText());
  }
}

// Diagnostic helper — run manually from the Apps Script editor (only
// needed again if the mailbox account id ever needs re-checking, e.g.
// after switching Zoho accounts) after ZOHO_CLIENT_ID / ZOHO_CLIENT_SECRET
// / ZOHO_REFRESH_TOKEN / ZOHO_ACCOUNTS_SERVER are set. Prints this
// mailbox's account id to the execution log — set that as ZOHO_ACCOUNT_ID.
function logZohoAccountInfo_() {
  var props = PropertiesService.getScriptProperties();
  var accountsServer = props.getProperty("ZOHO_ACCOUNTS_SERVER");
  var tokenResp = UrlFetchApp.fetch(accountsServer + "/oauth/v2/token", {
    method: "post",
    muteHttpExceptions: true,
    payload: {
      client_id: props.getProperty("ZOHO_CLIENT_ID"),
      client_secret: props.getProperty("ZOHO_CLIENT_SECRET"),
      refresh_token: props.getProperty("ZOHO_REFRESH_TOKEN"),
      grant_type: "refresh_token"
    }
  });
  var tokenData = JSON.parse(tokenResp.getContentText());
  if (!tokenData.access_token) {
    Logger.log("Token exchange failed: " + tokenResp.getContentText());
    return;
  }

  var acctResp = UrlFetchApp.fetch(zohoMailHost_(accountsServer) + "/api/accounts", {
    headers: { Authorization: "Zoho-oauthtoken " + tokenData.access_token },
    muteHttpExceptions: true
  });
  Logger.log("Accounts response (find accountId for info@kdholidayz.in, set as ZOHO_ACCOUNT_ID): " + acctResp.getContentText());
}

// Branded signature block: "Regards, <proprietor> (<title>) / <company>"
// followed by the logo beside the office address/contact details, matching
// the company's existing Zoho signature style, plus an automated-message
// disclaimer since these (unlike a personal reply) are sent by the script.
// The logo is a plain external <img> pointing at the live site — Zoho's
// send-mail API takes a `content` HTML string with no attachment/
// inline-image field (unlike MailApp's inlineImages), so this is the
// straightforward option; the tradeoff is some mail clients hide external
// images until the recipient clicks "show images".
function buildEmailFooterHtml_() {
  var siteLabel = COMPANY.website.replace(/^https?:\/\//, "");

  return (
    '<div style="font-family:Arial,Helvetica,sans-serif;max-width:640px;margin:28px auto 0;padding-top:16px;font-size:13px;line-height:1.6;color:#1a1a1a;">' +
      '<div>Regards,</div>' +
      '<div style="margin-top:10px;font-weight:700;">' + escapeHtml_(COMPANY.proprietor) + ' (' + escapeHtml_(COMPANY.proprietorTitle) + ')</div>' +
      '<div style="font-weight:700;">' + escapeHtml_(COMPANY.name) + '</div>' +
      '<table style="margin-top:14px;border-collapse:collapse;"><tr>' +
        '<td style="vertical-align:top;padding-right:16px;">' +
          '<img src="' + escapeHtml_(COMPANY.logoUrl) + '" alt="' + escapeHtml_(COMPANY.name) + '" height="70">' +
        '</td>' +
        '<td style="vertical-align:top;border-left:1px solid #999;padding-left:16px;color:#444;">' +
          '<div>' + escapeHtml_(COMPANY.office.address) + '</div>' +
          '<div>Mobile: ' + escapeHtml_(COMPANY.office.mobile) + '</div>' +
          '<div>EMail: <a href="mailto:' + escapeHtml_(COMPANY.office.email) + '" style="color:#0b3d5c;">' + escapeHtml_(COMPANY.office.email) + '</a></div>' +
          '<div>Web: <a href="' + COMPANY.website + '" style="color:#0b3d5c;">' + escapeHtml_(siteLabel) + '</a></div>' +
        '</td>' +
      '</tr></table>' +
      '<div style="margin-top:14px;color:#999;font-size:11px;border-top:1px solid #e5e5e5;padding-top:10px;">This is an automated message from the KD Holidayz website.</div>' +
    '</div>'
  );
}

function escapeHtml_(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}