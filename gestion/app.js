/* ==========================================================================
   BOLOU and CO — Application de gestion
   Commandes · Prospects · Stock · Livreurs · Finances · Équipe
   Vanilla JS + Supabase (aucune étape de build).
   ========================================================================== */
(function () {
  "use strict";

  var CFG = window.BCO_CONFIG || {};
  var APP = CFG.appName || "BOLOU and CO";

  /* ------------------------------------------------------------------------
     Constantes
     ------------------------------------------------------------------------ */
  var UNI = { passion: "Passion · Sacoches", bienetre: "Bien-être · Semelles" };
  var UNI_SHORT = { passion: "Sacoches", bienetre: "Semelles", commun: "Commun" };
  var ST = {
    nouvelle: "Nouvelle", injoignable: "Injoignable", confirmee: "Confirmée",
    en_livraison: "En livraison", livree: "Livrée", retour: "Retour", annulee: "Annulée"
  };
  var OPEN = ["nouvelle", "injoignable", "confirmee", "en_livraison"];
  var STAGES = { nouveau: "Nouveau contact", interesse: "Intéressé", panier: "Panier non confirmé", client: "Client", perdu: "Perdu" };
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
  function fdatetime(iso) { if (!iso) return ""; var d = new Date(iso); return fdate(iso) + " " + pad(d.getUTCHours()) + "h" + pad(d.getUTCMinutes()); }
  function fday(d) { if (!d) return ""; var p = d.split("-"); return p[2] + "/" + p[1] + "/" + p[0]; }
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
  function waUrl(phone, text) { return "https://wa.me/225" + digits(phone) + (text ? "?text=" + encodeURIComponent(text) : ""); }
  function firstName(n) { return String(n || "").trim().split(/\s+/)[0] || ""; }
  function store(k, v) {
    try { if (v === undefined) return JSON.parse(localStorage.getItem("bco_" + k) || "null"); localStorage.setItem("bco_" + k, JSON.stringify(v)); }
    catch (e) { return null; }
  }
  function opts(map, sel, empty) {
    var h = empty != null ? '<option value="">' + esc(empty) + "</option>" : "";
    Object.keys(map).forEach(function (k) { h += '<option value="' + k + '"' + (k === sel ? " selected" : "") + ">" + esc(map[k]) + "</option>"; });
    return h;
  }
  function pill(key, label) { return '<span class="pill pill--' + esc(key) + '">' + esc(label) + "</span>"; }
  function debounce(fn, ms) { var t; return function () { var a = arguments; clearTimeout(t); t = setTimeout(function () { fn.apply(null, a); }, ms); }; }

  var toastT;
  function toast(msg, isErr) {
    var t = $("#toast");
    t.textContent = msg; t.className = "toast is-on" + (isErr ? " is-err" : "");
    clearTimeout(toastT); toastT = setTimeout(function () { t.className = "toast"; }, isErr ? 5000 : 2600);
  }
  function fail(e) { console.error(e); toast((e && e.message) || "Erreur", true); }

  /* ------------------------------------------------------------------------
     Fenêtre modale
     ------------------------------------------------------------------------ */
  var dlg = $("#modal");
  $("#modal-x").addEventListener("click", function () { closeModal(); });
  dlg.addEventListener("cancel", function () { S.modalOpen = false; });
  dlg.addEventListener("close", function () { S.modalOpen = false; });
  function openModal(o) {
    $("#modal-title").textContent = o.title || "";
    $("#modal-body").innerHTML = o.body || "";
    var foot = $("#modal-foot"); foot.innerHTML = "";
    (o.actions || []).forEach(function (a) {
      var b = document.createElement(a.href ? "a" : "button");
      b.className = "btn " + (a.cls || ""); b.innerHTML = a.label;
      if (a.href) { b.href = a.href; b.target = "_blank"; b.rel = "noopener"; }
      else b.type = "button";
      if (a.onClick) b.addEventListener("click", function () {
        if (b.disabled) return;
        var r = a.onClick(b);
        if (r && r.then) {
          b.disabled = true;
          r.catch(fail).then(function () { b.disabled = false; });
        }
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
          { label: label || "Confirmer", cls: "btn--primary", onClick: function () { closeModal(); resolve(true); } }
        ]
      });
    });
  }
  function formData(root) {
    var o = {};
    $$("[name]", root).forEach(function (el) {
      if (el.type === "radio") { if (el.checked) o[el.name] = el.value; else if (!(el.name in o)) o[el.name] = ""; }
      else if (el.type === "checkbox") o[el.name] = el.checked;
      else o[el.name] = el.value.trim();
    });
    return o;
  }

  /* ------------------------------------------------------------------------
     État
     ------------------------------------------------------------------------ */
  var S = {
    sb: null, session: null, me: null,
    brands: {}, products: [], variants: [], offers: [], members: [], costs: {},
    uni: store("uni") || "all", view: null, refresh: null, modalOpen: false, vs: {}
  };
  function role() { return S.me && S.me.active ? S.me.role : null; }
  function can() { var r = role(); return Array.prototype.indexOf.call(arguments, r) >= 0; }
  function vstate(view, defaults) { S.vs[view] = S.vs[view] || Object.assign({}, defaults); return S.vs[view]; }

  async function q(p) {
    var res = await p;
    if (res.error) {
      var m = res.error.message || "Erreur";
      if (/JWT|token/i.test(m)) m = "Session expirée : reconnectez-vous.";
      if (/Failed to fetch|NetworkError/i.test(m)) m = "Pas de connexion internet.";
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
      q(S.sb.from("profiles").select("id, email, full_name, phone, role, active, created_at").order("created_at"))
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
  function brandName(u) { return (S.brands[u] && S.brands[u].name) || UNI_SHORT[u] || APP; }
  function variantName(id, withProduct) {
    var v = variant(id); if (!v) return "?";
    var p = product(v.product_id);
    return (withProduct !== false && p ? p.name + " " : "") + v.label;
  }
  function itemsText(o) {
    var items = o.order_items || [];
    if (!items.length) return "—";
    var offer = S.offers.find(function (x) { return x.id === o.offer_id; });
    if (offer) {
      return offer.name + " · " + items.map(function (i) { return variantName(i.variant_id, false) + (i.qty > 1 ? " ×" + i.qty : ""); }).join(", ");
    }
    return items.map(function (i) { return variantName(i.variant_id) + (i.qty > 1 ? " ×" + i.qty : ""); }).join(", ");
  }
  function toCollect(o) { return Math.max((o.total_amount || 0) - (o.prepaid_amount || 0), 0); }

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
     Vues (menu selon le rôle)
     ------------------------------------------------------------------------ */
  var VIEWS = {
    tableau:    { label: "Tableau de bord", ico: "◧", roles: ["gerant", "closeuse", "stock"], render: vDashboard },
    commandes:  { label: "Commandes", ico: "▤", roles: ["gerant", "closeuse", "stock"], render: vOrders },
    prospects:  { label: "Prospects", ico: "☺", roles: ["gerant", "closeuse"], render: vContacts },
    livraisons: { label: "Mes livraisons", ico: "➜", roles: ["livreur"], render: vMyDeliveries },
    stock:      { label: "Stock", ico: "▦", roles: ["gerant", "stock"], render: vStock },
    livreurs:   { label: "Livreurs", ico: "➜", roles: ["gerant"], render: vCouriers },
    finances:   { label: "Finances", ico: "₣", roles: ["gerant"], render: vFinances },
    reglages:   { label: "Équipe", ico: "⚙", roles: ["gerant"], render: vSettings },
    compte:     { label: "Mon compte", ico: "◉", roles: ["gerant", "closeuse", "livreur", "stock"], render: vAccount }
  };
  function allowedViews() { return Object.keys(VIEWS).filter(function (k) { return VIEWS[k].roles.indexOf(role()) >= 0; }); }

  function shell() {
    var nav = allowedViews().map(function (k) {
      return '<a href="#/' + k + '" data-view="' + k + '"><span class="ico">' + VIEWS[k].ico + "</span><span>" + VIEWS[k].label + "</span></a>";
    }).join("");
    $("#root").innerHTML =
      '<div class="app"><aside class="side">' +
      '<div class="brand"><b>' + esc(APP) + '</b><small>Gestion</small></div>' +
      '<nav class="menu" id="menu">' + nav + "</nav>" +
      '<div class="side__foot">' + esc(S.me.full_name || S.me.email) + "<br><small>" + esc(ROLES[S.me.role] || "") +
      '</small><br><button type="button" id="logout">Se déconnecter</button></div>' +
      '</aside><main class="main" id="view" tabindex="-1"></main></div>';
    $("#logout").addEventListener("click", logout);
  }

  function route() {
    var v = (location.hash.match(/^#\/(\w+)/) || [])[1];
    var allowed = allowedViews();
    if (allowed.indexOf(v) < 0) { v = allowed[0]; history.replaceState(null, "", "#/" + v); }
    S.view = v; S.refresh = null;
    $$("#menu a").forEach(function (a) { a.classList.toggle("is-active", a.getAttribute("data-view") === v); });
    var el = $("#view");
    el.innerHTML = '<p class="muted">Chargement…</p>';
    Promise.resolve(VIEWS[v].render(el)).catch(function (e) { el.innerHTML = '<div class="empty">' + esc(e.message) + "</div>"; });
    window.scrollTo(0, 0);
  }

  function uniSwitch() {
    return '<div class="uni-switch" role="group" aria-label="Univers">' +
      [["all", "Tout"], ["passion", "Sacoches"], ["bienetre", "Semelles"]].map(function (u) {
        return '<button type="button" data-u="' + u[0] + '" class="' + (S.uni === u[0] ? "is-on" : "") + '">' + u[1] + "</button>";
      }).join("") + "</div>";
  }
  function bindUni(root) {
    $$(".uni-switch button", root).forEach(function (b) {
      b.addEventListener("click", function () { S.uni = b.getAttribute("data-u"); store("uni", S.uni); route(); });
    });
  }
  function header(title, actionsHtml, withUni) {
    return '<div class="topline"><h1>' + esc(title) + '</h1><div class="actions">' + (withUni ? uniSwitch() : "") + (actionsHtml || "") + "</div></div>";
  }

  /* ========================================================================
     TABLEAU DE BORD
     ======================================================================== */
  async function vDashboard(el) {
    var mb = monthBounds(today().slice(0, 7));
    var tasks = [
      q(uniEq(S.sb.from("orders").select("*, order_items(variant_id, qty, unit_price)").in("status", OPEN)).order("created_at", { ascending: false }).limit(500)),
      q(uniEq(S.sb.from("orders").select("id, univers, status, total_amount, delivered_at").eq("status", "livree").gte("delivered_at", mb.from).lt("delivered_at", mb.to)))
    ];
    if (can("gerant", "closeuse")) tasks.push(q(uniEq(S.sb.from("contacts").select("*").lte("next_followup", today()).neq("stage", "perdu")).order("next_followup").limit(200)));
    if (can("gerant")) tasks.push(q(S.sb.from("courier_balances").select("*")));
    var r = await Promise.all(tasks);
    var open = r[0], delivered = r[1], follow = r[2] || [], balances = r[3] || [];
    var todo = open.filter(function (o) { return o.status === "nouvelle" || o.status === "injoignable"; });
    var toShip = open.filter(function (o) { return o.status === "confirmee"; });
    var onRoad = open.filter(function (o) { return o.status === "en_livraison"; });
    var dToday = delivered.filter(function (o) { return (o.delivered_at || "").slice(0, 10) === today(); });
    var caMonth = delivered.reduce(function (s, o) { return s + o.total_amount; }, 0);
    var low = S.variants.filter(function (v) {
      var p = product(v.product_id);
      return v.active && p && p.active && (S.uni === "all" || p.univers === S.uni) && v.stock <= v.alert_threshold;
    });
    var due = balances.reduce(function (s, b) { return s + Math.max(b.due, 0); }, 0);

    var k = '<div class="kpis">' +
      kpi("À confirmer", todo.length, "nouvelles + injoignables", "#/commandes", todo.length ? "bad" : "") +
      kpi("À expédier", toShip.length, "confirmées, sans livreur parti", "#/commandes") +
      kpi("En livraison", onRoad.length, money(onRoad.reduce(function (s, o) { return s + toCollect(o); }, 0)) + " à encaisser", "#/commandes") +
      kpi("Livrées aujourd'hui", dToday.length, money(dToday.reduce(function (s, o) { return s + o.total_amount; }, 0)), "#/commandes", "ok");
    if (can("gerant", "closeuse")) k += kpi("Relances du jour", follow.length, "prospects à recontacter", "#/prospects", follow.length ? "bad" : "");
    if (can("gerant")) k += kpi("CA du mois", money(caMonth), delivered.length + " commandes livrées", "#/finances");
    if (can("gerant")) k += kpi("Chez les livreurs", money(due), "argent à récupérer", "#/livreurs", due ? "bad" : "");
    if (can("gerant", "stock")) k += kpi("Stock bas", low.length, "variantes sous le seuil", "#/stock", low.length ? "bad" : "");
    k += "</div>";

    var lists = '<div class="grid-2"><div><div class="section-title"><h2>Commandes à confirmer</h2><a href="#/commandes">Tout voir</a></div>' +
      orderList(todo.slice(0, 8), "Aucune commande en attente 👍") + "</div>";
    if (can("gerant", "closeuse")) {
      lists += '<div><div class="section-title"><h2>Relances du jour</h2><a href="#/prospects">Tout voir</a></div>' +
        contactList(follow.slice(0, 8), "Aucune relance prévue aujourd'hui") + "</div>";
    } else {
      lists += '<div><div class="section-title"><h2>Stock bas</h2><a href="#/stock">Stock</a></div>' + lowList(low) + "</div>";
    }
    lists += "</div>";
    if (can("gerant") && low.length) lists += '<div class="section-title"><h2>Stock bas</h2><a href="#/stock">Stock</a></div>' + lowList(low);

    el.innerHTML = header("Bonjour " + firstName(S.me.full_name || ""), "", true) + k + lists;
    bindUni(el);
    bindOrderList(el, open);
    bindContactList(el, follow);
    S.refresh = function () { if (S.view === "tableau") vDashboard(el); };
  }
  function kpi(label, value, sub, href, mod) {
    var tag = href ? 'a href="' + href + '"' : "div";
    return "<" + tag + ' class="kpi' + (mod ? " kpi--" + mod : "") + '"><div class="kpi__label">' + esc(label) +
      '</div><div class="kpi__value">' + esc(value) + '</div><div class="kpi__sub">' + esc(sub || "") + "</div></" + (href ? "a" : "div") + ">";
  }
  function lowList(low) {
    if (!low.length) return '<div class="empty">Aucune alerte de stock</div>';
    return '<div class="card"><table class="t"><tbody>' + low.map(function (v) {
      return "<tr><td>" + esc(variantName(v.id)) + '</td><td class="num ' + (v.stock <= 0 ? "stock-out" : "stock-low") + '">' + v.stock + "</td></tr>";
    }).join("") + "</tbody></table></div>";
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

  function orderList(list, emptyText) {
    if (!list.length) return '<div class="empty">' + esc(emptyText || "Aucune commande") + "</div>";
    return '<div class="list">' + list.map(function (o) {
      return '<button type="button" class="item item--' + o.univers + '" data-order="' + o.id + '">' +
        '<div class="item__top"><span class="item__title">' + esc(o.customer_name || "Sans nom") + " " + pill(o.status, ST[o.status]) +
        '</span><span class="item__amount">' + money(o.total_amount) + "</span></div>" +
        '<div class="item__meta"><span>' + esc(fphone(o.phone)) + "</span><span>" + esc(o.city) + "</span><span>" + esc(itemsText(o)) + "</span></div>" +
        '<div class="item__meta"><span>' + esc(o.ref) + "</span><span>" + fdatetime(o.created_at) + "</span>" +
        (o.mode === "expedition" ? "<span>📦 Expédition</span>" : "") +
        (o.courier_id ? "<span>➜ " + esc(memberName(o.courier_id)) + "</span>" : "") +
        (o.delivery_date ? "<span>🚚 " + fday(o.delivery_date) + "</span>" : "") + "</div></button>";
    }).join("") + "</div>";
  }
  function bindOrderList(root, list) {
    $$("[data-order]", root).forEach(function (b) {
      b.addEventListener("click", function () {
        var o = list.find(function (x) { return x.id === b.getAttribute("data-order"); });
        if (o) orderDetail(o.id);
      });
    });
  }

  async function vOrders(el) {
    var st = vstate("commandes", { tab: "todo", search: "", days: "30" });
    var newBtn = can("gerant", "closeuse") ? '<button class="btn btn--primary" id="new-order">+ Nouvelle commande</button>' : "";
    el.innerHTML = header("Commandes", newBtn, true) +
      '<div class="tabs" id="otabs"></div>' +
      '<div class="toolbar"><input type="search" id="osearch" placeholder="Rechercher : nom, téléphone, référence…" value="' + esc(st.search) + '">' +
      '<select id="odays" style="width:auto"><option value="7">7 derniers jours</option><option value="30">30 derniers jours</option><option value="90">90 derniers jours</option><option value="365">12 mois</option></select>' +
      (can("gerant") ? '<button class="btn" id="oexport">Exporter (CSV)</button>' : "") + "</div>" +
      '<div id="olist"><p class="muted">Chargement…</p></div>';
    bindUni(el);
    $("#odays").value = st.days;
    if ($("#new-order")) $("#new-order").addEventListener("click", function () { orderForm(); });
    $("#osearch").addEventListener("input", debounce(function (e) { st.search = e.target.value.trim(); load(); }, 300));
    $("#odays").addEventListener("change", function (e) { st.days = e.target.value; load(); });
    if ($("#oexport")) $("#oexport").addEventListener("click", function () { exportOrders(st.days); });

    var counts = {};
    async function loadCounts() {
      var rows = await q(uniEq(S.sb.from("orders").select("status").in("status", OPEN)));
      counts = {}; rows.forEach(function (r) { counts[r.status] = (counts[r.status] || 0) + 1; });
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
        var closed = !tab[2] || tab[2].some(function (x) { return OPEN.indexOf(x) < 0; });
        if (closed) query = query.gte("created_at", new Date(Date.now() - int(st.days) * 864e5).toISOString());
      }
      var list = await q(query.order("created_at", { ascending: false }).limit(400));
      $("#olist").innerHTML = (s ? '<p class="muted small">' + list.length + " résultat(s) pour « " + esc(s) + " » (tous statuts)</p>" : "") +
        orderList(list, "Aucune commande ici");
      bindOrderList($("#olist"), list);
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
    var body = '<p>' + pill(o.univers, UNI_SHORT[o.univers]) + " " + pill(o.status, ST[o.status]) + ' <span class="muted small">' + esc(o.ref) + "</span></p>" +
      '<dl class="kv">' +
      "<dt>Client</dt><dd><b>" + esc(o.customer_name || "—") + "</b></dd>" +
      '<dt>Téléphone</dt><dd><a href="tel:+225' + digits(o.phone) + '">' + esc(fphone(o.phone)) + "</a></dd>" +
      "<dt>Lieu</dt><dd>" + esc(o.city) + (o.address ? " — " + esc(o.address) : "") + "</dd>" +
      "<dt>Articles</dt><dd>" + esc(itemsText(o)) + "</dd>" +
      "<dt>Montant</dt><dd><b>" + money(o.total_amount) + "</b>" + (o.prepaid_amount ? " (avance " + money(o.prepaid_amount) + ", reste " + money(toCollect(o)) + ")" : "") + "</dd>" +
      "<dt>Livraison</dt><dd>" + (o.mode === "expedition" ? "Expédition intérieur" : "Abidjan") +
      (o.courier_id ? " · " + esc(memberName(o.courier_id)) : "") + (o.delivery_date ? " · le " + fday(o.delivery_date) : "") +
      (can("gerant") && o.delivery_cost ? " · frais " + money(o.delivery_cost) : "") + "</dd>" +
      (o.status === "livree" ? "<dt>Encaissé</dt><dd>" + money(o.collected_amount) + "</dd>" : "") +
      "<dt>Source</dt><dd>" + esc(SOURCES[o.source] || o.source) + (o.utm ? ' <span class="muted small">' + esc(o.utm) + "</span>" : "") + "</dd>" +
      (o.notes ? "<dt>Remarques</dt><dd>" + esc(o.notes) + "</dd>" : "") +
      "</dl>" +
      '<h3 style="margin-top:16px">Historique</h3><ul class="timeline">' + ev.map(function (e) {
        return "<li>" + fdatetime(e.at) + " — " + (e.status ? "<b>" + esc(ST[e.status] || e.status) + "</b> " : "") + esc(e.note) +
          (e.by_user ? ' <span class="muted">(' + esc(memberName(e.by_user)) + ")</span>" : "") + "</li>";
      }).join("") + "</ul>";

    var actions = [];
    if (can("gerant", "closeuse")) {
      if (o.status === "nouvelle" || o.status === "injoignable") {
        actions.push({ label: "Confirmée ✓", cls: "btn--ok", onClick: function () { return statusFlow(o, "confirmee"); } });
        if (o.status === "nouvelle") actions.push({ label: "Injoignable", onClick: function () { return statusFlow(o, "injoignable"); } });
      }
      if (o.status === "confirmee") actions.push({ label: "Envoyer en livraison ➜", cls: "btn--primary", onClick: function () { return statusFlow(o, "en_livraison"); } });
      if (o.status === "en_livraison") {
        actions.push({ label: "Livrée ✓", cls: "btn--ok", onClick: function () { return statusFlow(o, "livree"); } });
        actions.push({ label: "Retour", cls: "btn--bad", onClick: function () { return statusFlow(o, "retour"); } });
      }
      if (OPEN.indexOf(o.status) >= 0 && o.status !== "en_livraison") actions.push({ label: "Annuler", cls: "btn--bad", onClick: function () { return statusFlow(o, "annulee"); } });
      if (["retour", "annulee", "livree"].indexOf(o.status) >= 0) actions.push({ label: "Changer le statut", onClick: function () { return statusFlow(o, null); } });
      actions.push({ label: "Modifier", onClick: function () { orderForm(o); } });
    }
    actions.push({ label: "WhatsApp", cls: "btn--wa", href: waUrl(o.phone, orderMsg(o)) });
    if (can("gerant")) actions.push({ label: "Supprimer", cls: "btn--bad", onClick: async function () {
      if (!(await confirmBox("Supprimer définitivement la commande " + o.ref + " ? Le stock sera remis si besoin.", "Supprimer"))) return;
      await q(S.sb.rpc("delete_order", { p_order: o.id })); toast("Commande supprimée"); afterChange();
    } });
    openModal({ title: "Commande " + o.ref, body: body, actions: actions });
  }

  function afterChange() { closeModal(); loadRefs().then(function () { if (S.refresh) S.refresh(); }).catch(fail); }

  // Changement de statut avec les infos utiles (livreur, montant encaissé, motif…)
  function statusFlow(o, status) {
    var body = '<div class="form">';
    if (status === null) {
      body += '<label class="f">Nouveau statut<select name="status">' + opts(ST, o.status) + "</select></label>";
    }
    if (status === "en_livraison") {
      var cs = couriers();
      if (!cs.length) body += '<p class="note">Aucun livreur actif. Ajoutez-en un dans « Équipe » (rôle Livreur).</p>';
      body += '<label class="f">Livreur<select name="courier">' + cs.map(function (c) {
        return '<option value="' + c.id + '"' + (c.id === o.courier_id ? " selected" : "") + ">" + esc(c.full_name || c.email) + "</option>";
      }).join("") + "</select></label>" +
        '<div class="row"><label class="f">Frais de livraison (payés au livreur)<input name="delivery_cost" inputmode="numeric" value="' + (o.delivery_cost || store("lastDeliveryCost") || "") + '"></label>' +
        '<label class="f">Date de livraison<input type="date" name="delivery_date" value="' + (o.delivery_date || today()) + '"></label></div>';
    }
    if (status === "livree") {
      body += '<label class="f">Montant encaissé<input name="collected" inputmode="numeric" value="' + toCollect(o) + '"></label>';
    }
    body += '<label class="f">Commentaire (facultatif)<input name="note" placeholder="' + (status === "retour" ? "Motif du retour" : status === "annulee" ? "Motif de l'annulation" : "") + '"></label></div>';
    return new Promise(function (resolve) {
      openModal({
        title: status ? ST[status] + " — " + o.ref : "Changer le statut — " + o.ref, body: body,
        actions: [
          { label: "Annuler", onClick: function () { orderDetail(o.id); resolve(); } },
          { label: "Valider", cls: "btn--primary", onClick: async function () {
            var f = formData($("#modal-body"));
            var params = { p_order: o.id, p_status: status || f.status, p_note: f.note || "" };
            if (status === "en_livraison") {
              if (!f.courier) { toast("Choisissez un livreur", true); return; }
              params.p_courier = f.courier; params.p_delivery_cost = int(f.delivery_cost); params.p_delivery_date = f.delivery_date || null;
              store("lastDeliveryCost", int(f.delivery_cost));
            }
            if (status === "livree") params.p_collected = int(f.collected);
            await q(S.sb.rpc("set_order_status", params));
            toast("Statut mis à jour : " + ST[params.p_status]);
            afterChange(); resolve();
          } }
        ]
      });
    });
  }

  // Formulaire de commande (création / modification)
  function orderForm(o, prefill) {
    o = o || null;
    var d = o || Object.assign({ univers: S.uni !== "all" ? S.uni : (store("lastUni") || "bienetre"), source: "whatsapp", mode: "abidjan", order_items: [] }, prefill || {});
    var lines = (d.order_items || []).map(function (i) { return { variant_id: i.variant_id, qty: i.qty, unit_price: i.unit_price }; });
    var totalManual = !!o;

    var body = '<form class="form" id="of" novalidate>' +
      '<div class="seg">' + ["bienetre", "passion"].map(function (u) {
        return '<label><input type="radio" name="univers" value="' + u + '"' + (d.univers === u ? " checked" : "") + "><span>" + UNI[u] + "</span></label>";
      }).join("") + "</div>" +
      '<div class="row"><label class="f">Nom du client<input name="customer_name" value="' + esc(d.customer_name || "") + '" autocomplete="off"></label>' +
      '<label class="f">Téléphone *<input name="phone" inputmode="tel" value="' + esc(d.phone ? fphone(d.phone) : "") + '" placeholder="07 00 00 00 00"></label></div>' +
      '<div class="row"><label class="f">Ville / commune<input name="city" value="' + esc(d.city || "") + '"></label>' +
      '<label class="f">Source<select name="source">' + opts(SOURCES, d.source) + "</select></label></div>" +
      '<label class="f">Adresse / repère<input name="address" value="' + esc(d.address || "") + '"></label>' +
      '<fieldset><legend>Articles (article · quantité · prix unitaire)</legend><div id="offer-box"></div><div class="lines" id="lines"></div>' +
      '<p style="margin:8px 0 0"><button type="button" class="btn btn--sm" id="add-line">+ Ajouter un article</button></p></fieldset>' +
      '<div class="row"><label class="f">Montant total (FCFA)<input name="total_amount" inputmode="numeric" value="' + (d.total_amount || "") + '"></label>' +
      '<label class="f">Livraison<select name="mode"><option value="abidjan">Abidjan (livreur)</option><option value="expedition"' + (d.mode === "expedition" ? " selected" : "") + '>Expédition intérieur</option></select></label></div>' +
      '<div class="row" id="prepaid-row"><label class="f">Avance Mobile Money reçue<input name="prepaid_amount" inputmode="numeric" value="' + (d.prepaid_amount || "") + '"></label>' +
      '<label class="f">Frais de transport / livraison<input name="delivery_cost" inputmode="numeric" value="' + (d.delivery_cost || "") + '"></label></div>' +
      '<div class="row"><label class="f">Date de livraison souhaitée<input type="date" name="delivery_date" value="' + (d.delivery_date || "") + '"></label>' +
      (o ? '<span></span>' : '<label class="f">Statut<select name="status"><option value="nouvelle">Nouvelle (à confirmer)</option><option value="confirmee">Déjà confirmée</option></select></label>') + "</div>" +
      '<label class="f">Remarques<textarea name="notes">' + esc(d.notes || "") + "</textarea></label></form>";

    openModal({
      title: o ? "Modifier " + o.ref : "Nouvelle commande", body: body,
      actions: [
        { label: "Annuler", onClick: function () { o ? orderDetail(o.id) : closeModal(); } },
        { label: o ? "Enregistrer" : "Créer la commande", cls: "btn--primary", onClick: submit }
      ],
      mount: mount
    });

    function uni() { return ($("#of input[name=univers]:checked") || {}).value || "bienetre"; }
    function uniVariants() {
      return S.variants.filter(function (v) { var p = product(v.product_id); return p && p.univers === uni() && (v.active && p.active || lines.some(function (l) { return l.variant_id === v.id; })); });
    }
    function variantOptions(sel) {
      var byP = {};
      uniVariants().forEach(function (v) { (byP[v.product_id] = byP[v.product_id] || []).push(v); });
      var h = '<option value="">— Choisir —</option>';
      Object.keys(byP).forEach(function (pid) {
        var p = product(pid);
        h += '<optgroup label="' + esc(p.name) + '">' + byP[pid].map(function (v) {
          return '<option value="' + v.id + '"' + (v.id === sel ? " selected" : "") + ">" + esc(v.label) + " (stock " + v.stock + ")</option>";
        }).join("") + "</optgroup>";
      });
      return h;
    }
    function renderOffers() {
      var offers = S.offers.filter(function (x) { return x.univers === uni() && x.active; });
      var box = $("#offer-box");
      if (!offers.length) { box.innerHTML = ""; return; }
      box.innerHTML = '<div class="seg" style="margin-bottom:8px">' + offers.map(function (x) {
        return '<label><input type="radio" name="offer_id" value="' + x.id + '"' + (d.offer_id === x.id ? " checked" : "") + "><span>" + esc(x.name) + "<small>" + money(x.price) + "</small></span></label>";
      }).join("") + '<label><input type="radio" name="offer_id" value=""' + (!d.offer_id ? " checked" : "") + "><span>Autre</span></label></div>";
      $$("input[name=offer_id]", box).forEach(function (r) {
        r.addEventListener("change", function () {
          d.offer_id = r.value;
          var x = S.offers.find(function (y) { return y.id === r.value; });
          if (!x) return;
          var unit = Math.round(x.price / x.qty);
          var keep = lines.filter(function (l) { return l.variant_id; });
          lines = [];
          for (var i = 0; i < x.qty; i++) lines.push({ variant_id: keep[i] ? keep[i].variant_id : "", qty: 1, unit_price: unit });
          // corrige l'arrondi sur la dernière ligne
          lines[lines.length - 1].unit_price = x.price - unit * (x.qty - 1);
          $("#of [name=total_amount]").value = x.price; totalManual = false;
          renderLines();
        });
      });
    }
    function renderLines() {
      $("#lines").innerHTML = lines.map(function (l, i) {
        return '<div class="line" data-i="' + i + '"><select data-k="variant_id" aria-label="Article">' + variantOptions(l.variant_id) + "</select>" +
          '<input data-k="qty" inputmode="numeric" value="' + l.qty + '" aria-label="Quantité" title="Quantité">' +
          '<input data-k="unit_price" inputmode="numeric" value="' + l.unit_price + '" aria-label="Prix unitaire (FCFA)" title="Prix unitaire (FCFA)">' +
          '<button type="button" class="x" aria-label="Retirer">×</button></div>';
      }).join("") || '<p class="muted small" style="margin:0">Aucun article. ' + (S.offers.some(function (x) { return x.univers === uni(); }) ? "Choisissez une offre ou ajoutez un article." : "Ajoutez un article.") + "</p>";
      $$("#lines .line").forEach(function (row) {
        var i = +row.getAttribute("data-i");
        $$("[data-k]", row).forEach(function (inp) {
          inp.addEventListener("change", function () {
            var k = inp.getAttribute("data-k");
            lines[i][k] = k === "variant_id" ? inp.value : int(inp.value);
            if (k === "variant_id" && !lines[i].unit_price) {
              var v = variant(inp.value), p = v && product(v.product_id);
              lines[i].unit_price = p ? p.sale_price : 0; renderLines();
            }
            autoTotal();
          });
        });
        $(".x", row).addEventListener("click", function () { lines.splice(i, 1); renderLines(); autoTotal(); });
      });
    }
    function autoTotal() {
      if (totalManual) return;
      $("#of [name=total_amount]").value = lines.reduce(function (s, l) { return s + (l.qty || 0) * (l.unit_price || 0); }, 0) || "";
    }
    function toggleMode() { $("#prepaid-row").querySelector("label").hidden = $("#of [name=mode]").value !== "expedition"; }
    function mount() {
      renderOffers(); renderLines(); toggleMode();
      $$("#of input[name=univers]").forEach(function (r) {
        r.addEventListener("change", function () { lines = []; d.offer_id = ""; totalManual = false; $("#of [name=total_amount]").value = ""; renderOffers(); renderLines(); });
      });
      $("#add-line").addEventListener("click", function () { lines.push({ variant_id: "", qty: 1, unit_price: 0 }); renderLines(); });
      $("#of [name=total_amount]").addEventListener("input", function () { totalManual = true; });
      $("#of [name=mode]").addEventListener("change", toggleMode);
      // client déjà connu ?
      $("#of [name=phone]").addEventListener("change", async function (e) {
        var p = digits(e.target.value);
        if (p.length < 8 || $("#of [name=customer_name]").value) return;
        var c = await q(S.sb.from("contacts").select("name, city").eq("phone", p).limit(1)).catch(function () { return []; });
        if (c[0]) { $("#of [name=customer_name]").value = c[0].name; if (!$("#of [name=city]").value) $("#of [name=city]").value = c[0].city; toast("Client déjà connu : " + c[0].name); }
      });
    }
    async function submit() {
      var f = formData($("#of"));
      if (digits(f.phone).length < 8) { toast("Numéro de téléphone invalide", true); return; }
      var items = lines.filter(function (l) { return l.variant_id; });
      if (!items.length || items.length !== lines.length) { toast("Choisissez un article (ou une pointure) pour chaque ligne", true); return; }
      var payload = {
        id: o ? o.id : null, univers: f.univers, customer_name: f.customer_name, phone: digits(f.phone), city: f.city, address: f.address,
        source: f.source, mode: f.mode, offer_id: f.offer_id || null, total_amount: int(f.total_amount),
        prepaid_amount: f.mode === "expedition" ? int(f.prepaid_amount) : 0, delivery_cost: int(f.delivery_cost),
        courier_id: o ? o.courier_id : null, status: o ? o.status : f.status, notes: f.notes, delivery_date: f.delivery_date || null,
        items: items.map(function (l) { return { variant_id: l.variant_id, qty: Math.max(int(l.qty), 1), unit_price: int(l.unit_price) }; })
      };
      store("lastUni", f.univers);
      var id = await q(S.sb.rpc("save_order", { p: payload }));
      toast(o ? "Commande modifiée" : "Commande créée");
      await loadRefs(); if (S.refresh) S.refresh();
      orderDetail(id);
    }
  }

  async function exportOrders(days) {
    var list = await q(uniEq(S.sb.from("orders").select("*, order_items(variant_id, qty, unit_price)"))
      .gte("created_at", new Date(Date.now() - int(days) * 864e5).toISOString()).order("created_at")).catch(fail);
    if (!list) return;
    csv("commandes-" + today() + ".csv",
      ["Date", "Réf", "Univers", "Statut", "Client", "Téléphone", "Ville", "Adresse", "Articles", "Montant", "Avance", "Encaissé", "Frais livraison", "Livreur", "Mode", "Source", "Remarques"],
      list.map(function (o) {
        return [fdatetime(o.created_at), o.ref, UNI_SHORT[o.univers], ST[o.status], o.customer_name, fphone(o.phone), o.city, o.address, itemsText(o),
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
    ["relance", "À relancer"], ["nouveau", "Nouveaux"], ["interesse", "Intéressés"], ["panier", "Paniers non confirmés"],
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
  function contactList(list, emptyText) {
    if (!list.length) return '<div class="empty">' + esc(emptyText || "Aucun contact") + "</div>";
    var t = today();
    return '<div class="list">' + list.map(function (c) {
      var late = c.next_followup && c.next_followup < t;
      return '<button type="button" class="item item--' + c.univers + '" data-contact="' + c.id + '">' +
        '<div class="item__top"><span class="item__title">' + esc(c.name || "Sans nom") + " " + pill(isOldClient(c) ? "panier" : c.stage, isOldClient(c) ? "Ancien client" : STAGES[c.stage]) + "</span>" +
        (c.next_followup ? '<span class="small nowrap" style="color:' + (late ? "var(--bad)" : c.next_followup === t ? "var(--warn)" : "var(--muted)") + '">Relance ' + (c.next_followup === t ? "aujourd'hui" : fday(c.next_followup)) + "</span>" : "") + "</div>" +
        '<div class="item__meta"><span>' + esc(fphone(c.phone)) + "</span><span>" + esc(c.city) + "</span><span>" + esc(SOURCES[c.source] || c.source) + "</span>" +
        (c.orders_delivered ? "<span>" + c.orders_delivered + " commande(s) livrée(s)</span>" : "") + "</div>" +
        (c.interest || c.notes ? '<div class="item__meta"><span>' + esc((c.interest ? c.interest + " · " : "") + c.notes).slice(0, 140) + "</span></div>" : "") +
        "</button>";
    }).join("") + "</div>";
  }
  function bindContactList(root, list) {
    $$("[data-contact]", root).forEach(function (b) {
      b.addEventListener("click", function () {
        var c = list.find(function (x) { return x.id === b.getAttribute("data-contact"); });
        if (c) contactDetail(c);
      });
    });
  }

  async function vContacts(el) {
    var st = vstate("prospects", { tab: "relance", search: "" });
    el.innerHTML = header("Prospects & clients", '<button class="btn btn--primary" id="new-contact">+ Nouveau contact</button>', true) +
      '<div class="tabs" id="ctabs"></div>' +
      '<div class="toolbar"><input type="search" id="csearch" placeholder="Rechercher : nom, téléphone, ville…" value="' + esc(st.search) + '">' +
      (can("gerant") ? '<button class="btn" id="cexport">Exporter (CSV)</button>' : "") + "</div>" +
      '<div id="clist"><p class="muted">Chargement…</p></div>';
    bindUni(el);
    $("#new-contact").addEventListener("click", function () { contactForm(); });
    var all = [];
    function render() {
      var counts = {};
      CONTACT_TABS.forEach(function (t) { counts[t[0]] = all.filter(contactFilter(t[0])).length; });
      $("#ctabs").innerHTML = CONTACT_TABS.map(function (t) {
        return '<button type="button" class="tab' + (st.tab === t[0] ? " is-on" : "") + '" data-tab="' + t[0] + '">' + t[1] + '<span class="n">' + counts[t[0]] + "</span></button>";
      }).join("");
      $$("#ctabs .tab").forEach(function (b) { b.addEventListener("click", function () { st.tab = b.getAttribute("data-tab"); render(); }); });
      var s = st.search.toLowerCase(), sd = s.replace(/\D/g, "");
      var list = s ? all.filter(function (c) {
        return (c.name || "").toLowerCase().indexOf(s) >= 0 || (c.city || "").toLowerCase().indexOf(s) >= 0 || (sd.length >= 3 && c.phone.indexOf(sd) >= 0);
      }) : all.filter(contactFilter(st.tab));
      if (st.tab === "relance" && !s) list.sort(function (a, b) { return a.next_followup < b.next_followup ? -1 : 1; });
      $("#clist").innerHTML = contactList(list.slice(0, 300), s ? "Aucun résultat" : "Personne dans cette liste");
      bindContactList($("#clist"), list);
    }
    async function load() {
      all = await q(uniEq(S.sb.from("contacts").select("*")).order("updated_at", { ascending: false }).limit(5000));
      render();
    }
    $("#csearch").addEventListener("input", debounce(function (e) { st.search = e.target.value.trim(); render(); }, 200));
    if ($("#cexport")) $("#cexport").addEventListener("click", function () {
      csv("contacts-" + today() + ".csv", ["Nom", "Téléphone", "Ville", "Univers", "Étape", "Source", "Intérêt", "Prochaine relance", "Commandes livrées", "Notes"],
        all.map(function (c) { return [c.name, fphone(c.phone), c.city, UNI_SHORT[c.univers], STAGES[c.stage], SOURCES[c.source] || c.source, c.interest, c.next_followup, c.orders_delivered, c.notes]; }));
    });
    await load();
    S.refresh = function () { if (S.view === "prospects") load().catch(fail); };
  }

  async function contactDetail(c) {
    var orders = await q(S.sb.from("orders").select("*, order_items(variant_id, qty, unit_price)").eq("contact_id", c.id).order("created_at", { ascending: false })).catch(function () { return []; });
    var body = "<p>" + pill(c.univers, UNI_SHORT[c.univers]) + " " + pill(c.stage, STAGES[c.stage]) + (isOldClient(c) ? " " + pill("panier", "Ancien client") : "") + "</p>" +
      '<dl class="kv"><dt>Téléphone</dt><dd><a href="tel:+225' + digits(c.phone) + '">' + esc(fphone(c.phone)) + "</a></dd>" +
      "<dt>Ville</dt><dd>" + esc(c.city || "—") + "</dd><dt>Source</dt><dd>" + esc(SOURCES[c.source] || c.source) + "</dd>" +
      (c.interest ? "<dt>Intéressé par</dt><dd>" + esc(c.interest) + "</dd>" : "") +
      "<dt>Contact depuis</dt><dd>" + fdate(c.created_at) + "</dd>" +
      (c.next_followup ? "<dt>Prochaine relance</dt><dd>" + fday(c.next_followup) + "</dd>" : "") +
      (c.notes ? "<dt>Notes</dt><dd style=\"white-space:pre-wrap\">" + esc(c.notes) + "</dd>" : "") + "</dl>" +
      '<h3 style="margin-top:16px">Relance faite ? Prochaine relance dans…</h3><div class="btn-row" id="fu">' +
      [[1, "1 jour"], [3, "3 jours"], [7, "1 semaine"], [30, "1 mois"], [0, "Plus de relance"]].map(function (x) {
        return '<button type="button" class="btn btn--sm" data-days="' + x[0] + '">' + x[1] + "</button>";
      }).join("") + "</div>" +
      '<h3 style="margin-top:16px">Commandes (' + orders.length + ")</h3>" + orderList(orders, "Aucune commande pour l'instant");
    openModal({
      title: c.name || fphone(c.phone), body: body,
      actions: [
        { label: "WhatsApp", cls: "btn--wa", href: waUrl(c.phone, contactMsg(c)) },
        { label: "Modifier", onClick: function () { contactForm(c); } },
        { label: "+ Commande", cls: "btn--primary", onClick: function () {
          orderForm(null, { univers: c.univers, customer_name: c.name, phone: c.phone, city: c.city, source: c.source });
        } }
      ],
      mount: function (b) {
        bindOrderList(b, orders);
        $$("#fu [data-days]", b).forEach(function (btn) {
          btn.addEventListener("click", async function () {
            var n = +btn.getAttribute("data-days");
            var patch = { next_followup: n ? addDays(today(), n) : null, updated_at: new Date().toISOString() };
            if (c.stage === "nouveau") patch.stage = "interesse";
            await q(S.sb.from("contacts").update(patch).eq("id", c.id)).catch(fail);
            toast(n ? "Relance prévue le " + fday(patch.next_followup) : "Relance retirée");
            closeModal(); if (S.refresh) S.refresh();
          });
        });
      }
    });
  }

  function contactForm(c) {
    var d = c || { univers: S.uni !== "all" ? S.uni : (store("lastUni") || "bienetre"), stage: "nouveau", source: "whatsapp", next_followup: addDays(today(), 1) };
    var body = '<form class="form" id="cf" novalidate>' +
      '<div class="seg">' + ["bienetre", "passion"].map(function (u) {
        return '<label><input type="radio" name="univers" value="' + u + '"' + (d.univers === u ? " checked" : "") + "><span>" + UNI[u] + "</span></label>";
      }).join("") + "</div>" +
      '<div class="row"><label class="f">Nom<input name="name" value="' + esc(d.name || "") + '"></label>' +
      '<label class="f">Téléphone *<input name="phone" inputmode="tel" value="' + esc(d.phone ? fphone(d.phone) : "") + '"></label></div>' +
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
    if (c && can("gerant")) actions.push({ label: "Supprimer", cls: "btn--bad", onClick: async function () {
      if (!(await confirmBox("Supprimer ce contact ? Ses commandes sont conservées.", "Supprimer"))) return;
      await q(S.sb.from("contacts").delete().eq("id", c.id)); toast("Contact supprimé"); if (S.refresh) S.refresh();
    } });
    actions.push({ label: "Enregistrer", cls: "btn--primary", onClick: async function () {
      var f = formData($("#cf"));
      if (digits(f.phone).length < 8) { toast("Numéro de téléphone invalide", true); return; }
      var row = {
        univers: f.univers, name: f.name, phone: digits(f.phone), city: f.city, source: f.source, stage: f.stage,
        next_followup: f.next_followup || null, interest: f.interest, notes: f.notes, updated_at: new Date().toISOString()
      };
      if ("assigned_to" in f) row.assigned_to = f.assigned_to || null;
      if (c) await q(S.sb.from("contacts").update(row).eq("id", c.id));
      else {
        var exist = await q(S.sb.from("contacts").select("id").eq("univers", row.univers).eq("phone", row.phone).limit(1));
        if (exist.length) { toast("Ce numéro existe déjà dans " + UNI_SHORT[row.univers] + " : utilisez la recherche.", true); return; }
        await q(S.sb.from("contacts").insert(row));
      }
      store("lastUni", f.univers);
      toast("Contact enregistré"); closeModal(); if (S.refresh) S.refresh();
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
    el.innerHTML = header("Mes livraisons") +
      '<div class="kpis">' + kpi("À livrer", todo.length, money(todo.reduce(function (s, o) { return s + toCollect(o); }, 0)) + " à encaisser") +
      kpi("Livrées aujourd'hui", done.filter(function (o) { return o.status === "livree"; }).length, money(done.reduce(function (s, o) { return s + (o.collected_amount || 0); }, 0)) + " encaissés", null, "ok") +
      (bal ? kpi("À reverser", money(Math.max(bal.due, 0)), "après vos frais (" + money(bal.fees) + ")", null, bal.due > 0 ? "bad" : "") : "") + "</div>" +
      '<div class="list">' + (todo.map(function (o) {
        return '<div class="card"><div class="item__top"><span class="item__title">' + esc(o.customer_name || "Client") + " " + pill(o.status, ST[o.status]) + '</span><span class="item__amount">' + money(toCollect(o)) + "</span></div>" +
          '<p style="margin:6px 0">📍 <b>' + esc(o.city) + "</b> " + esc(o.address) + "<br>🛒 " + esc(itemsText(o)) +
          (o.delivery_date ? "<br>🚚 " + fday(o.delivery_date) : "") + (o.notes ? "<br>📝 " + esc(o.notes) : "") +
          '<br><span class="muted small">' + esc(o.ref) + "</span></p>" +
          '<div class="btn-row"><a class="btn btn--sm" href="tel:+225' + digits(o.phone) + '">📞 Appeler</a>' +
          '<a class="btn btn--sm btn--wa" target="_blank" rel="noopener" href="' + waUrl(o.phone, "Bonjour " + firstName(o.customer_name) + ", c'est le livreur " + brandName(o.univers) + ". Je suis en route pour votre commande. Où puis-je vous trouver ?") + '">WhatsApp</a>' +
          (o.status === "confirmee" ? '<button class="btn btn--sm btn--primary" data-go="' + o.id + '" data-st="en_livraison">Je pars livrer</button>' :
            '<button class="btn btn--sm btn--ok" data-go="' + o.id + '" data-st="livree">Livrée ✓</button><button class="btn btn--sm btn--bad" data-go="' + o.id + '" data-st="retour">Retour</button>') +
          "</div></div>";
      }).join("") || '<div class="empty">Aucune livraison en attente 👍</div>') + "</div>" +
      (done.length ? '<div class="section-title"><h2>Terminées aujourd\'hui</h2></div>' + orderList(done) : "");
    $$("[data-go]", el).forEach(function (b) {
      b.addEventListener("click", function () {
        var o = todo.find(function (x) { return x.id === b.getAttribute("data-go"); });
        courierStatus(o, b.getAttribute("data-st"));
      });
    });
    S.refresh = function () { if (S.view === "livraisons") vMyDeliveries(el).catch(fail); };
  }
  function courierStatus(o, status) {
    var body = '<div class="form"><p><b>' + esc(o.customer_name) + "</b> — " + esc(itemsText(o)) + "</p>" +
      (status === "livree" ? '<label class="f">Montant encaissé<input name="collected" inputmode="numeric" value="' + toCollect(o) + '"></label>' : "") +
      '<label class="f">' + (status === "retour" ? "Motif du retour *" : "Commentaire (facultatif)") + '<input name="note"></label></div>';
    openModal({
      title: ST[status], body: body,
      actions: [
        { label: "Annuler", onClick: closeModal },
        { label: "Valider", cls: "btn--primary", onClick: async function () {
          var f = formData($("#modal-body"));
          if (status === "retour" && !f.note) { toast("Indiquez le motif du retour", true); return; }
          var p = { p_order: o.id, p_status: status, p_note: f.note || "" };
          if (status === "livree") p.p_collected = int(f.collected);
          await q(S.sb.rpc("set_order_status", p));
          toast(ST[status]); closeModal(); if (S.refresh) S.refresh();
        } }
      ]
    });
  }

  /* ========================================================================
     STOCK
     ======================================================================== */
  async function vStock(el) {
    var prods = S.products.filter(function (p) { return S.uni === "all" || p.univers === S.uni; });
    var showCost = can("gerant", "stock");
    var totalValue = 0;
    var html = header("Stock", '<button class="btn" id="mv-hist">Historique</button><button class="btn" id="mv-in">+ Entrée de stock</button><button class="btn btn--primary" id="new-prod">+ Produit</button>', true);
    if (!prods.length) html += '<div class="empty">Aucun produit. Créez vos sacoches avec « + Produit » (une variante par couleur).</div>';
    prods.forEach(function (p) {
      var vs = S.variants.filter(function (v) { return v.product_id === p.id; });
      var qty = vs.reduce(function (s, v) { return s + Math.max(v.stock, 0); }, 0);
      var cost = S.costs[p.id] || 0; totalValue += qty * cost;
      html += '<div class="card"' + (p.active ? "" : ' style="opacity:.6"') + '><div class="item__top"><div><b>' + esc(p.name) + "</b> " + pill(p.univers, UNI_SHORT[p.univers]) + (p.active ? "" : " " + pill("annulee", "Archivé")) +
        '<div class="muted small">Prix de vente ' + money(p.sale_price) + (showCost ? " · coût d'achat " + money(cost) + " · valeur du stock " + money(qty * cost) : "") + "</div></div>" +
        '<button class="btn btn--sm" data-edit="' + p.id + '">Modifier</button></div>' +
        '<div class="scroll-x"><table class="t" style="margin-top:8px"><thead><tr><th>' + (p.univers === "bienetre" ? "Pointure" : "Variante") + '</th><th class="num">Stock</th><th class="num">Seuil</th><th></th></tr></thead><tbody>' +
        vs.map(function (v) {
          var cls = v.stock <= 0 ? "stock-out" : v.stock <= v.alert_threshold ? "stock-low" : "";
          return "<tr" + (v.active ? "" : ' style="opacity:.5"') + "><td>" + esc(v.label) + '</td><td class="num ' + cls + '">' + v.stock + '</td><td class="num">' + v.alert_threshold +
            '</td><td class="right nowrap"><button class="btn btn--sm" data-in="' + v.id + '">+ Entrée</button> <button class="btn btn--sm" data-inv="' + v.id + '">Inventaire</button></td></tr>';
        }).join("") +
        '<tr class="total"><td>Total</td><td class="num">' + qty + "</td><td></td><td></td></tr></tbody></table></div></div>";
    });
    if (showCost && prods.length) html += '<p class="muted small" style="margin-top:10px">Valeur totale du stock (au coût d\'achat) : <b>' + money(totalValue) + "</b></p>";

    if (can("gerant")) {
      var offers = S.offers.filter(function (x) { return S.uni === "all" || x.univers === S.uni; });
      html += '<div class="section-title"><h2>Offres / packs</h2><button class="btn btn--sm" id="new-offer">+ Offre</button></div>' +
        (offers.length ? '<div class="card"><table class="t"><thead><tr><th>Offre</th><th>Univers</th><th class="num">Quantité</th><th class="num">Prix</th><th></th></tr></thead><tbody>' +
          offers.map(function (x) {
            return "<tr" + (x.active ? "" : ' style="opacity:.5"') + "><td>" + esc(x.name) + "</td><td>" + esc(UNI_SHORT[x.univers]) + '</td><td class="num">' + x.qty + '</td><td class="num">' + money(x.price) +
              '</td><td class="right"><button class="btn btn--sm" data-offer="' + x.id + '">Modifier</button></td></tr>';
          }).join("") + "</tbody></table></div>" : '<div class="empty">Aucune offre</div>');
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

  function productForm(p) {
    var d = p || { univers: S.uni !== "all" ? S.uni : "passion", active: true, sale_price: "" };
    var vs = p ? S.variants.filter(function (v) { return v.product_id === p.id; }) : [];
    var body = '<form class="form" id="pf" novalidate>' +
      (p ? "" : '<div class="seg">' + ["passion", "bienetre"].map(function (u) {
        return '<label><input type="radio" name="univers" value="' + u + '"' + (d.univers === u ? " checked" : "") + "><span>" + UNI[u] + "</span></label>";
      }).join("") + "</div>") +
      '<label class="f">Nom du produit *<input name="name" value="' + esc(d.name || "") + '" placeholder="ex. Sacoche bandoulière cuir"></label>' +
      '<div class="row"><label class="f">Prix de vente unitaire (FCFA)<input name="sale_price" inputmode="numeric" value="' + (d.sale_price || "") + '"></label>' +
      '<label class="f">Coût d\'achat unitaire (FCFA)<input name="cost_price" inputmode="numeric" value="' + (p ? (S.costs[p.id] || "") : "") + '"></label></div>' +
      '<p class="muted small" style="margin:-4px 0 0">Coût d\'achat = prix fournisseur + transport + douane, ramené à une pièce. Il n\'est visible que par le gérant et le stock.</p>' +
      (vs.length ? '<fieldset><legend>Variantes existantes</legend><table class="t"><thead><tr><th>Nom</th><th class="num">Seuil d\'alerte</th><th>Active</th></tr></thead><tbody>' +
        vs.map(function (v) {
          return '<tr data-v="' + v.id + '"><td><input data-k="label" value="' + esc(v.label) + '"></td><td style="width:110px"><input data-k="alert_threshold" inputmode="numeric" value="' + v.alert_threshold +
            '"></td><td style="width:60px"><input type="checkbox" data-k="active"' + (v.active ? " checked" : "") + ' style="width:auto;min-height:0"></td></tr>';
        }).join("") + "</tbody></table></fieldset>" : "") +
      '<label class="f">' + (p ? "Ajouter des variantes" : "Variantes *") + ' <span class="muted">(une par ligne : couleurs pour les sacoches, pointures pour les semelles)</span><textarea name="new_variants" placeholder="Noir\nMarron\nCamel"></textarea></label>' +
      '<label class="f">Seuil d\'alerte par défaut<input name="alert" inputmode="numeric" value="3"></label>' +
      (p ? '<label class="check"><input type="checkbox" name="active"' + (d.active ? " checked" : "") + "> Produit actif (décochez pour l'archiver)</label>" : "") +
      "</form>";
    openModal({
      title: p ? "Modifier " + p.name : "Nouveau produit", body: body,
      actions: [
        { label: "Annuler", onClick: closeModal },
        { label: "Enregistrer", cls: "btn--primary", onClick: async function () {
          var f = formData($("#pf"));
          var labels = f.new_variants.split(/\n|,/).map(function (s) { return s.trim(); }).filter(Boolean);
          if (!f.name) { toast("Donnez un nom au produit", true); return; }
          if (!p && !labels.length) { toast("Ajoutez au moins une variante (ex. une couleur)", true); return; }
          var pid;
          if (p) {
            pid = p.id;
            await q(S.sb.from("products").update({ name: f.name, sale_price: int(f.sale_price), active: !!f.active }).eq("id", pid));
            var rows = $$("#pf tr[data-v]");
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
          toast("Produit enregistré"); afterChange();
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
      '<label class="f">Note<input name="note" placeholder="ex. arrivage Chine n°3"></label></div>' +
      (can("gerant") ? '<fieldset><legend>Dépense</legend><label class="check"><input type="checkbox" name="expense"> Enregistrer aussi le montant payé dans les dépenses (achat de marchandise)</label>' +
        '<label class="f" style="margin-top:8px">Montant total payé (FCFA)<input name="amount" inputmode="numeric"></label></fieldset>' : "") +
      "</form>";
    openModal({
      title: "Entrée de stock", body: body,
      actions: [
        { label: "Annuler", onClick: closeModal },
        { label: "Ajouter au stock", cls: "btn--primary", onClick: async function () {
          var f = formData($("#sf"));
          var n = int(f.qty);
          if (!f.variant || n <= 0) { toast("Indiquez une quantité positive", true); return; }
          await q(S.sb.rpc("stock_move", { p_variant: f.variant, p_qty: n, p_kind: "entree", p_note: f.note }));
          if (f.expense && int(f.amount) > 0) {
            var p = product(variant(f.variant).product_id);
            await q(S.sb.from("expenses").insert({ univers: p.univers, category: "achat_stock", amount: int(f.amount), at: today(), label: n + " × " + variantName(f.variant) + (f.note ? " — " + f.note : ""), created_by: S.me.id }));
          }
          toast("+" + n + " en stock"); afterChange();
        } }
      ]
    });
  }
  function inventory(v) {
    var body = '<form class="form" id="inf"><p>' + esc(variantName(v.id)) + " — stock actuel dans l'application : <b>" + v.stock + "</b></p>" +
      '<label class="f">Quantité réellement comptée *<input name="real" inputmode="numeric" value="' + v.stock + '"></label>' +
      '<label class="f">Motif<input name="note" placeholder="ex. inventaire mensuel, article abîmé…"></label></form>';
    openModal({
      title: "Inventaire", body: body,
      actions: [
        { label: "Annuler", onClick: closeModal },
        { label: "Corriger le stock", cls: "btn--primary", onClick: async function () {
          var f = formData($("#inf"));
          if (f.real === "") { toast("Indiquez la quantité comptée", true); return; }
          var diff = int(f.real) - v.stock;
          if (!diff) { closeModal(); return; }
          await q(S.sb.rpc("stock_move", { p_variant: v.id, p_qty: diff, p_kind: "ajustement", p_note: f.note || "Inventaire" }));
          toast("Stock corrigé (" + (diff > 0 ? "+" : "") + diff + ")"); afterChange();
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
          return "<tr><td class=\"nowrap\">" + fdatetime(m.at) + "</td><td>" + esc(variantName(m.variant_id)) + "</td><td>" + K[m.kind] + '</td><td class="num ' + (m.qty < 0 ? "neg" : "pos") + '">' +
            (m.qty > 0 ? "+" : "") + m.qty + "</td><td>" + esc(m.note) + (m.by_user ? ' <span class="muted">· ' + esc(memberName(m.by_user)) + "</span>" : "") + "</td></tr>";
        }).join("") + "</tbody></table></div>" : '<div class="empty">Aucun mouvement</div>',
      actions: [{ label: "Fermer", onClick: closeModal }]
    });
  }
  function offerForm(x) {
    var d = x || { univers: S.uni !== "all" ? S.uni : "bienetre", qty: 2, price: "", active: true };
    var body = '<form class="form" id="xf">' +
      '<div class="row"><label class="f">Univers<select name="univers">' + opts(UNI, d.univers) + "</select></label>" +
      '<label class="f">Nom de l\'offre<input name="name" value="' + esc(d.name || "") + '" placeholder="ex. 3 paires"></label></div>' +
      '<div class="row"><label class="f">Nombre d\'articles<input name="qty" inputmode="numeric" value="' + d.qty + '"></label>' +
      '<label class="f">Prix total (FCFA)<input name="price" inputmode="numeric" value="' + d.price + '"></label></div>' +
      '<label class="check"><input type="checkbox" name="active"' + (d.active ? " checked" : "") + "> Offre active</label></form>";
    openModal({
      title: x ? "Modifier l'offre" : "Nouvelle offre", body: body,
      actions: [
        { label: "Annuler", onClick: closeModal },
        { label: "Enregistrer", cls: "btn--primary", onClick: async function () {
          var f = formData($("#xf"));
          if (!f.name || int(f.qty) < 1) { toast("Nom et quantité obligatoires", true); return; }
          var row = { univers: f.univers, name: f.name, qty: int(f.qty), price: int(f.price), active: !!f.active };
          if (x) await q(S.sb.from("offers").update(row).eq("id", x.id));
          else {
            var p = S.products.find(function (pp) { return pp.univers === f.univers; });
            row.product_id = p ? p.id : null;
            await q(S.sb.from("offers").insert(row));
          }
          toast("Offre enregistrée"); afterChange();
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
    var html = header("Livreurs & encaissements") +
      '<p class="muted small">Dû = argent encaissé sur les commandes livrées − frais de livraison du livreur (qu\'il garde) − versements déjà reçus.</p>';
    if (!bal.length) html += '<div class="empty">Aucun livreur. Demandez-lui de créer un compte, puis donnez-lui le rôle « Livreur » dans Équipe.</div>';
    else html += '<div class="card scroll-x"><table class="t"><thead><tr><th>Livreur</th><th class="num">En cours</th><th class="num">Livrées</th><th class="num">Retours</th><th class="num">Taux</th>' +
      '<th class="num">Encaissé</th><th class="num">Frais</th><th class="num">Versé</th><th class="num">Dû</th><th></th></tr></thead><tbody>' +
      bal.map(function (b) {
        return "<tr><td><b>" + esc(b.full_name || memberName(b.courier_id)) + "</b>" + (b.phone ? '<br><a class="small" href="tel:+225' + digits(b.phone) + '">' + esc(fphone(b.phone)) + "</a>" : "") + '</td><td class="num">' + b.in_progress +
          '</td><td class="num">' + b.delivered + '</td><td class="num">' + b.returned + '</td><td class="num">' + pct(b.delivered, b.delivered + b.returned) +
          '</td><td class="num">' + money(b.collected) + '</td><td class="num">' + money(b.fees) + '</td><td class="num">' + money(b.remitted) +
          '</td><td class="num ' + (b.due > 0 ? "neg" : "") + '"><b>' + money(b.due) + '</b></td><td class="right nowrap"><button class="btn btn--sm btn--primary" data-rem="' + b.courier_id + '">Versement reçu</button> ' +
          '<button class="btn btn--sm" data-run="' + b.courier_id + '">Ses livraisons</button></td></tr>';
      }).join("") + "</tbody></table></div>";
    html += '<div class="section-title"><h2>Derniers versements</h2></div>' +
      (rem.length ? '<div class="card scroll-x"><table class="t"><thead><tr><th>Date</th><th>Livreur</th><th class="num">Montant</th><th>Note</th><th>Reçu par</th></tr></thead><tbody>' +
        rem.map(function (x) {
          return "<tr><td>" + fday(x.at) + "</td><td>" + esc(memberName(x.courier_id)) + '</td><td class="num">' + money(x.amount) + "</td><td>" + esc(x.note) + "</td><td>" + esc(memberName(x.received_by)) + "</td></tr>";
        }).join("") + "</tbody></table></div>" : '<div class="empty">Aucun versement enregistré</div>');
    el.innerHTML = html;
    $$("[data-rem]", el).forEach(function (b) {
      b.addEventListener("click", function () {
        var c = bal.find(function (x) { return x.courier_id === b.getAttribute("data-rem"); });
        openModal({
          title: "Versement de " + (c.full_name || "livreur"),
          body: '<form class="form" id="rf"><p>Montant dû actuellement : <b>' + money(c.due) + "</b></p>" +
            '<div class="row"><label class="f">Montant reçu *<input name="amount" inputmode="numeric" value="' + Math.max(c.due, 0) + '"></label>' +
            '<label class="f">Date<input type="date" name="at" value="' + today() + '"></label></div>' +
            '<label class="f">Note<input name="note" placeholder="ex. Wave, espèces…"></label></form>',
          actions: [
            { label: "Annuler", onClick: closeModal },
            { label: "Enregistrer", cls: "btn--primary", onClick: async function () {
              var f = formData($("#rf"));
              if (int(f.amount) <= 0) { toast("Montant invalide", true); return; }
              await q(S.sb.from("remittances").insert({ courier_id: c.courier_id, amount: int(f.amount), at: f.at || today(), note: f.note, received_by: S.me.id }));
              toast("Versement enregistré"); closeModal(); vCouriers(el);
            } }
          ]
        });
      });
    });
    $$("[data-run]", el).forEach(function (b) {
      b.addEventListener("click", async function () {
        var list = await q(S.sb.from("orders").select("*, order_items(variant_id, qty, unit_price)").eq("courier_id", b.getAttribute("data-run")).in("status", ["confirmee", "en_livraison"]).order("created_at")).catch(fail);
        if (!list) return;
        openModal({ title: "Livraisons en cours — " + memberName(b.getAttribute("data-run")), body: orderList(list, "Aucune livraison en cours"), actions: [{ label: "Fermer", onClick: closeModal }], mount: function (m) { bindOrderList(m, list); } });
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
    function rate(u) {
      var list = created.filter(function (o) { return u === "total" || o.univers === u; });
      var conf = list.filter(function (o) { return ["confirmee", "en_livraison", "livree", "retour"].indexOf(o.status) >= 0; }).length;
      return { n: list.length, conf: conf };
    }
    var T = R.total, rt = rate("total");
    var delivOK = T.n, ret = returns.filter(function (o) { return inMonth(o.updated_at, st.month); }).length;

    var months = []; for (var i = 5; i >= 0; i--) months.push(shiftMonth(st.month, -i));
    var nets = months.map(function (m) { return compute(m).total.net; });
    var maxAbs = Math.max.apply(null, nets.map(Math.abs).concat([1]));

    var html = header("Finances", '<input type="month" id="fmonth" value="' + st.month + '" style="width:auto"><button class="btn btn--primary" id="new-exp">+ Dépense</button>') +
      '<div class="kpis">' +
      kpi("Chiffre d'affaires", money(T.ca), T.n + " commandes livrées") +
      kpi("Bénéfice net", money(T.net), "marge nette " + pct(T.net, T.ca), null, T.net < 0 ? "bad" : "ok") +
      kpi("ROAS", T.pub ? (T.ca / T.pub).toFixed(1).replace(".", ",") + " ×" : "—", "CA ÷ dépenses pub (" + money(T.pub) + ")") +
      kpi("Coût pub / livraison", T.n ? money(T.pub / T.n) : "—", "pub ÷ commandes livrées") +
      kpi("Commandes reçues", rt.n, "créées ce mois-ci") +
      kpi("Taux de confirmation", pct(rt.conf, rt.n), rt.conf + " confirmées") +
      kpi("Taux de livraison", pct(delivOK, delivOK + ret), ret + " retour(s)") +
      kpi("Achats de stock", money(T.achats), "trésorerie (hors bénéfice)") + "</div>" +
      '<div class="card scroll-x"><h2>Compte de résultat — ' + monthLabel(st.month) + '</h2><table class="t"><thead><tr><th></th>' +
      cols.map(function (c) { return '<th class="num">' + c[1] + "</th>"; }).join("") + "</tr></thead><tbody>" +
      row("Chiffre d'affaires (livré)", "ca") + row("Coût d'achat des produits vendus", "cogs", true) + row("<b>Marge brute</b>", "marge") +
      row("Livraison & transport", "liv", true) + row("Publicité", "pub", true) + row("Autres dépenses", "autres", true) +
      row("Bénéfice net", "net", false, "total") + "</tbody></table>" +
      '<p class="muted small" style="margin:8px 0 0">Les achats de marchandise ne sont pas déduits ici : ils sont comptés via le coût d\'achat des produits vendus. Les dépenses « Commun » (salaires, téléphone…) ne sont réparties sur aucun produit.</p></div>' +
      '<div class="card"><h2>Bénéfice net — 6 derniers mois</h2><div class="bars">' + months.map(function (m, i) {
        var h = Math.round(Math.abs(nets[i]) / maxAbs * 100);
        return '<div class="bar"><b>' + num(Math.round(nets[i] / 1000)) + 'k</b><i class="' + (nets[i] < 0 ? "neg" : "") + '" style="height:' + h + '%"></i>' + monthLabel(m) + "</div>";
      }).join("") + "</div></div>" +
      '<div class="section-title"><h2>Dépenses de ' + monthLabel(st.month) + "</h2></div>";
    var monthExp = expenses.filter(function (e) { return inMonth(e.at, st.month); });
    html += monthExp.length ? '<div class="card scroll-x"><table class="t"><thead><tr><th>Date</th><th>Catégorie</th><th>Univers</th><th>Libellé</th><th class="num">Montant</th><th></th></tr></thead><tbody>' +
      monthExp.map(function (e) {
        return "<tr><td>" + fday(e.at) + "</td><td>" + esc(EXP[e.category]) + "</td><td>" + esc(UNI_SHORT[e.univers]) + "</td><td>" + esc(e.label) + '</td><td class="num">' + money(e.amount) +
          '</td><td class="right"><button class="btn btn--sm btn--bad" data-del="' + e.id + '" aria-label="Supprimer">×</button></td></tr>';
      }).join("") + "</tbody></table></div>" : '<div class="empty">Aucune dépense ce mois-ci. Pensez à saisir vos dépenses pub chaque semaine pour suivre le ROAS.</div>';
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
        { label: "Enregistrer", cls: "btn--primary", onClick: async function () {
          var f = formData($("#ef"));
          if (int(f.amount) <= 0) { toast("Montant invalide", true); return; }
          await q(S.sb.from("expenses").insert({ at: f.at || today(), amount: int(f.amount), category: f.category, univers: f.univers, label: f.label, created_by: S.me.id }));
          toast("Dépense enregistrée"); closeModal(); if (done) done();
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
      (pending.length ? '<p class="note">' + pending.length + " compte(s) en attente : choisissez un rôle et cochez « Actif » pour leur donner accès.</p>" : "") +
      '<div class="card scroll-x"><h2>Équipe</h2><p class="muted small">Chaque membre crée son compte depuis la page de connexion (« Créer un compte »), puis vous lui attribuez un rôle ici.</p>' +
      '<table class="t"><thead><tr><th>Membre</th><th>Rôle</th><th>Actif</th><th></th></tr></thead><tbody>' +
      S.members.map(function (m) {
        return '<tr data-m="' + m.id + '"><td><b>' + esc(m.full_name || "—") + '</b><br><span class="muted small">' + esc(m.email) + "</span></td>" +
          '<td><select data-k="role">' + opts(ROLES, m.role, "— Aucun —") + "</select></td>" +
          '<td><input type="checkbox" data-k="active"' + (m.active ? " checked" : "") + ' style="width:auto;min-height:0"></td>' +
          '<td class="right"><button class="btn btn--sm" data-save>Enregistrer</button></td></tr>';
      }).join("") + "</tbody></table>" +
      '<p class="muted small">Closeuse : commandes et prospects (sans coûts ni finances). Livreur : uniquement ses livraisons. Stock : produits et entrées de stock.</p></div>';

    html += '<div class="card"><h2>Marques</h2><form class="form" id="bf">' + ["bienetre", "passion"].map(function (u) {
      var b = S.brands[u] || {};
      return '<fieldset><legend>' + UNI[u] + '</legend><div class="row3"><label class="f">Nom<input name="' + u + '_name" value="' + esc(b.name || "") + '"></label>' +
        '<label class="f">WhatsApp<input name="' + u + '_whatsapp" value="' + esc(b.whatsapp || "") + '" placeholder="225 07…"></label>' +
        '<label class="f">Site<input name="' + u + '_site_url" value="' + esc(b.site_url || "") + '" placeholder="https://…"></label></div></fieldset>';
    }).join("") + '<div><button type="button" class="btn btn--primary" id="save-brands">Enregistrer les marques</button></div></form></div>';

    html += '<div class="card"><h2>Recevoir les commandes d\'un site</h2>' +
      '<p class="small">Dans le fichier <code>assets/js/config.js</code> du site, renseignez :</p>' +
      '<pre class="small" style="white-space:pre-wrap;word-break:break-all;background:#F2EEE8;padding:10px;border-radius:8px">supabaseUrl: "' + esc(CFG.supabaseUrl) + '",\nsupabaseAnonKey: "' + esc(CFG.supabaseAnonKey) + '",\nunivers: "bienetre"   // "passion" pour le site des sacoches</pre>' +
      '<p class="muted small">Chaque commande validée sur le site arrive alors ici dans « À confirmer », et le client est ajouté aux prospects.</p></div>';
    el.innerHTML = html;
    $$("tr[data-m]", el).forEach(function (tr) {
      $("[data-save]", tr).addEventListener("click", async function () {
        var roleV = $("[data-k=role]", tr).value || null, active = $("[data-k=active]", tr).checked;
        if (active && !roleV) { toast("Choisissez un rôle avant d'activer", true); return; }
        await q(S.sb.rpc("set_member", { p_user: tr.getAttribute("data-m"), p_role: roleV, p_active: active })).catch(fail);
        toast("Membre mis à jour"); vSettings(el).catch(fail);
      });
    });
    $("#save-brands").addEventListener("click", async function () {
      var f = formData($("#bf"));
      var rows = ["bienetre", "passion"].map(function (u) { return { univers: u, name: f[u + "_name"] || UNI_SHORT[u], whatsapp: f[u + "_whatsapp"], site_url: f[u + "_site_url"] }; });
      await q(S.sb.from("brands").upsert(rows)).catch(fail);
      await loadRefs(); toast("Marques enregistrées");
    });
  }

  /* ========================================================================
     MON COMPTE
     ======================================================================== */
  function vAccount(el) {
    el.innerHTML = header("Mon compte") +
      '<div class="card"><form class="form" id="af"><p class="muted">' + esc(S.me.email) + " · " + esc(ROLES[S.me.role] || "") + "</p>" +
      '<div class="row"><label class="f">Nom complet<input name="full_name" value="' + esc(S.me.full_name) + '"></label>' +
      '<label class="f">Téléphone<input name="phone" inputmode="tel" value="' + esc(S.me.phone) + '"></label></div>' +
      '<div><button type="button" class="btn btn--primary" id="save-me">Enregistrer</button></div></form></div>' +
      '<div class="card"><form class="form" id="pwf"><h2>Changer de mot de passe</h2><label class="f">Nouveau mot de passe (8 caractères min.)<input type="password" name="pw" autocomplete="new-password"></label>' +
      '<div><button type="button" class="btn" id="save-pw">Changer</button></div></form></div>' +
      '<p><button class="btn btn--bad" id="logout2">Se déconnecter</button></p>';
    $("#save-me").addEventListener("click", async function () {
      var f = formData($("#af"));
      await q(S.sb.from("profiles").update({ full_name: f.full_name, phone: digits(f.phone) }).eq("id", S.me.id)).catch(fail);
      S.me.full_name = f.full_name; S.me.phone = digits(f.phone); toast("Enregistré");
    });
    $("#save-pw").addEventListener("click", async function () {
      var pw = formData($("#pwf")).pw;
      if (pw.length < 8) { toast("8 caractères minimum", true); return; }
      var res = await S.sb.auth.updateUser({ password: pw });
      if (res.error) fail(res.error); else toast("Mot de passe changé");
    });
    $("#logout2").addEventListener("click", logout);
  }

  /* ========================================================================
     CONNEXION
     ======================================================================== */
  function authScreen(mode) {
    mode = mode || "login";
    var titles = { login: "Connexion", signup: "Créer un compte", forgot: "Mot de passe oublié", reset: "Nouveau mot de passe" };
    var f = "";
    if (mode === "signup") f += '<label class="f">Nom complet<input name="full_name" required autocomplete="name"></label>';
    if (mode !== "reset") f += '<label class="f">E-mail<input type="email" name="email" required autocomplete="email"></label>';
    if (mode !== "forgot") f += '<label class="f">Mot de passe<input type="password" name="password" required autocomplete="' + (mode === "login" ? "current-password" : "new-password") + '"></label>';
    $("#root").innerHTML = '<div class="auth"><div class="card"><div class="logo">' + esc(APP) + "</div><h1>" + titles[mode] + '</h1><p class="muted small">Gestion des commandes, du stock et des finances.</p>' +
      '<form class="form" id="authf" novalidate>' + f + '<button class="btn btn--primary" type="submit">' + (mode === "login" ? "Se connecter" : mode === "signup" ? "Créer mon compte" : mode === "forgot" ? "Recevoir le lien" : "Enregistrer") + "</button></form>" +
      '<p class="small" style="margin-top:14px">' +
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
          if (!res.error && !res.data.session) { toast("Compte créé. Ouvrez l'e-mail de confirmation, puis connectez-vous."); authScreen("login"); return; }
        }
        if (mode === "forgot") {
          res = await S.sb.auth.resetPasswordForEmail(d.email, { redirectTo: location.origin + location.pathname });
          if (!res.error) { toast("Si ce compte existe, un lien vous a été envoyé par e-mail."); authScreen("login"); return; }
        }
        if (mode === "reset") {
          if (d.password.length < 8) throw new Error("Mot de passe : 8 caractères minimum");
          res = await S.sb.auth.updateUser({ password: d.password });
          if (!res.error) { toast("Mot de passe enregistré"); S.recovering = false; start(); return; }
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
    $("#root").innerHTML = '<div class="auth"><div class="card"><div class="logo">' + esc(APP) + "</div><h1>Compte en attente</h1>" +
      "<p>Bonjour " + esc(S.me.full_name || S.me.email) + ", votre compte est créé. Le gérant doit maintenant vous attribuer un rôle.</p>" +
      '<div class="btn-row"><button class="btn btn--primary" id="recheck">Vérifier à nouveau</button><button class="btn" id="lo">Se déconnecter</button></div></div></div>';
    $("#recheck").addEventListener("click", start);
    $("#lo").addEventListener("click", logout);
  }

  function setupScreen() {
    $("#root").innerHTML = '<div class="setup"><h1>' + esc(APP) + ' — installation</h1>' +
      "<p>L'application n'est pas encore reliée à sa base de données. Suivez le guide <b>gestion/README.md</b> :</p><ol>" +
      "<li>Créez un projet gratuit sur <b>supabase.com</b>.</li>" +
      "<li>Dans <b>SQL Editor</b>, exécutez le fichier <code>gestion/supabase/schema.sql</code>.</li>" +
      "<li>Copiez l'URL du projet et la clé <b>anon public</b> dans <code>gestion/config.js</code>.</li>" +
      "<li>Rechargez cette page et créez votre compte : le premier compte devient gérant.</li></ol></div>";
  }

  async function logout() { await S.sb.auth.signOut(); S.me = null; authScreen("login"); }

  var channel;
  function realtime() {
    if (channel) return;
    var refresh = debounce(function () {
      Promise.resolve(S.view === "stock" ? loadRefs() : null).then(function () { if (S.refresh && !S.modalOpen) S.refresh(); }).catch(function () {});
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
    try { await loadRefs(); } catch (e) { fail(e); }
    shell(); route(); realtime();
  }

  /* ------------------------------------------------------------------------
     Démarrage
     ------------------------------------------------------------------------ */
  window.addEventListener("hashchange", function () { if (S.me && S.me.active && $("#view")) { closeModal(); route(); } });
  if ("serviceWorker" in navigator && location.protocol === "https:") navigator.serviceWorker.register("sw.js").catch(function () {});

  if (!CFG.supabaseUrl || !CFG.supabaseAnonKey || !window.supabase) { setupScreen(); return; }
  S.sb = window.supabase.createClient(CFG.supabaseUrl, CFG.supabaseAnonKey);
  S.recovering = /type=recovery/.test(location.hash);
  S.sb.auth.onAuthStateChange(function (ev) {
    if (ev === "PASSWORD_RECOVERY") { S.recovering = true; authScreen("reset"); }
    else if (ev === "SIGNED_IN" && !S.me && !S.recovering) setTimeout(start, 0);
  });
  start();
})();
