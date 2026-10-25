/* カラーローラー Service Worker
   ネットワーク優先: 開けるときは常に最新を取得し、オフラインのときだけ保存済みを使う。
   このファイルは一度置いたら、以後は書き換えなくても自動で最新版が反映されます。 */
const CACHE = "color-roller-v1";

self.addEventListener("install", () => self.skipWaiting());

self.addEventListener("activate", (e) => {
  e.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)));
    await self.clients.claim();
  })());
});

self.addEventListener("fetch", (e) => {
  const req = e.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  if (url.origin !== location.origin) return;
  e.respondWith((async () => {
    try {
      const res = await fetch(new Request(req.url, { cache: "no-store" }));
      if (res && res.ok) {
        const copy = res.clone();
        caches.open(CACHE).then((c) => c.put(req, copy)).catch(() => {});
      }
      return res;
    } catch (err) {
      const hit = await caches.match(req, { ignoreSearch: true });
      if (hit) return hit;
      if (req.mode === "navigate") {
        const idx = (await caches.match("./")) || (await caches.match("index.html"));
        if (idx) return idx;
      }
      throw err;
    }
  })());
});
