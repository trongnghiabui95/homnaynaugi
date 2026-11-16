// Service worker: trang HTML lấy mạng trước, mất mạng thì dùng bản đã lưu; tài nguyên tĩnh dùng bản lưu và cập nhật ngầm.
const CACHE = "hnng-__BUILD_ID__";
const BASE = "__BASE__";
const PRECACHE = ["/", "/di-cho/", "/da-luu/", "/tim-kiem/", "/assets/style.css", "/assets/app.js", "/data/recipes.json", "/assets/icons/icon.svg"].map((p) => BASE + p);

self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(PRECACHE)).then(() => self.skipWaiting()));
});
self.addEventListener("activate", (e) => {
  e.waitUntil(caches.keys().then((keys) => Promise.all(keys.filter((k) => k.startsWith("hnng-") && k !== CACHE).map((k) => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener("fetch", (e) => {
  const req = e.request;
  const url = new URL(req.url);
  if (req.method !== "GET" || url.origin !== location.origin) return;
  if (req.mode === "navigate") {
    e.respondWith(fetch(req).then((res) => {
      const copy = res.clone();
      caches.open(CACHE).then((c) => c.put(req, copy));
      return res;
    }).catch(() => caches.match(req).then((r) => r || caches.match(BASE + "/"))));
    return;
  }
  e.respondWith(caches.match(req, { ignoreSearch: true }).then((cached) => {
    const net = fetch(req).then((res) => {
      if (res.ok) { const copy = res.clone(); caches.open(CACHE).then((c) => c.put(req, copy)); }
      return res;
    }).catch(() => cached);
    return cached || net;
  }));
});
