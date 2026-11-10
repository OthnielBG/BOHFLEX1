/* ==========================================================================
   BOHFLEX — Scripts du site (vanilla JS, aucune dépendance)
   ========================================================================== */
(function () {
  "use strict";

  var CFG = window.BOHFLEX_CONFIG || {};
  var STORAGE_KEY = "bohflex_client";
  var $ = function (sel, ctx) { return (ctx || document).querySelector(sel); };
  var $$ = function (sel, ctx) { return Array.prototype.slice.call((ctx || document).querySelectorAll(sel)); };

  /* ---------- Utilitaires ---------- */
  function fcfa(n) {
    return String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, " ") + " FCFA";
  }
  function getOffer(id) {
    var list = CFG.offers || [];
    for (var i = 0; i < list.length; i++) if (list[i].id === String(id)) return list[i];
    return list[list.length - 1];
  }
  function oldPrice(offer) { return (CFG.unitPrice || 0) * offer.pairs; }
  function waLink(text) {
    return "https://wa.me/" + (CFG.whatsappNumber || "") + (text ? "?text=" + encodeURIComponent(text) : "");
  }
  function store(key, val) {
    try {
      if (val === undefined) return JSON.parse(localStorage.getItem(key) || "null");
      localStorage.setItem(key, JSON.stringify(val));
    } catch (e) { return null; }
  }
  function track(event, params) {
    if (typeof window.fbq === "function") window.fbq("track", event, params || {});
  }

  /* ---------- Pixel Meta (chargé seulement si un ID est configuré) ---------- */
  function initPixel() {
    if (!CFG.metaPixelId) return;
    /* eslint-disable */
    !function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?
    n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;
    n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;
    t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,
    document,'script','https://connect.facebook.net/en_US/fbevents.js');
    /* eslint-enable */
    window.fbq("init", CFG.metaPixelId);
    window.fbq("track", "PageView");
  }

  /* ---------- Contenu dynamique issu de la config ---------- */
  function applyConfig() {
    $$("[data-wa]").forEach(function (a) {
      a.href = waLink(a.getAttribute("data-wa") || "Bonjour BOHFLEX, j'aimerais avoir des informations sur les semelles.");
      a.target = "_blank";
      a.rel = "noopener";
      a.addEventListener("click", function () { track("Contact"); });
    });
    $$("[data-phone]").forEach(function (el) {
      el.textContent = CFG.phoneDisplay;
      if (el.tagName === "A") el.href = "tel:+" + CFG.whatsappNumber;
    });
    $$("[data-count]").forEach(function (el) { el.textContent = CFG.deliveredCount; });
    $$("[data-price]").forEach(function (el) { el.textContent = fcfa(getOffer(el.getAttribute("data-price")).price); });
    $$("[data-old]").forEach(function (el) { el.textContent = fcfa(oldPrice(getOffer(el.getAttribute("data-old")))); });
    $$("[data-save]").forEach(function (el) {
      var o = getOffer(el.getAttribute("data-save"));
      el.textContent = "Vous économisez " + fcfa(oldPrice(o) - o.price);
    });
    $$("[data-unit]").forEach(function (el) {
      var o = getOffer(el.getAttribute("data-unit"));
      el.textContent = "soit " + fcfa(o.price / o.pairs) + " la paire";
    });
    $$("[data-year]").forEach(function (el) { el.textContent = new Date().getFullYear(); });
    if (CFG.showReviewMarkers) document.body.classList.add("show-review");
  }

  /* ---------- Menu mobile ---------- */
  function initMenu() {
    var btn = $(".burger"), menu = $(".mobile-menu");
    if (!btn || !menu) return;
    btn.addEventListener("click", function () {
      var open = menu.classList.toggle("is-open");
      btn.setAttribute("aria-expanded", open ? "true" : "false");
      btn.querySelector("use").setAttribute("href", open ? "#i-x" : "#i-menu");
    });
  }

  /* ---------- Galerie produit ---------- */
  function initGallery() {
    var main = $(".gallery__main");
    if (!main) return;
    $$(".gallery__thumbs button").forEach(function (b) {
      b.addEventListener("click", function () {
        $$(".gallery__thumbs button").forEach(function (x) { x.setAttribute("aria-current", "false"); });
        b.setAttribute("aria-current", "true");
        main.innerHTML = b.innerHTML;
      });
    });
  }

  /* ---------- Sélecteur d'offre (page produit) ---------- */
  function initProductPicker() {
    var picker = $("#product-picker");
    if (!picker) return;
    track("ViewContent", { content_name: "Semelles Confort BOHFLEX", currency: "XOF", value: getOffer(CFG.defaultOffer).price });
    var links = $$("[data-order-link]");
    function update() {
      var checked = $("input[name=offre]:checked", picker);
      var id = checked ? checked.value : CFG.defaultOffer;
      links.forEach(function (a) { a.href = "commander.html?offre=" + id; });
    }
    picker.addEventListener("change", update);
    update();
  }

  /* ---------- Formulaire de commande ---------- */
  function initOrderForm() {
    var form = $("#order-form");
    if (!form) return;

    var sizesBox = $("#sizes");
    var colorField = $("#field-color");
    var colorSelect = $("#color");
    var modal = $("#recap-modal");
    var current = null;

    // Offre pré-sélectionnée via ?offre=2 ou ?offre=3
    var params = new URLSearchParams(window.location.search);
    var initial = getOffer(params.get("offre") || CFG.defaultOffer).id;
    var radio = $("input[name=offre][value='" + initial + "']", form);
    if (radio) radio.checked = true;

    // Coloris
    var colors = CFG.colors || [];
    if (colors.length <= 1) {
      colorField.hidden = true;
    } else {
      colors.forEach(function (c) {
        var o = document.createElement("option");
        o.value = o.textContent = c;
        colorSelect.appendChild(o);
      });
    }

    function selectedOffer() {
      var r = $("input[name=offre]:checked", form);
      return getOffer(r ? r.value : CFG.defaultOffer);
    }

    // Une pointure par paire (pratique pour commander pour la famille)
    function renderSizes() {
      var offer = selectedOffer();
      var previous = $$("select", sizesBox).map(function (s) { return s.value; });
      sizesBox.innerHTML = "";
      for (var i = 0; i < offer.pairs; i++) {
        var wrap = document.createElement("div");
        wrap.className = "field";
        wrap.innerHTML =
          '<label for="size-' + i + '">Paire ' + (i + 1) + ' <span class="req">*</span></label>' +
          '<select class="select" id="size-' + i + '" name="pointure" required>' +
          '<option value="">Pointure…</option>' +
          (CFG.sizes || []).map(function (s) { return '<option value="' + s + '">' + s + "</option>"; }).join("") +
          "</select>" +
          '<div class="field__error">Choisissez une pointure</div>';
        sizesBox.appendChild(wrap);
        var sel = wrap.querySelector("select");
        sel.value = previous[i] || previous[0] || "";
      }
    }

    function updateSummary() {
      var offer = selectedOffer();
      $("#sum-offer").textContent = offer.label;
      $("#sum-old").textContent = fcfa(oldPrice(offer));
      $("#sum-price").textContent = fcfa(offer.price);
      $("#sum-total").textContent = fcfa(offer.price);
      $("#submit-total").textContent = fcfa(offer.price);
    }

    form.addEventListener("change", function (e) {
      if (e.target.name === "offre") { renderSizes(); updateSummary(); }
      var f = e.target.closest(".field");
      if (f) f.classList.remove("has-error");
    });
    form.addEventListener("input", function (e) {
      var f = e.target.closest(".field");
      if (f) f.classList.remove("has-error");
    });

    // Pré-remplissage si le client a déjà commandé sur cet appareil
    var known = store(STORAGE_KEY);
    if (known) {
      ["name", "phone", "city", "address"].forEach(function (k) {
        if (known[k] && form.elements[k]) form.elements[k].value = known[k];
      });
      var hello = $("#welcome-back");
      if (hello && known.name) {
        hello.hidden = false;
        $("strong", hello).textContent = known.name.split(" ")[0];
      }
    }

    renderSizes();
    updateSummary();
    track("InitiateCheckout", { currency: "XOF", value: selectedOffer().price });

    function normalizePhone(v) {
      var d = String(v || "").replace(/\D/g, "");
      if (d.length === 13 && d.indexOf("225") === 0) d = d.slice(3);
      if (d.length === 14 && d.indexOf("00225") === 0) d = d.slice(5);
      return d;
    }
    function setError(el, bad) {
      var f = el.closest(".field");
      if (f) f.classList.toggle("has-error", bad);
      return bad;
    }

    function validate() {
      var firstBad = null;
      function check(el, bad) { if (setError(el, bad) && !firstBad) firstBad = el; }
      $$("select[name=pointure]", form).forEach(function (s) { check(s, !s.value); });
      if (!colorField.hidden) check(colorSelect, !colorSelect.value);
      check(form.elements.name, form.elements.name.value.trim().length < 3);
      check(form.elements.phone, normalizePhone(form.elements.phone.value).length !== 10);
      check(form.elements.city, form.elements.city.value.trim().length < 2);
      check(form.elements.address, form.elements.address.value.trim().length < 4);
      if (firstBad) {
        firstBad.focus();
        firstBad.scrollIntoView({ block: "center", behavior: "smooth" });
      }
      return !firstBad;
    }

    function makeRef() {
      var d = new Date();
      var p = function (n) { return (n < 10 ? "0" : "") + n; };
      return "BHF-" + String(d.getFullYear()).slice(2) + p(d.getMonth() + 1) + p(d.getDate()) + "-" +
        Math.random().toString(36).slice(2, 6).toUpperCase();
    }

    function collect() {
      var offer = selectedOffer();
      var phone = normalizePhone(form.elements.phone.value);
      return {
        ref: makeRef(),
        date: new Date().toISOString(),
        offer: offer.label,
        pairs: offer.pairs,
        price: offer.price,
        sizes: $$("select[name=pointure]", form).map(function (s) { return s.value; }),
        color: colorField.hidden ? (colors[0] || "") : colorSelect.value,
        name: form.elements.name.value.trim(),
        phone: phone.replace(/(\d{2})(?=\d)/g, "$1 "),
        city: form.elements.city.value.trim(),
        address: form.elements.address.value.trim(),
        notes: form.elements.notes.value.trim(),
        source: document.referrer || "direct",
        utm: window.location.search.replace(/^\?/, "")
      };
    }

    function waMessage(o) {
      var lines = [
        "Bonjour BOHFLEX ! Je souhaite commander :",
        "",
        "🛒 Offre : " + o.offer + " — " + fcfa(o.price),
        "👟 Pointure(s) : " + o.sizes.join(", ")
      ];
      if (o.color && colors.length > 1) lines.push("🎨 Coloris : " + o.color);
      lines.push(
        "",
        "👤 Nom : " + o.name,
        "📞 Téléphone : +225 " + o.phone,
        "📍 Ville / Quartier : " + o.city,
        "🏠 Adresse / repère : " + o.address
      );
      if (o.notes) lines.push("📝 Remarques : " + o.notes);
      lines.push("", "💵 Paiement à la livraison", "Réf : " + o.ref);
      return lines.join("\n");
    }

    function openModal(o) {
      var dl = $("#recap-list");
      var rows = [
        ["Offre", o.offer + " — " + fcfa(o.price)],
        ["Pointure(s)", o.sizes.join(", ")]
      ];
      if (colors.length > 1) rows.push(["Coloris", o.color]);
      rows.push(
        ["Nom", o.name],
        ["Téléphone", "+225 " + o.phone],
        ["Ville / Quartier", o.city],
        ["Adresse", o.address]
      );
      if (o.notes) rows.push(["Remarques", o.notes]);
      rows.push(["Livraison", "Gratuite"], ["À payer à la livraison", fcfa(o.price)]);
      dl.innerHTML = "";
      rows.forEach(function (r) {
        var dt = document.createElement("dt"); dt.textContent = r[0];
        var dd = document.createElement("dd"); dd.textContent = r[1];
        dl.appendChild(dt); dl.appendChild(dd);
      });
      $("#wa-confirm").href = waLink(waMessage(o));
      modal.classList.add("is-open");
      document.body.style.overflow = "hidden";
      $("#wa-confirm").focus();
    }
    function closeModal() {
      modal.classList.remove("is-open");
      document.body.style.overflow = "";
    }
    $$("[data-close]", modal).forEach(function (b) { b.addEventListener("click", closeModal); });
    document.addEventListener("keydown", function (e) { if (e.key === "Escape") closeModal(); });

    // Envoie la commande à l'application de gestion (Supabase)
    function sendToApp(o) {
      if (!CFG.supabaseUrl || !CFG.supabaseAnonKey) return;
      var p = Object.assign({}, o, { sizes: o.sizes.join(", "), univers: CFG.univers || "bienetre" });
      try {
        fetch(CFG.supabaseUrl.replace(/\/$/, "") + "/rest/v1/rpc/site_order", {
          method: "POST", keepalive: true,
          headers: { "Content-Type": "application/json", apikey: CFG.supabaseAnonKey, Authorization: "Bearer " + CFG.supabaseAnonKey },
          body: JSON.stringify({ p: p })
        }).catch(function () {});
      } catch (e) { /* on ne bloque jamais la commande */ }
    }

    function sendToWebhook(o) {
      if (!CFG.orderWebhookUrl) return;
      var payload = JSON.stringify(Object.assign({}, o, { sizes: o.sizes.join(", ") }));
      try {
        // text/plain évite le "preflight" CORS (compatible Google Apps Script)
        fetch(CFG.orderWebhookUrl, {
          method: "POST", mode: "no-cors", keepalive: true,
          headers: { "Content-Type": "text/plain;charset=utf-8" }, body: payload
        }).catch(function () {});
      } catch (e) { /* on ne bloque jamais la commande */ }
    }

    form.addEventListener("submit", function (e) {
      e.preventDefault();
      if (!validate()) return;
      current = collect();
      openModal(current);
    });

    $("#wa-confirm").addEventListener("click", function () {
      if (!current) return;
      sendToApp(current);
      sendToWebhook(current);
      store(STORAGE_KEY, { name: current.name, phone: current.phone, city: current.city, address: current.address });
      track("Purchase", { currency: "XOF", value: current.price, num_items: current.pairs });
      // Laisse le lien s'ouvrir (WhatsApp), puis affiche l'écran de confirmation
      setTimeout(function () {
        closeModal();
        $("#order-view").hidden = true;
        var ok = $("#order-success");
        ok.hidden = false;
        $("#success-ref").textContent = current.ref;
        $("#success-wa").href = $("#wa-confirm").href;
        window.scrollTo(0, 0);
      }, 400);
    });
  }

  /* ---------- Suivi de commande (v1 : via WhatsApp) ---------- */
  function initTracking() {
    var form = $("#track-form");
    if (!form) return;
    var known = store(STORAGE_KEY);
    if (known && known.phone) form.elements.phone.value = known.phone;
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var phone = form.elements.phone.value.trim();
      var ref = form.elements.ref.value.trim();
      var field = form.elements.phone.closest(".field");
      var bad = phone.replace(/\D/g, "").length < 10;
      field.classList.toggle("has-error", bad);
      if (bad) { form.elements.phone.focus(); return; }
      var msg = "Bonjour BOHFLEX, je souhaite connaître le statut de ma commande.\n📞 Téléphone : " + phone +
        (ref ? "\nRéf : " + ref : "");
      window.location.href = waLink(msg);
    });
  }

  /* ---------- PWA : service worker + bannière d'installation ---------- */
  function initPWA() {
    if ("serviceWorker" in navigator && location.protocol !== "file:") {
      window.addEventListener("load", function () {
        navigator.serviceWorker.register("sw.js").catch(function () {});
      });
    }
    var deferred = null;
    var banner = $("#install-banner");
    window.addEventListener("beforeinstallprompt", function (e) {
      e.preventDefault();
      deferred = e;
      if (banner && !store("bohflex_install_dismissed")) banner.classList.add("is-visible");
    });
    $$("[data-install]").forEach(function (b) {
      b.addEventListener("click", function () {
        if (!deferred) {
          alert("Pour installer l'application : ouvrez le menu de votre navigateur (⋮) puis « Ajouter à l'écran d'accueil ».");
          return;
        }
        deferred.prompt();
        deferred = null;
        if (banner) banner.classList.remove("is-visible");
      });
    });
    var close = banner && $(".close", banner);
    if (close) close.addEventListener("click", function () {
      banner.classList.remove("is-visible");
      store("bohflex_install_dismissed", true);
    });
  }

  initPixel();
  applyConfig();
  initMenu();
  initGallery();
  initProductPicker();
  initOrderForm();
  initTracking();
  initPWA();
})();
