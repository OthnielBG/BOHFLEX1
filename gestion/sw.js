/* BOLOU and CO Gestion — service worker : rend l'application installable.
   Les données viennent toujours de Supabase (connexion internet nécessaire). */
var CACHE = "bco-gestion-v9";
var CORE = ["./", "index.html", "app.css", "app.js", "config.js", "manifest.webmanifest", "logo.svg", "badge.png", "icon-192.png"];

self.addEventListener("install", function (e) {
  e.waitUntil(caches.open(CACHE).then(function (c) { return c.addAll(CORE); }).then(function () { return self.skipWaiting(); }));
});
self.addEventListener("activate", function (e) {
  e.waitUntil(caches.keys().then(function (keys) {
    return Promise.all(keys.filter(function (k) { return k.indexOf("bco-gestion") === 0 && k !== CACHE; })
      .map(function (k) { return caches.delete(k); }));
  }).then(function () { return self.clients.claim(); }));
});
// Réseau d'abord, cache en secours (fichiers de l'application uniquement)
self.addEventListener("fetch", function (e) {
  var req = e.request;
  if (req.method !== "GET" || new URL(req.url).origin !== self.location.origin) return;
  e.respondWith(fetch(req).then(function (res) {
    var copy = res.clone();
    caches.open(CACHE).then(function (c) { c.put(req, copy); });
    return res;
  }).catch(function () { return caches.match(req, { ignoreSearch: true }); }));
});

// Toucher une notification « nouvelle commande » ouvre (ou ramène au premier plan) l'application
self.addEventListener("notificationclick", function (e) {
  e.notification.close();
  var url = (e.notification.data && e.notification.data.url) || "./#/commandes";
  e.waitUntil(self.clients.matchAll({ type: "window", includeUncontrolled: true }).then(function (list) {
    for (var i = 0; i < list.length; i++) {
      if (list[i].url.indexOf(self.registration.scope) === 0 && "focus" in list[i]) { list[i].navigate(url).catch(function () {}); return list[i].focus(); }
    }
    return self.clients.openWindow(url);
  }));
});

// Notification « push » envoyée par le serveur (nouvelle commande du site), même application fermée
self.addEventListener("push", function (e) {
  var d = {};
  try { d = e.data ? e.data.json() : {}; } catch (x) { d = { title: "BOLOU and CO", body: e.data ? e.data.text() : "" }; }
  e.waitUntil(self.clients.matchAll({ type: "window", includeUncontrolled: true }).then(function (list) {
    // Si l'application est déjà à l'écran, elle affiche sa propre bannière : pas de doublon
    var visible = list.some(function (c) { return c.visibilityState === "visible" && c.url.indexOf(self.registration.scope) === 0; });
    if (visible && !d.test) return;
    return self.registration.showNotification(d.title || "BOLOU and CO", {
      body: d.body || "", icon: "icon-192.png", badge: "badge.png", tag: d.tag || "bco", renotify: true,
      vibrate: [200, 100, 200], data: { url: self.registration.scope + "index.html" + (d.url || "#/commandes") }
    });
  }));
});
