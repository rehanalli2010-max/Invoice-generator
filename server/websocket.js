const WebSocket = require('ws');
const jwt = require('jsonwebtoken');
const db = require('./db');

let wss;
const HEARTBEAT_INTERVAL = 30000;
const HEARTBEAT_TIMEOUT = 10000;

function setupWebSocket(server) {
  wss = new WebSocket.Server({ server, path: '/ws' });

  wss.on('connection', (ws, req) => {
    // Accept auth token from Sec-WebSocket-Protocol header (avoids URL query param exposure)
    const protocols = req.headers['sec-websocket-protocol'];
    const token = protocols ? protocols.split(',').map(p => p.trim()).find(p => {
      try { jwt.verify(p, process.env.JWT_SECRET); return true; } catch { return false; }
    }) : null;
    if (!token) {
      ws.close(4001, 'Auth token required');
      return;
    }
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = db.prepare('SELECT token_version FROM users WHERE id = ?').get(decoded.userId);
      if (!user || (decoded.tokenVersion ?? 0) !== (user.token_version ?? 0)) {
        ws.close(4001, 'Token revoked');
        return;
      }
      ws.userId = decoded.userId;
    } catch {
      ws.close(4001, 'Invalid token');
      return;
    }

    ws.isAlive = true;
    ws.on('pong', () => { ws.isAlive = true; });

    ws.on('error', (err) => {
      console.error('[WebSocket] Client error:', err.message);
    });

    ws.on('close', () => {});
  });

  // Heartbeat: terminate dead connections
  const heartbeat = setInterval(() => {
    if (!wss) return;
    wss.clients.forEach(ws => {
      if (ws.isAlive === false) {
        console.log('[WebSocket] Terminating stale connection');
        return ws.terminate();
      }
      ws.isAlive = false;
      ws.ping();
    });
  }, HEARTBEAT_INTERVAL);

  wss.on('close', () => {
    clearInterval(heartbeat);
  });

  return wss;
}

function broadcast(userId, event, data) {
  if (!wss) return;
  const message = JSON.stringify({ event, data });
  wss.clients.forEach(client => {
    if (client.readyState === WebSocket.OPEN && client.userId === userId) {
      client.send(message);
    }
  });
}

module.exports = { setupWebSocket, broadcast, getWss: () => wss };
