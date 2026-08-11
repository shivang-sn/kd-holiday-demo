# KD Holidayz — Website Build Brief
### Senior design + 11ty engineering prompt, derived from client-supplied assets
Prepared by Neetrick · Source docs: Project Quotation (₹25,000 estimation), Client Requirement List, KD Holidayz Company Profile deck, flyer/logo/business card

---

## 0. What we actually know (extracted, not invented)

**Company:** KD Holidayz — "A Dream Quest Explorers!" · Travel consulting firm, founded 2023
**Offices:** Head Office — "Hreehan Complex," Patel Samaj, Jamnagar, Gujarat, India · / +91 9429799355
**Branch:** Ronald Ngala Street, P.O. Box 4309-30100, Eldoret, Kenya · +254 731062066 / +91 8660401151 · maithri.shah@kdholidayz.in
**Global:** info@kdholidayz.in · www.kdholidayz.in

**People:**
- Dhaval Gudhka — Founder (India Operations)
- Meeren Shah — Partner, Africa Operations
- Maithri Shah — Partner, Africa Operations

**Positioning (from slide 3):** "We go beyond selling packages" — a 3-step philosophy: **Consult → Plan → Deliver**. Personal, consultant-led travel planning rather than templated packages.

**Core services:** International Packages · Domestic Packages · MICE Tours · Spiritual/Pilgrimage Tours
**Allied services:** Flights Ticketing · Hotel Reservation · Transport · Visa/Insurance
**Extended services (from requirement list, confirm with client which are active):** Honeymoon Packages, Group Tours, Corporate Tours, School/College Trips, Bus/Train Booking, Passport Assistance, Travel Insurance, Cab Service, Cruise Booking, Customized Holiday Packages, Wellness Packages, Hospitality Consultant

**Real testimonials on file (usable verbatim, with permission):**
- Mayur Nakhva — Char Dham Yatra: *"...Dhavalbhai's personal involvement gave us complete confidence throughout the yatra"*
- Neel Vachhani — Bali (honeymoon, customised)
- Neha Shah — Bali
- Sheetal Trivedi — Turkey
- Pooja Jain — Singapore
- Hiten Malde — Kerala
- Sanjay Desai — Europe (Switzerland–Paris)
- Kunal Parekh — Andaman Islands
(Full quotes are in the deck; carry them over verbatim into `_data/testimonials.json`.)

**Live/seasonal offers found in the deck (treat as swappable promo content, not permanent copy):**
- Rishikesh wellness retreat — ₹50,000 (single occ.) / ₹45,000 (double occ.) per person
- Chardham Yatra by Helicopter, Ex-Dehradun, 5N/6D
- Chardham Yatra by Land, Ex-Dehradun 9N/10D or Ex-Delhi 11N/12D, starting ₹30,000 (fixed April departure dates)
- Canton Fair (Guangzhou/Foshan/Hong Kong) B2B sourcing tour — niche corporate/trade package, 3 phases, April–May 2026, from ₹71,999

**Ready-made FAQ copy (slide 16)** — what we offer, customised vs fixed, key destinations, why KD Holidayz, pricing clarity, travel support, payments & presence. Use as the seed FAQ set.

