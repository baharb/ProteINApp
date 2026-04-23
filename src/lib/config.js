// ─── SERVER CONFIG ────────────────────────────────────────────────────────
// During local development: 'http://YOUR_LOCAL_IP:3000'
// Find your IP: Windows → ipconfig → IPv4 Address
//               Mac     → System Preferences → Network
// After deploying to Render: 'https://your-app.onrender.com'
//
// IMPORTANT: Use your computer's local IP, NOT localhost or 127.0.0.1
// because the phone needs to reach your computer over WiFi.
// Example: 'http://192.168.1.5:3000'

export const SERVER_URL = 'http://192.168.86.155:3000'; // ← change this

// Request timeout in ms — prevents app from freezing if server is unreachable
export const REQUEST_TIMEOUT = 8000;

// Helper: fetch with timeout so app never freezes waiting for server
export async function fetchWithTimeout(url, options = {}) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT);
  try {
    const res = await fetch(url, { ...options, signal: controller.signal });
    clearTimeout(timer);
    return res;
  } catch (err) {
    clearTimeout(timer);
    if (err.name === 'AbortError') {
      throw new Error('Server not responding. Check your SERVER_URL in src/lib/config.js and make sure the server is running.');
    }
    throw err;
  }
}
