/* GCM Registro Único — service worker
   Estratégia: network-first para o app (pega atualização quando há rede),
   com cache de reserva para funcionar offline. */
var CACHE = 'gcm-ro-v3';
var SHELL = ['./', './index.html', './manifest.json',
             './icons/icon-192.png', './icons/icon-512.png', './icons/icon-512-maskable.png',
             './icons/apple-touch-icon.png', './icons/favicon.png'];

self.addEventListener('install', function (e) {
  e.waitUntil(
    caches.open(CACHE).then(function (c) { return c.addAll(SHELL); }).then(function () { return self.skipWaiting(); })
  );
});

self.addEventListener('activate', function (e) {
  e.waitUntil(
    caches.keys().then(function (ks) {
      return Promise.all(ks.map(function (k) { if (k !== CACHE) return caches.delete(k); }));
    }).then(function () { return self.clients.claim(); })
  );
});

self.addEventListener('fetch', function (e) {
  var req = e.request;
  if (req.method !== 'GET') return;                     // envios ao Forms passam direto
  var url = new URL(req.url);
  if (url.origin !== location.origin) return;           // Tesseract/ViaCEP/OSM: sempre da rede

  e.respondWith(
    fetch(req).then(function (res) {
      var copy = res.clone();
      caches.open(CACHE).then(function (c) { c.put(req, copy); });
      return res;
    }).catch(function () {
      return caches.match(req).then(function (hit) {
        return hit || caches.match('./index.html');
      });
    })
  );
});