**Visual identity (sampled from logo/flyer — confirm exact hex/fonts with client):**
- Palette: deep teal/forest green (headers, footer), warm gold/amber (sun, accents, CTAs), terracotta/rust red (logotype "KD"), navy (ribbon/tagline), sky teal (wave accent), white base
- Logo mark: sun + palm tree + hibiscus + birds, brush-script "Holidayz" — don't try to recreate the brush script in UI type; pull *mood* (warm, tropical, personal) not the literal font
- Motif candidates for the site: rounded/organic card corners, a thin wave/ribbon divider (echoes the navy ribbon under the logo), circular photo frames (already used in the flyer's 5-destination row)

**Gaps the client still needs to fill (requirement list, unanswered):** Mission/Vision exact wording, business hours, precise stats (happy customers, tours completed, destinations covered, years of experience, repeat customers), official brand hex/fonts, Privacy Policy / T&C / Cancellation / Refund legal text, GST number, payment/UPI details if online payment is ever added. Flag these as placeholders in the build — don't fabricate numbers or legal text.

---

## 0.5 UI/layout reference — https://yathart-demo-site.vercel.app/

Client-designated visual and structural benchmark. Extracted directly from the live site (design tokens pulled from computed CSS, not guessed):

**Design tokens found on the reference (adapt colors to KD, keep the system):**
```css
--blue: #1A5A9A;        /* → replace with KD deep teal, e.g. #0E4D45 */
--blue-dark: #0f3d6e;   /* → KD teal-dark, e.g. #08332E */
--blue-light: #2471b3;  /* → KD teal-light, e.g. #17756B */
--orange: #F5931E;      /* → KD gold/amber accent, e.g. #F2A81D (matches the logo's sun) */
--orange-dark: #d4780f; /* → KD gold-dark, e.g. #D68E0E */
--white: #ffffff;
--off-white: #f8f9fc;
--gray-100: #f1f5f9;  --gray-200: #e2e8f0;  --gray-400: #94a3b8;
--gray-600: #475569;  --gray-800: #1e293b;  --black: #0a0f1a;
--radius-sm: 8px;  --radius-md: 16px;  --radius-lg: 24px;  --radius-xl: 40px;
--shadow-sm: 0 2px 12px rgba(teal,0.08);
--shadow-md: 0 8px 32px rgba(teal,0.14);
--shadow-lg: 0 24px 64px rgba(teal,0.18);
--shadow-xl: 0 40px 80px rgba(teal,0.22);
--transition: all 0.35s cubic-bezier(0.4,0,0.2,1);
```
- **Single font family throughout** (no separate display/body split): Inter, weight 800 / -1.5px tracking for H1 (~76px desktop), weight 700 for H2 (~44px), weight 600 for buttons (~14px). We'll do the same for KD — Inter end to end — since that's what the client is pointing at, rather than the two-font pairing suggested earlier in this brief.
- **Generous, soft radius scale** (8/16/24/40px) on every card, button, and image frame — this is the single biggest driver of the "Framer/Webflow" feel, more than color. Pill-shaped buttons, large-radius cards, large-radius hero image frames.
- **Colored shadows, not gray** — shadows tinted with the brand primary at low opacity, not `rgba(0,0,0,...)`. Do the same with KD teal.
- Header/hero use a dark section (near-black `--black`) with white text; content sections alternate white and `--off-white`; cards sit on white with the colored shadow, never a border.

**Section-by-section structure found on each reference page** (this is the layout to replicate with KD content/palette — see the rewritten Section 4 below, which is now built directly off this):
- **Home:** announcement strip → hero w/ destination search + rating badge + scroll cue → animated stat bar (4 counters) → "Why choose us" (icon list + 5 big stat tiles) → destinations carousel with Domestic/International tabs, "Quick Inquiry" on every card → tour-category icon grid (with package counts) → photo "Moments" grid → Limited-Time Offers with live countdown timers → testimonial carousel (prev/next) → newsletter bar → footer.
- **About:** hero → Mission & Vision two-card block → year-by-year founding story timeline → 6-pillar "why choose us" icon grid → team grid → stat row → 5-step "how it works" → FAQ accordion → (reference embeds Privacy/Terms as in-page anchors here — KD keeps these as their own quoted pages instead, styled with the same checklist-card treatment) → closing CTA → footer.
- **Destinations listing:** hero w/ count + search → filter chip row (All / Domestic / International / Budget / Luxury / Adventure / Family / Honeymoon / Pilgrimage) → card grid (flag/region tag, days, rating, title, subtitle, from-price, "Inquire Now") → Load More → "Can't find your destination?" custom-request banner → newsletter → footer.
- **Destination detail:** breadcrumb → title block (nights/days, rating, group/private, key places) → tag pill row → overview copy → "Activities Included" icon grid → "Top Places to Visit" cards → "Famous Local Food" cards → "Recommended Hotels" mini-cards with Select → day-by-day itinerary (expandable) → "Download Full Itinerary PDF" → **sticky booking sidebar** (discounted price, days/rating/max-pax chips, mini form: name/phone/date/travelers, Book Now, trust badges) → "Need help? Call us" banner → related destinations CTA → footer.
- **Contact:** hero → 5 info cards (Call / WhatsApp / Email / Visit Office / Business Hours) → "We're here to help" 3-perk row + social links → full inquiry form (destination, date, travelers, budget, **trip-type chips**, message) → office location block w/ working hours + WhatsApp CTA → FAQ accordion → emergency/on-trip support banner → newsletter → footer.
- **Sitewide "Plan Your Trip" quick-enquiry drawer** (slide-in panel, triggered from the nav CTA and every "Quick Inquiry"/"Book Now" button): shows the selected destination as context, then Full Name*, Phone*, Email, Travel Date*, No. of Travelers (dropdown), Budget Range (dropdown), Additional Notes (textarea), Submit → success state ("Thank you! Our team will reach out within 2 hours" — adapt copy to KD).

**What we will NOT copy:** the reference's fabricated stats (15,000+ travelers, founded 2012, awards, 60+ staff) and its Indore/Madhya Pradesh identity — none of that applies to KD. It's a layout/UI reference only; every number and story beat gets replaced with KD's real content from Section 0, or a `[TODO: client]` placeholder where KD hasn't supplied one yet.

---

## 1. Design system prompt (the "20-years, Framer/Webflow" brief)

> Design and build this as a senior product designer would in Framer or Webflow — not a template-stitched brochure site. Principles:
> - **Generous whitespace, confident type scale.** Match the reference's scale: H1 ~76px/800-weight/-1.5px tracking on desktop, H2 ~44px/700-weight, body 16-18px. Single font family — **Inter** — for everything, self-hosted and subset for performance. (Superseding this brief's earlier two-font suggestion: the client-designated reference uses one font throughout, so we do too.)
> - **Motion with restraint.** Scroll-triggered fade/rise on section entry (Intersection Observer, ~350ms, `cubic-bezier(0.4,0,0.2,1)` — the exact easing sampled from the reference), count-up stat numbers on scroll-into-view, live countdown timers on time-limited offers, card hover = subtle lift + colored shadow, never spin/rotate gimmicks.
> - **Color discipline, tokens adapted from the reference.** Deep teal (`#0E4D45`) replaces the reference's blue as the dominant chrome/nav/footer/button color, gold (`#F2A81D`, matches the logo's sun) replaces its orange as the single CTA/highlight accent, terracotta stays reserved for the logotype only. Off-white (`#F8F9FC`) and white alternate as section backgrounds; near-black (`#0A0F1A`) for the hero/dark sections. Never let more than 2 accent colors compete on one screen.
> - **Generous soft-radius everywhere.** 8/16/24/40px radius scale (buttons pill-shaped, cards large-radius, hero image frames large-radius) — sampled directly from the reference, this is what reads as "Framer/Webflow" rather than "template."
> - **Colored shadows, never gray.** All card/button shadows tinted with the teal primary at 8–22% opacity (`shadow-sm` through `shadow-xl`, same 4-step scale as the reference).
> - **Componentized, not one-off.** Every recurring pattern (destination card, testimonial card, stat tile, offer card, accordion, tabbed itinerary) is one component reused everywhere via 11ty includes/shortcodes — never hand-copied HTML per page.
> - **Real content over lorem ipsum.** Use the extracted testimonials, service names, and office details verbatim from this brief; mark anything unconfirmed with a visible `[TODO: client]` in the data file, not in rendered HTML.
> - **Mobile-first, thumb-reachable.** Sticky bottom action bar on mobile (Call / WhatsApp / Enquire) on all money pages (Home, Destination Detail, Custom Tour, Contact).

