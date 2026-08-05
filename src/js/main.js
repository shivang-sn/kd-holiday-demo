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
    var currentSlide = 0;
    var slideTimer = null;

    function showSlide(index) {
      slides[currentSlide].classList.remove("is-active");
      if (dots[currentSlide]) dots[currentSlide].classList.remove("is-active");
      currentSlide = (index + slides.length) % slides.length;
      slides[currentSlide].classList.add("is-active");
      if (dots[currentSlide]) dots[currentSlide].classList.add("is-active");
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
    date: function (value, required) {
      if (!value) return required ? "Please select a date." : null;
      var picked = new Date(value + "T00:00:00");
      var today = new Date();
      today.setHours(0, 0, 0, 0);
      if (isNaN(picked.getTime())) return "Enter a valid date.";
      if (picked < today) return "Please choose a future date.";
      return null;
    }
  };

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
      if (!validateField(field) && !firstInvalid) firstInvalid = field;
      if (field.closest(".form-field") && field.closest(".form-field").classList.contains("has-error")) valid = false;
    });
    if (firstInvalid) firstInvalid.focus();
    return valid;
  }

  function wireLiveValidation(form) {
    form.querySelectorAll("input[name], textarea[name], select[name]").forEach(function (field) {
      if (field.type === "hidden" || field.type === "radio" || field.type === "checkbox") return;
      field.addEventListener("blur", function () { validateField(field); });
      field.addEventListener("input", function () {
        if (field.closest(".form-field").classList.contains("has-error")) validateField(field);
      });
    });
  }

  function formToPayload(form, formType) {
    var payload = { formType: formType, submittedAt: new Date().toISOString() };
    new FormData(form).forEach(function (value, key) {
      payload[key] = payload[key] ? payload[key] + ", " + value : value;
    });
    return payload;
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

  function openDrawer(destination, pdfPath) {
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
    drawer.dataset.pdf = pdfPath || "";
    drawer.classList.add("is-open");
    drawerOverlay.classList.add("is-open");
    drawer.setAttribute("aria-hidden", "false");
    document.body.style.overflow = "hidden";
  }

  function closeDrawer() {
    if (!drawer) return;
    drawer.classList.remove("is-open");
    drawerOverlay.classList.remove("is-open");
    drawer.setAttribute("aria-hidden", "true");
    document.body.style.overflow = "";
  }

  document.addEventListener("click", function (e) {
    var trigger = e.target.closest("[data-drawer-open]");
    if (trigger) {
      openDrawer(trigger.getAttribute("data-destination"), trigger.getAttribute("data-pdf"));
    }
  });

  function downloadPdf(pdfPath) {
    if (!pdfPath) return;
    var link = document.createElement("a");
    link.href = pdfPath;
    link.download = pdfPath.split("/").pop();
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
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
      submitToSheet(formToPayload(drawerForm, "Quick Enquiry"));
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
        drawerForm.style.display = "flex";
        drawerSuccess.classList.remove("is-visible");
      }, 3500);
    });
  }

  /* ---------- Generic form success (Custom Tour / Contact) ---------- */
  [{ id: "customTourForm", label: "Custom Tour" }, { id: "contactForm", label: "Contact" }].forEach(function (cfg) {
    var form = document.getElementById(cfg.id);
    if (!form) return;
    wireLiveValidation(form);
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      if (!validateForm(form)) return;
      submitToSheet(formToPayload(form, cfg.label));
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
    destFilters.addEventListener("click", function (e) {
      var btn = e.target.closest("[data-filter]");
      if (!btn) return;
      destFilters.querySelectorAll("button").forEach(function (b) { b.classList.remove("is-active"); });
      btn.classList.add("is-active");
      var filter = btn.getAttribute("data-filter");
      var visibleCount = 0;
      destGrid.querySelectorAll(".dest-card").forEach(function (card) {
        var region = card.getAttribute("data-region");
        var tags = (card.getAttribute("data-tags") || "").split(",");
        var match = filter === "all" || region === filter || tags.indexOf(filter) !== -1;
        card.style.display = match ? "" : "none";
        if (match) visibleCount++;
      });
      if (destEmpty) destEmpty.style.display = visibleCount === 0 ? "block" : "none";
    });
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
    var revealObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          revealObserver.unobserve(entry.target);
        }
      });
    }, { threshold: 0.15 });
    revealEls.forEach(function (el) { revealObserver.observe(el); });
  } else {
    revealEls.forEach(function (el) { el.classList.add("is-visible"); });
  }

  /* ---------- Sticky mobile bar body padding ---------- */
  if (document.querySelector(".sticky-mobile-bar.is-active")) {
    document.body.classList.add("has-sticky-bar");
  }

  /* ---------- Footer flight path — the exact route trail from the
     inlined flight-doodle.svg (#flightTrail) is drawn in with GSAP
     (stroke-dashoffset, no plugin needed) while a cloned copy of the
     doodle's own plane glyph (#flightPlane) travels that very same
     path element via getPointAtLength, so the two stay perfectly
     in sync. The original plane stays in the markup (hidden via CSS)
     so the source SVG file itself is never mutated at runtime. ---------- */
  (function footerFlightPath() {
    var svgNS = "http://www.w3.org/2000/svg";
    var trail = document.getElementById("flightTrail");
    var planeSource = document.getElementById("flightPlane");
    var pathWrap = document.querySelector(".footer-route__path");
    if (!trail || !planeSource || !pathWrap || !window.gsap) return;

    var svgRoot = trail.ownerSVGElement;
    if (!svgRoot) return;

    var length = trail.getTotalLength();
    var box = planeSource.getBBox();
    var cx = box.x + box.width / 2;
    var cy = box.y + box.height / 2;
    var planeScale = 1.6;

    var marker = document.createElementNS(svgNS, "g");
    marker.setAttribute("id", "footerPlaneMarker");
    marker.setAttribute("class", "footer-route__plane-marker");
    var clone = planeSource.cloneNode(true);
    clone.removeAttribute("id");
    clone.setAttribute("class", "footer-route__plane-clone");
    marker.appendChild(clone);
    svgRoot.appendChild(marker);

    var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    function placePlane(progress) {
      var point = trail.getPointAtLength(progress * length);
      var lookahead = trail.getPointAtLength(Math.min(progress + 0.002, 1) * length);
      var angle = Math.atan2(lookahead.y - point.y, lookahead.x - point.x) * (180 / Math.PI);
      marker.setAttribute(
        "transform",
        "translate(" + point.x + "," + point.y + ") rotate(" + angle + ") scale(" + planeScale + ") translate(" + -cx + "," + -cy + ")"
      );
    }

    if (reduceMotion) {
      trail.style.strokeDasharray = "none";
      placePlane(1);
      marker.style.opacity = "1";
      return;
    }

    // Starts right at the trail's own first point (near the pin) and plays
    // immediately on load — no scroll trigger.
    trail.style.strokeDasharray = length;
    trail.style.strokeDashoffset = length;
    placePlane(0);
    marker.style.opacity = "1";

    // Draw the line in once, start-to-end; the line stays fully drawn after this.
    var drawProgress = { value: 0 };
    gsap.to(drawProgress, {
      value: 1,
      duration: 2.8,
      ease: "power1.inOut",
      onUpdate: function () {
        trail.style.strokeDashoffset = String(length * (1 - drawProgress.value));
        placePlane(drawProgress.value);
      },
      onComplete: function () {
        // Then the plane keeps flying start-to-end and back, forever.
        var flyProgress = { value: 1 };
        gsap.to(flyProgress, {
          value: 0,
          duration: 2.6,
          ease: "power1.inOut",
          repeat: -1,
          yoyo: true,
          repeatDelay: 0.4,
          onUpdate: function () {
            placePlane(flyProgress.value);
          },
        });
      },
    });
  })();
})();
