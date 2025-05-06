self.addEventListener("install", (event) => {
    event.waitUntil(
        caches.open("mon-app-cache").then((cache) => {
            return cache.addAll([
                "/",
                "/index.html",
                "/style.css",
                "/script.js",
                "/favicon.ico"
            ]);
        })
    );
    console.log("✅ Service worker installé !");
});

self.addEventListener("fetch", (event) => {
    event.respondWith(
        caches.match(event.request).then((response) => {
            return response || fetch(event.request);
        })
    );
});