---

## 2. Technical architecture (11ty)

- **Eleventy 3.x**, Nunjucks templates, output to `_site/` — plain static HTML/CSS/JS, deployable to any shared/cPanel host (matches the estimation's "Deployment on Client Hosting" line, no server runtime required).
- **Content model as data, not hardcoded markup:**
  - `src/destinations/*.md` — front matter: `name, region (domestic|international), country, durationDays, durationNights, startingPrice, includes[], excludes[], bestTime, tags[] (honeymoon/family/adventure/spiritual/group), images[]`. Eleventy collection `destinations`, paginated listing + auto-generated detail pages.
  - `src/_data/company.json` — offices, phones, emails, socials, stats (placeholders flagged).
  - `src/_data/team.json`, `src/_data/testimonials.json`, `src/_data/faqs.json`, `src/_data/services.json` — seeded from Section 0 above.
  - `src/packages/*.md` — custom/seasonal offer cards (Rishikesh, Chardham, Canton Fair) so these can be swapped without touching templates.
- **Images:** `@11ty/eleventy-img` pipeline — responsive widths, WebP/AVIF with JPEG fallback, lazy-loaded below the fold, eager + `fetchpriority=high` on the hero image only.
- **CSS:** hand-written with CSS custom properties as a design-token file (`tokens.css`: colors, spacing, radii, shadows, type scale) — no heavy framework needed at this scope; keeps Lighthouse scores high on a budget build.
- **JS:** vanilla, no framework — small modules for: mobile nav, accordion (FAQ), tabs (itinerary), testimonial/offer carousel, scroll-reveal, count-up, lightbox (gallery), sticky mobile action bar.
- **Forms:** scope specifies Google Forms (cheapest, matches ₹25k estimation) — embed via iframe or redirect-on-submit. Note for the client: a native-styled form via Formspree/Web3Forms would look and convert better and is a small upsell if they want it later; don't build it by default since it's outside the quoted scope.
- **SEO:** per-page front matter (`title`, `description`, `ogImage`), `sitemap.xml` + `robots.txt`, JSON-LD `TravelAgency`/`LocalBusiness` schema for both India and Kenya locations, `hreflang` not needed (single locale).
- **Integrations:** WhatsApp floating button (`wa.me` deep link) site-wide, click-to-call `tel:` links, Google Maps embed (India HQ + Kenya branch), social icon row (Instagram/Facebook/YouTube/LinkedIn — confirm which handles exist).

---

## 3. Sitemap (matches the 10 quoted pages + shared components)

```
/                          Home
/about/                    About
/services/                 Services
/destinations/             Destination listing (filterable)
/destinations/:slug/       Destination detail (generated per collection item)
/custom-tour/              Custom Tour & Packages
/gallery/                  Gallery
/contact/                  Contact Us
/privacy-policy/           Privacy Policy
/terms-conditions/         Terms & Conditions
```
Shared components (not standalone pages): enquiry/booking modal, WhatsApp float, header/mega-menu, footer, FAQ accordion, testimonial carousel, stat counter.
**Explicitly out of scope** (flag if client asks): Blog, Newsletter signup, online payment/checkout — these were checkboxes in the requirement list but not in the quoted 10-page scope; quote separately per the estimation's "Additional Work" clause.

---

## 4. Page-by-page section breakdown
*(Each page's section order now mirrors the reference site 1:1 where a matching page exists; content is 100% KD's, from Section 0 or flagged `[TODO: client]`.)*

### Home (`/`) — mirrors reference `index.html`
1. **Announcement strip** (dismissible) — live seasonal offer, e.g. "Chardham Yatra 2026 — Helicopter & Land packages open →"
2. **Header/nav** — logo left, Home / About / Services / Destinations / Custom Tour / Gallery / Contact, primary "Plan Your Trip" button opens the shared Quick-Enquiry Drawer (see Section 4a), persistent WhatsApp icon
3. **Hero** — dark near-black section, full-bleed rotating imagery (Amer Fort, houseboat, Dubai skyline, African safari — same set as the flyer collage), tagline-driven H1 (~76px/800), destination search field, star-rating badge (once client has a real aggregate rating), scroll cue
4. **Stat bar** — 4 animated count-up tiles: Happy Customers / Destinations Covered / Tours Completed / Years of Experience (`[TODO: client numbers]`)
5. **Why Choose Us** — expand the flyer's 3-item USP bar into an icon-list (best price, trusted, 24/7 support, experienced consultants, customized itineraries, no hidden charges) *plus* 5 big stat tiles in the reference's style (e.g. "45+ Destinations Covered," "99%+ Smooth Departures" — only ship numbers the client confirms), "Learn Our Story" CTA → About
6. **Featured Destinations** — Domestic/International tab toggle, card carousel (flag/region tag, days, rating placeholder, name, from-price, "Quick Inquiry" opens the drawer pre-filled with that destination), "View All Destinations" CTA
7. **Tour Categories** — icon grid with package counts, seeded from KD's actual services: Family, Honeymoon, Group, Corporate/MICE, Spiritual/Pilgrimage, Wellness, Adventure, Custom (counts wired to real collection counts, not invented like the reference's)
8. **Gallery "Moments" grid** — photo grid with captions (Office / Team / Tour Groups / Destinations / Events / Customer Photos), "View Full Gallery" CTA → `/gallery/`
9. **Limited-Time Offers** — promo cards with live countdown timers for genuinely time-bound offers only (Chardham fixed April departure dates, Rishikesh retreat) — no fake discount math like the reference; only show a struck-through price if there's a real one
10. **Testimonials carousel** — real quotes from Section 0 (Mayur Nakhva, Neel Vachhani, Sheetal Trivedi, Pooja Jain, Hiten Malde, Sanjay Desai, Kunal Parekh), prev/next controls
11. **Meet the Consultants** teaser — Dhaval, Meeren, Maithri strip → `/about/`
12. **Newsletter/CTA bar** — optional, only if client wants an email list (flag as extra, not in quoted scope)
13. **Footer** — sitemap, both offices, socials, legal links

