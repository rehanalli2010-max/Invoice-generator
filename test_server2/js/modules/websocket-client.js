let ws = null;
let reconnectTimer = null;
let explicitlyDisconnected = false;
const listeners = {};

export function connectWebSocket(token) {
  if (ws) return;
  explicitlyDisconnected = false;
  const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  const host = window.location.hostname === 'localhost' ? 'localhost:3001' : window.location.host;
  const url = `${protocol}//${host}/ws`;

  ws = new WebSocket(url, [token]);

  ws.onopen = () => {
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
      reconnectTimer = setTimeout(() => {
        const token = localStorage.getItem('invoice-auth-token');
        if (token) connectWebSocket(token);
      }, 5000);
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
