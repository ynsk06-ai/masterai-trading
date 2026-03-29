/**
 * Master AI Trading — Cloudflare Worker v1.0
 * ============================================
 * Görevler:
 *  1. /yahoo  — Yahoo Finance proxy (CORS + header sahteciliği)
 *  2. /prices — Çoklu sembol fiyat sorgulama
 *  3. /xu100  — BIST100 anlık fiyat
 *  4. /kv/signals — KV'den sinyal okuma/yazma (arka plan kalıcılığı)
 *  5. /kv/settings — KV'den ayar okuma/yazma
 *  6. /kv/positions — Açık pozisyon okuma/yazma
 *
 * KV Namespace: MASTERAI_KV  (wrangler.toml'da tanımlanacak)
 */

const YAHOO_BASE = 'https://query1.finance.yahoo.com';

// ── Chrome/Windows UA — Yahoo'nun kabul ettiği header paketi ──────────────
function yahooHeaders(symbol = '') {
  return {
    'User-Agent':
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 ' +
      '(KHTML, like Gecko) Chrome/134.0.0.0 Safari/537.36',
    'Accept': 'application/json, text/plain, */*',
    'Accept-Language': 'tr-TR,tr;q=0.9,en-US;q=0.8,en;q=0.7',
    'Referer': `https://finance.yahoo.com/quote/${symbol}.IS`,
    'Origin': 'https://finance.yahoo.com',
    'Sec-Fetch-Mode': 'cors',
    'Sec-Fetch-Site': 'same-site',
    'Sec-Fetch-Dest': 'empty',
    'Cache-Control': 'no-cache',
    'Pragma': 'no-cache',
  };
}

// ── CORS başlıkları — tüm origin'lere izin ver ───────────────────────────
const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

function jsonRes(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json', ...CORS },
  });
}

function errRes(msg, status = 500) {
  return jsonRes({ error: msg }, status);
}