### About (`/about/`) — mirrors reference `about.html`
1. Header/breadcrumb, "Our Story" hero
2. **Mission & Vision** two-card block — `[TODO: client]` placeholders, styled ready to receive copy
3. **Consult → Plan → Deliver** — KD's actual stated differentiator (slide 3), shown as a short "our story" narrative + 3-step visual, in place of the reference's fabricated 2012–2025 timeline (KD was founded 2023 — a full year-by-year timeline isn't credible yet; use a simple "Founded 2023, India + Kenya" story block instead)
4. **Why Choose Us** — 6-pillar icon grid (full version, reused component from Home)
5. **Team grid** — Dhaval Gudhka (Founder), Meeren Shah (Africa Ops Partner), Maithri Shah (Africa Ops Partner), photo + role + short intro per person
6. **Stat row** (reused component)
7. **How It Works** — 5-step timeline: Enquire → Consult → Customize → Confirm → Travel
8. **FAQ accordion** — seeded from slide 16
9. Closing CTA band → Destinations / Contact
10. Footer
*(Unlike the reference, Privacy Policy and T&C stay as their own dedicated pages — see below — since that's what's in the quoted scope, rather than in-page anchors on About.)*

### Services (`/services/`)
*(No direct reference page — built from the reference's pillar-grid/icon-list visual language, applied to KD's actual service list.)*
1. Header banner
2. Core Services — 4 alternating image/text feature blocks: International, Domestic, MICE & Group, Spiritual/Pilgrimage
3. Allied Services grid — Flights, Hotels, Transport/Cab, Visa & Insurance, Bus/Train, Passport Assistance, Cruise, Corporate/School Trips, Customized Packages (confirm active list with client)
4. How It Works — 5-step timeline (reused component from About)
5. CTA — "Get a Custom Quote" → opens Quick-Enquiry Drawer

### Destination Listing (`/destinations/`) — mirrors reference `destinations.html`
1. Hero — "Explore Our Destinations" + count + search field
2. Filter chip row — All / Domestic / International / Family / Honeymoon / Spiritual / Adventure / Group (mapped to KD's real tags, not the reference's "Budget/Luxury" split unless KD wants tiered pricing)
3. Card grid, data-driven from the `destinations` collection — region flag/tag, duration, name, subtitle, from-price, "Inquire Now" opens the drawer
4. Load-more / pagination
5. "Can't find your destination?" banner → Custom Tour page
6. Footer

### Destination Detail (`/destinations/:slug/`, auto-generated) — mirrors reference `destination-detail.html`
1. Breadcrumb → title block (nights/days, group/private, key places)
2. Tag pill row (e.g. Mountain Views, Houseboat Stay — per-destination)
3. Overview copy
4. "Activities Included" icon grid
5. "Top Places to Visit" cards
6. "Local Food to Try" cards (where relevant/known)
7. "Recommended Hotels" mini-cards (only if KD supplies partner hotel names — otherwise omit rather than invent)
8. Day-by-day itinerary, expandable
9. "Download Full Itinerary PDF" (optional — only if KD wants to produce PDFs per package)
10. **Sticky booking sidebar** — price, day/rating/max-pax chips, mini form (name/phone/date/travelers), Book Now, trust badges (secure booking, free cancellation terms once KD confirms a policy)
11. "Need help? Call us" banner (direct `tel:` link to the Jamnagar HQ number)
12. Related destinations CTA
13. Footer

### Custom Tour & Packages (`/custom-tour/`)
*(No direct reference page, but reuses the reference's Quick-Enquiry Drawer field set as a full-page form instead of a drawer.)*
1. Header — "Design Your Own Journey"
2. Full enquiry form: Destination → Travel dates → Adults/Children → Budget → Special requirements (exact fields from the requirement list's Booking Form section)
3. Popular themes — Honeymoon, Family, Group/Corporate, School/College, Wellness, Adventure (cards, same icon-grid component as Home's Tour Categories)
4. Featured specialized packages — Canton Fair B2B tour, Rishikesh wellness retreat, as worked examples of "we build anything"
5. Why customize with KD Holidayz — value props
6. CTA — direct WhatsApp chat for a fast quote

### Gallery (`/gallery/`)
*(Expands the reference's homepage "Moments" grid into its own filterable page.)*
1. Header banner
2. Filter tabs — Office / Team / Tour Groups / Destinations / Events / Customer Photos (matches requirement list's gallery categories exactly)
3. Masonry grid + lightbox, lazy-loaded (same visual card style as the reference's Moments grid)
4. Instagram embed (only if client confirms an active handle)
5. CTA — "Tag us in your trip photos"

### Contact (`/contact/`) — mirrors reference `contact.html`
1. Hero — "Let's Plan Your Dream Trip"
2. 5 info cards — Call, WhatsApp, Email, Visit Office (pick India HQ or show both), Business Hours (`[TODO: client]`)
3. "We're Here to Help" 3-perk row (fast response, free consultation, no-pressure) + social links
4. Full inquiry form — name, phone, email, destination, travel date, travelers, budget, **trip-type chips** (Family/Honeymoon/Adventure/Spiritual/Corporate/Group/Solo), message
5. Office location block(s) — India HQ + Kenya branch, each with address, embedded map, working hours, WhatsApp CTA
6. FAQ accordion (general, seeded from slide 16)
7. Footer

### Privacy Policy (`/privacy-policy/`)
Own dedicated page (per the quoted 10-page scope — not folded into About like the reference). Styled with the same checklist-card treatment the reference uses for its embedded privacy block (icon + short bullet list), sticky in-page TOC if long, "last updated" date. Content must come from the client (requirement list #16, not yet supplied) — do not draft placeholder legal text, leave clearly marked as pending.

### Terms & Conditions (`/terms-conditions/`)
Same treatment, own dedicated page, to include Cancellation & Refund policy once supplied.

### 4a. Shared component — Quick-Enquiry Drawer
Slide-in panel (not a full page), triggered from the nav "Plan Your Trip" button and every "Quick Inquiry"/"Book Now"/"Inquire Now" card action sitewide — mirrors the reference's drawer exactly:
- Shows selected destination as context (if triggered from a card)
- Fields: Full Name*, Phone Number*, Email Address, Travel Date*, No. of Travelers (dropdown), Budget Range (dropdown), Additional Notes (textarea)
- Submit → success state, KD-appropriate copy (e.g. "Thank you! Our consultant will reach out shortly.")
- Wire to whatever backend the client approves (Google Form passthrough per quoted scope, or a lightweight form service as a paid upsell — see Section 2)

---

## 5. Before development starts — send this back to the client
1. Confirmed Mission & Vision wording
2. Business hours
3. Real stats: happy customers, tours completed, destinations covered, years of experience, repeat customers
4. Official brand hex codes / fonts (if any exist beyond the logo)
5. Privacy Policy, T&C, Cancellation & Refund Policy text
6. Confirmation on which "extended services" list (honeymoon, corporate, cruise, etc.) is actually active
7. Final destination package list with per-package includes/excludes/images (only Char Dham, Bali, Kerala, Turkey, Singapore, Europe, Andaman are evidenced so far — from testimonials, not full package sheets)
8. Active social media handles

## 6. Suggested next step
Scaffold the 11ty project skeleton (folder structure, `_data` files pre-filled with everything confirmed in Section 0, tokens.css from the sampled palette) so the client-facing gaps in Section 5 are the *only* blockers left before content-complete.
