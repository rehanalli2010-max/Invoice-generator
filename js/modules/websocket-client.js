let ws = null;
let reconnectTimer = null;
let explicitlyDisconnected = false;
let reconnectAttempts = 0;
const MAX_RECONNECT_ATTEMPTS = 10;
const BASE_RECONNECT_DELAY = 1000;
const MAX_RECONNECT_DELAY = 30000;
const listeners = {};

function getReconnectDelay() {
  const delay = Math.min(BASE_RECONNECT_DELAY * Math.pow(2, reconnectAttempts), MAX_RECONNECT_DELAY);
  // Add jitter to prevent thundering herd
  return delay + Math.random() * 1000;
}

export function connectWebSocket(token) {
  if (ws) return;
  explicitlyDisconnected = false;
  const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  const host = window.location.hostname === 'localhost' ? 'localhost:3000' : window.location.host;
  const url = `${protocol}//${host}/ws`;

  ws = new WebSocket(url, [token]);

  ws.onopen = () => {
    reconnectAttempts = 0; // Reset on successful connection
    if (reconnectTimer) { clearTimeout(reconnectTimer); reconnectTimer = null; }
  };

  ws.onmessage = (event) => {
    try {
      const { event: evt, data } = JSON.parse(event.data);
      if (listeners[evt]) {
        listeners[evt].forEach(fn => fn(data));
      }
    } catch {}
  };

  ws.onclose = () => {
    ws = null;
    if (!explicitlyDisconnected) {
      if (reconnectAttempts < MAX_RECONNECT_ATTEMPTS) {
        reconnectAttempts++;
        const delay = getReconnectDelay();
        reconnectTimer = setTimeout(() => {
          const storedToken = localStorage.getItem('invoice-auth-token');
          if (storedToken) connectWebSocket(storedToken);
        }, delay);
      }
    }
  };

  ws.onerror = () => { ws?.close(); };
}

export function disconnectWebSocket() {
  explicitlyDisconnected = true;
  if (reconnectTimer) { clearTimeout(reconnectTimer); reconnectTimer = null; }
  if (ws) { ws.close(); ws = null; }
}

export function onEvent(event, fn) {
  if (!listeners[event]) listeners[event] = [];
  listeners[event].push(fn);
}

export function offEvent(event, fn) {
  if (!listeners[event]) return;
  listeners[event] = listeners[event].filter(f => f !== fn);
}
