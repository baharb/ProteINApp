import { supabase } from './supabase';

// ── SERVER CONFIG ──────────────────────────────────────────────────────────
// Online server on Render. To test against the server on your own PC instead,
// use your PC's local IP, e.g. 'http://192.168.86.155:3000'.
export const SERVER_URL = 'https://proteinserver.onrender.com';

// Render's free plan sleeps after 15 min idle and needs up to ~50s to wake,
// so allow a generous timeout and wake the server as soon as the app opens.
const TIMEOUT_MS = 30000;

// ── Feature switches ──
// payments:false = free version. Every feature is unlocked and no premium /
// trial screens are shown (stores reject buy buttons that don't work).
// Turn on once real in-app purchases are set up.
export const FEATURES = {
  payments: false,
};

// Server error → translation key for a friendly message (null = generic).
export function errorKey(status, data) {
  if (data?.code === 'daily_limit') return 'dailyLimit';
  if (data?.code === 'busy') return 'serverBusy';
  if (status === 401) return 'sessionExpired';
  return null;
}

export function wakeServer() {
  fetch(SERVER_URL).catch(() => {});
}

// The server only answers signed-in users — send the Supabase session token.
export async function authHeaders() {
  const { data } = await supabase.auth.getSession();
  const token = data?.session?.access_token;
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export async function fetchWithTimeout(url, options = {}, timeoutMs = TIMEOUT_MS) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const headers = { ...(options.headers || {}), ...(await authHeaders()) };
    const res = await fetch(url, { ...options, headers, signal: controller.signal });
    clearTimeout(timer);
    return res;
  } catch (e) {
    clearTimeout(timer);
    if (e.name === 'AbortError') throw new Error('Server not responding. Check SERVER_URL in config.js.');
    throw e;
  }
}
