/* ==========================================================================
   BOLOU and CO — Application de gestion
   Commandes · Prospects · Stock · Livreurs · Finances · Équipe
   Vanilla JS + Supabase (aucune étape de build).
   ========================================================================== */
(function () {
  "use strict";

  var CFG = window.BCO_CONFIG || {};
  var APP = CFG.appName || "BOLOU and CO";
  var LOGO = CFG.logo || "logo.svg";

  /* ------------------------------------------------------------------------
     Constantes
     ------------------------------------------------------------------------ */
  var UNI = { passion: "Sacoches", bienetre: "Semelles" };
  var UNI_LONG = { passion: "Passion · Sacoches", bienetre: "Bien-être · Semelles", commun: "Commun" };
  var ST = {
    nouvelle: "Nouvelle", injoignable: "Injoignable", confirmee: "Confirmée",
    en_livraison: "En livraison", livree: "Livrée", retour: "Retour", annulee: "Annulée"
  };
  var OPEN = ["nouvelle", "injoignable", "confirmee", "en_livraison"];
  var STAGES = { nouveau: "Nouveau", interesse: "Intéressé", panier: "Panier non confirmé", client: "Client", perdu: "Perdu" };
  var SOURCES = {
    whatsapp: "WhatsApp", site: "Site internet", facebook: "Facebook", instagram: "Instagram",
    tiktok: "TikTok", appel: "Appel", bouche: "Bouche-à-oreille", autre: "Autre"
  };
  var ROLES = { gerant: "Gérant / associé", closeuse: "Closeuse", livreur: "Livreur", stock: "Gestionnaire de stock" };
  var EXP = {
    pub_meta: "Pub Facebook / Instagram", pub_tiktok: "Pub TikTok", pub_autre: "Autre publicité",
    achat_stock: "Achat de marchandise", transport: "Transport / expédition", salaire: "Salaires / commissions",
    emballage: "Emballage", telephone: "Crédit / internet", autre: "Autre dépense"
  };
  var AD_CATS = ["pub_meta", "pub_tiktok", "pub_autre"];
  var OLD_CLIENT_DAYS = 45;

  /* ------------------------------------------------------------------------
     Icônes (traits 24 px, style « Lucide »)
     ------------------------------------------------------------------------ */
  var ICONS = {
    home: '<path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><path d="M9 22V12h6v10"/>',
    orders: '<rect x="8" y="2" width="8" height="4" rx="1"/><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><path d="M12 11h4M12 16h4M8 11h.01M8 16h.01"/>',
    users: '<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/>',
    package: '<path d="m7.5 4.27 9 5.15"/><path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z"/><path d="m3.3 7 8.7 5 8.7-5M12 22V12"/>',
    truck: '<path d="M14 18V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v11a1 1 0 0 0 1 1h2"/><path d="M15 18H9"/><path d="M19 18h2a1 1 0 0 0 1-1v-3.65a1 1 0 0 0-.22-.62L18.3 9.38a1 1 0 0 0-.78-.38H14"/><circle cx="17" cy="18" r="2"/><circle cx="7" cy="18" r="2"/>',
    wallet: '<path d="M19 7V4a1 1 0 0 0-1-1H5a2 2 0 0 0 0 4h15a1 1 0 0 1 1 1v4h-3a2 2 0 0 0 0 4h3a1 1 0 0 0 1-1v-2a1 1 0 0 0-1-1"/><path d="M3 5v14a2 2 0 0 0 2 2h15a1 1 0 0 0 1-1v-4"/>',
    team: '<path d="M2 21a8 8 0 0 1 13.29-6"/><circle cx="10" cy="8" r="5"/><circle cx="18" cy="18" r="3"/><path d="M18 13.5v1.5M18 21v1.5M22.5 18H21M15 18h-1.5"/>',
    user: '<circle cx="12" cy="8" r="5"/><path d="M20 21a8 8 0 0 0-16 0"/>',
    phone: '<path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/>',
    phoneoff: '<path d="M10.68 13.31a16 16 0 0 0 3.41 2.6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7 2 2 0 0 1 1.72 2v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.42 19.42 0 0 1-3.33-2.67m-2.67-3.34a19.79 19.79 0 0 1-3.07-8.63A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91"/><path d="M22 2 2 22"/>',
    wa: '<path d="M3 21l1.65-3.8a9 9 0 1 1 3.4 2.9L3 21"/><path d="M9 10a.5.5 0 0 0 1 0V9a.5.5 0 0 0-1 0v1a5 5 0 0 0 5 5h1a.5.5 0 0 0 0-1h-1a.5.5 0 0 0 0 1"/>',
    check: '<path d="M20 6 9 17l-5-5"/>',
    x: '<path d="M18 6 6 18M6 6l12 12"/>',
    pin: '<path d="M20 10c0 4.99-5.54 10.19-7.4 11.8a1 1 0 0 1-1.2 0C9.54 20.19 4 14.99 4 10a8 8 0 0 1 16 0"/><circle cx="12" cy="10" r="3"/>',
    plus: '<path d="M5 12h14M12 5v14"/>',
    search: '<circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/>',
    calendar: '<rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/>',
    alert: '<path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3"/><path d="M12 9v4M12 17h.01"/>',
    undo: '<path d="M9 14 4 9l5-5"/><path d="M4 9h10.5a5.5 5.5 0 0 1 0 11H11"/>',
    trash: '<path d="M3 6h18M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/>',
    edit: '<path d="M21.17 6.81a1 1 0 0 0-3.99-3.99L3.84 16.17a2 2 0 0 0-.5.83l-1.32 4.35a.5.5 0 0 0 .62.62l4.35-1.32a2 2 0 0 0 .83-.5z"/>',
    download: '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3"/>',
    camera: '<path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z"/><circle cx="12" cy="13" r="3"/>',
    logout: '<path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9"/>',
    chev: '<path d="m9 18 6-6-6-6"/>',
    bag: '<path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z"/><path d="M3 6h18M16 10a4 4 0 0 1-8 0"/>',
    foot: '<path d="M4 16v-2.38C4 11.5 2.97 10.5 3 8c.03-2.72 1.49-6 4.5-6C9.37 2 10 3.8 10 5.5c0 3.11-2 5.66-2 8.68V16a2 2 0 1 1-4 0Z"/><path d="M20 20v-2.38c0-2.12 1.03-3.12 1-5.62-.03-2.72-1.49-6-4.5-6C14.63 6 14 7.8 14 9.5c0 3.11 2 5.66 2 8.68V20a2 2 0 1 0 4 0Z"/><path d="M16 17h4M4 13h4"/>',
    send: '<path d="m22 2-7 20-4-9-9-4Z"/><path d="M22 2 11 13"/>',
    trend: '<path d="m22 7-8.5 8.5-5-5L2 17"/><path d="M16 7h6v6"/>',
    cash: '<rect x="2" y="6" width="20" height="12" rx="2"/><circle cx="12" cy="12" r="2"/><path d="M6 12h.01M18 12h.01"/>',
    grid: '<rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/>',
    bell: '<path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/>',
    paste: '<path d="M15 2H9a1 1 0 0 0-1 1v2a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1V3a1 1 0 0 0-1-1Z"/><path d="M8 4H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2M16 4h2a2 2 0 0 1 2 2v2M11 14h10M17 10l4 4-4 4"/>',
    history: '<path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5M12 7v5l4 2"/>',
    note: '<path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><path d="M14 2v6h6M16 13H8M16 17H8M10 9H8"/>',
    tag: '<path d="M12.59 2.59A2 2 0 0 0 11.17 2H4a2 2 0 0 0-2 2v7.17a2 2 0 0 0 .59 1.42l8.7 8.7a2.43 2.43 0 0 0 3.42 0l6.58-6.58a2.43 2.43 0 0 0 0-3.42z"/><circle cx="7.5" cy="7.5" r="1"/>',
    inbox: '<path d="M22 12h-6l-2 3h-4l-2-3H2"/><path d="M5.45 5.11 2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z"/>',
    lock: '<rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>'
  };
  function ico(name, cls) { return '<svg class="i ' + (cls || "") + '" viewBox="0 0 24 24" aria-hidden="true">' + (ICONS[name] || "") + "</svg>"; }

  /* ------------------------------------------------------------------------
     Utilitaires
     ------------------------------------------------------------------------ */
  var $ = function (s, c) { return (c || document).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };
  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }
  function num(n) { return String(Math.round(Number(n) || 0)).replace(/\B(?=(\d{3})+(?!\d))/g, " "); }
  function money(n) { return num(n) + " F"; }
  function pct(a, b) { return b ? Math.round((a / b) * 100) + " %" : "—"; }
  function int(v) { var n = parseInt(String(v == null ? "" : v).replace(/\s/g, ""), 10); return isNaN(n) ? 0 : n; }
  function pad(n) { return (n < 10 ? "0" : "") + n; }
  // Côte d'Ivoire = UTC toute l'année
  function today() { return new Date().toISOString().slice(0, 10); }
  function addDays(d, n) { var x = new Date(d + "T00:00:00Z"); x.setUTCDate(x.getUTCDate() + n); return x.toISOString().slice(0, 10); }
  function fdate(iso) { if (!iso) return ""; var d = new Date(iso); return pad(d.getUTCDate()) + "/" + pad(d.getUTCMonth() + 1); }
  function fdatetime(iso) { if (!iso) return ""; var d = new Date(iso); return fdate(iso) + " à " + pad(d.getUTCHours()) + "h" + pad(d.getUTCMinutes()); }
  function fday(d) { if (!d) return ""; var p = d.split("-"); return p[2] + "/" + p[1] + "/" + p[0]; }
  function fdayShort(d) {
    if (!d) return ""; if (d === today()) return "aujourd'hui"; if (d === addDays(today(), 1)) return "demain"; if (d === addDays(today(), -1)) return "hier";
    var p = d.split("-"); return p[2] + "/" + p[1];
  }
  function ago(iso) {
    if (!iso) return "";
    var m = Math.round((Date.now() - new Date(iso).getTime()) / 60000);
    if (m < 1) return "à l'instant"; if (m < 60) return "il y a " + m + " min";
    var h = Math.round(m / 60); if (h < 24) return "il y a " + h + " h";
    var d = Math.round(h / 24); return d === 1 ? "hier" : "il y a " + d + " j";
  }
  function hoursSince(iso) { return (Date.now() - new Date(iso).getTime()) / 36e5; }
  function monthBounds(ym) {
    var y = +ym.slice(0, 4), m = +ym.slice(5, 7);
    var start = new Date(Date.UTC(y, m - 1, 1)), end = new Date(Date.UTC(y, m, 1));
    return { from: start.toISOString(), to: end.toISOString(), fromD: start.toISOString().slice(0, 10), toD: end.toISOString().slice(0, 10) };
  }
  function monthLabel(ym) {
    var names = ["janv.", "févr.", "mars", "avr.", "mai", "juin", "juil.", "août", "sept.", "oct.", "nov.", "déc."];
    return names[+ym.slice(5, 7) - 1] + " " + ym.slice(2, 4);
  }
  function shiftMonth(ym, n) { var d = new Date(Date.UTC(+ym.slice(0, 4), +ym.slice(5, 7) - 1 + n, 1)); return d.toISOString().slice(0, 7); }
  function digits(p) { var d = String(p || "").replace(/\D/g, ""); return d.length > 10 ? d.slice(-10) : d; }
  function fphone(p) { return digits(p).replace(/(\d{2})(?=\d)/g, "$1 "); }
  function telUrl(p) { return "tel:+225" + digits(p); }
  function waUrl(phone, text) { return "https://wa.me/225" + digits(phone) + (text ? "?text=" + encodeURIComponent(text) : ""); }
  function firstName(n) { return String(n || "").trim().split(/\s+/)[0] || ""; }
  function initials(n) { var p = String(n || "?").trim().split(/\s+/); return ((p[0] || "?")[0] + (p[1] ? p[1][0] : "")).toUpperCase(); }
  function longDate() { var t = new Date().toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long", timeZone: "UTC" }); return t.charAt(0).toUpperCase() + t.slice(1); }
  function store(k, v) {
    try { if (v === undefined) return JSON.parse(localStorage.getItem("bco_" + k) || "null"); localStorage.setItem("bco_" + k, JSON.stringify(v)); }
    catch (e) { return null; }
  }
  function opts(map, sel, emptyLabel) {
    var h = emptyLabel != null ? '<option value="">' + esc(emptyLabel) + "</option>" : "";
    Object.keys(map).forEach(function (k) { h += '<option value="' + k + '"' + (k === sel ? " selected" : "") + ">" + esc(map[k]) + "</option>"; });
    return h;
  }
  function pill(key, label) { return '<span class="pill pill--' + esc(key) + '">' + esc(label) + "</span>"; }
  function statusPill(s) { return pill(s, ST[s]); }
  function debounce(fn, ms) { var t; return function () { var a = arguments; clearTimeout(t); t = setTimeout(function () { fn.apply(null, a); }, ms); }; }

  var toastT;
  function toast(msg, kind) {
    var t = $("#toast");
    var icon = kind === "err" ? "alert" : kind === "ok" ? "check" : null;
    t.innerHTML = (icon ? ico(icon) : "") + "<span>" + esc(msg) + "</span>";
    t.className = "toast is-on" + (kind === "err" ? " is-err" : kind === "ok" ? " is-ok" : "");
    clearTimeout(toastT); toastT = setTimeout(function () { t.className = "toast"; }, kind === "err" ? 5000 : 2600);
  }
  function fail(e) { console.error(e); toast((e && e.message) || "Erreur", "err"); }

  /* ------------------------------------------------------------------------
     Fenêtre (plein écran sur téléphone)
     ------------------------------------------------------------------------ */
  var dlg = $("#modal");
  $("#modal-x").innerHTML = ico("x");
  $("#modal-x").addEventListener("click", function () { closeModal(); });
  dlg.addEventListener("close", function () { S.modalOpen = false; });
  function openModal(o) {
    $("#modal-title").textContent = o.title || "";
    $("#modal-body").innerHTML = o.body || "";
    var foot = $("#modal-foot"); foot.innerHTML = "";
    (o.actions || []).forEach(function (a) {
      var b = document.createElement(a.href ? "a" : "button");
      b.className = "btn " + (a.cls || ""); b.innerHTML = (a.icon ? ico(a.icon) : "") + (a.label ? "<span>" + a.label + "</span>" : "");
      if (a.title) { b.title = a.title; b.setAttribute("aria-label", a.title); }
      if (a.href) { b.href = a.href; if (/^https?:/.test(a.href)) { b.target = "_blank"; b.rel = "noopener"; } }
      else b.type = "button";
      if (a.onClick) b.addEventListener("click", function () {
        if (b.disabled) return;
        var r = a.onClick(b);
        if (r && r.then) { b.disabled = true; r.catch(fail).then(function () { b.disabled = false; }); }
      });
      foot.appendChild(b);
    });
    if (!dlg.open) dlg.showModal();
    S.modalOpen = true;
    $("#modal-body").scrollTop = 0;
    if (o.mount) o.mount($("#modal-body"));
  }
  function closeModal() { if (dlg.open) dlg.close(); S.modalOpen = false; }
  function confirmBox(text, label) {
    return new Promise(function (resolve) {
      openModal({
        title: "Confirmation", body: "<p>" + esc(text) + "</p>",
        actions: [
          { label: "Annuler", onClick: function () { closeModal(); resolve(false); } },
          { label: label || "Confirmer", cls: "btn--bad-fill", onClick: function () { closeModal(); resolve(true); } }
        ]
      });
    });
  }
  function formData(root) {
    var o = {};
    $$("[name]", root).forEach(function (el) {
      if (el.type === "radio") { if (el.checked) o[el.name] = el.value; else if (!(el.name in o)) o[el.name] = ""; }
      else if (el.type === "checkbox") o[el.name] = el.checked;
      else if (el.type !== "file") o[el.name] = el.value.trim();
    });
    return o;
  }

  /* ------------------------------------------------------------------------
     État
     ------------------------------------------------------------------------ */
  var S = {
    sb: null, session: null, me: null,
    brands: {}, products: [], variants: [], offers: [], members: [], costs: {},
    uni: store("uni") || "all", view: null, refresh: null, modalOpen: false, vs: {}, badges: {}
  };
  function role() { return S.me && S.me.active ? S.me.role : null; }
  // Closeuse dédiée à une seule activité (sacoches ou semelles) : tout est filtré sur celle-ci
  function lockedUni() { return role() === "closeuse" && S.me.univers ? S.me.univers : null; }
  function defaultUni() { return lockedUni() || (S.uni !== "all" ? S.uni : (store("lastUni") || "bienetre")); }
  function uniPicker(name, current) {
    if (lockedUni()) return '<input type="radio" name="' + name + '" value="' + lockedUni() + '" checked hidden>';
    return '<div class="seg">' + ["bienetre", "passion"].map(function (u) {
      return '<label><input type="radio" name="' + name + '" value="' + u + '"' + (current === u ? " checked" : "") + '><span><span><span class="dot dot--' + u + '"></span>' + UNI[u] + "</span></span></label>";
    }).join("") + "</div>";
  }
  function can() { var r = role(); return Array.prototype.indexOf.call(arguments, r) >= 0; }
  function vstate(view, defaults) { S.vs[view] = S.vs[view] || Object.assign({}, defaults); return S.vs[view]; }

  async function q(p) {
    var res = await p;
    if (res.error) {
      var m = res.error.message || "Erreur";
      if (/JWT|token/i.test(m)) m = "Session expirée : reconnectez-vous.";
      if (/Failed to fetch|NetworkError/i.test(m)) m = "Pas de connexion internet.";
      if (/image_url|univers|set_member|my_univers/.test(m)) m = "Base à mettre à jour : exécutez le fichier maj-03.sql dans Supabase (SQL Editor).";
      throw new Error(m);
    }
    return res.data;
  }
  function uniEq(query, col) { return S.uni === "all" ? query : query.eq(col || "univers", S.uni); }

  async function loadRefs() {
    var r = await Promise.all([
      q(S.sb.from("products").select("*").order("created_at")),
      q(S.sb.from("variants").select("*").order("sort").order("label")),
      q(S.sb.from("offers").select("*").order("qty")),
      q(S.sb.from("brands").select("*")),
      q(S.sb.from("profiles").select("*").order("created_at"))
    ]);
    S.products = r[0]; S.variants = r[1]; S.offers = r[2]; S.members = r[4];
    S.brands = {}; r[3].forEach(function (b) { S.brands[b.univers] = b; });
    S.costs = {};
    if (can("gerant", "stock")) {
      (await q(S.sb.from("product_costs").select("*"))).forEach(function (c) { S.costs[c.product_id] = c.cost_price; });
    }
  }
  function product(id) { return S.products.find(function (p) { return p.id === id; }); }
  function variant(id) { return S.variants.find(function (v) { return v.id === id; }); }
  function member(id) { return S.members.find(function (m) { return m.id === id; }); }
  function memberName(id) { var m = member(id); return m ? (m.full_name || m.email) : ""; }
  function couriers() { return S.members.filter(function (m) { return m.role === "livreur" && m.active; }); }
  function brandName(u) { return (S.brands[u] && S.brands[u].name) || UNI[u] || APP; }
  function singleVariant(pid) { return S.variants.filter(function (v) { return v.product_id === pid; }).length === 1; }
  function variantName(id, withProduct) {
    var v = variant(id); if (!v) return "?";
    var p = product(v.product_id);
    if (p && singleVariant(p.id)) return p.name;
    return (withProduct !== false && p ? p.name + " " : "") + v.label;
  }
  function variantImage(id) { var v = variant(id); if (!v) return ""; var p = product(v.product_id); return v.image_url || (p && p.image_url) || ""; }
  function itemsText(o) {
    var items = o.order_items || [];
    if (!items.length) return "—";
    var offer = S.offers.find(function (x) { return x.id === o.offer_id; });
    if (offer) return offer.name + " · " + items.map(function (i) { return variantName(i.variant_id, false) + (i.qty > 1 ? " ×" + i.qty : ""); }).join(", ");
    return items.map(function (i) { return variantName(i.variant_id) + (i.qty > 1 ? " ×" + i.qty : ""); }).join(", ");
  }
  function toCollect(o) { return Math.max((o.total_amount || 0) - (o.prepaid_amount || 0), 0); }
  function uniIcon(u) { return u === "passion" ? "bag" : "foot"; }
  function thumb(src, u, extra, size) {
    return '<div class="thumb thumb--' + (u || "x") + '"' + (size ? ' style="width:' + size + "px;height:" + size + 'px"' : "") + ">" +
      (src ? '<img src="' + esc(src) + '" alt="" loading="lazy">' : ico(uniIcon(u), "i--lg")) + (extra ? '<span class="more">' + extra + "</span>" : "") + "</div>";
  }
  function orderThumb(o) {
    var items = o.order_items || [];
    var src = items.length ? variantImage(items[0].variant_id) : "";
    var distinct = {}; items.forEach(function (i) { var v = variant(i.variant_id); if (v) distinct[v.product_id + "|" + (v.image_url || "")] = 1; });
    var n = Object.keys(distinct).length;
    return thumb(src, o.univers, n > 1 ? "+" + (n - 1) : "");
  }

  /* ------------------------------------------------------------------------
     Messages WhatsApp
     ------------------------------------------------------------------------ */
  function productWord(u) { return u === "passion" ? "nos sacoches" : "nos semelles " + brandName("bienetre"); }
  function orderMsg(o) {
    var lines = [
      "Bonjour " + firstName(o.customer_name) + ", c'est " + brandName(o.univers) + " 😊",
      "Nous confirmons votre commande " + o.ref + " :",
      "🛒 " + itemsText(o),
      "💵 " + (o.prepaid_amount ? "Reste à payer à la livraison : " + money(toCollect(o)) : "À payer à la livraison : " + money(o.total_amount)),
      "📍 " + [o.city, o.address].filter(Boolean).join(", ")
    ];
    if (o.delivery_date) lines.push("🚚 Livraison prévue le " + fday(o.delivery_date));
    lines.push("", "Merci pour votre confiance !");
    return lines.join("\n");
  }
  function callBackMsg(o) {
    return "Bonjour " + firstName(o.customer_name) + ", c'est " + brandName(o.univers) + " 😊 Nous avons bien reçu votre commande (" + itemsText(o) +
      ", " + money(o.total_amount) + "). Nous avons essayé de vous appeler pour la confirmer : à quel moment pouvons-nous vous joindre ?";
  }
  function contactMsg(c) {
    var b = brandName(c.univers), n = firstName(c.name);
    var hi = "Bonjour" + (n ? " " + n : "") + ", c'est " + b + " 😊 ";
    if (c.stage === "panier") return hi + "Nous avons bien reçu votre demande de commande. Pouvez-vous nous confirmer votre adresse et le moment qui vous arrange pour la livraison ? Paiement à la livraison.";
    if (c.stage === "client" && isOldClient(c)) return hi + "Cela fait un moment ! Nous avons des nouveautés et une offre spéciale pour nos anciens clients. Voulez-vous que je vous envoie les détails ?";
    if (c.stage === "client") return hi + "Êtes-vous satisfait(e) de votre commande ? Votre avis compte beaucoup pour nous 🙏";
    return hi + "Vous nous aviez contactés au sujet de " + productWord(c.univers) + ". Avez-vous des questions ? Nous livrons partout en Côte d'Ivoire, paiement à la livraison.";
  }
  function isOldClient(c) {
    return c.stage === "client" && c.last_order_at && (Date.now() - new Date(c.last_order_at).getTime()) > OLD_CLIENT_DAYS * 864e5;
  }

  /* ------------------------------------------------------------------------
     Vues et navigation
     ------------------------------------------------------------------------ */
  var VIEWS = {
    tableau:    { label: "Accueil", ico: "home", roles: ["gerant", "closeuse", "stock"], render: vDashboard },
    commandes:  { label: "Commandes", ico: "orders", roles: ["gerant", "closeuse", "stock"], render: vOrders, badge: "todo" },
    prospects:  { label: "Prospects", ico: "users", roles: ["gerant", "closeuse"], render: vContacts, badge: "follow" },
    livraisons: { label: "Livraisons", ico: "truck", roles: ["livreur"], render: vMyDeliveries },
    stock:      { label: "Stock", ico: "package", roles: ["gerant", "stock"], render: vStock },
    livreurs:   { label: "Livreurs", ico: "truck", roles: ["gerant"], render: vCouriers },
    finances:   { label: "Finances", ico: "wallet", roles: ["gerant"], render: vFinances },
    reglages:   { label: "Équipe", ico: "team", roles: ["gerant"], render: vSettings },
    compte:     { label: "Compte", ico: "user", roles: ["gerant", "closeuse", "livreur", "stock"], render: vAccount }
  };
  function viewLabel(k) { return k === "tableau" && role() === "closeuse" ? "Ma journée" : VIEWS[k].label; }
  function allowedViews() { return Object.keys(VIEWS).filter(function (k) { return VIEWS[k].roles.indexOf(role()) >= 0; }); }
  function brandHtml() { return "BOLOU <span>and CO</span>"; }
  function navLink(k) {
    return '<a href="#/' + k + '" data-view="' + k + '">' + ico(VIEWS[k].ico) + "<span>" + viewLabel(k) + "</span>" +
      (VIEWS[k].badge ? '<span class="badge" data-badge="' + VIEWS[k].badge + '" hidden></span>' : "") + "</a>";
  }

  function shell() {
    var views = allowedViews();
    var tabs = views.length <= 5 ? views : views.slice(0, 4);
    $("#root").innerHTML =
      '<div class="app">' +
      '<aside class="side"><div class="side__brand"><img src="' + LOGO + '" alt=""><div><b>' + brandHtml() + '</b><small>GESTION</small></div></div>' +
      "<nav>" + views.map(navLink).join("") + "</nav>" +
      '<div class="side__foot">' + esc(S.me.full_name || S.me.email) + "<br><small>" + esc((ROLES[S.me.role] || "") + (lockedUni() ? " · " + UNI[lockedUni()] : "")) +
      '</small><br><button type="button" id="logout">' + ico("logout", "i--sm") + "Se déconnecter</button></div></aside>" +
      '<header class="topbar"><img src="' + LOGO + '" alt=""><b>' + brandHtml() + '</b><span class="sp"></span><span class="who">' +
      esc(firstName(S.me.full_name) || S.me.email) + "<br>" + esc((ROLES[S.me.role] || "") + (lockedUni() ? " · " + UNI[lockedUni()] : "")) + "</span></header>" +
      '<main class="main" id="view" tabindex="-1"></main>' +
      '<nav class="tabbar" aria-label="Navigation">' + tabs.map(navLink).join("") +
      (views.length > 5 ? '<button type="button" id="more-btn">' + ico("grid") + "<span>Plus</span></button>" : "") + "</nav>" +
      '<button type="button" class="fab" id="fab" hidden></button></div>';
    $("#logout").addEventListener("click", logout);
    if ($("#more-btn")) $("#more-btn").addEventListener("click", function () {
      openModal({
        title: "Plus",
        body: '<div class="more-list">' + views.slice(4).map(function (k) {
          return '<a href="#/' + k + '">' + ico(VIEWS[k].ico) + "<span>" + viewLabel(k) + '</span><span style="margin-left:auto">' + ico("chev", "i--sm") + "</span></a>";
        }).join("") + "</div>"
      });
    });
  }
  function setBadges() {
    $$("[data-badge]").forEach(function (b) {
      var n = S.badges[b.getAttribute("data-badge")] || 0;
      b.hidden = !n; b.textContent = n > 99 ? "99+" : n;
    });
  }
  async function refreshBadges() {
    if (!can("gerant", "closeuse")) return;
    try {
      var r = await Promise.all([
        q(S.sb.from("orders").select("id").in("status", ["nouvelle", "injoignable"])),
        q(S.sb.from("contacts").select("id").lte("next_followup", today()).neq("stage", "perdu"))
      ]);
      S.badges.todo = r[0].length; S.badges.follow = r[1].length; setBadges();
    } catch (e) { /* silencieux */ }
  }
  function setFab(icon, label, fn) {
    var f = $("#fab"); if (!f) return;
    if (!fn) { f.hidden = true; f.onclick = null; return; }
    f.hidden = false; f.innerHTML = ico(icon); f.setAttribute("aria-label", label); f.title = label; f.onclick = fn;
  }

  function route() {
    var v = (location.hash.match(/^#\/?([\w-]+)/) || [])[1];
    var allowed = allowedViews();
    if (allowed.indexOf(v) < 0) { v = allowed[0]; history.replaceState(null, "", "#/" + v); }
    S.view = v; S.refresh = null;
    $$("[data-view]").forEach(function (a) { a.classList.toggle("is-active", a.getAttribute("data-view") === v); });
    if ($("#more-btn")) $("#more-btn").classList.toggle("is-active", allowed.indexOf(v) >= 4);
    setFab(null);
    if (can("gerant", "closeuse") && (v === "tableau" || v === "commandes")) setFab("plus", "Nouvelle commande", function () { orderForm(); });
    if (can("gerant", "closeuse") && v === "prospects") setFab("plus", "Nouveau contact", function () { contactForm(); });
    if (can("gerant", "stock") && v === "stock") setFab("plus", "Entrée de stock", function () { stockIn(); });
    var el = $("#view");
    el.innerHTML = '<p class="muted">Chargement…</p>';
    Promise.resolve(VIEWS[v].render(el)).catch(function (e) { el.innerHTML = empty("alert", e.message); });
    window.scrollTo(0, 0);
    refreshBadges();
  }

  function uniSwitch() {
    if (lockedUni()) return '<span class="pill pill--' + lockedUni() + '" style="font-size:.78rem;padding:6px 12px"><span class="dot dot--' + lockedUni() + '"></span>&nbsp;' + UNI[lockedUni()] + "</span>";
    return '<div class="uni" role="group" aria-label="Activité">' +
      [["all", "Tout", ""], ["passion", "Sacoches", "passion"], ["bienetre", "Semelles", "bienetre"]].map(function (u) {
        return '<button type="button" data-u="' + u[0] + '" class="' + (S.uni === u[0] ? "is-on" : "") + '">' + (u[2] ? '<span class="dot dot--' + u[2] + '"></span>' : "") + u[1] + "</button>";
      }).join("") + "</div>";
  }
  function bindUni(root) {
    $$(".uni button", root).forEach(function (b) {
      b.addEventListener("click", function () { S.uni = b.getAttribute("data-u"); store("uni", S.uni); route(); });
    });
  }
  function header(title, sub, actionsHtml, withUni) {
    return '<div class="head"><div><h1>' + esc(title) + "</h1>" + (sub ? '<div class="head__sub">' + esc(sub) + "</div>" : "") +
      '</div><div class="actions">' + (withUni ? uniSwitch() : "") + (actionsHtml || "") + "</div></div>";
  }
  function sectionTitle(icon, title, link, linkLabel) {
    return '<div class="section-title"><h2>' + ico(icon) + esc(title) + "</h2>" + (link ? '<a href="' + link + '">' + esc(linkLabel || "Tout voir") + ico("chev", "i--sm") + "</a>" : "") + "</div>";
  }
  function empty(icon, text) { return '<div class="empty">' + ico(icon) + esc(text) + "</div>"; }

  /* ========================================================================
     ACCUEIL (closeuse : « Ma journée » · gérant : tableau de bord)
     ======================================================================== */
  async function vDashboard(el) {
    var mb = monthBounds(today().slice(0, 7));
    var tasks = [
      q(uniEq(S.sb.from("orders").select("*, order_items(variant_id, qty, unit_price)").in("status", OPEN)).order("created_at").limit(500)),
      q(uniEq(S.sb.from("orders").select("id, univers, status, total_amount, delivered_at, confirmed_at").gte("updated_at", can("gerant") ? mb.from : today() + "T00:00:00Z")))
    ];
    if (can("gerant", "closeuse")) tasks.push(q(uniEq(S.sb.from("contacts").select("*").lte("next_followup", today()).neq("stage", "perdu")).order("next_followup").limit(200)));
    if (can("gerant")) tasks.push(q(S.sb.from("courier_balances").select("*")));
    var r = await Promise.all(tasks);
    var open = r[0], recent = r[1], follow = r[2] || [], balances = r[3] || [];
    var nouvelles = open.filter(function (o) { return o.status === "nouvelle"; });
    var injoignables = open.filter(function (o) { return o.status === "injoignable"; });
    var toShip = open.filter(function (o) { return o.status === "confirmee"; });
    var onRoad = open.filter(function (o) { return o.status === "en_livraison"; });
    var confToday = recent.filter(function (o) { return (o.confirmed_at || "").slice(0, 10) === today(); });
    var delivered = recent.filter(function (o) { return o.status === "livree" && o.delivered_at && o.delivered_at >= mb.from; });
    var dToday = delivered.filter(function (o) { return (o.delivered_at || "").slice(0, 10) === today(); });
    var low = S.variants.filter(function (v) {
      var p = product(v.product_id);
      return v.active && p && p.active && (S.uni === "all" || p.univers === S.uni) && v.stock <= v.alert_threshold;
    });
    var due = balances.reduce(function (s, b) { return s + Math.max(b.due, 0); }, 0);
    var hour = new Date().getUTCHours();
    var hello = (hour < 12 ? "Bonjour " : hour < 18 ? "Bon après-midi " : "Bonsoir ") + firstName(S.me.full_name || "");
    var html = header(hello, longDate(), "", true);

    if (can("gerant", "closeuse")) {
      html += '<div class="counters">' +
        counter(nouvelles.length, "À confirmer", "inbox", "#/commandes", nouvelles.length ? "bad" : "") +
        counter(injoignables.length, "Injoignables", "phoneoff", "#/commandes", injoignables.length ? "warn" : "") +
        counter(follow.length, "Relances", "bell", "#/prospects", follow.length ? "info" : "") +
        counter(confToday.length, "Confirmées auj.", "check", "#/commandes", "ok") + "</div>";
    }
    if (can("gerant")) {
      html += '<div class="kpis">' +
        kpi("truck", "cyan", "En livraison", onRoad.length, money(onRoad.reduce(function (s, o) { return s + toCollect(o); }, 0)) + " à encaisser", "#/livreurs") +
        kpi("trend", "ok", "CA du mois", money(delivered.reduce(function (s, o) { return s + o.total_amount; }, 0)), delivered.length + " livrées · " + dToday.length + " aujourd'hui", "#/finances") +
        kpi("cash", due ? "bad" : "", "Chez les livreurs", money(due), "à récupérer", "#/livreurs") +
        kpi("package", low.length ? "warn" : "", "Stock bas", low.length, "variantes à réapprovisionner", "#/stock") + "</div>";
    }
    if (role() === "stock") {
      html += '<div class="kpis">' + kpi("orders", "violet", "À expédier", toShip.length, "commandes confirmées", "#/commandes") +
        kpi("truck", "cyan", "En livraison", onRoad.length, "", "#/commandes") + kpi("package", low.length ? "warn" : "", "Stock bas", low.length, "variantes", "#/stock") + "</div>";
    }

    var todo = nouvelles.concat(injoignables);
    if (can("gerant", "closeuse")) {
      html += '<div class="grid-2"><div>' + sectionTitle("inbox", "À confirmer (" + todo.length + ")", "#/commandes") +
        '<div class="list">' + (todo.length ? todo.slice(0, 12).map(orderCard).join("") : empty("check", "Tout est confirmé, bravo !")) + "</div></div>" +
        "<div>" + sectionTitle("bell", "Relances du jour (" + follow.length + ")", "#/prospects") +
        '<div class="list">' + (follow.length ? follow.slice(0, 10).map(contactCard).join("") : empty("bell", "Aucune relance prévue aujourd'hui")) + "</div>" +
        (toShip.length ? sectionTitle("send", "Confirmées à expédier (" + toShip.length + ")", "#/commandes") + '<div class="list">' + toShip.slice(0, 8).map(orderCard).join("") + "</div>" : "") +
        "</div></div>";
    }
    if (can("gerant", "stock") && low.length) html += sectionTitle("alert", "Stock bas", "#/stock", "Stock") + lowList(low);
    el.innerHTML = html;
    bindUni(el);
    bindOrderCards(el, open);
    bindContactCards(el, follow);
    S.refresh = function () { if (S.view === "tableau") vDashboard(el).catch(fail); };
  }
  function counter(n, label, icon, href, mod) {
    return '<a class="counter' + (mod ? " counter--" + mod : "") + '" href="' + href + '"><b>' + n + "</b><span>" + ico(icon, "i--sm") + esc(label) + "</span></a>";
  }
  function kpi(icon, tone, label, value, sub, href) {
    var tag = href ? 'a href="' + href + '"' : "div";
    return "<" + tag + ' class="kpi"><div class="kpi__ico' + (tone ? " kpi__ico--" + tone : "") + '">' + ico(icon) + '</div><div class="kpi__body"><div class="kpi__label">' + esc(label) +
      '</div><div class="kpi__value">' + esc(value) + '</div><div class="kpi__sub">' + esc(sub || "") + "</div></div></" + (href ? "a" : "div") + ">";
  }
  function lowList(low) {
    return '<div class="card"><div class="tiles" style="margin-top:0">' + low.map(function (v) {
      return '<div class="tile tile--' + (v.stock <= 0 ? "out" : "low") + '"><div class="tile__label">' + esc(variantName(v.id)) + '</div><div class="tile__qty">' + v.stock + "</div></div>";
    }).join("") + "</div></div>";
  }

  /* ========================================================================
     CARTES DE COMMANDE avec actions rapides
     ======================================================================== */
  function orderCard(o) {
    var late = (o.status === "nouvelle" || o.status === "injoignable") && hoursSince(o.created_at) > 24;
    var acts = "";
    if (can("gerant", "closeuse")) {
      var call = '<a class="btn btn--icon" href="' + telUrl(o.phone) + '" title="Appeler" aria-label="Appeler">' + ico("phone") + "</a>";
      var wa = '<a class="btn btn--icon btn--wa" target="_blank" rel="noopener" href="' + waUrl(o.phone, o.status === "injoignable" ? callBackMsg(o) : orderMsg(o)) + '" title="WhatsApp" aria-label="WhatsApp">' + ico("wa") + "</a>";
      if (o.status === "nouvelle") acts = '<div class="oc__acts">' + call + wa + '<button class="btn btn--warn" data-act="injoignable">' + ico("phoneoff", "i--sm") + 'Injoignable</button><button class="btn btn--ok" data-act="confirmee">' + ico("check", "i--sm") + "Confirmer</button></div>";
      else if (o.status === "injoignable") acts = '<div class="oc__acts">' + call + wa + '<button class="btn btn--bad" data-act="annulee">' + ico("x", "i--sm") + 'Annuler</button><button class="btn btn--ok" data-act="confirmee">' + ico("check", "i--sm") + "Confirmer</button></div>";
      else if (o.status === "confirmee") acts = '<div class="oc__acts oc__acts--3">' + call + wa + '<button class="btn btn--primary" data-act="en_livraison">' + ico("send", "i--sm") + "Envoyer en livraison</button></div>";
      else if (o.status === "en_livraison") acts = '<div class="oc__acts">' + call + wa + '<button class="btn btn--bad" data-act="retour">' + ico("undo", "i--sm") + 'Retour</button><button class="btn btn--ok" data-act="livree">' + ico("check", "i--sm") + "Livrée</button></div>";
    }
    return '<article class="oc" data-order="' + o.id + '">' +
      '<div class="oc__main" role="button" tabindex="0">' + orderThumb(o) +
      '<div class="oc__body"><div class="oc__name">' + esc(o.customer_name || "Sans nom") + " " + statusPill(o.status) + "</div>" +
      '<div class="oc__line">' + ico("tag") + "<span>" + esc(itemsText(o)) + "</span></div>" +
      '<div class="oc__line">' + ico("pin") + "<span>" + esc(o.city || "—") + (o.mode === "expedition" ? " · expédition" : "") + "</span></div>" +
      (o.courier_id && (o.status === "en_livraison" || o.status === "confirmee") ? '<div class="oc__line">' + ico("truck") + "<span>" + esc(memberName(o.courier_id)) + (o.delivery_date ? " · " + fdayShort(o.delivery_date) : "") + "</span></div>" : "") +
      '</div><div class="oc__aside"><div class="oc__amount">' + money(o.total_amount) + '</div><div class="oc__time' + (late ? " is-late" : "") + '">' + ago(o.created_at) + "</div>" +
      (S.uni === "all" ? '<span class="dot dot--' + o.univers + '" title="' + UNI[o.univers] + '"></span>' : "") + "</div></div>" + acts + "</article>";
  }
  function bindOrderCards(root, list) {
    $$("[data-order]", root).forEach(function (card) {
      var o = list.find(function (x) { return x.id === card.getAttribute("data-order"); });
      if (!o) return;
      var main = $(".oc__main", card);
      main.addEventListener("click", function () { orderDetail(o.id); });
      main.addEventListener("keydown", function (e) { if (e.key === "Enter") orderDetail(o.id); });
      $$("[data-act]", card).forEach(function (b) {
        b.addEventListener("click", function (e) { e.stopPropagation(); quickAction(o, b.getAttribute("data-act"), b); });
      });
    });
  }
  async function quickAction(o, act, btn) {
    if (act === "confirmee" || act === "injoignable") {
      btn.disabled = true;
      try { await q(S.sb.rpc("set_order_status", { p_order: o.id, p_status: act, p_note: act === "injoignable" ? "Appel sans réponse" : "" })); }
      catch (e) { btn.disabled = false; return fail(e); }
      o.status = act;
      if (act === "confirmee") afterConfirm(o);
      else { closeModal(); toast("Injoignable : envoyez-lui un message WhatsApp"); }
      if (S.refresh) S.refresh(); refreshBadges();
      return;
    }
    return statusFlow(o, act);
  }
  function afterConfirm(o) {
    openModal({
      title: "Commande confirmée",
      body: '<div class="note note--info" style="margin-bottom:12px">' + ico("check") + "<span><b>" + esc(o.customer_name || "Le client") + "</b> · " + esc(itemsText(o)) + " · " + money(o.total_amount) + "</span></div>" +
        "<p>Envoyez-lui le récapitulatif sur WhatsApp, puis confiez la commande à un livreur.</p>",
      actions: [
        { label: "Plus tard", onClick: closeModal },
        { label: "Livreur", icon: "send", cls: "btn--primary", onClick: function () { statusFlow(o, "en_livraison"); } },
        { label: "WhatsApp", icon: "wa", cls: "btn--wa", href: waUrl(o.phone, orderMsg(o)) }
      ]
    });
    toast("Commande confirmée", "ok");
  }

  /* ========================================================================
     COMMANDES
     ======================================================================== */
  var ORDER_TABS = [
    ["todo", "À confirmer", ["nouvelle", "injoignable"]],
    ["confirmee", "Confirmées", ["confirmee"]],
    ["route", "En livraison", ["en_livraison"]],
    ["livree", "Livrées", ["livree"]],
    ["ko", "Retours / annulées", ["retour", "annulee"]],
    ["all", "Toutes", null]
  ];

  async function vOrders(el) {
    var st = vstate("commandes", { tab: role() === "stock" ? "confirmee" : "todo", search: "", days: "30" });
    var actions = (can("gerant", "closeuse") ? '<button class="btn btn--primary" id="new-order">' + ico("plus") + "<span>Nouvelle</span></button>" : "") +
      (can("gerant") ? '<button class="btn btn--icon" id="oexport" title="Exporter en CSV (Excel)" aria-label="Exporter en CSV">' + ico("download") + "</button>" : "");
    el.innerHTML = header("Commandes", "", actions, true) +
      '<div class="tabs" id="otabs"></div>' +
      '<div class="toolbar"><div class="search">' + ico("search") + '<input type="search" id="osearch" placeholder="Nom, téléphone, référence…" value="' + esc(st.search) + '"></div>' +
      '<select id="odays" style="width:auto"><option value="7">7 jours</option><option value="30">30 jours</option><option value="90">90 jours</option><option value="365">12 mois</option></select></div>' +
      '<div id="olist"><p class="muted">Chargement…</p></div>';
    bindUni(el);
    $("#odays").value = st.days;
    if ($("#new-order")) $("#new-order").addEventListener("click", function () { orderForm(); });
    $("#osearch").addEventListener("input", debounce(function (e) { st.search = e.target.value.trim(); load(); }, 300));
    $("#odays").addEventListener("change", function (e) { st.days = e.target.value; load(); });
    if ($("#oexport")) $("#oexport").addEventListener("click", function () { exportOrders(st.days); });

    function isClosedTab() { var t = ORDER_TABS.find(function (x) { return x[0] === st.tab; }); return !t[2] || t[2].some(function (x) { return OPEN.indexOf(x) < 0; }); }
    async function loadCounts() {
      var rows = await q(uniEq(S.sb.from("orders").select("status").in("status", OPEN)));
      var counts = {}; rows.forEach(function (r) { counts[r.status] = (counts[r.status] || 0) + 1; });
      $("#otabs").innerHTML = ORDER_TABS.map(function (t) {
        var n = t[2] && t[2].every(function (s) { return OPEN.indexOf(s) >= 0; }) ? t[2].reduce(function (s, x) { return s + (counts[x] || 0); }, 0) : null;
        return '<button type="button" class="tab' + (st.tab === t[0] ? " is-on" : "") + '" data-tab="' + t[0] + '">' + t[1] + (n != null ? '<span class="n">' + n + "</span>" : "") + "</button>";
      }).join("");
      $$("#otabs .tab").forEach(function (b) { b.addEventListener("click", function () { st.tab = b.getAttribute("data-tab"); loadCounts(); load(); }); });
    }
    async function load() {
      var tab = ORDER_TABS.find(function (t) { return t[0] === st.tab; });
      var query = uniEq(S.sb.from("orders").select("*, order_items(variant_id, qty, unit_price)"));
      var s = st.search.replace(/[^\p{L}\p{N} -]/gu, "").trim();
      if (s) {
        var d = s.replace(/\D/g, "");
        var ors = ["customer_name.ilike.*" + s + "*", "ref.ilike.*" + s + "*", "city.ilike.*" + s + "*"];
        if (d.length >= 4) ors.push("phone.ilike.*" + d + "*");
        query = query.or(ors.join(","));
      } else {
        if (tab[2]) query = query.in("status", tab[2]);
        if (isClosedTab()) query = query.gte("created_at", new Date(Date.now() - int(st.days) * 864e5).toISOString());
      }
      // à confirmer / à expédier : la plus ancienne d'abord, pour que personne n'attende trop
      var asc = !s && (st.tab === "todo" || st.tab === "confirmee");
      var list = await q(query.order("created_at", { ascending: asc }).limit(400));
      $("#olist").innerHTML = (s ? '<p class="muted small">' + list.length + " résultat(s) pour « " + esc(s) + " »</p>" : "") +
        (list.length ? '<div class="list list--2">' + list.map(orderCard).join("") + "</div>" : empty("inbox", "Aucune commande ici"));
      bindOrderCards($("#olist"), list);
      $("#odays").hidden = !isClosedTab() && !s;
    }
    await Promise.all([loadCounts(), load()]);
    S.refresh = function () { if (S.view === "commandes") { loadCounts().catch(fail); load().catch(fail); } };
  }

  async function orderDetail(id) {
    var r = await Promise.all([
      q(S.sb.from("orders").select("*, order_items(variant_id, qty, unit_price)").eq("id", id).single()),
      q(S.sb.from("order_events").select("*").eq("order_id", id).order("at"))
    ]).catch(fail);
    if (!r) return;
    var o = r[0], ev = r[1];
    var items = o.order_items || [];
    var body =
      '<div class="btn-row" style="margin-bottom:12px;align-items:center">' + pill(o.univers, UNI[o.univers]) + statusPill(o.status) + '<span class="muted small">' + esc(o.ref) + " · " + ago(o.created_at) + "</span></div>" +
      '<div class="gallery">' + items.map(function (i) {
        return "<figure>" + thumb(variantImage(i.variant_id), o.univers) + "<figcaption>" + esc(variantName(i.variant_id, false)) + (i.qty > 1 ? " ×" + i.qty : "") + "</figcaption></figure>";
      }).join("") + "</div>" +
      '<div class="hero-amount"><div><small class="muted">' + (o.status === "livree" ? "Encaissé" : o.prepaid_amount ? "Reste à encaisser" : "À encaisser à la livraison") + "</small><br><b>" +
      money(o.status === "livree" ? o.collected_amount : toCollect(o)) + '</b></div><div class="right small muted">Total ' + money(o.total_amount) + (o.prepaid_amount ? "<br>Avance " + money(o.prepaid_amount) : "") + "</div></div>" +
      '<div class="rows">' +
      '<div class="rowi">' + ico("user") + "<div><b>" + esc(o.customer_name || "—") + '</b><br><a href="' + telUrl(o.phone) + '">' + esc(fphone(o.phone)) + "</a></div></div>" +
      '<div class="rowi">' + ico("pin") + "<div>" + esc(o.city || "—") + (o.address ? "<small>" + esc(o.address) + "</small>" : "") + "</div></div>" +
      '<div class="rowi">' + ico("tag") + "<div>" + esc(itemsText(o)) + "</div></div>" +
      '<div class="rowi">' + ico("truck") + "<div>" + (o.mode === "expedition" ? "Expédition intérieur" : "Livraison Abidjan") +
      "<small>" + [o.courier_id ? memberName(o.courier_id) : "Pas encore de livreur", o.delivery_date ? "le " + fday(o.delivery_date) : "", can("gerant") && o.delivery_cost ? "frais " + money(o.delivery_cost) : ""].filter(Boolean).map(esc).join(" · ") + "</small></div></div>" +
      '<div class="rowi">' + ico("send") + "<div>" + esc(SOURCES[o.source] || o.source) + (o.utm ? "<small>" + esc(o.utm) + "</small>" : "") + "</div></div>" +
      (o.notes ? '<div class="rowi">' + ico("note") + '<div style="white-space:pre-wrap">' + esc(o.notes) + "</div></div>" : "") +
      "</div>" +
      '<details style="margin-top:12px"><summary class="muted small" style="cursor:pointer">Historique (' + ev.length + ')</summary><ul class="timeline" style="margin-top:8px">' + ev.map(function (e) {
        return "<li>" + fdatetime(e.at) + " — " + (e.status ? "<b>" + esc(ST[e.status] || e.status) + "</b> " : "") + esc(e.note) +
          (e.by_user ? ' <span class="muted">(' + esc(memberName(e.by_user)) + ")</span>" : "") + "</li>";
      }).join("") + "</ul></details>";

    var actions = [];
    if (can("gerant")) actions.push({ icon: "trash", title: "Supprimer", cls: "btn--bad btn--icon", onClick: async function () {
      if (!(await confirmBox("Supprimer définitivement la commande " + o.ref + " ? Le stock sera remis si besoin.", "Supprimer"))) return;
      await q(S.sb.rpc("delete_order", { p_order: o.id })); toast("Commande supprimée", "ok"); afterChange();
    } });
    if (can("gerant", "closeuse")) {
      actions.push({ icon: "edit", title: "Modifier", cls: "btn--icon", onClick: function () { orderForm(o); } });
      if (["retour", "annulee", "livree"].indexOf(o.status) >= 0) actions.push({ icon: "history", label: "Statut", onClick: function () { return statusFlow(o, null); } });
    }
    actions.push({ icon: "phone", title: "Appeler", cls: "btn--icon", href: telUrl(o.phone) });
    actions.push({ icon: "wa", title: "WhatsApp", cls: "btn--wa btn--icon", href: waUrl(o.phone, o.status === "injoignable" ? callBackMsg(o) : orderMsg(o)) });
    if (can("gerant", "closeuse")) {
      var fake = { disabled: false };
      if (o.status === "nouvelle") {
        actions.push({ label: "Injoignable", icon: "phoneoff", cls: "btn--warn", onClick: function () { return quickAction(o, "injoignable", fake); } });
        actions.push({ label: "Confirmer", icon: "check", cls: "btn--ok", onClick: function () { return quickAction(o, "confirmee", fake); } });
      }
      if (o.status === "injoignable") {
        actions.push({ label: "Annuler", icon: "x", cls: "btn--bad", onClick: function () { return statusFlow(o, "annulee"); } });
        actions.push({ label: "Confirmer", icon: "check", cls: "btn--ok", onClick: function () { return quickAction(o, "confirmee", fake); } });
      }
      if (o.status === "confirmee") {
        actions.push({ label: "Annuler", icon: "x", cls: "btn--bad", onClick: function () { return statusFlow(o, "annulee"); } });
        actions.push({ label: "Livraison", icon: "send", cls: "btn--primary", onClick: function () { return statusFlow(o, "en_livraison"); } });
      }
      if (o.status === "en_livraison") {
        actions.push({ label: "Retour", icon: "undo", cls: "btn--bad", onClick: function () { return statusFlow(o, "retour"); } });
        actions.push({ label: "Livrée", icon: "check", cls: "btn--ok", onClick: function () { return statusFlow(o, "livree"); } });
      }
    }
    openModal({ title: o.customer_name || "Commande " + o.ref, body: body, actions: actions });
  }

  function afterChange() { closeModal(); loadRefs().then(function () { if (S.refresh) S.refresh(); refreshBadges(); }).catch(fail); }

  // Changement de statut avec les infos utiles (livreur, montant encaissé, motif…)
  function statusFlow(o, status) {
    var body = '<div class="form">';
    if (status === null) body += '<label class="f">Nouveau statut<select name="status">' + opts(ST, o.status) + "</select></label>";
    if (status === "en_livraison") {
      var cs = couriers();
      if (!cs.length) body += '<p class="note">' + ico("alert") + "<span>Aucun livreur actif. Ajoutez-en un dans « Équipe » (rôle Livreur).</span></p>";
      else body += '<div><div style="margin-bottom:6px;font-size:.8rem;color:var(--muted);font-weight:600">Livreur</div><div class="seg">' + cs.map(function (c, i) {
        return '<label><input type="radio" name="courier" value="' + c.id + '"' + (c.id === o.courier_id || (!o.courier_id && i === 0) ? " checked" : "") + "><span>" + esc(firstName(c.full_name) || c.email) + "</span></label>";
      }).join("") + "</div></div>";
      body += '<div class="row"><label class="f">Frais de livraison<input name="delivery_cost" inputmode="numeric" value="' + (o.delivery_cost || store("lastDeliveryCost") || "") + '"></label>' +
        '<label class="f">Date de livraison<input type="date" name="delivery_date" value="' + (o.delivery_date || today()) + '"></label></div>';
    }
    if (status === "livree") body += '<label class="f">Montant encaissé (FCFA)<input name="collected" inputmode="numeric" value="' + toCollect(o) + '"></label>';
    body += '<label class="f">' + (status === "retour" ? "Motif du retour" : status === "annulee" ? "Motif de l'annulation" : "Commentaire (facultatif)") + '<input name="note"></label></div>';
    return new Promise(function (resolve) {
      openModal({
        title: status ? ST[status] + " · " + (o.customer_name || o.ref) : "Changer le statut",
        body: body,
        actions: [
          { label: "Annuler", onClick: function () { orderDetail(o.id); resolve(); } },
          { label: "Valider", icon: "check", cls: status === "retour" || status === "annulee" ? "btn--bad-fill" : "btn--ok", onClick: async function () {
            var f = formData($("#modal-body"));
            var params = { p_order: o.id, p_status: status || f.status, p_note: f.note || "" };
            if (status === "en_livraison") {
              if (!f.courier) { toast("Choisissez un livreur", "err"); return; }
              params.p_courier = f.courier; params.p_delivery_cost = int(f.delivery_cost); params.p_delivery_date = f.delivery_date || null;
              store("lastDeliveryCost", int(f.delivery_cost));
            }
            if (status === "livree") params.p_collected = int(f.collected);
            await q(S.sb.rpc("set_order_status", params));
            toast(ST[params.p_status], "ok");
            afterChange(); resolve();
          } }
        ]
      });
    });
  }

  /* ---------- Lecture d'un message WhatsApp (commande du site ou message client) ---------- */
  function parseWA(text) {
    var t = String(text || ""), r = {};
    function grab(re) { var m = t.match(re); return m ? m[1].trim() : ""; }
    r.name = grab(/Nom\s*:\s*(.+)/i);
    r.phone = grab(/T[ée]l[ée]phone\s*:\s*(.+)/i);
    if (!r.phone) { var m = t.match(/(?:\+?225[\s.]?)?(?:\d[\s.]?){10}/); r.phone = m ? m[0] : ""; }
    r.phone = digits(r.phone);
    r.city = grab(/(?:Ville|Quartier|Commune)[^:\n]*:\s*(.+)/i);
    r.address = grab(/(?:Adresse|Rep[èe]re)[^:\n]*:\s*(.+)/i);
    r.notes = grab(/Remarques?\s*:\s*(.+)/i);
    var pairs = t.match(/(\d+)\s*paires?/i); r.pairs = pairs ? int(pairs[1]) : 0;
    var sizes = grab(/Pointures?\s*(?:\(s\))?\s*:\s*(.+)/i);
    r.sizes = sizes ? sizes.split(/[,;]| et /).map(function (s) { return s.trim(); }).filter(Boolean) : [];
    r.ref = grab(/R[ée]f[^:\n]*:\s*([A-Z]{3}-[\w-]+)/i);
    return r;
  }

  // Formulaire de commande (création / modification)
  function orderForm(o, prefill) {
    o = o || null;
    var d = o || Object.assign({ univers: defaultUni(), source: "whatsapp", mode: "abidjan", order_items: [] }, prefill || {});
    var lines = (d.order_items || []).map(function (i) { var v = variant(i.variant_id); return { product_id: v ? v.product_id : "", variant_id: i.variant_id, qty: i.qty, unit_price: i.unit_price }; });
    var totalManual = !!o;

    var body = '<form class="form" id="of" novalidate>' +
      (o ? "" : '<button type="button" class="btn btn--block" id="paste-btn">' + ico("paste") + "Coller un message WhatsApp</button>" +
        '<div id="paste-box" hidden><label class="f">Collez le message du client ou la commande reçue du site<textarea id="paste-txt" placeholder="Bonjour BOHFLEX ! Je souhaite commander : Offre : 3 paires…"></textarea></label>' +
        '<button type="button" class="btn btn--primary btn--block" id="paste-go" style="margin-top:8px">' + ico("check") + "Remplir la commande</button></div>") +
      '<div id="dup-note"></div>' + uniPicker("univers", d.univers) +
      '<div class="row"><label class="f">Téléphone *<input name="phone" inputmode="tel" value="' + esc(d.phone ? fphone(d.phone) : "") + '" placeholder="07 00 00 00 00" autocomplete="off"></label>' +
      '<label class="f">Nom du client<input name="customer_name" value="' + esc(d.customer_name || "") + '" autocomplete="off"></label></div>' +
      '<div class="row"><label class="f">Ville / commune<input name="city" value="' + esc(d.city || "") + '"></label>' +
      '<label class="f">Source<select name="source">' + opts(SOURCES, d.source) + "</select></label></div>" +
      '<label class="f">Adresse / repère<input name="address" value="' + esc(d.address || "") + '"></label>' +
      '<fieldset><legend>Articles</legend><div id="offer-box"></div><div id="lines" style="display:grid;gap:12px"></div>' +
      '<p style="margin:10px 0 0"><button type="button" class="btn btn--sm" id="add-line">' + ico("plus", "i--sm") + "Ajouter un article</button></p></fieldset>" +
      '<label class="f">Montant total à payer (FCFA)<input name="total_amount" inputmode="numeric" value="' + (d.total_amount || "") + '"></label>' +
      '<div class="seg">' + [["abidjan", "Livraison Abidjan"], ["expedition", "Expédition intérieur"]].map(function (m) {
        return '<label><input type="radio" name="mode" value="' + m[0] + '"' + ((d.mode || "abidjan") === m[0] ? " checked" : "") + "><span>" + m[1] + "</span></label>";
      }).join("") + "</div>" +
      '<div class="row" id="prepaid-row"><label class="f">Avance Mobile Money<input name="prepaid_amount" inputmode="numeric" value="' + (d.prepaid_amount || "") + '"></label>' +
      '<label class="f">Frais transport / livraison<input name="delivery_cost" inputmode="numeric" value="' + (d.delivery_cost || "") + '"></label></div>' +
      '<label class="f">Date de livraison souhaitée<input type="date" name="delivery_date" value="' + (d.delivery_date || "") + '"></label>' +
      (o ? "" : '<div class="seg"><label><input type="radio" name="status" value="nouvelle" checked><span>À confirmer</span></label><label><input type="radio" name="status" value="confirmee"><span>Déjà confirmée</span></label></div>') +
      '<label class="f">Remarques<textarea name="notes">' + esc(d.notes || "") + "</textarea></label></form>";

    openModal({
      title: o ? "Modifier " + o.ref : "Nouvelle commande", body: body,
      actions: [
        { label: "Annuler", onClick: function () { o ? orderDetail(o.id) : closeModal(); } },
        { label: o ? "Enregistrer" : "Créer la commande", icon: "check", cls: "btn--primary", onClick: submit }
      ],
      mount: mount
    });

    function uni() { return ($("#of input[name=univers]:checked") || {}).value || "bienetre"; }
    function uniProducts() { return S.products.filter(function (p) { return p.univers === uni() && (p.active || lines.some(function (l) { return l.product_id === p.id; })); }); }
    function productVariants(pid) { return S.variants.filter(function (v) { return v.product_id === pid && (v.active || lines.some(function (l) { return l.variant_id === v.id; })); }); }
    function currentOffer() { return S.offers.find(function (x) { return x.id === d.offer_id; }); }
    function renderOffers() {
      var offers = S.offers.filter(function (x) { return x.univers === uni() && x.active; });
      var box = $("#offer-box");
      if (!offers.length) { renderPicker(box); return; }
      box.innerHTML = '<div class="seg" style="margin-bottom:12px">' + offers.map(function (x) {
        return '<label><input type="radio" name="offer_id" value="' + x.id + '"' + (d.offer_id === x.id ? " checked" : "") + "><span>" + esc(x.name) + "<small>" + money(x.price) + "</small></span></label>";
      }).join("") + '<label><input type="radio" name="offer_id" value=""' + (!d.offer_id ? " checked" : "") + "><span>Autre<small>au détail</small></span></label></div>";
      $$("input[name=offer_id]", box).forEach(function (r) { r.addEventListener("change", function () { applyOffer(r.value); }); });
    }
    function renderPicker(box) {
      var prods = uniProducts().filter(function (p) { return p.active; });
      box.innerHTML = '<div class="pick">' + prods.map(function (p) {
        var vs = productVariants(p.id), stock = vs.reduce(function (s, v) { return s + Math.max(v.stock, 0); }, 0);
        var n = lines.filter(function (l) { return l.product_id === p.id; }).reduce(function (s, l) { return s + (l.qty || 0); }, 0);
        return '<button type="button" class="pick__item' + (n ? " is-on" : "") + '" data-pick="' + p.id + '">' + thumb(p.image_url, p.univers) +
          "<b>" + esc(p.name.replace(/^Sacoche\s+/i, "")) + "</b><small>" + money(p.sale_price) + " · " + (stock > 0 ? "stock " + stock : "rupture") + "</small>" +
          (n ? '<span class="pick__n">' + n + "</span>" : "") + "</button>";
      }).join("") + "</div>";
      $$("[data-pick]", box).forEach(function (b) {
        b.addEventListener("click", function () {
          var pid = b.getAttribute("data-pick"), vs = productVariants(pid), p = product(pid);
          var same = vs.length === 1 && lines.find(function (l) { return l.product_id === pid; });
          if (same) same.qty = (same.qty || 0) + 1;
          else lines.push({ product_id: pid, variant_id: vs.length === 1 ? vs[0].id : "", qty: 1, unit_price: p.sale_price });
          renderLines(); autoTotal();
        });
      });
    }
    function applyOffer(id, sizes) {
      d.offer_id = id;
      var x = S.offers.find(function (y) { return y.id === id; });
      if (!x) { renderLines(); return; }
      var unit = Math.round(x.price / x.qty);
      var pid = x.product_id || (uniProducts()[0] || {}).id;
      var keep = lines.filter(function (l) { return l.variant_id; });
      lines = [];
      for (var i = 0; i < x.qty; i++) {
        var vid = keep[i] ? keep[i].variant_id : "";
        if (sizes && sizes[i]) { var v = productVariants(pid).find(function (vv) { return vv.label.replace(/\s/g, "") === sizes[i].replace(/\s/g, ""); }); vid = v ? v.id : ""; }
        lines.push({ product_id: pid, variant_id: vid, qty: 1, unit_price: unit });
      }
      lines[lines.length - 1].unit_price = x.price - unit * (x.qty - 1);
      $("#of [name=total_amount]").value = x.price; totalManual = false;
      renderLines();
    }
    function renderLines() {
      var offer = currentOffer(), prods = uniProducts(), word = uni() === "bienetre" ? "Paire" : "Article";
      $("#lines").innerHTML = lines.map(function (l, i) {
        var vs = l.product_id ? productVariants(l.product_id) : [];
        var img = l.variant_id ? variantImage(l.variant_id) : (product(l.product_id) || {}).image_url;
        return '<div class="line" data-i="' + i + '" style="border:1px solid var(--line);border-radius:12px;padding:10px">' +
          '<div style="display:flex;align-items:center;gap:10px;margin-bottom:8px">' + thumb(img, uni(), "", 40) +
          '<b style="flex:1">' + word + " " + (i + 1) + (l.variant_id ? ' <span class="muted" style="font-weight:500">· ' + esc(variantName(l.variant_id, prods.length > 1)) + "</span>" : "") + "</b>" +
          (offer ? "" : '<button type="button" class="x" data-del aria-label="Retirer">' + ico("x", "i--sm") + "</button>") + "</div>" +
          (!l.product_id ? '<select data-k="product_id" style="margin-bottom:8px"><option value="">— Choisir le modèle —</option>' + prods.map(function (p) {
            return '<option value="' + p.id + '"' + (p.id === l.product_id ? " selected" : "") + ">" + esc(p.name) + "</option>";
          }).join("") + "</select>" : "") +
          (vs.length > 1 ? '<div class="chips">' + vs.map(function (v) {
            return '<button type="button" class="chip' + (v.id === l.variant_id ? " is-on" : "") + (v.stock <= 0 ? " is-out" : "") + '" data-v="' + v.id + '">' + esc(v.label) + "<small>" + (v.stock <= 0 ? "rupture" : "stock " + v.stock) + "</small></button>";
          }).join("") + "</div>" : "") +
          (offer ? "" : '<div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-top:8px"><label class="f">Quantité<input data-k="qty" inputmode="numeric" value="' + l.qty + '"></label>' +
            '<label class="f">Prix unitaire<input data-k="unit_price" inputmode="numeric" value="' + l.unit_price + '"></label></div>') +
          "</div>";
      }).join("") || '<p class="muted small" style="margin:0">' + (S.offers.some(function (x) { return x.univers === uni() && x.active; }) ? "Choisissez une offre ci-dessus." : "Touchez un modèle ci-dessus pour l'ajouter.") + "</p>";
      var hasOffers = S.offers.some(function (x) { return x.univers === uni() && x.active; });
      $("#add-line").hidden = !!offer || !hasOffers;
      if (!hasOffers) renderPicker($("#offer-box"));
      $$("#lines .line").forEach(function (row) {
        var i = +row.getAttribute("data-i");
        var ps = $("[data-k=product_id]", row);
        if (ps) ps.addEventListener("change", function () {
          var p = product(ps.value); lines[i].product_id = ps.value; lines[i].variant_id = "";
          if (!offer) lines[i].unit_price = p ? p.sale_price : 0;
          var vs = productVariants(ps.value); if (vs.length === 1) lines[i].variant_id = vs[0].id;
          renderLines(); autoTotal();
        });
        $$("[data-v]", row).forEach(function (c) { c.addEventListener("click", function () { lines[i].variant_id = c.getAttribute("data-v"); renderLines(); }); });
        $$("input[data-k]", row).forEach(function (inp) {
          inp.addEventListener("change", function () { lines[i][inp.getAttribute("data-k")] = int(inp.value); autoTotal(); });
        });
        var del = $("[data-del]", row); if (del) del.addEventListener("click", function () { lines.splice(i, 1); renderLines(); autoTotal(); });
      });
    }
    function autoTotal() {
      if (totalManual) return;
      $("#of [name=total_amount]").value = lines.reduce(function (s, l) { return s + (l.qty || 0) * (l.unit_price || 0); }, 0) || "";
    }
    function toggleMode() { $("#prepaid-row").querySelector("label").hidden = ($("#of input[name=mode]:checked") || {}).value !== "expedition"; }
    async function lookupPhone(p) {
      p = digits(p);
      if (p.length < 8 || $("#of [name=customer_name]").value) return;
      var c = await q(S.sb.from("contacts").select("name, city").eq("phone", p).limit(1)).catch(function () { return []; });
      if (c[0]) { $("#of [name=customer_name]").value = c[0].name; if (!$("#of [name=city]").value) $("#of [name=city]").value = c[0].city; toast("Client déjà connu : " + c[0].name); }
    }
    async function applyPaste() {
      var txt = $("#paste-txt").value, r = parseWA(txt);
      if (!r.phone && !r.name) { toast("Je n'ai trouvé ni numéro ni nom dans ce message", "err"); return; }
      if ((r.pairs || r.sizes.length) && !lockedUni()) { var radio = $("#of input[name=univers][value=bienetre]"); if (radio && !radio.checked) { radio.checked = true; onUni(); } }
      if (r.phone) $("#of [name=phone]").value = fphone(r.phone);
      if (r.name) $("#of [name=customer_name]").value = r.name;
      if (r.city) $("#of [name=city]").value = r.city;
      if (r.address) $("#of [name=address]").value = r.address;
      if (r.notes) $("#of [name=notes]").value = r.notes;
      if (r.ref) $("#of [name=source]").value = "site";
      var x = r.pairs && S.offers.find(function (y) { return y.univers === uni() && y.active && y.qty === r.pairs; });
      if (x) { renderOffers(); $('#of input[name=offer_id][value="' + x.id + '"]').checked = true; applyOffer(x.id, r.sizes); }
      $("#paste-box").hidden = true;
      toast("Commande remplie : vérifiez puis validez", "ok");
      if (r.ref) {
        var ex = await q(S.sb.from("orders").select("id, status").eq("ref", r.ref).limit(1)).catch(function () { return []; });
        if (ex[0]) {
          $("#dup-note").innerHTML = '<div class="note">' + ico("alert") + "<span>Cette commande (" + esc(r.ref) + ") est déjà arrivée du site, statut « " + esc(ST[ex[0].status]) + ' ». <a href="#" id="open-dup">Ouvrir la commande existante</a></span></div>';
          $("#open-dup").addEventListener("click", function (e) { e.preventDefault(); orderDetail(ex[0].id); });
        }
      } else if (r.phone) lookupPhone(r.phone);
    }
    function onUni() { lines = []; d.offer_id = ""; totalManual = false; $("#of [name=total_amount]").value = ""; renderOffers(); renderLines(); }
    function mount() {
      renderOffers(); renderLines(); toggleMode();
      $$("#of input[name=univers]").forEach(function (r) { r.addEventListener("change", onUni); });
      $("#add-line").addEventListener("click", function () {
        var ps = uniProducts(); var pid = ps.length === 1 ? ps[0].id : "";
        lines.push({ product_id: pid, variant_id: "", qty: 1, unit_price: pid ? product(pid).sale_price : 0 }); renderLines(); autoTotal();
      });
      $("#of [name=total_amount]").addEventListener("input", function () { totalManual = true; });
      $$("#of input[name=mode]").forEach(function (r) { r.addEventListener("change", toggleMode); });
      $("#of [name=phone]").addEventListener("change", function (e) { lookupPhone(e.target.value); });
      if ($("#paste-btn")) {
        $("#paste-btn").addEventListener("click", function () { $("#paste-box").hidden = !$("#paste-box").hidden; if (!$("#paste-box").hidden) $("#paste-txt").focus(); });
        $("#paste-go").addEventListener("click", applyPaste);
      }
    }
    async function submit() {
      var f = formData($("#of"));
      if (digits(f.phone).length < 8) { toast("Numéro de téléphone invalide", "err"); return; }
      if (!lines.length || lines.some(function (l) { return !l.variant_id; })) { toast(uni() === "bienetre" ? "Choisissez une pointure pour chaque paire" : "Choisissez le modèle et la couleur de chaque article", "err"); return; }
      var payload = {
        id: o ? o.id : null, univers: f.univers, customer_name: f.customer_name, phone: digits(f.phone), city: f.city, address: f.address,
        source: f.source, mode: f.mode || "abidjan", offer_id: f.offer_id || null, total_amount: int(f.total_amount),
        prepaid_amount: f.mode === "expedition" ? int(f.prepaid_amount) : 0, delivery_cost: int(f.delivery_cost),
        courier_id: o ? o.courier_id : null, status: o ? o.status : (f.status || "nouvelle"), notes: f.notes, delivery_date: f.delivery_date || null,
        items: lines.map(function (l) { return { variant_id: l.variant_id, qty: Math.max(int(l.qty), 1), unit_price: int(l.unit_price) }; })
      };
      store("lastUni", f.univers);
      var id = await q(S.sb.rpc("save_order", { p: payload }));
      toast(o ? "Commande modifiée" : "Commande créée", "ok");
      await loadRefs(); if (S.refresh) S.refresh(); refreshBadges();
      orderDetail(id);
    }
  }

  async function exportOrders(days) {
    var list = await q(uniEq(S.sb.from("orders").select("*, order_items(variant_id, qty, unit_price)"))
      .gte("created_at", new Date(Date.now() - int(days) * 864e5).toISOString()).order("created_at")).catch(fail);
    if (!list) return;
    csv("commandes-" + today() + ".csv",
      ["Date", "Réf", "Activité", "Statut", "Client", "Téléphone", "Ville", "Adresse", "Articles", "Montant", "Avance", "Encaissé", "Frais livraison", "Livreur", "Mode", "Source", "Remarques"],
      list.map(function (o) {
        return [fdatetime(o.created_at), o.ref, UNI[o.univers], ST[o.status], o.customer_name, fphone(o.phone), o.city, o.address, itemsText(o),
          o.total_amount, o.prepaid_amount, o.collected_amount, o.delivery_cost, memberName(o.courier_id), o.mode, SOURCES[o.source] || o.source, o.notes];
      }));
  }
  function csv(name, head, rows) {
    var cell = function (v) { v = v == null ? "" : String(v); return /[;"\n]/.test(v) ? '"' + v.replace(/"/g, '""') + '"' : v; };
    var txt = "﻿" + [head].concat(rows).map(function (r) { return r.map(cell).join(";"); }).join("\r\n");
    var a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([txt], { type: "text/csv;charset=utf-8" }));
    a.download = name; document.body.appendChild(a); a.click(); a.remove();
  }

  /* ========================================================================
     PROSPECTS / CLIENTS
     ======================================================================== */
  var CONTACT_TABS = [
    ["relance", "À relancer"], ["nouveau", "Nouveaux"], ["interesse", "Intéressés"], ["panier", "Paniers"],
    ["client", "Clients"], ["ancien", "Anciens clients"], ["perdu", "Perdus"], ["tous", "Tous"]
  ];
  function contactFilter(tab) {
    var t = today();
    return function (c) {
      if (tab === "relance") return c.next_followup && c.next_followup <= t && c.stage !== "perdu";
      if (tab === "ancien") return isOldClient(c);
      if (tab === "client") return c.stage === "client" && !isOldClient(c);
      if (tab === "tous") return true;
      return c.stage === tab;
    };
  }
  function contactCard(c) {
    var t = today(), late = c.next_followup && c.next_followup < t;
    var stage = isOldClient(c) ? pill("ancien", "Ancien client") : pill(c.stage, STAGES[c.stage]);
    return '<article class="oc" data-contact="' + c.id + '"><div class="oc__main" role="button" tabindex="0">' +
      '<div class="thumb thumb--round thumb--' + c.univers + '">' + esc(initials(c.name)) + "</div>" +
      '<div class="oc__body"><div class="oc__name">' + esc(c.name || fphone(c.phone)) + " " + stage + "</div>" +
      (c.interest ? '<div class="oc__line">' + ico("tag") + "<span>" + esc(c.interest) + "</span></div>" : "") +
      '<div class="oc__line">' + ico("pin") + "<span>" + esc([c.city, SOURCES[c.source] || c.source].filter(Boolean).join(" · ")) + "</span></div>" +
      (c.notes ? '<div class="oc__line">' + ico("note") + "<span>" + esc(c.notes) + "</span></div>" : "") +
      '</div><div class="oc__aside">' + (c.next_followup ? '<div class="oc__time' + (late ? " is-late" : "") + '">' + ico("bell", "i--sm") + " " + fdayShort(c.next_followup) + "</div>" : "") +
      (c.orders_delivered ? '<div class="oc__time">' + c.orders_delivered + " cde livrée" + (c.orders_delivered > 1 ? "s" : "") + "</div>" : "") + "</div></div>" +
      (can("gerant", "closeuse") ? '<div class="oc__acts"><a class="btn btn--icon" href="' + telUrl(c.phone) + '" title="Appeler" aria-label="Appeler">' + ico("phone") + "</a>" +
        '<a class="btn btn--icon btn--wa" target="_blank" rel="noopener" href="' + waUrl(c.phone, contactMsg(c)) + '" title="WhatsApp" aria-label="WhatsApp">' + ico("wa") + "</a>" +
        '<button class="btn" data-fu="1">' + ico("bell", "i--sm") + 'Demain</button><button class="btn" data-fu="3">' + ico("calendar", "i--sm") + "Dans 3 j</button></div>" : "") +
      "</article>";
  }
  function bindContactCards(root, list) {
    $$("[data-contact]", root).forEach(function (card) {
      var c = list.find(function (x) { return x.id === card.getAttribute("data-contact"); });
      if (!c) return;
      var main = $(".oc__main", card);
      main.addEventListener("click", function () { contactDetail(c); });
      main.addEventListener("keydown", function (e) { if (e.key === "Enter") contactDetail(c); });
      $$("[data-fu]", card).forEach(function (b) {
        b.addEventListener("click", function (e) { e.stopPropagation(); followUp(c, +b.getAttribute("data-fu")); });
      });
    });
  }
  async function followUp(c, n) {
    var patch = { next_followup: n ? addDays(today(), n) : null, updated_at: new Date().toISOString() };
    if (c.stage === "nouveau") patch.stage = "interesse";
    try { await q(S.sb.from("contacts").update(patch).eq("id", c.id)); } catch (e) { return fail(e); }
    toast(n ? "Prochaine relance : " + fdayShort(patch.next_followup) : "Relance retirée", "ok");
    closeModal(); if (S.refresh) S.refresh(); refreshBadges();
  }

  async function vContacts(el) {
    var st = vstate("prospects", { tab: "relance", search: "" });
    el.innerHTML = header("Prospects & clients", "", '<button class="btn btn--primary" id="new-contact">' + ico("plus") + "<span>Nouveau</span></button>" +
      (can("gerant") ? '<button class="btn btn--icon" id="cexport" title="Exporter en CSV" aria-label="Exporter en CSV">' + ico("download") + "</button>" : ""), true) +
      '<div class="tabs" id="ctabs"></div>' +
      '<div class="toolbar"><div class="search">' + ico("search") + '<input type="search" id="csearch" placeholder="Nom, téléphone, ville…" value="' + esc(st.search) + '"></div></div>' +
      '<div id="clist"><p class="muted">Chargement…</p></div>';
    bindUni(el);
    $("#new-contact").addEventListener("click", function () { contactForm(); });
    var all = [];
    function render() {
      $("#ctabs").innerHTML = CONTACT_TABS.map(function (t) {
        return '<button type="button" class="tab' + (st.tab === t[0] ? " is-on" : "") + '" data-tab="' + t[0] + '">' + t[1] + '<span class="n">' + all.filter(contactFilter(t[0])).length + "</span></button>";
      }).join("");
      $$("#ctabs .tab").forEach(function (b) { b.addEventListener("click", function () { st.tab = b.getAttribute("data-tab"); render(); }); });
      var s = st.search.toLowerCase(), sd = s.replace(/\D/g, "");
      var list = s ? all.filter(function (c) {
        return (c.name || "").toLowerCase().indexOf(s) >= 0 || (c.city || "").toLowerCase().indexOf(s) >= 0 || (sd.length >= 3 && c.phone.indexOf(sd) >= 0);
      }) : all.filter(contactFilter(st.tab));
      if (st.tab === "relance" && !s) list.sort(function (a, b) { return a.next_followup < b.next_followup ? -1 : 1; });
      $("#clist").innerHTML = list.length ? '<div class="list list--2">' + list.slice(0, 300).map(contactCard).join("") + "</div>" : empty("users", s ? "Aucun résultat" : "Personne dans cette liste");
      bindContactCards($("#clist"), list);
    }
    async function load() {
      all = await q(uniEq(S.sb.from("contacts").select("*")).order("updated_at", { ascending: false }).limit(5000));
      render();
    }
    $("#csearch").addEventListener("input", debounce(function (e) { st.search = e.target.value.trim(); render(); }, 200));
    if ($("#cexport")) $("#cexport").addEventListener("click", function () {
      csv("contacts-" + today() + ".csv", ["Nom", "Téléphone", "Ville", "Activité", "Étape", "Source", "Intérêt", "Prochaine relance", "Commandes livrées", "Notes"],
        all.map(function (c) { return [c.name, fphone(c.phone), c.city, UNI[c.univers], STAGES[c.stage], SOURCES[c.source] || c.source, c.interest, c.next_followup, c.orders_delivered, c.notes]; }));
    });
    await load();
    S.refresh = function () { if (S.view === "prospects") load().catch(fail); };
  }

  async function contactDetail(c) {
    var orders = await q(S.sb.from("orders").select("*, order_items(variant_id, qty, unit_price)").eq("contact_id", c.id).order("created_at", { ascending: false })).catch(function () { return []; });
    var body = '<div class="btn-row" style="margin-bottom:10px">' + pill(c.univers, UNI[c.univers]) + pill(c.stage, STAGES[c.stage]) + (isOldClient(c) ? pill("ancien", "Ancien client") : "") + "</div>" +
      '<div class="rows">' +
      '<div class="rowi">' + ico("phone") + '<div><a href="' + telUrl(c.phone) + '">' + esc(fphone(c.phone)) + "</a></div></div>" +
      '<div class="rowi">' + ico("pin") + "<div>" + esc(c.city || "—") + "<small>" + esc(SOURCES[c.source] || c.source) + " · contact depuis le " + fdate(c.created_at) + "</small></div></div>" +
      (c.interest ? '<div class="rowi">' + ico("tag") + "<div>" + esc(c.interest) + "</div></div>" : "") +
      (c.notes ? '<div class="rowi">' + ico("note") + '<div style="white-space:pre-wrap">' + esc(c.notes) + "</div></div>" : "") +
      '<div class="rowi">' + ico("bell") + "<div>" + (c.next_followup ? "Relance prévue " + fdayShort(c.next_followup) : "Aucune relance prévue") + "</div></div></div>" +
      '<h3 style="margin-top:16px">Relance faite ? Prochaine relance</h3><div class="btn-row" id="fu">' +
      [[1, "Demain"], [3, "Dans 3 jours"], [7, "1 semaine"], [30, "1 mois"], [0, "Aucune"]].map(function (x) {
        return '<button type="button" class="btn btn--sm" data-days="' + x[0] + '">' + x[1] + "</button>";
      }).join("") + "</div>" +
      '<h3 style="margin-top:18px">Commandes (' + orders.length + ")</h3>" + (orders.length ? '<div class="list">' + orders.map(orderCard).join("") + "</div>" : empty("orders", "Aucune commande pour l'instant"));
    openModal({
      title: c.name || fphone(c.phone), body: body,
      actions: [
        { icon: "edit", title: "Modifier", cls: "btn--icon", onClick: function () { contactForm(c); } },
        { icon: "phone", title: "Appeler", cls: "btn--icon", href: telUrl(c.phone) },
        { label: "WhatsApp", icon: "wa", cls: "btn--wa", href: waUrl(c.phone, contactMsg(c)) },
        { label: "Commande", icon: "plus", cls: "btn--primary", onClick: function () {
          orderForm(null, { univers: c.univers, customer_name: c.name, phone: c.phone, city: c.city, source: c.source });
        } }
      ],
      mount: function (b) {
        bindOrderCards(b, orders);
        $$("#fu [data-days]", b).forEach(function (btn) { btn.addEventListener("click", function () { followUp(c, +btn.getAttribute("data-days")); }); });
      }
    });
  }

  function contactForm(c) {
    var d = c || { univers: defaultUni(), stage: "nouveau", source: "whatsapp", next_followup: addDays(today(), 1) };
    var body = '<form class="form" id="cf" novalidate>' + uniPicker("univers", d.univers) +
      '<div class="row"><label class="f">Téléphone *<input name="phone" inputmode="tel" value="' + esc(d.phone ? fphone(d.phone) : "") + '"></label>' +
      '<label class="f">Nom<input name="name" value="' + esc(d.name || "") + '"></label></div>' +
      '<div class="row"><label class="f">Ville / commune<input name="city" value="' + esc(d.city || "") + '"></label>' +
      '<label class="f">Source<select name="source">' + opts(SOURCES, d.source) + "</select></label></div>" +
      '<div class="row"><label class="f">Étape<select name="stage">' + opts(STAGES, d.stage) + "</select></label>" +
      '<label class="f">Prochaine relance<input type="date" name="next_followup" value="' + (d.next_followup || "") + '"></label></div>' +
      '<label class="f">Intéressé par<input name="interest" value="' + esc(d.interest || "") + '" placeholder="ex. sacoche noire, 3 paires pointure 42…"></label>' +
      '<label class="f">Notes<textarea name="notes">' + esc(d.notes || "") + "</textarea></label>" +
      (S.members.length > 1 ? '<label class="f">Suivi par<select name="assigned_to"><option value="">—</option>' +
        S.members.filter(function (m) { return m.active && (m.role === "closeuse" || m.role === "gerant"); }).map(function (m) {
          return '<option value="' + m.id + '"' + (m.id === d.assigned_to ? " selected" : "") + ">" + esc(m.full_name || m.email) + "</option>";
        }).join("") + "</select></label>" : "") +
      "</form>";
    var actions = [{ label: "Annuler", onClick: function () { c ? contactDetail(c) : closeModal(); } }];
    if (c && can("gerant")) actions.push({ icon: "trash", title: "Supprimer", cls: "btn--bad btn--icon", onClick: async function () {
      if (!(await confirmBox("Supprimer ce contact ? Ses commandes sont conservées.", "Supprimer"))) return;
      await q(S.sb.from("contacts").delete().eq("id", c.id)); toast("Contact supprimé", "ok"); if (S.refresh) S.refresh();
    } });
    actions.push({ label: "Enregistrer", icon: "check", cls: "btn--primary", onClick: async function () {
      var f = formData($("#cf"));
      if (digits(f.phone).length < 8) { toast("Numéro de téléphone invalide", "err"); return; }
      var row = {
        univers: f.univers, name: f.name, phone: digits(f.phone), city: f.city, source: f.source, stage: f.stage,
        next_followup: f.next_followup || null, interest: f.interest, notes: f.notes, updated_at: new Date().toISOString()
      };
      if ("assigned_to" in f) row.assigned_to = f.assigned_to || null;
      if (c) await q(S.sb.from("contacts").update(row).eq("id", c.id));
      else {
        var exist = await q(S.sb.from("contacts").select("id").eq("univers", row.univers).eq("phone", row.phone).limit(1));
        if (exist.length) { toast("Ce numéro existe déjà dans " + UNI[row.univers] + " : utilisez la recherche.", "err"); return; }
        await q(S.sb.from("contacts").insert(row));
      }
      store("lastUni", f.univers);
      toast("Contact enregistré", "ok"); closeModal(); if (S.refresh) S.refresh(); refreshBadges();
    } });
    openModal({ title: c ? "Modifier le contact" : "Nouveau contact", body: body, actions: actions });
  }

  /* ========================================================================
     LIVREUR : MES LIVRAISONS
     ======================================================================== */
  async function vMyDeliveries(el) {
    var r = await Promise.all([
      q(S.sb.from("orders").select("*, order_items(variant_id, qty, unit_price)").eq("courier_id", S.me.id).in("status", ["confirmee", "en_livraison"]).order("delivery_date", { nullsFirst: false }).order("created_at")),
      q(S.sb.from("orders").select("*, order_items(variant_id, qty, unit_price)").eq("courier_id", S.me.id).in("status", ["livree", "retour"]).gte("updated_at", today() + "T00:00:00Z").order("updated_at", { ascending: false })),
      q(S.sb.from("courier_balances").select("*").eq("courier_id", S.me.id))
    ]);
    var todo = r[0], done = r[1], bal = r[2][0];
    var cashToday = done.reduce(function (s, o) { return s + (o.collected_amount || 0); }, 0);
    el.innerHTML = header("Mes livraisons", longDate()) +
      '<div class="kpis">' + kpi("truck", "cyan", "À livrer", todo.length, money(todo.reduce(function (s, o) { return s + toCollect(o); }, 0)) + " à encaisser") +
      kpi("check", "ok", "Livrées aujourd'hui", done.filter(function (o) { return o.status === "livree"; }).length, money(cashToday) + " encaissés") +
      kpi("wallet", bal && bal.due > 0 ? "bad" : "ok", "À reverser", money(bal ? Math.max(bal.due, 0) : 0), "après vos frais") + "</div>" +
      '<div class="list">' + (todo.map(function (o) {
        return '<article class="oc"><div class="oc__main" style="cursor:default">' + orderThumb(o) +
          '<div class="oc__body"><div class="oc__name">' + esc(o.customer_name || "Client") + " " + statusPill(o.status) + "</div>" +
          '<div class="oc__line">' + ico("pin") + "<span><b>" + esc(o.city) + "</b> " + esc(o.address) + "</span></div>" +
          '<div class="oc__line">' + ico("tag") + "<span>" + esc(itemsText(o)) + "</span></div>" +
          (o.notes ? '<div class="oc__line">' + ico("note") + "<span>" + esc(o.notes) + "</span></div>" : "") +
          '</div><div class="oc__aside"><div class="oc__amount">' + money(toCollect(o)) + '</div><div class="oc__time">à encaisser</div>' +
          (o.delivery_date ? '<div class="oc__time">' + fdayShort(o.delivery_date) + "</div>" : "") + "</div></div>" +
          '<div class="oc__acts' + (o.status === "confirmee" ? " oc__acts--3" : "") + '"><a class="btn btn--icon" href="' + telUrl(o.phone) + '" aria-label="Appeler">' + ico("phone") + "</a>" +
          '<a class="btn btn--icon btn--wa" target="_blank" rel="noopener" aria-label="WhatsApp" href="' + waUrl(o.phone, "Bonjour " + firstName(o.customer_name) + ", c'est le livreur " + brandName(o.univers) + ". Je suis en route pour votre commande. Où puis-je vous trouver ?") + '">' + ico("wa") + "</a>" +
          (o.status === "confirmee" ? '<button class="btn btn--primary" data-go="' + o.id + '" data-st="en_livraison">' + ico("truck", "i--sm") + "Je pars livrer</button>" :
            '<button class="btn btn--bad" data-go="' + o.id + '" data-st="retour">' + ico("undo", "i--sm") + 'Retour</button><button class="btn btn--ok" data-go="' + o.id + '" data-st="livree">' + ico("check", "i--sm") + "Livrée</button>") +
          "</div></article>";
      }).join("") || empty("check", "Aucune livraison en attente")) + "</div>" +
      (done.length ? sectionTitle("check", "Terminées aujourd'hui") + '<div class="list">' + done.map(function (o) {
        return '<article class="oc"><div class="oc__main" style="cursor:default">' + orderThumb(o) + '<div class="oc__body"><div class="oc__name">' + esc(o.customer_name) + " " + statusPill(o.status) +
          '</div><div class="oc__line">' + ico("pin") + "<span>" + esc(o.city) + '</span></div></div><div class="oc__aside"><div class="oc__amount">' + money(o.collected_amount) + "</div></div></div></article>";
      }).join("") + "</div>" : "");
    $$("[data-go]", el).forEach(function (b) {
      b.addEventListener("click", function () { courierStatus(todo.find(function (x) { return x.id === b.getAttribute("data-go"); }), b.getAttribute("data-st")); });
    });
    S.refresh = function () { if (S.view === "livraisons") vMyDeliveries(el).catch(fail); };
  }
  function courierStatus(o, status) {
    if (status === "en_livraison") {
      return q(S.sb.rpc("set_order_status", { p_order: o.id, p_status: status, p_note: "" })).then(function () { toast("Bonne route !", "ok"); if (S.refresh) S.refresh(); }).catch(fail);
    }
    var body = '<div class="form"><p><b>' + esc(o.customer_name) + "</b> · " + esc(itemsText(o)) + "</p>" +
      (status === "livree" ? '<label class="f">Montant encaissé (FCFA)<input name="collected" inputmode="numeric" value="' + toCollect(o) + '"></label>' : "") +
      '<label class="f">' + (status === "retour" ? "Motif du retour *" : "Commentaire (facultatif)") + '<input name="note"></label></div>';
    openModal({
      title: ST[status], body: body,
      actions: [
        { label: "Annuler", onClick: closeModal },
        { label: "Valider", icon: "check", cls: status === "retour" ? "btn--bad-fill" : "btn--ok", onClick: async function () {
          var f = formData($("#modal-body"));
          if (status === "retour" && !f.note) { toast("Indiquez le motif du retour", "err"); return; }
          var p = { p_order: o.id, p_status: status, p_note: f.note || "" };
          if (status === "livree") p.p_collected = int(f.collected);
          await q(S.sb.rpc("set_order_status", p));
          toast(ST[status], "ok"); closeModal(); if (S.refresh) S.refresh();
        } }
      ]
    });
  }

  /* ========================================================================
     STOCK (+ photos des produits)
     ======================================================================== */
  async function vStock(el) {
    var prods = S.products.filter(function (p) { return S.uni === "all" || p.univers === S.uni; });
    var showCost = can("gerant", "stock");
    var totalValue = 0;
    var html = header("Stock", "", '<button class="btn btn--icon" id="mv-hist" title="Historique des mouvements" aria-label="Historique">' + ico("history") + "</button>" +
      '<button class="btn" id="mv-in">' + ico("plus") + '<span>Entrée</span></button><button class="btn btn--primary" id="new-prod">' + ico("package") + "<span>Produit</span></button>", true);
    if (!prods.length) html += empty("package", "Aucun produit. Créez vos sacoches avec « Produit » (une variante par couleur).");
    prods.forEach(function (p) {
      var vs = S.variants.filter(function (v) { return v.product_id === p.id; });
      var qty = vs.reduce(function (s, v) { return s + Math.max(v.stock, 0); }, 0);
      var cost = S.costs[p.id] || 0; totalValue += qty * cost;
      html += '<div class="card"' + (p.active ? "" : ' style="opacity:.6"') + '><div class="prod">' + thumb(p.image_url, p.univers) +
        '<div style="min-width:0"><b>' + esc(p.name) + '</b><div class="btn-row" style="margin-top:4px">' + pill(p.univers, UNI[p.univers]) + (p.active ? "" : pill("annulee", "Archivé")) + "</div>" +
        '<div class="muted small" style="margin-top:4px">Vente ' + money(p.sale_price) + (showCost ? " · achat " + money(cost) + " · " + qty + " en stock (" + money(qty * cost) + ")" : "") + "</div></div>" +
        '<button class="btn btn--icon" data-edit="' + p.id + '" title="Modifier le produit" aria-label="Modifier le produit">' + ico("edit") + "</button></div>" +
        '<div class="tiles">' + vs.map(function (v) {
          var cls = v.stock <= 0 ? " tile--out" : v.stock <= v.alert_threshold ? " tile--low" : "";
          return '<div class="tile' + cls + '"' + (v.active ? "" : ' style="opacity:.5"') + '><div class="tile__label">' + (v.image_url ? '<img src="' + esc(v.image_url) + '" alt="">' : "") + esc(v.label) + "</div>" +
            '<div class="tile__qty">' + v.stock + '</div><div class="btn-row"><button class="btn" data-in="' + v.id + '" title="Entrée de stock" aria-label="Entrée de stock">' + ico("plus", "i--sm") + '</button><button class="btn" data-inv="' + v.id + '" title="Inventaire" aria-label="Inventaire">' + ico("edit", "i--sm") + "</button></div></div>";
        }).join("") + "</div></div>";
    });
    if (showCost && prods.length) html += '<p class="muted small" style="margin-top:10px">Valeur totale du stock (au coût d\'achat) : <b>' + money(totalValue) + "</b></p>";

    if (can("gerant")) {
      var offers = S.offers.filter(function (x) { return S.uni === "all" || x.univers === S.uni; });
      html += sectionTitle("tag", "Offres / packs") + '<div class="card scroll-x">' + (offers.length ? '<table class="t"><thead><tr><th>Offre</th><th>Activité</th><th class="num">Qté</th><th class="num">Prix</th><th></th></tr></thead><tbody>' +
        offers.map(function (x) {
          return "<tr" + (x.active ? "" : ' style="opacity:.5"') + "><td><b>" + esc(x.name) + "</b></td><td>" + esc(UNI[x.univers]) + '</td><td class="num">' + x.qty + '</td><td class="num">' + money(x.price) +
            '</td><td class="right"><button class="btn btn--sm btn--icon" data-offer="' + x.id + '" title="Modifier" aria-label="Modifier">' + ico("edit", "i--sm") + "</button></td></tr>";
        }).join("") + "</tbody></table>" : '<p class="muted">Aucune offre</p>') + '<p style="margin:10px 0 0"><button class="btn btn--sm" id="new-offer">' + ico("plus", "i--sm") + "Nouvelle offre</button></p></div>";
    }
    el.innerHTML = html;
    bindUni(el);
    $("#new-prod").addEventListener("click", function () { productForm(); });
    $("#mv-in").addEventListener("click", function () { stockIn(); });
    $("#mv-hist").addEventListener("click", stockHistory);
    $$("[data-edit]", el).forEach(function (b) { b.addEventListener("click", function () { productForm(product(b.getAttribute("data-edit"))); }); });
    $$("[data-in]", el).forEach(function (b) { b.addEventListener("click", function () { stockIn(b.getAttribute("data-in")); }); });
    $$("[data-inv]", el).forEach(function (b) { b.addEventListener("click", function () { inventory(variant(b.getAttribute("data-inv"))); }); });
    if ($("#new-offer")) $("#new-offer").addEventListener("click", function () { offerForm(); });
    $$("[data-offer]", el).forEach(function (b) { b.addEventListener("click", function () { offerForm(S.offers.find(function (x) { return x.id === b.getAttribute("data-offer"); })); }); });
    S.refresh = function () { if (S.view === "stock" && !S.modalOpen) vStock(el); };
  }

  // Réduit la photo (800 px max, JPEG) avant l'envoi : rapide en 3G et léger pour le stockage
  function shrinkImage(file) {
    return new Promise(function (resolve, reject) {
      var img = new Image(), url = URL.createObjectURL(file);
      img.onload = function () {
        var k = Math.min(1, 800 / Math.max(img.width, img.height));
        var c = document.createElement("canvas"); c.width = Math.round(img.width * k); c.height = Math.round(img.height * k);
        c.getContext("2d").drawImage(img, 0, 0, c.width, c.height);
        URL.revokeObjectURL(url);
        c.toBlob(function (b) { b ? resolve(b) : reject(new Error("Image illisible")); }, "image/jpeg", 0.82);
      };
      img.onerror = function () { reject(new Error("Ce fichier n'est pas une image lisible")); };
      img.src = url;
    });
  }
  async function uploadImage(file, path) {
    var blob = await shrinkImage(file);
    var res = await S.sb.storage.from("produits").upload(path, blob, { upsert: true, contentType: "image/jpeg" });
    if (res.error) {
      var m = res.error.message || "";
      if (/bucket|not found|row-level|policy|unauthorized/i.test(m)) throw new Error("Photos pas encore activées : exécutez le fichier maj-03.sql dans Supabase.");
      throw new Error(m);
    }
    return S.sb.storage.from("produits").getPublicUrl(path).data.publicUrl + "?v=" + Date.now();
  }
  function bindUpload(id, u, cb, size) {
    var inp = $("#" + id); if (!inp) return;
    inp.addEventListener("change", function () {
      var f = inp.files[0]; if (!f) return;
      $("#" + id + "-prev").innerHTML = thumb(URL.createObjectURL(f), u, "", size);
      cb(f);
    });
  }

  function productForm(p) {
    var d = p || { univers: S.uni !== "all" ? S.uni : "passion", active: true, sale_price: "" };
    var vs = p ? S.variants.filter(function (v) { return v.product_id === p.id; }) : [];
    var newMain = null, newVar = {};
    var body = '<form class="form" id="pf" novalidate>' +
      (p ? "" : '<div class="seg">' + ["passion", "bienetre"].map(function (u) {
        return '<label><input type="radio" name="univers" value="' + u + '"' + (d.univers === u ? " checked" : "") + '><span><span><span class="dot dot--' + u + '"></span>' + UNI[u] + "</span></span></label>";
      }).join("") + "</div>") +
      '<div class="upload"><span id="pimg-prev">' + thumb(d.image_url, d.univers, "", 72) + '</span><div><label class="btn btn--sm" for="pimg">' + ico("camera", "i--sm") + (d.image_url ? "Changer la photo" : "Ajouter une photo") +
      '</label><input type="file" id="pimg" accept="image/*"><div class="muted small" style="margin-top:4px">Photo carrée de préférence, sur fond clair</div></div></div>' +
      '<label class="f">Nom du produit *<input name="name" value="' + esc(d.name || "") + '" placeholder="ex. Sacoche bandoulière cuir"></label>' +
      '<div class="row"><label class="f">Prix de vente unitaire<input name="sale_price" inputmode="numeric" value="' + (d.sale_price || "") + '"></label>' +
      '<label class="f">Coût d\'achat unitaire<input name="cost_price" inputmode="numeric" value="' + (p ? (S.costs[p.id] || "") : "") + '"></label></div>' +
      '<p class="muted small" style="margin:-4px 0 0">Coût d\'achat = prix fournisseur + transport + douane, pour une pièce. Visible seulement par le gérant et le stock.</p>' +
      (vs.length ? "<fieldset><legend>" + (d.univers === "bienetre" ? "Pointures" : "Couleurs / variantes") + '</legend><div style="display:grid;gap:10px">' +
        vs.map(function (v) {
          return '<div data-v="' + v.id + '" style="display:grid;grid-template-columns:auto 1fr 70px auto;gap:8px;align-items:center">' +
            '<label for="vimg-' + v.id + '" style="cursor:pointer" title="Photo de cette variante"><span id="vimg-' + v.id + '-prev">' + thumb(v.image_url, d.univers, "", 44) + '</span></label><input type="file" id="vimg-' + v.id + '" accept="image/*" hidden>' +
            '<input data-k="label" value="' + esc(v.label) + '" aria-label="Nom de la variante">' +
            '<input data-k="alert_threshold" inputmode="numeric" value="' + v.alert_threshold + '" aria-label="Seuil d\'alerte" title="Seuil d\'alerte">' +
            '<label class="check" title="Active"><input type="checkbox" data-k="active"' + (v.active ? " checked" : "") + "></label></div>";
        }).join("") + '</div><p class="muted small" style="margin:8px 0 0">Touchez une vignette pour ajouter la photo de cette couleur. Le chiffre est le seuil d\'alerte de stock.</p></fieldset>' : "") +
      '<label class="f">' + (p ? "Ajouter des variantes" : "Variantes *") + ' <span class="muted">(une par ligne : couleurs pour les sacoches, pointures pour les semelles)</span><textarea name="new_variants" placeholder="Noir\nMarron\nCamel"></textarea></label>' +
      '<label class="f">Seuil d\'alerte par défaut<input name="alert" inputmode="numeric" value="3"></label>' +
      (p ? '<label class="check"><input type="checkbox" name="active"' + (d.active ? " checked" : "") + "> Produit actif (décochez pour l'archiver)</label>" : "") +
      "</form>";
    openModal({
      title: p ? p.name : "Nouveau produit", body: body,
      mount: function () {
        bindUpload("pimg", d.univers, function (f) { newMain = f; }, 72);
        vs.forEach(function (v) { bindUpload("vimg-" + v.id, d.univers, function (f) { newVar[v.id] = f; }, 44); });
      },
      actions: [
        { label: "Annuler", onClick: closeModal },
        { label: "Enregistrer", icon: "check", cls: "btn--primary", onClick: async function () {
          var f = formData($("#pf"));
          var labels = f.new_variants.split(/\n|,/).map(function (s) { return s.trim(); }).filter(Boolean);
          if (!f.name) { toast("Donnez un nom au produit", "err"); return; }
          if (!p && !labels.length) { toast("Ajoutez au moins une variante (ex. une couleur)", "err"); return; }
          var pid;
          if (p) {
            pid = p.id;
            await q(S.sb.from("products").update({ name: f.name, sale_price: int(f.sale_price), active: !!f.active }).eq("id", pid));
            var rows = $$("#pf [data-v]");
            for (var i = 0; i < rows.length; i++) {
              var tr = rows[i];
              await q(S.sb.from("variants").update({
                label: $("[data-k=label]", tr).value.trim() || "?", alert_threshold: int($("[data-k=alert_threshold]", tr).value),
                active: $("[data-k=active]", tr).checked
              }).eq("id", tr.getAttribute("data-v")));
            }
          } else {
            pid = (await q(S.sb.from("products").insert({ univers: f.univers, name: f.name, sale_price: int(f.sale_price) }).select("id").single())).id;
          }
          if (f.cost_price !== "") await q(S.sb.rpc("set_product_cost", { p_product: pid, p_cost: int(f.cost_price) }));
          if (labels.length) {
            var base = vs.length;
            await q(S.sb.from("variants").insert(labels.map(function (l, i) { return { product_id: pid, label: l, alert_threshold: int(f.alert), sort: base + i + 1 }; })));
          }
          if (newMain) {
            var url = await uploadImage(newMain, pid + "/produit-" + Date.now() + ".jpg");
            await q(S.sb.from("products").update({ image_url: url }).eq("id", pid));
          }
          for (var vid in newVar) {
            var vurl = await uploadImage(newVar[vid], pid + "/" + vid + "-" + Date.now() + ".jpg");
            await q(S.sb.from("variants").update({ image_url: vurl }).eq("id", vid));
          }
          toast("Produit enregistré", "ok"); afterChange();
        } }
      ]
    });
  }

  function variantSelect(sel) {
    return S.products.filter(function (p) { return p.active && (S.uni === "all" || p.univers === S.uni); }).map(function (p) {
      return '<optgroup label="' + esc(p.name) + '">' + S.variants.filter(function (v) { return v.product_id === p.id && v.active; }).map(function (v) {
        return '<option value="' + v.id + '"' + (v.id === sel ? " selected" : "") + ">" + esc(v.label) + " (stock " + v.stock + ")</option>";
      }).join("") + "</optgroup>";
    }).join("");
  }
  function stockIn(vid) {
    var body = '<form class="form" id="sf"><label class="f">Article<select name="variant">' + variantSelect(vid) + "</select></label>" +
      '<div class="row"><label class="f">Quantité reçue *<input name="qty" inputmode="numeric"></label>' +
      '<label class="f">Note<input name="note" placeholder="ex. arrivage n°3"></label></div>' +
      (can("gerant") ? '<fieldset><legend>Dépense</legend><label class="check"><input type="checkbox" name="expense"> Enregistrer aussi le montant payé (achat de marchandise)</label>' +
        '<label class="f" style="margin-top:8px">Montant total payé (FCFA)<input name="amount" inputmode="numeric"></label></fieldset>' : "") +
      "</form>";
    openModal({
      title: "Entrée de stock", body: body,
      actions: [
        { label: "Annuler", onClick: closeModal },
        { label: "Ajouter au stock", icon: "plus", cls: "btn--ok", onClick: async function () {
          var f = formData($("#sf"));
          var n = int(f.qty);
          if (!f.variant || n <= 0) { toast("Indiquez une quantité positive", "err"); return; }
          await q(S.sb.rpc("stock_move", { p_variant: f.variant, p_qty: n, p_kind: "entree", p_note: f.note }));
          if (f.expense && int(f.amount) > 0) {
            var p = product(variant(f.variant).product_id);
            await q(S.sb.from("expenses").insert({ univers: p.univers, category: "achat_stock", amount: int(f.amount), at: today(), label: n + " × " + variantName(f.variant) + (f.note ? " — " + f.note : ""), created_by: S.me.id }));
          }
          toast("+" + n + " en stock", "ok"); afterChange();
        } }
      ]
    });
  }
  function inventory(v) {
    var body = '<form class="form" id="inf"><p>' + esc(variantName(v.id)) + " — stock dans l'application : <b>" + v.stock + "</b></p>" +
      '<label class="f">Quantité réellement comptée *<input name="real" inputmode="numeric" value="' + v.stock + '"></label>' +
      '<label class="f">Motif<input name="note" placeholder="ex. inventaire mensuel, article abîmé…"></label></form>';
    openModal({
      title: "Inventaire", body: body,
      actions: [
        { label: "Annuler", onClick: closeModal },
        { label: "Corriger le stock", icon: "check", cls: "btn--primary", onClick: async function () {
          var f = formData($("#inf"));
          if (f.real === "") { toast("Indiquez la quantité comptée", "err"); return; }
          var diff = int(f.real) - v.stock;
          if (!diff) { closeModal(); return; }
          await q(S.sb.rpc("stock_move", { p_variant: v.id, p_qty: diff, p_kind: "ajustement", p_note: f.note || "Inventaire" }));
          toast("Stock corrigé (" + (diff > 0 ? "+" : "") + diff + ")", "ok"); afterChange();
        } }
      ]
    });
  }
  async function stockHistory() {
    var rows = await q(S.sb.from("stock_movements").select("*").order("at", { ascending: false }).limit(150)).catch(fail);
    if (!rows) return;
    var K = { entree: "Entrée", vente: "Vente", retour: "Retour", ajustement: "Inventaire" };
    rows = rows.filter(function (m) { var v = variant(m.variant_id), p = v && product(v.product_id); return S.uni === "all" || (p && p.univers === S.uni); });
    openModal({
      title: "Mouvements de stock",
      body: rows.length ? '<div class="scroll-x"><table class="t"><thead><tr><th>Date</th><th>Article</th><th>Type</th><th class="num">Qté</th><th>Note</th></tr></thead><tbody>' +
        rows.map(function (m) {
          return '<tr><td class="nowrap">' + fdatetime(m.at) + "</td><td>" + esc(variantName(m.variant_id)) + "</td><td>" + K[m.kind] + '</td><td class="num ' + (m.qty < 0 ? "neg" : "pos") + '">' +
            (m.qty > 0 ? "+" : "") + m.qty + "</td><td>" + esc(m.note) + (m.by_user ? ' <span class="muted">· ' + esc(memberName(m.by_user)) + "</span>" : "") + "</td></tr>";
        }).join("") + "</tbody></table></div>" : empty("history", "Aucun mouvement"),
      actions: [{ label: "Fermer", onClick: closeModal }]
    });
  }
  function offerForm(x) {
    var d = x || { univers: S.uni !== "all" ? S.uni : "bienetre", qty: 2, price: "", active: true };
    var body = '<form class="form" id="xf">' +
      '<div class="row"><label class="f">Activité<select name="univers">' + opts(UNI, d.univers) + "</select></label>" +
      '<label class="f">Nom de l\'offre<input name="name" value="' + esc(d.name || "") + '" placeholder="ex. 3 paires"></label></div>' +
      '<div class="row"><label class="f">Nombre d\'articles<input name="qty" inputmode="numeric" value="' + d.qty + '"></label>' +
      '<label class="f">Prix total (FCFA)<input name="price" inputmode="numeric" value="' + d.price + '"></label></div>' +
      '<label class="check"><input type="checkbox" name="active"' + (d.active ? " checked" : "") + "> Offre active</label></form>";
    openModal({
      title: x ? "Modifier l'offre" : "Nouvelle offre", body: body,
      actions: [
        { label: "Annuler", onClick: closeModal },
        { label: "Enregistrer", icon: "check", cls: "btn--primary", onClick: async function () {
          var f = formData($("#xf"));
          if (!f.name || int(f.qty) < 1) { toast("Nom et quantité obligatoires", "err"); return; }
          var row = { univers: f.univers, name: f.name, qty: int(f.qty), price: int(f.price), active: !!f.active };
          if (x) await q(S.sb.from("offers").update(row).eq("id", x.id));
          else {
            var p = S.products.find(function (pp) { return pp.univers === f.univers; });
            row.product_id = p ? p.id : null;
            await q(S.sb.from("offers").insert(row));
          }
          toast("Offre enregistrée", "ok"); afterChange();
        } }
      ]
    });
  }

  /* ========================================================================
     LIVREURS (gérant)
     ======================================================================== */
  async function vCouriers(el) {
    var r = await Promise.all([
      q(S.sb.from("courier_balances").select("*")),
      q(S.sb.from("remittances").select("*").order("at", { ascending: false }).order("created_at", { ascending: false }).limit(40))
    ]);
    var bal = r[0], rem = r[1];
    var totalDue = bal.reduce(function (s, b) { return s + Math.max(b.due, 0); }, 0);
    var html = header("Livreurs", "Dû = encaissé − frais du livreur − versements reçus") +
      '<div class="kpis">' + kpi("cash", totalDue ? "bad" : "ok", "Total à récupérer", money(totalDue), bal.length + " livreur(s)") +
      kpi("truck", "cyan", "En cours", bal.reduce(function (s, b) { return s + b.in_progress; }, 0), "livraisons") + "</div>";
    if (!bal.length) html += empty("truck", "Aucun livreur. Demandez-lui de créer un compte, puis donnez-lui le rôle « Livreur » dans Équipe.");
    html += '<div class="list list--2">' + bal.map(function (b) {
      return '<article class="oc"><div class="oc__main" style="cursor:default"><div class="thumb thumb--round">' + esc(initials(b.full_name)) + "</div>" +
        '<div class="oc__body"><div class="oc__name">' + esc(b.full_name || memberName(b.courier_id)) + "</div>" +
        '<div class="oc__line">' + ico("truck") + "<span>" + b.in_progress + " en cours · " + b.delivered + " livrées · " + b.returned + " retours · taux " + pct(b.delivered, b.delivered + b.returned) + "</span></div>" +
        '<div class="oc__line">' + ico("cash") + "<span>Encaissé " + money(b.collected) + " · frais " + money(b.fees) + " · versé " + money(b.remitted) + "</span></div>" +
        '</div><div class="oc__aside"><div class="oc__amount" style="color:' + (b.due > 0 ? "var(--bad)" : "var(--ok)") + '">' + money(b.due) + '</div><div class="oc__time">à reverser</div></div></div>' +
        '<div class="oc__acts oc__acts--3"><a class="btn btn--icon" href="' + telUrl(b.phone) + '" aria-label="Appeler">' + ico("phone") + "</a>" +
        '<button class="btn btn--icon" data-run="' + b.courier_id + '" title="Ses livraisons" aria-label="Ses livraisons">' + ico("orders") + "</button>" +
        '<button class="btn btn--ok" data-rem="' + b.courier_id + '">' + ico("cash", "i--sm") + "Versement reçu</button></div></article>";
    }).join("") + "</div>";
    html += sectionTitle("history", "Derniers versements") +
      (rem.length ? '<div class="card scroll-x"><table class="t"><thead><tr><th>Date</th><th>Livreur</th><th class="num">Montant</th><th>Note</th><th>Reçu par</th></tr></thead><tbody>' +
        rem.map(function (x) {
          return "<tr><td>" + fday(x.at) + "</td><td>" + esc(memberName(x.courier_id)) + '</td><td class="num">' + money(x.amount) + "</td><td>" + esc(x.note) + "</td><td>" + esc(memberName(x.received_by)) + "</td></tr>";
        }).join("") + "</tbody></table></div>" : empty("cash", "Aucun versement enregistré"));
    el.innerHTML = html;
    $$("[data-rem]", el).forEach(function (b) {
      b.addEventListener("click", function () {
        var c = bal.find(function (x) { return x.courier_id === b.getAttribute("data-rem"); });
        openModal({
          title: "Versement de " + (c.full_name || "livreur"),
          body: '<form class="form" id="rf"><div class="hero-amount"><small class="muted">Montant dû actuellement</small><b>' + money(c.due) + "</b></div>" +
            '<div class="row"><label class="f">Montant reçu *<input name="amount" inputmode="numeric" value="' + Math.max(c.due, 0) + '"></label>' +
            '<label class="f">Date<input type="date" name="at" value="' + today() + '"></label></div>' +
            '<label class="f">Moyen / note<input name="note" placeholder="ex. Wave, espèces…"></label></form>',
          actions: [
            { label: "Annuler", onClick: closeModal },
            { label: "Enregistrer", icon: "check", cls: "btn--ok", onClick: async function () {
              var f = formData($("#rf"));
              if (int(f.amount) <= 0) { toast("Montant invalide", "err"); return; }
              await q(S.sb.from("remittances").insert({ courier_id: c.courier_id, amount: int(f.amount), at: f.at || today(), note: f.note, received_by: S.me.id }));
              toast("Versement enregistré", "ok"); closeModal(); vCouriers(el).catch(fail);
            } }
          ]
        });
      });
    });
    $$("[data-run]", el).forEach(function (b) {
      b.addEventListener("click", async function () {
        var list = await q(S.sb.from("orders").select("*, order_items(variant_id, qty, unit_price)").eq("courier_id", b.getAttribute("data-run")).in("status", ["confirmee", "en_livraison"]).order("created_at")).catch(fail);
        if (!list) return;
        openModal({ title: "Livraisons de " + memberName(b.getAttribute("data-run")), body: list.length ? '<div class="list">' + list.map(orderCard).join("") + "</div>" : empty("truck", "Aucune livraison en cours"), mount: function (m) { bindOrderCards(m, list); } });
      });
    });
    S.refresh = function () { if (S.view === "livreurs" && !S.modalOpen) vCouriers(el).catch(fail); };
  }

  /* ========================================================================
     FINANCES (gérant)
     ======================================================================== */
  async function vFinances(el) {
    var st = vstate("finances", { month: today().slice(0, 7) });
    var first = shiftMonth(st.month, -5), mb = monthBounds(st.month), range = { from: monthBounds(first).from, to: mb.to };
    var r = await Promise.all([
      q(S.sb.from("orders").select("id, univers, total_amount, delivery_cost, delivered_at, order_costs(cogs)").eq("status", "livree").gte("delivered_at", range.from).lt("delivered_at", range.to)),
      q(S.sb.from("orders").select("id, univers, delivery_cost, updated_at").eq("status", "retour").gte("updated_at", range.from).lt("updated_at", range.to)),
      q(S.sb.from("expenses").select("*").gte("at", monthBounds(first).fromD).lt("at", mb.toD).order("at", { ascending: false })),
      q(S.sb.from("orders").select("univers, status").gte("created_at", mb.from).lt("created_at", mb.to))
    ]);
    var delivered = r[0], returns = r[1], expenses = r[2], created = r[3];
    function cogsOf(o) { var c = o.order_costs; if (Array.isArray(c)) c = c[0]; return c ? c.cogs : 0; }
    function inMonth(dt, ym) { return dt && dt.slice(0, 7) === ym; }
    function compute(ym) {
      var res = {};
      ["passion", "bienetre", "commun", "total"].forEach(function (u) { res[u] = { ca: 0, cogs: 0, liv: 0, pub: 0, autres: 0, achats: 0, n: 0 }; });
      delivered.forEach(function (o) {
        if (!inMonth(o.delivered_at, ym)) return;
        [o.univers, "total"].forEach(function (u) { res[u].ca += o.total_amount; res[u].cogs += cogsOf(o); res[u].liv += o.delivery_cost; res[u].n++; });
      });
      returns.forEach(function (o) { if (!inMonth(o.updated_at, ym)) return; [o.univers, "total"].forEach(function (u) { res[u].liv += o.delivery_cost; }); });
      expenses.forEach(function (e) {
        if (!inMonth(e.at, ym)) return;
        var k = e.category === "achat_stock" ? "achats" : AD_CATS.indexOf(e.category) >= 0 ? "pub" : "autres";
        if (e.category === "transport") k = "liv";
        [e.univers, "total"].forEach(function (u) { res[u][k] += e.amount; });
      });
      Object.keys(res).forEach(function (u) { var x = res[u]; x.marge = x.ca - x.cogs; x.net = x.marge - x.liv - x.pub - x.autres; });
      return res;
    }
    var R = compute(st.month);
    var cols = [["passion", "Sacoches"], ["bienetre", "Semelles"], ["commun", "Commun"], ["total", "Total"]];
    function row(label, key, sign, cls) {
      return "<tr" + (cls ? ' class="' + cls + '"' : "") + "><td>" + label + "</td>" + cols.map(function (c) {
        var v = R[c[0]][key]; var s = sign && v ? "− " : "";
        var color = key === "net" ? (v < 0 ? "neg" : "pos") : "";
        return '<td class="num ' + color + '">' + (c[0] === "commun" && (key === "ca" || key === "cogs" || key === "marge") ? "—" : s + money(v)) + "</td>";
      }).join("") + "</tr>";
    }
    var T = R.total;
    var conf = created.filter(function (o) { return ["confirmee", "en_livraison", "livree", "retour"].indexOf(o.status) >= 0; }).length;
    var ret = returns.filter(function (o) { return inMonth(o.updated_at, st.month); }).length;
    var months = []; for (var i = 5; i >= 0; i--) months.push(shiftMonth(st.month, -i));
    var nets = months.map(function (m) { return compute(m).total.net; });
    var maxAbs = Math.max.apply(null, nets.map(Math.abs).concat([1]));

    var html = header("Finances", monthLabel(st.month), '<input type="month" id="fmonth" value="' + st.month + '" style="width:auto"><button class="btn btn--primary" id="new-exp">' + ico("plus") + "<span>Dépense</span></button>") +
      '<div class="kpis">' +
      kpi("trend", "", "Chiffre d'affaires", money(T.ca), T.n + " commandes livrées") +
      kpi("wallet", T.net < 0 ? "bad" : "ok", "Bénéfice net", money(T.net), "marge nette " + pct(T.net, T.ca)) +
      kpi("send", "violet", "ROAS", T.pub ? (T.ca / T.pub).toFixed(1).replace(".", ",") + " ×" : "—", "CA ÷ pub (" + money(T.pub) + ")") +
      kpi("tag", "warn", "Coût pub / livrée", T.n ? money(T.pub / T.n) : "—", "pub ÷ commandes livrées") +
      kpi("inbox", "", "Commandes reçues", created.length, "ce mois-ci") +
      kpi("check", "ok", "Taux de confirmation", pct(conf, created.length), conf + " confirmées") +
      kpi("truck", "cyan", "Taux de livraison", pct(T.n, T.n + ret), ret + " retour(s)") +
      kpi("package", "", "Achats de stock", money(T.achats), "trésorerie (hors bénéfice)") + "</div>" +
      '<div class="card scroll-x"><h2 style="margin-bottom:8px">Compte de résultat</h2><table class="t"><thead><tr><th></th>' +
      cols.map(function (c) { return '<th class="num">' + c[1] + "</th>"; }).join("") + "</tr></thead><tbody>" +
      row("Chiffre d'affaires (livré)", "ca") + row("Coût d'achat des produits vendus", "cogs", true) + row("<b>Marge brute</b>", "marge") +
      row("Livraison & transport", "liv", true) + row("Publicité", "pub", true) + row("Autres dépenses", "autres", true) +
      row("Bénéfice net", "net", false, "total") + "</tbody></table>" +
      '<p class="muted small" style="margin:8px 0 0">Les achats de marchandise sont comptés via le coût d\'achat des produits vendus, pas ici. Les dépenses « Commun » ne sont réparties sur aucun produit.</p></div>' +
      '<div class="card"><h2>Bénéfice net — 6 derniers mois</h2><div class="bars">' + months.map(function (m, i) {
        var h = Math.round(Math.abs(nets[i]) / maxAbs * 100);
        return '<div class="bar"><b>' + num(Math.round(nets[i] / 1000)) + 'k</b><i class="' + (nets[i] < 0 ? "neg" : "") + '" style="height:' + h + '%"></i>' + monthLabel(m) + "</div>";
      }).join("") + "</div></div>" + sectionTitle("cash", "Dépenses du mois");
    var monthExp = expenses.filter(function (e) { return inMonth(e.at, st.month); });
    html += monthExp.length ? '<div class="card scroll-x"><table class="t"><thead><tr><th>Date</th><th>Catégorie</th><th>Pour</th><th>Libellé</th><th class="num">Montant</th><th></th></tr></thead><tbody>' +
      monthExp.map(function (e) {
        return "<tr><td>" + fday(e.at) + "</td><td>" + esc(EXP[e.category]) + "</td><td>" + esc(UNI[e.univers] || "Commun") + "</td><td>" + esc(e.label) + '</td><td class="num">' + money(e.amount) +
          '</td><td class="right"><button class="btn btn--sm btn--icon btn--bad" data-del="' + e.id + '" aria-label="Supprimer">' + ico("trash", "i--sm") + "</button></td></tr>";
      }).join("") + "</tbody></table></div>" : empty("cash", "Aucune dépense ce mois-ci. Saisissez vos dépenses pub chaque semaine pour suivre le ROAS.");
    el.innerHTML = html;
    $("#fmonth").addEventListener("change", function (e) { if (e.target.value) { st.month = e.target.value; vFinances(el).catch(fail); } });
    $("#new-exp").addEventListener("click", function () { expenseForm(function () { vFinances(el).catch(fail); }); });
    $$("[data-del]", el).forEach(function (b) {
      b.addEventListener("click", async function () {
        if (!(await confirmBox("Supprimer cette dépense ?", "Supprimer"))) return;
        await q(S.sb.from("expenses").delete().eq("id", b.getAttribute("data-del"))).catch(fail);
        vFinances(el).catch(fail);
      });
    });
  }
  function expenseForm(done) {
    var body = '<form class="form" id="ef"><div class="row"><label class="f">Date<input type="date" name="at" value="' + today() + '"></label>' +
      '<label class="f">Montant (FCFA) *<input name="amount" inputmode="numeric"></label></div>' +
      '<div class="row"><label class="f">Catégorie<select name="category">' + opts(EXP, "pub_meta") + "</select></label>" +
      '<label class="f">Pour<select name="univers"><option value="bienetre">Semelles</option><option value="passion">Sacoches</option><option value="commun">Commun (les deux)</option></select></label></div>' +
      '<label class="f">Libellé<input name="label" placeholder="ex. Campagne Meta semaine 45"></label></form>';
    openModal({
      title: "Nouvelle dépense", body: body,
      mount: function () { if (S.uni !== "all") $("#ef [name=univers]").value = S.uni; },
      actions: [
        { label: "Annuler", onClick: closeModal },
        { label: "Enregistrer", icon: "check", cls: "btn--primary", onClick: async function () {
          var f = formData($("#ef"));
          if (int(f.amount) <= 0) { toast("Montant invalide", "err"); return; }
          await q(S.sb.from("expenses").insert({ at: f.at || today(), amount: int(f.amount), category: f.category, univers: f.univers, label: f.label, created_by: S.me.id }));
          toast("Dépense enregistrée", "ok"); closeModal(); if (done) done();
        } }
      ]
    });
  }

  /* ========================================================================
     ÉQUIPE & RÉGLAGES (gérant)
     ======================================================================== */
  async function vSettings(el) {
    await loadRefs();
    var pending = S.members.filter(function (m) { return !m.active; });
    var html = header("Équipe & réglages") +
      (pending.length ? '<p class="note" style="margin-bottom:12px">' + ico("alert") + "<span>" + pending.length + " compte(s) en attente : choisissez un rôle et cochez « Actif ».</span></p>" : "") +
      '<div class="card"><h2 style="margin-bottom:4px">Équipe</h2><p class="muted small">Chaque membre crée son compte (« Créer un compte »), puis vous lui donnez un rôle ici.</p><div class="list" style="margin-top:10px">' +
      S.members.map(function (m) {
        return '<div data-m="' + m.id + '" style="display:grid;grid-template-columns:42px 1fr;gap:10px;align-items:center;border:1px solid var(--line);border-radius:12px;padding:10px">' +
          '<div class="thumb thumb--round" style="width:42px;height:42px">' + esc(initials(m.full_name || m.email)) + "</div>" +
          '<div style="min-width:0"><b>' + esc(m.full_name || "—") + '</b> <span class="muted small">' + esc(m.email) + "</span>" +
          '<div style="display:flex;gap:8px;align-items:center;margin-top:6px;flex-wrap:wrap"><select data-k="role" style="flex:1;min-width:150px" aria-label="Rôle">' + opts(ROLES, m.role, "— Aucun rôle —") + "</select>" +
          '<select data-k="univers" style="flex:1;min-width:150px" aria-label="Activité" title="Activité de la closeuse"' + (m.role === "closeuse" ? "" : " hidden") + ">" + opts({ passion: "Sacoches uniquement", bienetre: "Semelles uniquement" }, m.univers || "", "Les deux activités") + "</select>" +
          '<label class="check"><input type="checkbox" data-k="active"' + (m.active ? " checked" : "") + "> Actif</label>" +
          '<button class="btn btn--sm btn--primary" data-save>' + ico("check", "i--sm") + "OK</button></div></div></div>";
      }).join("") + "</div>" +
      '<p class="muted small" style="margin-top:10px">Closeuse : commandes et prospects de son activité (ou des deux), sans coûts ni finances. Livreur : uniquement ses livraisons. Stock : produits et entrées de stock.</p></div>';

    html += '<div class="card"><h2 style="margin-bottom:10px">Marques</h2><form class="form" id="bf">' + ["bienetre", "passion"].map(function (u) {
      var b = S.brands[u] || {};
      return '<fieldset><legend><span class="dot dot--' + u + '"></span> ' + UNI_LONG[u] + '</legend><div class="row3"><label class="f">Nom<input name="' + u + '_name" value="' + esc(b.name || "") + '"></label>' +
        '<label class="f">WhatsApp<input name="' + u + '_whatsapp" value="' + esc(b.whatsapp || "") + '" placeholder="225 07…"></label>' +
        '<label class="f">Site<input name="' + u + '_site_url" value="' + esc(b.site_url || "") + '" placeholder="https://…"></label></div></fieldset>';
    }).join("") + '<div><button type="button" class="btn btn--primary" id="save-brands">' + ico("check") + "Enregistrer les marques</button></div></form></div>";

    html += '<div class="card"><h2 style="margin-bottom:6px">Recevoir les commandes d\'un site</h2>' +
      '<p class="small">Dans le fichier <code>assets/js/config.js</code> du site, renseignez :</p>' +
      '<pre class="small" style="white-space:pre-wrap;word-break:break-all;background:var(--brand-soft);padding:10px;border-radius:10px">supabaseUrl: "' + esc(CFG.supabaseUrl) + '",\nsupabaseAnonKey: "' + esc(CFG.supabaseAnonKey) + '",\nunivers: "bienetre"   // "passion" pour le site des sacoches</pre></div>';
    el.innerHTML = html;
    $$("[data-m]", el).forEach(function (tr) {
      $("[data-k=role]", tr).addEventListener("change", function (e) { $("[data-k=univers]", tr).hidden = e.target.value !== "closeuse"; });
      $("[data-save]", tr).addEventListener("click", async function () {
        var roleV = $("[data-k=role]", tr).value || null, active = $("[data-k=active]", tr).checked;
        var uniV = roleV === "closeuse" ? ($("[data-k=univers]", tr).value || null) : null;
        if (active && !roleV) { toast("Choisissez un rôle avant d'activer", "err"); return; }
        try { await q(S.sb.rpc("set_member", { p_user: tr.getAttribute("data-m"), p_role: roleV, p_active: active, p_univers: uniV })); } catch (e) { return fail(e); }
        toast("Membre mis à jour", "ok"); vSettings(el).catch(fail);
      });
    });
    $("#save-brands").addEventListener("click", async function () {
      var f = formData($("#bf"));
      var rows = ["bienetre", "passion"].map(function (u) { return { univers: u, name: f[u + "_name"] || UNI[u], whatsapp: f[u + "_whatsapp"], site_url: f[u + "_site_url"] }; });
      try { await q(S.sb.from("brands").upsert(rows)); } catch (e) { return fail(e); }
      await loadRefs(); toast("Marques enregistrées", "ok");
    });
  }

  /* ========================================================================
     MON COMPTE
     ======================================================================== */
  function vAccount(el) {
    el.innerHTML = header("Mon compte", ROLES[S.me.role] || "") +
      '<div class="card"><form class="form" id="af"><p class="muted" style="margin:0">' + esc(S.me.email) + "</p>" +
      '<div class="row"><label class="f">Nom complet<input name="full_name" value="' + esc(S.me.full_name) + '"></label>' +
      '<label class="f">Téléphone<input name="phone" inputmode="tel" value="' + esc(S.me.phone) + '"></label></div>' +
      '<div><button type="button" class="btn btn--primary" id="save-me">' + ico("check") + "Enregistrer</button></div></form></div>" +
      '<div class="card"><form class="form" id="pwf"><h2>Mot de passe</h2><label class="f">Nouveau mot de passe (8 caractères min.)<input type="password" name="pw" autocomplete="new-password"></label>' +
      '<div><button type="button" class="btn" id="save-pw">' + ico("lock") + "Changer</button></div></form></div>" +
      '<p style="margin-top:16px"><button class="btn btn--bad" id="logout2">' + ico("logout") + "Se déconnecter</button></p>";
    $("#save-me").addEventListener("click", async function () {
      var f = formData($("#af"));
      try { await q(S.sb.from("profiles").update({ full_name: f.full_name, phone: digits(f.phone) }).eq("id", S.me.id)); } catch (e) { return fail(e); }
      S.me.full_name = f.full_name; S.me.phone = digits(f.phone); toast("Enregistré", "ok");
    });
    $("#save-pw").addEventListener("click", async function () {
      var pw = formData($("#pwf")).pw;
      if (pw.length < 8) { toast("8 caractères minimum", "err"); return; }
      var res = await S.sb.auth.updateUser({ password: pw });
      if (res.error) fail(res.error); else toast("Mot de passe changé", "ok");
    });
    $("#logout2").addEventListener("click", logout);
  }

  /* ========================================================================
     CONNEXION
     ======================================================================== */
  function authLogo() { return '<div class="auth__logo"><img src="' + LOGO + '" alt=""><div><b>' + brandHtml() + "</b><small>GESTION</small></div></div>"; }
  function authScreen(mode) {
    mode = mode || "login";
    var titles = { login: "Connexion", signup: "Créer un compte", forgot: "Mot de passe oublié", reset: "Nouveau mot de passe" };
    var f = "";
    if (mode === "signup") f += '<label class="f">Nom complet<input name="full_name" required autocomplete="name"></label>';
    if (mode !== "reset") f += '<label class="f">E-mail<input type="email" name="email" required autocomplete="email"></label>';
    if (mode !== "forgot") f += '<label class="f">Mot de passe<input type="password" name="password" required autocomplete="' + (mode === "login" ? "current-password" : "new-password") + '"></label>';
    $("#root").innerHTML = '<div class="auth"><div class="card">' + authLogo() + "<h1>" + titles[mode] + "</h1>" +
      '<form class="form" id="authf" novalidate style="margin-top:14px">' + f + '<button class="btn btn--primary btn--block" type="submit">' + (mode === "login" ? "Se connecter" : mode === "signup" ? "Créer mon compte" : mode === "forgot" ? "Recevoir le lien" : "Enregistrer") + "</button></form>" +
      '<p class="small" style="margin:16px 0 0">' +
      (mode === "login" ? '<a href="#" data-m="signup">Créer un compte</a> · <a href="#" data-m="forgot">Mot de passe oublié ?</a>' : mode === "reset" ? "" : '<a href="#" data-m="login">← Retour à la connexion</a>') +
      "</p></div></div>";
    $$("[data-m]").forEach(function (a) { a.addEventListener("click", function (e) { e.preventDefault(); authScreen(a.getAttribute("data-m")); }); });
    $("#authf").addEventListener("submit", async function (e) {
      e.preventDefault();
      var d = formData(e.target), btn = $("button[type=submit]", e.target), res;
      btn.disabled = true;
      try {
        if (mode === "login") res = await S.sb.auth.signInWithPassword({ email: d.email, password: d.password });
        if (mode === "signup") {
          if (d.password.length < 8) throw new Error("Mot de passe : 8 caractères minimum");
          res = await S.sb.auth.signUp({ email: d.email, password: d.password, options: { data: { full_name: d.full_name }, emailRedirectTo: location.origin + location.pathname } });
          if (!res.error && !res.data.session) { toast("Compte créé. Ouvrez l'e-mail de confirmation, puis connectez-vous.", "ok"); authScreen("login"); return; }
        }
        if (mode === "forgot") {
          res = await S.sb.auth.resetPasswordForEmail(d.email, { redirectTo: location.origin + location.pathname });
          if (!res.error) { toast("Si ce compte existe, un lien vous a été envoyé par e-mail.", "ok"); authScreen("login"); return; }
        }
        if (mode === "reset") {
          if (d.password.length < 8) throw new Error("Mot de passe : 8 caractères minimum");
          res = await S.sb.auth.updateUser({ password: d.password });
          if (!res.error) { toast("Mot de passe enregistré", "ok"); S.recovering = false; start(); return; }
        }
        if (res && res.error) {
          var m = res.error.message;
          if (/Invalid login/i.test(m)) m = "E-mail ou mot de passe incorrect";
          if (/Email not confirmed/i.test(m)) m = "Confirmez d'abord votre e-mail (lien reçu à l'inscription)";
          if (/already registered/i.test(m)) m = "Un compte existe déjà avec cet e-mail";
          throw new Error(m);
        }
      } catch (err) { fail(err); }
      btn.disabled = false;
    });
  }

  function pendingScreen() {
    $("#root").innerHTML = '<div class="auth"><div class="card">' + authLogo() + "<h1>Compte en attente</h1>" +
      "<p>Bonjour " + esc(S.me.full_name || S.me.email) + ", votre compte est créé. Le gérant doit maintenant vous attribuer un rôle.</p>" +
      '<div class="btn-row"><button class="btn btn--primary" id="recheck">' + ico("history") + 'Vérifier à nouveau</button><button class="btn" id="lo">' + ico("logout") + "Se déconnecter</button></div></div></div>";
    $("#recheck").addEventListener("click", start);
    $("#lo").addEventListener("click", logout);
  }

  function setupScreen() {
    $("#root").innerHTML = '<div class="setup"><h1>' + esc(APP) + ' — installation</h1>' +
      "<p>L'application n'est pas encore reliée à sa base de données. Suivez le guide <b>gestion/README.md</b> :</p><ol>" +
      "<li>Créez un projet gratuit sur <b>supabase.com</b>.</li>" +
      "<li>Dans <b>SQL Editor</b>, exécutez le fichier <code>gestion/supabase/schema.sql</code>.</li>" +
      "<li>Copiez l'URL du projet et la clé publique dans <code>gestion/config.js</code>.</li>" +
      "<li>Rechargez cette page et créez votre compte : le premier compte devient gérant.</li></ol></div>";
  }

  async function logout() { await S.sb.auth.signOut(); S.me = null; authScreen("login"); }

  var channel;
  function realtime() {
    if (channel) return;
    var refresh = debounce(function () {
      Promise.resolve(S.view === "stock" ? loadRefs() : null).then(function () { if (S.refresh && !S.modalOpen) S.refresh(); refreshBadges(); }).catch(function () {});
    }, 800);
    channel = S.sb.channel("bco-db")
      .on("postgres_changes", { event: "*", schema: "public", table: "orders" }, refresh)
      .on("postgres_changes", { event: "*", schema: "public", table: "contacts" }, refresh)
      .on("postgres_changes", { event: "*", schema: "public", table: "variants" }, refresh)
      .subscribe();
  }

  var starting = null;
  function start() {
    if (!starting) starting = doStart().finally(function () { starting = null; });
    return starting;
  }
  async function doStart() {
    if (S.recovering) { authScreen("reset"); return; }
    var sres = await S.sb.auth.getSession();
    S.session = sres.data.session;
    if (!S.session) { authScreen("login"); return; }
    try {
      S.me = await q(S.sb.from("profiles").select("*").eq("id", S.session.user.id).single());
    } catch (e) {
      $("#root").innerHTML = '<div class="setup"><h1>Erreur</h1><p>' + esc(e.message) + "</p><p>Vérifiez que le fichier <code>supabase/schema.sql</code> a bien été exécuté.</p></div>";
      return;
    }
    if (!S.me.active || !S.me.role) { pendingScreen(); return; }
    if (lockedUni()) S.uni = lockedUni();
    try { await loadRefs(); } catch (e) { fail(e); }
    shell(); route(); realtime();
  }

  /* ------------------------------------------------------------------------
     Démarrage
     ------------------------------------------------------------------------ */
  window.addEventListener("hashchange", function () { if (S.me && S.me.active && $("#view")) { closeModal(); route(); } });
  if ("serviceWorker" in navigator && location.protocol === "https:") navigator.serviceWorker.register("sw.js").catch(function () {});

  if (!CFG.supabaseUrl || !CFG.supabaseAnonKey || !window.supabase) { setupScreen(); return; }
  CFG.supabaseUrl = String(CFG.supabaseUrl).trim().replace(/\/(rest|auth)\/v1\/?$/, "").replace(/\/+$/, "");
  S.sb = window.supabase.createClient(CFG.supabaseUrl, CFG.supabaseAnonKey.trim());
  S.recovering = /type=recovery/.test(location.hash);
  S.sb.auth.onAuthStateChange(function (ev) {
    if (ev === "PASSWORD_RECOVERY") { S.recovering = true; authScreen("reset"); }
    else if (ev === "SIGNED_IN" && !S.me && !S.recovering) setTimeout(start, 0);
  });
  start();
})();