// ── Ana işleyici ──────────────────────────────────────────────────────────
export default {
  async fetch(request, env) {
    // OPTIONS preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: CORS });
    }

    const url = new URL(request.url);
    const path = url.pathname;

    try {
      // ── /yahoo ─────────────────────────────────────────────────────────
      if (path === '/yahoo') {
        const symbol   = url.searchParams.get('symbol') || '';
        const interval = url.searchParams.get('interval') || '60m';
        const range    = url.searchParams.get('range')    || '2y';

        if (!symbol) return errRes('symbol required', 400);

        const yUrl = `${YAHOO_BASE}/v8/finance/chart/${symbol}.IS?interval=${interval}&range=${range}`;
        const resp = await fetch(yUrl, { headers: yahooHeaders(symbol) });

        if (!resp.ok) {
          const text = await resp.text().catch(() => '');
          return errRes(`Yahoo HTTP ${resp.status}: ${text.slice(0, 200)}`, 502);
        }

        const data = await resp.json();
        return jsonRes(data);
      }

      // ── /prices ────────────────────────────────────────────────────────
      if (path === '/prices') {
        const symbols = (url.searchParams.get('symbols') || '')
          .split(',').map(s => s.trim()).filter(Boolean);

        const result = {};
        await Promise.all(
          symbols.map(async sym => {
            try {
              const yUrl = `${YAHOO_BASE}/v8/finance/chart/${sym}.IS?interval=1d&range=5d`;
              const resp = await fetch(yUrl, { headers: yahooHeaders(sym) });
              if (!resp.ok) return;
              const json = await resp.json();
              const q = json.chart?.result?.[0]?.indicators?.quote?.[0];
              const ts = json.chart?.result?.[0]?.timestamp;
              if (q && ts) {
                const idx = ts.length - 1;
                result[sym] = {
                  price:      q.close[idx],
                  change:     q.close[idx] - q.open[idx],
                  change_pct: ((q.close[idx] - q.open[idx]) / q.open[idx]) * 100,
                  high:       q.high[idx],
                  low:        q.low[idx],
                  volume:     q.volume[idx],
                };
              }
            } catch (_) {}
          })
        );
        return jsonRes(result);
      }

      // ── /xu100 ─────────────────────────────────────────────────────────
      if (path === '/xu100') {
        const yUrl = `${YAHOO_BASE}/v8/finance/chart/XU100.IS?interval=1d&range=5d`;
        const resp = await fetch(yUrl, { headers: yahooHeaders('XU100') });
        const data = await resp.json();
        const r = data.chart?.result?.[0];
        if (!r) return errRes('No data');
        const idx = r.timestamp.length - 1;
        const q   = r.indicators.quote[0];
        return jsonRes({
          price:      q.close[idx],
          change_pct: ((q.close[idx] - q.open[idx]) / q.open[idx]) * 100,
        });
      }

      // ── /scan (POST — placeholder) ─────────────────────────────────────
      if (path === '/scan' && request.method === 'POST') {
        return jsonRes({ success: true, message: 'Scan endpoint aktif (Worker Mode)' });
      }

      // ══════════════════════════════════════════════════════════════════
      //  KV ENDPOINTS  — Cloudflare Workers KV kalıcı depolama
      // ══════════════════════════════════════════════════════════════════

      // ── /kv/signals — GET: oku, POST: yaz ─────────────────────────────
      if (path === '/kv/signals') {
        if (!env.MASTERAI_KV) return errRes('KV namespace bağlı değil', 503);

        if (request.method === 'GET') {
          const userId = url.searchParams.get('uid') || 'default';
          const raw = await env.MASTERAI_KV.get(`signals:${userId}`);
          return jsonRes(raw ? JSON.parse(raw) : {});
        }

        if (request.method === 'POST') {
          const userId = url.searchParams.get('uid') || 'default';
          const body   = await request.json();
          // 1 yıl TTL — sinyaller silinmesin
          await env.MASTERAI_KV.put(`signals:${userId}`, JSON.stringify(body), {
            expirationTtl: 365 * 24 * 3600,
          });
          return jsonRes({ ok: true });
        }
      }

      // ── /kv/settings — GET: oku, POST: yaz ────────────────────────────
      if (path === '/kv/settings') {
        if (!env.MASTERAI_KV) return errRes('KV namespace bağlı değil', 503);

        if (request.method === 'GET') {
          const userId = url.searchParams.get('uid') || 'default';
          const raw = await env.MASTERAI_KV.get(`settings:${userId}`);
          return jsonRes(raw ? JSON.parse(raw) : {});
        }

        if (request.method === 'POST') {
          const userId = url.searchParams.get('uid') || 'default';
          const body   = await request.json();
          await env.MASTERAI_KV.put(`settings:${userId}`, JSON.stringify(body), {
            expirationTtl: 365 * 24 * 3600,
          });
          return jsonRes({ ok: true });
        }
      }

      // ── /kv/positions — GET: oku, POST: yaz ───────────────────────────
      if (path === '/kv/positions') {
        if (!env.MASTERAI_KV) return errRes('KV namespace bağlı değil', 503);

        if (request.method === 'GET') {
          const userId = url.searchParams.get('uid') || 'default';
          const raw = await env.MASTERAI_KV.get(`positions:${userId}`);
          return jsonRes(raw ? JSON.parse(raw) : {});
        }

        if (request.method === 'POST') {
          const userId = url.searchParams.get('uid') || 'default';
          const body   = await request.json();
          await env.MASTERAI_KV.put(`positions:${userId}`, JSON.stringify(body), {
            expirationTtl: 365 * 24 * 3600,
          });
          return jsonRes({ ok: true });
        }
      }

      // ── / root ─────────────────────────────────────────────────────────
      if (path === '/' || path === '') {
        return jsonRes({
          success: true,
          message: '🚀 Master AI Trading Worker v1.0 — AKTIF',
          endpoints: [
            'GET  /yahoo?symbol=XU100&interval=60m&range=2y',
            'GET  /prices?symbols=KONTR,THYAO,GARAN',
            'GET  /xu100',
            'GET  /kv/signals?uid=<cihaz-id>',
            'POST /kv/signals?uid=<cihaz-id>  body: {...sinyaller}',
            'GET  /kv/settings?uid=<cihaz-id>',
            'POST /kv/settings?uid=<cihaz-id>  body: {...ayarlar}',
            'GET  /kv/positions?uid=<cihaz-id>',
            'POST /kv/positions?uid=<cihaz-id>  body: {...pozisyonlar}',
          ],
        });
      }

      return errRes('404 Not found', 404);

    } catch (err) {
      console.error('Worker hata:', err);
      return errRes(`Worker hatası: ${err.message}`, 500);
    }
  },

  // ── Scheduled trigger — her 5 dakikada bir arka plan ping ─────────────
  async scheduled(event, env, ctx) {
    // Gelecekte buraya arka plan tarama / Telegram özet eklenebilir
    console.log('Scheduled cron tetiklendi:', event.cron);
  },
};
