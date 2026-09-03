/**
 * Live Exchange Rate Service with caching & resilient fallback.
 * Uses Argentina's DolarApi / Bluelytics public endpoints with local fallback.
 */

let cachedRates = null;
let lastFetchTime = 0;
const CACHE_TTL_MS = 10 * 60 * 1000; // 10 minutes

const FALLBACK_RATES = {
  oficial: { compra: 1000, venta: 1050 },
  blue: { compra: 1250, venta: 1280 },
  mep: { compra: 1220, venta: 1230 },
  lastUpdated: new Date().toISOString()
};

export async function fetchLiveExchangeRates(force = false) {
  const now = Date.now();
  if (!force && cachedRates && now - lastFetchTime < CACHE_TTL_MS) {
    return cachedRates;
  }

  // Check localStorage cache
  try {
    const stored = localStorage.getItem('misgastos_dolar_rates');
    if (stored && !force) {
      const parsed = JSON.parse(stored);
      if (parsed.timestamp && now - parsed.timestamp < CACHE_TTL_MS) {
        cachedRates = parsed.data;
        lastFetchTime = parsed.timestamp;
        return cachedRates;
      }
    }
  } catch (e) {
    // Ignore storage parse errors
  }

  try {
    // Fetch from public reliable dolar API
    const res = await fetch('https://dolarapi.com/v1/dolares', {
      headers: { 'Accept': 'application/json' },
      signal: AbortSignal.timeout(4000)
    });

    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();

    const oficial = data.find(d => d.casa === 'oficial') || FALLBACK_RATES.oficial;
    const blue = data.find(d => d.casa === 'blue') || FALLBACK_RATES.blue;
    const mep = data.find(d => d.casa === 'bolsa') || FALLBACK_RATES.mep;

    cachedRates = {
      oficial: { compra: oficial.compra || 1000, venta: oficial.venta || 1050 },
      blue: { compra: blue.compra || 1250, venta: blue.venta || 1280 },
      mep: { compra: mep.compra || 1220, venta: mep.venta || 1230 },
      lastUpdated: new Date().toISOString()
    };
    lastFetchTime = now;

    try {
      localStorage.setItem('misgastos_dolar_rates', JSON.stringify({
        data: cachedRates,
        timestamp: now
      }));
    } catch (e) {
      // Storage full or private mode
    }

    return cachedRates;
  } catch (err) {
    console.warn('Could not fetch live exchange rates, using fallback:', err.message);
    if (!cachedRates) {
      cachedRates = FALLBACK_RATES;
    }
    return cachedRates;
  }
}
