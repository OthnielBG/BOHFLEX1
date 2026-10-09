/* BOHFLEX — Service worker : rend le site installable et utilisable hors connexion (pages déjà visitées). */
var CACHE = "bohflex-v1";
var CORE = [
  "./", "index.html", "produit.html", "commander.html", "faq.html", "contact.html",
  "a-propos.html", "suivi.html", "mentions-legales.html",
  "assets/css/style.css", "assets/js/config.js", "assets/js/icons.js", "assets/js/main.js",
  "assets/img/semelle.svg", "assets/img/logo-mark.svg", "assets/img/favicon.svg",
  "assets/img/icon-192.png", "assets/img/icon-512.png", "manifest.webmanifest"
];

self.addEventListener("install", function (e) {
  e.waitUntil(caches.open(CACHE).then(function (c) { return c.addAll(CORE); }).then(function () { return self.skipWaiting(); }));
});

self.addEventListener("activate", function (e) {
  e.waitUntil(caches.keys().then(function (keys) {
    return Promise.all(keys.filter(function (k) { return k !== CACHE; }).map(function (k) { return caches.delete(k); }));
  }).then(function () { return self.clients.claim(); }));
});

// Réseau d'abord (contenu toujours à jour), cache en secours si la connexion coupe.
self.addEventListener("fetch", function (e) {
  var req = e.request;
  if (req.method !== "GET" || new URL(req.url).origin !== self.location.origin) return;
  e.respondWith(
    fetch(req).then(function (res) {
      var copy = res.clone();
      caches.open(CACHE).then(function (c) { c.put(req, copy); });
      return res;
    }).catch(function () {
      return caches.match(req, { ignoreSearch: true }).then(function (r) { return r || caches.match("index.html"); });
    })
  );
});
