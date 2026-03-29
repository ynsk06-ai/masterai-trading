/* ============================================================
   Master AI Trading — Service Worker v7
   Strateji:
   - Statik dosyalar: Cache-First (offline çalışma)
   - Worker/API istekleri: Network-Only (güncel veri)
   - Safari/iOS uyumlu
   ============================================================ */

const CACHE_NAME     = 'masterai-v7';
const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 saat

const STATIC_ASSETS = [
  './',
  'index.html',
  'manifest.json',
  'https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;600;700&family=Space+Grotesk:wght@400;500;600;700&display=swap',
];

// ── KURULUM ──────────────────────────────────────────────────
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        // Her dosyayı ayrı ayrı dene (biri başarısız olsa diğerleri etkilenmesin)
        return Promise.allSettled(
          STATIC_ASSETS.map(url =>
            cache.add(url).catch(err => console.warn('Cache eklenemedi:', url, err))
          )
        );
      })
  );
  self.skipWaiting();
  console.log('🚀 Master AI SW v7 kuruldu');
});

// ── AKTİVASYON ───────────────────────────────────────────────
self.addEventListener('activate', event => {
  event.waitUntil(
    Promise.all([
      // Eski cache'leri sil
      caches.keys().then(keys =>
        Promise.all(
          keys
            .filter(key => key !== CACHE_NAME)
            .map(key => {
              console.log('Eski cache silindi:', key);
              return caches.delete(key);
            })
        )
      ),
      // Tüm client'ları hemen devral
      self.clients.claim(),
    ])
  );
  console.log('✅ Master AI SW v7 aktif');
});

// ── FETCH ─────────────────────────────────────────────────────
self.addEventListener('fetch', event => {
  const url = event.request.url;
  const { origin } = self.location;

  // 1. Dış istekler (Worker proxy, Yahoo, Telegram, Groq, Font)
  //    → Network-Only (Safari kritik: proxy isteklerini asla cache'leme)
  if (!url.startsWith(origin)) {
    event.respondWith(
      fetch(event.request).catch(() =>
        new Response(
          JSON.stringify({ error: 'Çevrimdışı — ağ bağlantısı yok' }),
          { status: 503, headers: { 'Content-Type': 'application/json' } }
        )
      )
    );
    return;
  }

  // 2. Kendi statik dosyalar → Cache-First + Network Fallback
  event.respondWith(
    caches.match(event.request).then(cachedRes => {
      if (cachedRes) {
        // Arka planda güncellemeyi dene
        const networkFetch = fetch(event.request).then(netRes => {
          if (netRes && netRes.status === 200) {
            const clone = netRes.clone();
            caches.open(CACHE_NAME).then(c => c.put(event.request, clone));
          }
          return netRes;
        }).catch(() => {});
        // Cache'i hemen döndür
        return cachedRes;
      }

      // Cache'de yok → Network'ten al ve cache'e ekle
      return fetch(event.request).then(netRes => {
        if (netRes && netRes.status === 200) {
          const clone = netRes.clone();
          caches.open(CACHE_NAME).then(c => c.put(event.request, clone));
        }
        return netRes;
      }).catch(() =>
        new Response('<h1>Çevrimdışı</h1><p>Lütfen internete bağlanın.</p>', {
          status: 503,
          headers: { 'Content-Type': 'text/html' },
        })
      );
    })
  );
});

// ── BACKGROUND SYNC ──────────────────────────────────────────
self.addEventListener('sync', event => {
  if (event.tag === 'masterai-refresh') {
    event.waitUntil(
      self.clients.matchAll().then(clients =>
        clients.forEach(c => c.postMessage({ type: 'REFRESH' }))
      )
    );
  }
});

// ── PUSH BİLDİRİMLERİ (gelecekte kullanılabilir) ─────────────
self.addEventListener('push', event => {
  if (!event.data) return;
  const data = event.data.json();
  event.waitUntil(
    self.registration.showNotification(data.title || 'Master AI', {
      body: data.body || '',
      icon: 'https://via.placeholder.com/192/ffd700/0a0e1a?text=MA',
      badge: 'https://via.placeholder.com/96/ffd700/0a0e1a?text=MA',
      vibrate: [100, 50, 100],
      data: { url: data.url || '/' },
    })
  );
});

self.addEventListener('notificationclick', event => {
  event.notification.close();
  event.waitUntil(
    clients.openWindow(event.notification.data?.url || '/')
  );
});

// ── PING / PONG ──────────────────────────────────────────────
self.addEventListener('message', event => {
  if (event.data?.type === 'PING') {
    event.source?.postMessage({ type: 'PONG', timestamp: Date.now() });
  }
  // Güncelleme talebi
  if (event.data?.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
