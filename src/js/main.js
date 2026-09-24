(function () {
  "use strict";

  /* ---------- Featured Destinations decorative doodle (GSAP float + morph) ---------- */
  var featuredDecor = document.getElementById("featuredDecor");
  if (
    featuredDecor &&
    window.gsap &&
    window.MorphSVGPlugin &&
    !window.matchMedia("(prefers-reduced-motion: reduce)").matches
  ) {
    gsap.registerPlugin(MorphSVGPlugin);

    // Whole doodle gently floats/drifts as one piece.
    gsap.to(featuredDecor, {
      y: 16,
      rotation: 5,
      duration: 3,
      ease: "sine.inOut",
      yoyo: true,
      repeat: -1,
    });
    gsap.to(featuredDecor, {
      x: -12,
      duration: 4.2,
      ease: "sine.inOut",
      yoyo: true,
      repeat: -1,
      delay: 0.4,
    });

    // The small top-right spark continuously morphs between three shapes —
    // its own original silhouette, a sparkle/star, and a circle — using
    // MorphSVGPlugin (bundled free with gsap since the GreenSock/Webflow move).
    var morphTarget = document.getElementById("morphTarget");
    if (morphTarget) {
      var originalPath = morphTarget.getAttribute("d");
      var starShape =
        "M2245,95 L2278,182 L2365,215 L2278,248 L2245,335 L2212,248 L2125,215 L2212,182 Z";
      var circleShape =
        "M2150,215 A95,95 0 1,0 2340,215 A95,95 0 1,0 2150,215 Z";

      var morphTl = gsap.timeline({ repeat: -1, defaults: { duration: 2.2, ease: "power1.inOut" } });
      morphTl
        .to(morphTarget, { morphSVG: starShape })
        .to(morphTarget, { morphSVG: circleShape })
        .to(morphTarget, { morphSVG: originalPath })
        .to(morphTarget, {}, "+=0.6");
    }
  }

  /* ---------- Lottie icon rings (play once, on scroll into view) ---------- */
  var lottieEls = document.querySelectorAll("[data-lottie]");
  if (lottieEls.length && window.lottie && "IntersectionObserver" in window) {
    var lottieObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        var el = entry.target;
        var anim = window.lottie.loadAnimation({
          container: el,
          renderer: "svg",
          loop: false,
          autoplay: true,
          path: el.getAttribute("data-lottie"),
        });
        anim.addEventListener("complete", function () {
          anim.goToAndStop(anim.totalFrames - 1, true);
        });
        lottieObserver.unobserve(el);
      });
    }, { threshold: 0.4 });
    lottieEls.forEach(function (el) { lottieObserver.observe(el); });
  }

  /* ---------- Hero fade slider ---------- */
  var heroSlider = document.getElementById("heroSlider");
  if (heroSlider) {
    var slides = [].slice.call(heroSlider.querySelectorAll(".hero__slide"));
    var dots = [].slice.call(document.querySelectorAll("#heroDots .hero__dot"));
    var heroValue = document.getElementById("heroValue");
    var currentSlide = 0;
    var slideTimer = null;

    function showSlide(index) {
      slides[currentSlide].classList.remove("is-active");
      if (dots[currentSlide]) dots[currentSlide].classList.remove("is-active");
      currentSlide = (index + slides.length) % slides.length;
      var next = slides[currentSlide];
      var bg = next.getAttribute("data-bg");
      if (bg) {
        next.style.backgroundImage = "url('" + bg + "')";
        next.removeAttribute("data-bg");
      }
      next.classList.add("is-active");
      if (dots[currentSlide]) dots[currentSlide].classList.add("is-active");

      if (heroValue) {
        var title = next.getAttribute("data-value-title");
        var desc = next.getAttribute("data-value-desc");
        if (title && desc) {
          heroValue.classList.add("is-fading");
          setTimeout(function () {
            heroValue.innerHTML = "<strong>" + title + "</strong> — " + desc;
            heroValue.classList.remove("is-fading");
          }, 300);
        }
      }
    }

    function startSlider() {
      stopSlider();
      slideTimer = setInterval(function () { showSlide(currentSlide + 1); }, 5000);
    }
    function stopSlider() {
      if (slideTimer) clearInterval(slideTimer);
    }

    dots.forEach(function (dot) {
      dot.addEventListener("click", function () {
        showSlide(parseInt(dot.getAttribute("data-slide-index"), 10));
        startSlider();
      });
    });

    if (slides.length > 1) startSlider();

    /* Warm the browser cache for the remaining slides once the page has
       settled, so rotation never stalls on a cold fetch — without
       competing with critical resources for initial bandwidth. */
    var prefetchIdle = window.requestIdleCallback || function (fn) { setTimeout(fn, 2000); };
    prefetchIdle(function () {
      slides.forEach(function (slide) {
        var bg = slide.getAttribute("data-bg");
        if (bg) new Image().src = bg;
      });
    });
  }

  /* ---------- Cursor follower: instant dot + smoothly-lagging ring -----------
     Same mechanic as the reference site: the dot tracks the mouse directly,
     the ring trails behind it via a lerp animated on requestAnimationFrame,
     and hovering a link/button grows both (the ring's growth+fade is the
     "ripple" — it reverts the moment the pointer leaves, nothing lingers). */
  var cursorDot = document.getElementById("cursorDot");
  var cursorRipple = document.getElementById("cursorRipple");
  var CURSOR_HOVER_TARGETS = "a, button, .btn, .dest-card, .category-tile, .gallery-item, .offer-card, .filter-chip, [data-drawer-open]";
  if (cursorDot && cursorRipple && window.matchMedia("(hover: hover) and (pointer: fine)").matches) {
    var mx = 0, my = 0, fx = 0, fy = 0;
    var hasMoved = false;

    document.addEventListener("mousemove", function (e) {
      mx = e.clientX;
      my = e.clientY;
      cursorDot.style.left = mx + "px";
      cursorDot.style.top = my + "px";
      if (!hasMoved) {
        hasMoved = true;
        fx = mx;
        fy = my;
        cursorDot.classList.add("is-visible");
        cursorRipple.classList.add("is-visible");
      }
    });

    function animateRipple() {
      fx += (mx - fx) * 0.12;
      fy += (my - fy) * 0.12;
      cursorRipple.style.left = fx + "px";
      cursorRipple.style.top = fy + "px";
      requestAnimationFrame(animateRipple);
    }
    animateRipple();

    document.addEventListener("mouseover", function (e) {
      var target = e.target.closest(CURSOR_HOVER_TARGETS);
      if (!target) return;
      cursorDot.classList.add("is-hovering");
      cursorRipple.classList.add("is-hovering");
    });

    document.addEventListener("mouseout", function (e) {
      var target = e.target.closest(CURSOR_HOVER_TARGETS);
      if (!target) return;
      var toTarget = e.relatedTarget && e.relatedTarget.closest && e.relatedTarget.closest(CURSOR_HOVER_TARGETS);
      if (toTarget === target) return;
      cursorDot.classList.remove("is-hovering");
      cursorRipple.classList.remove("is-hovering");
    });

    document.addEventListener("mouseleave", function () {
      cursorDot.classList.remove("is-visible");
      cursorRipple.classList.remove("is-visible");
    });
  }

  /* ---------- Header: hide on scroll down, reveal on scroll up ---------- */
  var siteHeader = document.getElementById("siteHeader");
  if (siteHeader) {
    var lastScrollY = window.scrollY;
    var ticking = false;
    var hideThreshold = 80;

    function updateHeader() {
      var currentY = window.scrollY;
      if (currentY > hideThreshold && currentY > lastScrollY) {
        siteHeader.classList.add("is-hidden");
      } else {
        siteHeader.classList.remove("is-hidden");
      }
      lastScrollY = currentY;
      ticking = false;
    }

    window.addEventListener("scroll", function () {
      if (!ticking) {
        requestAnimationFrame(updateHeader);
        ticking = true;
      }
    }, { passive: true });
  }

  /* ---------- Mobile nav ---------- */
  var navToggle = document.getElementById("navToggle");
  var siteNav = document.getElementById("siteNav");
  if (navToggle && siteNav) {
    navToggle.addEventListener("click", function () {
      var open = siteNav.classList.toggle("is-open");
      navToggle.setAttribute("aria-expanded", open ? "true" : "false");
      navToggle.textContent = open ? "✕" : "☰";
      document.body.classList.toggle("nav-open", open);
    });
    siteNav.querySelectorAll(".site-nav__list a").forEach(function (link) {
      link.addEventListener("click", function () {
        siteNav.classList.remove("is-open");
        navToggle.setAttribute("aria-expanded", "false");
        navToggle.textContent = "☰";
        document.body.classList.remove("nav-open");
      });
    });
  }

  /* ---------- Announcement bar (fixed to bottom) ---------- */
  var announcement = document.getElementById("announcement");
  var announcementClose = document.getElementById("announcementClose");
  if (announcement && announcementClose) {
    if (sessionStorage.getItem("kd-announcement-dismissed") === "1") {
      announcement.classList.add("is-hidden");
    } else {
      document.body.classList.add("has-announcement");
    }
    announcementClose.addEventListener("click", function () {
      announcement.classList.add("is-hidden");
      document.body.classList.remove("has-announcement");
      sessionStorage.setItem("kd-announcement-dismissed", "1");
    });
  }

  /* ---------- Form validation + Google Sheets submission -----------
     Shared by the quick-enquiry drawer, custom-tour form, and contact
     form. Validates real formats (not just "required"), shows inline
     errors, and — if window.KD_FORM_ENDPOINT is configured (a deployed
     Google Apps Script Web App URL) — posts the submission so it lands
     as a row in a Google Sheet. */
  var FIELD_VALIDATORS = {
    name: function (value) {
      var v = value.trim();
      if (!v) return "Name is required.";
      if (v.length < 2) return "Name is too short.";
      if (!/^[a-zA-ZÀ-ſ\s'.-]{2,60}$/.test(v)) return "Enter a valid name.";
      return null;
    },
    phone: function (value) {
      var v = value.trim();
      if (!v) return "Phone number is required.";
      var digits = v.replace(/\D/g, "");
      if (digits.length < 7 || digits.length > 15) return "Enter a valid phone number.";
      if (!/^[+]?[\d\s().-]{7,25}$/.test(v)) return "Enter a valid phone number.";
      return null;
    },
    email: function (value, required) {
      var v = value.trim();
      if (!v) return required ? "Email is required." : null;
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)) return "Enter a valid email address.";
      return null;
    },
    dateFrom: function (value, required) { return dateValidator(value, required); },
    dateTo: function (value, required) { return dateValidator(value, required); },
    adults: function (value, required) {
      var v = value.trim();
      if (!v) return required ? "Number of adults is required." : null;
      var n = Number(v);
      if (!Number.isInteger(n) || n < 1) return "Enter at least 1 adult.";
      return null;
    },
    departureCity: function (value, required) {
      var v = value.trim();
      if (!v) return required ? "Departure city is required." : null;
      if (v.length < 2) return "Enter a valid city name.";
      return null;
    }
  };

  function dateValidator(value, required) {
    if (!value) return required ? "Please select a date." : null;
    var picked = new Date(value + "T00:00:00");
    var today = new Date();
    today.setHours(0, 0, 0, 0);
    if (isNaN(picked.getTime())) return "Enter a valid date.";
    if (picked < today) return "Please choose a future date.";
    return null;
  }

  function clearFieldError(field) {
    var wrap = field.closest(".form-field");
    if (!wrap) return;
    wrap.classList.remove("has-error");
    var err = wrap.querySelector(".form-field__error");
    if (err) err.remove();
  }

  function setFieldError(field, message) {
    var wrap = field.closest(".form-field");
    if (!wrap) return;
    wrap.classList.add("has-error");
    var err = wrap.querySelector(".form-field__error");
    if (!err) {
      err = document.createElement("span");
      err.className = "form-field__error";
      wrap.appendChild(err);
    }
    err.textContent = message;
  }

  function clearGroupError(container) {
    if (!container) return;
    container.classList.remove("has-error");
    var err = container.querySelector(".form-field__error");
    if (err) err.remove();
  }

  function setGroupError(container, message) {
    if (!container) return;
    container.classList.add("has-error");
    var err = container.querySelector(".form-field__error");
    if (!err) {
      err = document.createElement("span");
      err.className = "form-field__error";
      container.appendChild(err);
    }
    err.textContent = message;
  }

  function validateField(field) {
    if (!field.name || field.type === "hidden" || field.type === "radio" || field.type === "checkbox") return true;
    var validator = FIELD_VALIDATORS[field.name];
    var required = field.hasAttribute("required");
    var message = null;
    if (validator) {
      message = validator(field.value, required);
    } else if (required && !field.value.trim()) {
      message = "This field is required.";
    }
    if (message) {
      setFieldError(field, message);
      return false;
    }
    clearFieldError(field);
    return true;
  }

  function validateForm(form) {
    var valid = true;
    var firstInvalid = null;
    form.querySelectorAll("input[name], textarea[name], select[name]").forEach(function (field) {
      if (field.type === "radio" || field.type === "checkbox") return;
      if (!validateField(field) && !firstInvalid) firstInvalid = field;
      if (field.closest(".form-field") && field.closest(".form-field").classList.contains("has-error")) valid = false;
    });

    /* Preferred Package — required radio group. */
    var packageRadios = form.querySelectorAll('input[name="preferredPackage"]');
    if (packageRadios.length) {
      var packageContainer = packageRadios[0].closest(".form-field");
      var packageChecked = Array.prototype.some.call(packageRadios, function (r) { return r.checked; });
      if (!packageChecked) {
        setGroupError(packageContainer, "Please select a preferred package.");
        valid = false;
        if (!firstInvalid) firstInvalid = packageRadios[0];
      } else {
        clearGroupError(packageContainer);
      }
    }

    /* Special Requirements — "Other" requires the free-text detail. */
    var otherCheckbox = form.querySelector('input[name="specialRequirements"][data-other-toggle]');
    var otherText = form.querySelector('[data-other-field]');
    if (otherCheckbox && otherText) {
      if (otherCheckbox.checked && !otherText.value.trim()) {
        setFieldError(otherText, "Please specify your other requirement.");
        valid = false;
        if (!firstInvalid) firstInvalid = otherText;
      } else {
        clearFieldError(otherText);
      }
    }

    /* Travel dates — "To" can't be before "From". */
    var dateFrom = form.querySelector('[name="dateFrom"]');
    var dateTo = form.querySelector('[name="dateTo"]');
    if (dateFrom && dateTo && dateFrom.value && dateTo.value && dateTo.value < dateFrom.value) {
      setFieldError(dateTo, "Return date can't be before the start date.");
      valid = false;
      if (!firstInvalid) firstInvalid = dateTo;
    }

    if (firstInvalid) firstInvalid.focus();
    return valid;
  }

  function wireChildrenAgesToggle(form) {
    var childrenInput = form.querySelector('[name="children"]');
    var agesField = form.querySelector('[data-children-ages-field]');
    if (!childrenInput || !agesField) return;
    var agesInput = agesField.querySelector("input");
    function sync() {
      var count = Number(childrenInput.value) || 0;
      if (count > 0) {
        agesField.style.display = "";
        if (agesInput) agesInput.setAttribute("required", "required");
      } else {
        agesField.style.display = "none";
        if (agesInput) {
          agesInput.removeAttribute("required");
          clearFieldError(agesInput);
        }
      }
    }
    childrenInput.addEventListener("input", sync);
    sync();
  }

  function wireSpecialRequirementsOther(form) {
    var otherCheckbox = form.querySelector('input[name="specialRequirements"][data-other-toggle]');
    var otherText = form.querySelector('[data-other-field]');
    if (!otherCheckbox || !otherText) return;
    function sync() {
      otherText.style.display = otherCheckbox.checked ? "" : "none";
      if (!otherCheckbox.checked) {
        otherText.value = "";
        clearFieldError(otherText);
      }
    }
    otherCheckbox.addEventListener("change", sync);
    sync();
  }

  function wireLiveValidation(form) {
    form.querySelectorAll("input[name], textarea[name], select[name]").forEach(function (field) {
      if (field.type === "hidden" || field.type === "radio" || field.type === "checkbox") return;
      field.addEventListener("blur", function () { validateField(field); });
      field.addEventListener("input", function () {
        if (field.closest(".form-field").classList.contains("has-error")) validateField(field);
      });
    });
    form.querySelectorAll('input[name="preferredPackage"]').forEach(function (radio) {
      radio.addEventListener("change", function () { clearGroupError(radio.closest(".form-field")); });
    });
    wireChildrenAgesToggle(form);
    wireSpecialRequirementsOther(form);
  }

  /* Google Sheets (and Excel) treat a cell value starting with +, =, - or @
     as the start of a formula. A phone number like "+91 99988 87776" then
     shows up as #ERROR! once it lands in the sheet via Apps Script. Prefixing
     with a leading apostrophe is the standard fix — Sheets (and Apps Script's
     setValue/appendRow, which mirrors the same coercion) treats a leading
     apostrophe as "force plain text" and strips it, so the value displays
     correctly instead of being parsed as a formula. */
  function sheetSafeValue(value) {
    if (typeof value === "string" && /^[+=\-@]/.test(value)) return "'" + value;
    return value;
  }

  function formToPayload(form, formType) {
    var payload = { formType: formType, submittedAt: new Date().toISOString() };
    new FormData(form).forEach(function (value, key) {
      value = sheetSafeValue(value);
      payload[key] = payload[key] ? payload[key] + ", " + value : value;
    });
    return payload;
  }

  /* ---------- Google reCAPTCHA (shared by all three forms) -----------
     Rendered explicitly (render=explicit in the api.js query string) so
     each form gets its own widget id, since the drawer form is present
     on every page alongside whichever page-specific form is loaded. */
  var RECAPTCHA_WIDGETS = {};
  window.onRecaptchaLoad = function () {
    if (!window.grecaptcha) return;
    [
      { elId: "recaptchaDrawer", key: "drawer" },
      { elId: "recaptchaCustomTour", key: "customTour" },
      { elId: "recaptchaContact", key: "contact" }
    ].forEach(function (cfg) {
      var el = document.getElementById(cfg.elId);
      if (!el) return;
      RECAPTCHA_WIDGETS[cfg.key] = grecaptcha.render(el, { sitekey: window.KD_RECAPTCHA_SITE_KEY });
    });
  };

  function getRecaptchaToken(key) {
    if (!window.grecaptcha || RECAPTCHA_WIDGETS[key] === undefined) return "";
    return grecaptcha.getResponse(RECAPTCHA_WIDGETS[key]);
  }

  function validateRecaptcha(key, form) {
    if (!window.KD_RECAPTCHA_SITE_KEY) return true;
    var container = form.querySelector(".g-recaptcha-container");
    var token = getRecaptchaToken(key);
    if (!token) {
      if (container) {
        container.classList.add("has-error");
        var err = container.querySelector(".form-field__error");
        if (!err) {
          err = document.createElement("span");
          err.className = "form-field__error";
          container.appendChild(err);
        }
        err.textContent = "Please verify you're not a robot.";
      }
      return false;
    }
    if (container) container.classList.remove("has-error");
    return true;
  }

  function resetRecaptcha(key) {
    if (window.grecaptcha && RECAPTCHA_WIDGETS[key] !== undefined) grecaptcha.reset(RECAPTCHA_WIDGETS[key]);
  }

  function submitToSheet(payload) {
    if (!window.KD_FORM_ENDPOINT) return;
    fetch(window.KD_FORM_ENDPOINT, {
      method: "POST",
      mode: "no-cors",
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify(payload)
    }).catch(function () {
      /* no-cors gives an opaque response either way; a network-level
         failure here just means the sheet doesn't get the row — the
         on-page success state isn't blocked on it. */
    });
  }

  /* ---------- Quick-enquiry drawer ---------- */
  var drawer = document.getElementById("quickDrawer");
  var drawerOverlay = document.getElementById("drawerOverlay");
  var drawerClose = document.getElementById("drawerClose");
  var drawerForm = document.getElementById("drawerForm");
  var drawerSuccess = document.getElementById("drawerSuccess");
  var drawerContext = document.getElementById("drawerContext");
  var drawerDestination = document.getElementById("drawerDestination");

  function openDrawer(destination, pdfPath, notesPrefill) {
    if (!drawer) return;
    var destinationField = document.getElementById("dDestination");
    if (destination) {
      drawerDestination.textContent = destination;
      drawerContext.style.display = "block";
      if (destinationField) {
        destinationField.value = destination;
        if (destinationField.value !== destination) destinationField.value = "Other";
      }
    } else {
      drawerContext.style.display = "none";
      if (destinationField) destinationField.value = "";
    }
    if (notesPrefill) {
      var notesField = document.getElementById("dNotes");
      if (notesField && !notesField.value) notesField.value = notesPrefill;
    }
    drawer.dataset.pdf = pdfPath || "";
    drawer.classList.add("is-open");
    drawerOverlay.classList.add("is-open");
    drawer.removeAttribute("aria-hidden");
    drawer.removeAttribute("inert");
    document.body.style.overflow = "hidden";
  }

  function closeDrawer() {
    if (!drawer) return;
    drawer.classList.remove("is-open");
    drawerOverlay.classList.remove("is-open");
    drawer.setAttribute("aria-hidden", "true");
    drawer.setAttribute("inert", "");
    document.body.style.overflow = "";
  }

  document.addEventListener("click", function (e) {
    var trigger = e.target.closest("[data-drawer-open]");
    if (trigger) {
      openDrawer(trigger.getAttribute("data-destination"), trigger.getAttribute("data-pdf"));
    }
  });

  function downloadPdfFile(url, filename) {
    var link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  var pdfLibLoadPromise = null;
  function loadPdfLib() {
    if (window.PDFLib) return Promise.resolve(window.PDFLib);
    if (!pdfLibLoadPromise) {
      pdfLibLoadPromise = new Promise(function (resolve, reject) {
        var script = document.createElement("script");
        script.src = "/js/vendor/pdf-lib.min.js";
        script.onload = function () { resolve(window.PDFLib); };
        script.onerror = reject;
        document.head.appendChild(script);
      });
    }
    return pdfLibLoadPromise;
  }

  /* The itinerary PDFs are static files baked at build time (see
     scripts/generate-itinerary-pdfs.js) — the "generated on" date printed
     in their header is whatever day the build ran, not today, and only
     gets stale further with every day that passes before the next deploy.
     Re-stamp it with the real, live date right here in the browser at the
     moment of download: mask the old date with a white box in the exact
     header slot the generator draws it in, then draw today's date over
     it, on every page (the header repeats per page). Coordinates below
     mirror generate-itinerary-pdfs.js's PAGE_WIDTH/MARGIN/drawHeader
     exactly, so the replacement sits pixel-for-pixel where the original was. */
  function stampLiveDate(PDFLib, pdfBytes) {
    return PDFLib.PDFDocument.load(pdfBytes).then(function (pdfDoc) {
      var PAGE_WIDTH = 595.28;
      var MARGIN_RIGHT = 50;
      var HEADER_TOP = 26;
      // The date box pdfkit lays out is 200pt wide, but right-aligned text
      // inside it only ever inks the rightmost ~60-80pt (the widest real
      // "D Month YYYY" string, e.g. "30 September 2026", measures ~79pt at
      // this font/size) — the rest is empty space in the box. Masking the
      // full 200pt would reach left of x≈345 and clip the centered tagline
      // ("A Dream Quest Explorers!") sitting on the same header line, whose
      // own right edge lands around x≈366. Masking just the actual ink
      // footprint (with margin) stays clear of it.
      var MASK_WIDTH = 110;
      var rightEdge = PAGE_WIDTH - MARGIN_RIGHT;
      var dateStr = new Date().toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" });

      return pdfDoc.embedFont(PDFLib.StandardFonts.Helvetica).then(function (font) {
        var fontSize = 9;
        var textWidth = font.widthOfTextAtSize(dateStr, fontSize);
        pdfDoc.getPages().forEach(function (page) {
          var pageHeight = page.getHeight();
          page.drawRectangle({
            x: rightEdge - MASK_WIDTH,
            y: pageHeight - (HEADER_TOP + 15 + 20),
            width: MASK_WIDTH + 5,
            height: 24,
            color: PDFLib.rgb(1, 1, 1),
          });
          page.drawText(dateStr, {
            x: rightEdge - textWidth,
            y: pageHeight - (HEADER_TOP + 15 + 7.2),
            size: fontSize,
            font: font,
            color: PDFLib.rgb(107 / 255, 107 / 255, 107 / 255),
          });
        });
        return pdfDoc.save();
      });
    });
  }

  function downloadPdf(pdfPath) {
    if (!pdfPath) return;
    var filename = pdfPath.split("/").pop();

    Promise.all([loadPdfLib(), fetch(pdfPath).then(function (r) { return r.arrayBuffer(); })])
      .then(function (results) {
        return stampLiveDate(results[0], results[1]);
      })
      .then(function (stampedBytes) {
        var blobUrl = URL.createObjectURL(new Blob([stampedBytes], { type: "application/pdf" }));
        downloadPdfFile(blobUrl, filename);
        setTimeout(function () { URL.revokeObjectURL(blobUrl); }, 10000);
      })
      .catch(function () {
        // pdf-lib failed to load, or the PDF couldn't be fetched/stamped —
        // fall back to the plain static file so the download never breaks,
        // it just keeps the build-time date in that rare case.
        downloadPdfFile(pdfPath, filename);
      });
  }

  if (drawerClose) drawerClose.addEventListener("click", closeDrawer);
  if (drawerOverlay) drawerOverlay.addEventListener("click", closeDrawer);
  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape") {
      closeDrawer();
      if (siteNav && siteNav.classList.contains("is-open")) {
        siteNav.classList.remove("is-open");
        navToggle.setAttribute("aria-expanded", "false");
        navToggle.textContent = "☰";
        document.body.classList.remove("nav-open");
      }
    }
  });

  if (drawerForm) {
    wireLiveValidation(drawerForm);
    drawerForm.addEventListener("submit", function (e) {
      e.preventDefault();
      if (!validateForm(drawerForm)) return;
      if (!validateRecaptcha("drawer", drawerForm)) return;
      var drawerPayload = formToPayload(drawerForm, "Quick Enquiry");
      drawerPayload.recaptchaToken = getRecaptchaToken("drawer");
      submitToSheet(drawerPayload);
      var pdfPath = drawer.dataset.pdf;
      drawerForm.style.display = "none";
      drawerSuccess.classList.add("is-visible");
      var successMsg = drawerSuccess.querySelector("p");
      if (pdfPath && successMsg) {
        successMsg.textContent = "Thank you! Your itinerary PDF is downloading now — our consultant will reach out shortly.";
        downloadPdf(pdfPath);
      } else if (successMsg) {
        successMsg.textContent = "Thank you! Our consultant will reach out shortly.";
      }
      setTimeout(function () {
        closeDrawer();
        drawerForm.reset();
        resetRecaptcha("drawer");
        drawerForm.style.display = "flex";
        drawerSuccess.classList.remove("is-visible");
      }, 3500);
    });
  }

  /* ---------- Hero live destination search -----------
     Matches typed text against the real destinations collection (fetched
     once from /search-index.json, generated by 11ty at build time — see
     src/search-index.njk). A match navigates straight to that destination's
     page; no match opens a popup offering a custom package, with a slider
     of other destinations as an easy alternative. */
  (function () {
    var heroSearchForm = document.querySelector(".hero__search");
    if (!heroSearchForm) return;
    var searchInput = heroSearchForm.querySelector("input");
    var dropdown = document.getElementById("heroSearchDropdown");
    var modal = document.getElementById("noMatchModal");
    var modalQueryEl = document.getElementById("noMatchQuery");
    var modalClose = document.getElementById("noMatchClose");
    var modalCta = document.getElementById("noMatchRequestBtn");
    var exploreTrack = document.getElementById("exploreSlickTrack");
    var destinationsIndex = [];
    var exploreSliderInitialized = false;

    fetch("/search-index.json")
      .then(function (r) { return r.json(); })
      .then(function (data) {
        destinationsIndex = data || [];
        buildExploreSlider();
      })
      .catch(function () {});

    function matchDestinations(query) {
      var q = query.trim().toLowerCase();
      if (!q) return [];
      return destinationsIndex.filter(function (d) {
        return (
          d.title.toLowerCase().indexOf(q) !== -1 ||
          (d.country || "").toLowerCase().indexOf(q) !== -1 ||
          (d.tags || []).some(function (t) { return t.toLowerCase().indexOf(q) !== -1; })
        );
      });
    }

    function escapeHtml(str) {
      var div = document.createElement("div");
      div.textContent = str;
      return div.innerHTML;
    }

    function renderDropdown(matches) {
      if (!dropdown) return;
      if (!matches.length) {
        dropdown.innerHTML = "";
        dropdown.classList.remove("is-open");
        return;
      }
      dropdown.innerHTML = matches
        .map(function (d) {
          return (
            '<a class="hero-search__item" href="' + d.url + '">' +
            '<span class="hero-search__item-photo" style="background-image:url(\'' + d.image + '\')"></span>' +
            "<span><strong>" + escapeHtml(d.title) + "</strong><small>" + escapeHtml(d.country) + "</small></span>" +
            "</a>"
          );
        })
        .join("");
      dropdown.classList.add("is-open");
    }

    searchInput.addEventListener("input", function () {
      renderDropdown(searchInput.value.trim() ? matchDestinations(searchInput.value) : destinationsIndex);
    });

    searchInput.addEventListener("focus", function () {
      renderDropdown(searchInput.value.trim() ? matchDestinations(searchInput.value) : destinationsIndex);
    });

    document.addEventListener("click", function (e) {
      if (dropdown && !heroSearchForm.contains(e.target)) dropdown.classList.remove("is-open");
    });

    function buildExploreSlider() {
      if (!exploreTrack || !destinationsIndex.length) return;
      exploreTrack.innerHTML = destinationsIndex
        .map(function (d) {
          return (
            '<div class="explore-circle">' +
            '<a href="' + d.url + '">' +
            '<span class="explore-circle__photo" style="background-image:url(\'' + d.image + '\')"></span>' +
            '<span class="explore-circle__name">' + escapeHtml(d.title) + "</span>" +
            "</a></div>"
          );
        })
        .join("");
    }

    function openNoMatchModal(query) {
      if (!modal) return;
      if (modalQueryEl) modalQueryEl.textContent = query;
      modal.dataset.query = query;
      modal.classList.add("is-open");
      document.body.style.overflow = "hidden";
      if (!exploreSliderInitialized && window.jQuery && exploreTrack && exploreTrack.children.length) {
        jQuery(exploreTrack).slick({
          slidesToShow: 2,
          slidesToScroll: 1,
          arrows: true,
          dots: false,
          infinite: destinationsIndex.length > 2,
          responsive: [
            { breakpoint: 640, settings: { slidesToShow: 1 } }
          ]
        });
        exploreSliderInitialized = true;
      }
    }

    function closeNoMatchModal() {
      if (!modal) return;
      modal.classList.remove("is-open");
      document.body.style.overflow = "";
    }

    if (modalClose) modalClose.addEventListener("click", closeNoMatchModal);
    if (modal) {
      modal.addEventListener("click", function (e) {
        if (e.target === modal) closeNoMatchModal();
      });
    }
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && modal && modal.classList.contains("is-open")) closeNoMatchModal();
    });

    if (modalCta) {
      modalCta.addEventListener("click", function () {
        var query = (modal && modal.dataset.query) || "";
        closeNoMatchModal();
        openDrawer(null, null, query ? "Requested destination: " + query : "");
      });
    }

    heroSearchForm.addEventListener("submit", function (e) {
      e.preventDefault();
      var query = searchInput.value.trim();
      if (!query) return;
      var matches = matchDestinations(query);
      if (dropdown) dropdown.classList.remove("is-open");
      if (matches.length) {
        window.location = matches[0].url;
      } else {
        openNoMatchModal(query);
      }
    });
  })();

  /* ---------- Generic form success (Custom Tour / Contact) ---------- */
  [
    { id: "customTourForm", label: "Custom Tour", recaptchaKey: "customTour" },
    { id: "contactForm", label: "Contact", recaptchaKey: "contact" }
  ].forEach(function (cfg) {
    var form = document.getElementById(cfg.id);
    if (!form) return;
    wireLiveValidation(form);
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      if (!validateForm(form)) return;
      if (!validateRecaptcha(cfg.recaptchaKey, form)) return;
      var payload = formToPayload(form, cfg.label);
      payload.recaptchaToken = getRecaptchaToken(cfg.recaptchaKey);
      submitToSheet(payload);
      var box = document.createElement("div");
      box.style.textAlign = "center";
      box.style.padding = "32px 0";
      box.innerHTML = "<h3>Thank you!</h3><p class='text-muted'>Our consultant will reach out shortly.</p>";
      form.replaceWith(box);
    });
  });

  /* ---------- FAQ accordion ---------- */
  document.addEventListener("click", function (e) {
    var trigger = e.target.closest(".accordion__trigger");
    if (!trigger) return;
    var item = trigger.closest(".accordion__item");
    var wasOpen = item.classList.contains("is-open");
    item.parentElement.querySelectorAll(".accordion__item.is-open").forEach(function (openItem) {
      if (openItem === item) return;
      openItem.classList.remove("is-open");
      openItem.querySelector(".accordion__trigger").setAttribute("aria-expanded", "false");
    });
    item.classList.toggle("is-open", !wasOpen);
    trigger.setAttribute("aria-expanded", String(!wasOpen));
  });

  /* ---------- Tabs (Home: Domestic / International) ---------- */
  var destTabs = document.getElementById("destTabs");
  var featuredGrid = document.getElementById("featuredGrid");
  if (destTabs && featuredGrid) {
    destTabs.addEventListener("click", function (e) {
      var btn = e.target.closest("[data-tab]");
      if (!btn) return;
      destTabs.querySelectorAll("button").forEach(function (b) { b.classList.remove("is-active"); });
      btn.classList.add("is-active");
      var tab = btn.getAttribute("data-tab");
      featuredGrid.querySelectorAll(".dest-card").forEach(function (card) {
        var match = tab === "all" || card.getAttribute("data-region") === tab;
        card.style.display = match ? "" : "none";
      });
    });
  }

  /* ---------- Filter chips (Destinations listing) ---------- */
  var destFilters = document.getElementById("destFilters");
  var destGrid = document.getElementById("destGrid");
  var destEmpty = document.getElementById("destEmpty");
  if (destFilters && destGrid) {
    var applyDestFilter = function (filter, btn) {
      destFilters.querySelectorAll("button").forEach(function (b) { b.classList.remove("is-active"); });
      if (btn) btn.classList.add("is-active");
      var visibleCount = 0;
      destGrid.querySelectorAll(".dest-card").forEach(function (card) {
        var region = card.getAttribute("data-region");
        var tags = (card.getAttribute("data-tags") || "").split(",");
        var match = filter === "all" || region === filter || tags.indexOf(filter) !== -1;
        card.style.display = match ? "" : "none";
        if (match) visibleCount++;
      });
      if (destEmpty) destEmpty.style.display = visibleCount === 0 ? "block" : "none";
    };

    destFilters.addEventListener("click", function (e) {
      var btn = e.target.closest("[data-filter]");
      if (!btn) return;
      applyDestFilter(btn.getAttribute("data-filter"), btn);
    });

    // Deep-link support — e.g. the header's "Spiritual" link goes to
    // /destinations/?filter=spiritual and should land pre-filtered, the
    // same as clicking that chip by hand.
    var urlFilter = new URLSearchParams(window.location.search).get("filter");
    if (urlFilter) {
      var matchingBtn = destFilters.querySelector('[data-filter="' + urlFilter + '"]');
      if (matchingBtn) applyDestFilter(urlFilter, matchingBtn);
    }
  }

  /* ---------- Gallery filter chips ---------- */
  var galleryFilters = document.getElementById("galleryFilters");
  var galleryGrid = document.getElementById("galleryGrid");
  if (galleryFilters && galleryGrid) {
    galleryFilters.addEventListener("click", function (e) {
      var btn = e.target.closest("[data-gallery-filter]");
      if (!btn) return;
      galleryFilters.querySelectorAll("button").forEach(function (b) { b.classList.remove("is-active"); });
      btn.classList.add("is-active");
      var filter = btn.getAttribute("data-gallery-filter");
      galleryGrid.querySelectorAll("[data-gallery-item]").forEach(function (item) {
        var match = filter === "all" || item.getAttribute("data-gallery-item") === filter;
        item.style.display = match ? "" : "none";
      });
    });
  }

  /* ---------- Lightbox ---------- */
  var lightbox = document.getElementById("lightbox");
  var lightboxClose = document.getElementById("lightboxClose");
  var lightboxLabel = document.getElementById("lightboxLabel");
  var lightboxImg = document.getElementById("lightboxImg");
  if (lightbox && galleryGrid) {
    galleryGrid.addEventListener("click", function (e) {
      var item = e.target.closest("[data-lightbox-label]");
      if (!item) return;
      var label = item.getAttribute("data-lightbox-label");
      lightboxLabel.textContent = label;
      if (lightboxImg) {
        lightboxImg.src = item.getAttribute("data-lightbox-src") || "";
        lightboxImg.alt = label;
      }
      lightbox.classList.add("is-open");
    });
    lightboxClose.addEventListener("click", function () { lightbox.classList.remove("is-open"); });
    lightbox.addEventListener("click", function (e) {
      if (e.target === lightbox) lightbox.classList.remove("is-open");
    });
  }

  /* ---------- Testimonial / card carousel ---------- */
  document.addEventListener("click", function (e) {
    var prevBtn = e.target.closest("[data-carousel-prev]");
    var nextBtn = e.target.closest("[data-carousel-next]");
    var btn = prevBtn || nextBtn;
    if (!btn) return;
    var trackId = btn.getAttribute(prevBtn ? "data-carousel-prev" : "data-carousel-next");
    var track = document.getElementById(trackId);
    if (!track) return;
    var amount = track.clientWidth * 0.8;
    track.scrollBy({ left: prevBtn ? -amount : amount, behavior: "smooth" });
  });

  /* ---------- Count-up stats ---------- */
  var countEls = document.querySelectorAll("[data-countup]");
  if (countEls.length && "IntersectionObserver" in window) {
    var countObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        var el = entry.target;
        var target = parseInt(el.getAttribute("data-countup"), 10);
        var suffix = el.textContent.replace(/[0-9]/g, "");
        var start = 0;
        var duration = 1200;
        var startTime = null;
        function step(ts) {
          if (!startTime) startTime = ts;
          var progress = Math.min((ts - startTime) / duration, 1);
          el.textContent = Math.floor(progress * target) + suffix;
          if (progress < 1) requestAnimationFrame(step);
          else el.textContent = target + suffix;
        }
        requestAnimationFrame(step);
        countObserver.unobserve(el);
      });
    }, { threshold: 0.5 });
    countEls.forEach(function (el) { countObserver.observe(el); });
  }

  /* ---------- Countdown timers ---------- */
  var countdownEls = document.querySelectorAll("[data-countdown]");
  if (countdownEls.length) {
    function updateCountdowns() {
      var now = Date.now();
      countdownEls.forEach(function (el) {
        var deadline = new Date(el.getAttribute("data-countdown")).getTime();
        var diff = deadline - now;
        if (isNaN(deadline) || diff <= 0) {
          el.querySelectorAll("strong").forEach(function (s) { s.textContent = "00"; });
          return;
        }
        var days = Math.floor(diff / 86400000);
        var hours = Math.floor((diff % 86400000) / 3600000);
        var minutes = Math.floor((diff % 3600000) / 60000);
        var seconds = Math.floor((diff % 60000) / 1000);
        var map = { days: days, hours: hours, minutes: minutes, seconds: seconds };
        el.querySelectorAll("strong").forEach(function (s) {
          var unit = s.getAttribute("data-unit");
          s.textContent = String(map[unit]).padStart(2, "0");
        });
      });
    }
    updateCountdowns();
    setInterval(updateCountdowns, 1000);
  }

  /* ---------- Reveal on scroll ---------- */
  var revealEls = document.querySelectorAll("[data-reveal]");
  if (revealEls.length && "IntersectionObserver" in window) {
    // A 0.15 threshold means "15% of the target's own height must be
    // visible" — fine for a short card, but a tall single-column grid on
    // mobile (e.g. #featuredGrid, 12 stacked cards) can be taller than
    // 1/0.15 viewport heights, so that ratio is *never reachable* at any
    // scroll position and the element stays at opacity:0 forever (the
    // "destinations all hidden on mobile" bug). A near-zero threshold
    // reveals as soon as any of it enters view, regardless of target height.
    var revealObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          revealObserver.unobserve(entry.target);
        }
      });
    }, { threshold: 0.01 });
    revealEls.forEach(function (el) { revealObserver.observe(el); });
  } else {
    revealEls.forEach(function (el) { el.classList.add("is-visible"); });
  }

})();
