const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = process.env.PORT || 8080;
const ROOT_DIR = path.resolve(__dirname);

const MIME_TYPES = {
    '.html': 'text/html',
    '.css': 'text/css',
    '.js': 'text/javascript',
    '.json': 'application/json',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.gif': 'image/gif',
    '.svg': 'image/svg+xml',
    '.ico': 'image/x-icon',
    '.woff': 'font/woff',
    '.woff2': 'font/woff2',
    '.ttf': 'font/ttf'
};

// Only these top-level paths/files are allowed to be served
const ALLOWED_TOP_DIRS = ['js', 'css', 'next-app'];
const ALLOWED_ROOT_FILES = [
    'index.html', 'landing.html', 'history.html', 'clients.html',
    'pricing.html', 'templates.html', 'oauth-github-callback.html', 'favicon.ico',
    'robots.txt', 'sitemap.xml'
];

// Paths that must never be served
const BLOCKED_PREFIXES = ['server/', '.env', '.vscode/', '.claude/', '.kimchi/', 'node_modules/'];

function isPathSafe(urlPath) {
    // Normalize and strip query/hash
    const clean = urlPath.split('?')[0].split('#')[0];
    const parts = clean.split('/').filter(Boolean);

    // Block hidden files/dirs (except .well-known for HTTPS)
    if (parts.some(p => p.startsWith('.') && p !== '.well-known')) return false;

    // Block sensitive prefixes
    for (const prefix of BLOCKED_PREFIXES) {
        if (clean.startsWith(prefix) || clean.includes('/' + prefix)) return false;
    }

    // Root serves landing.html (allowed)
    if (parts.length === 0) return true;

    const topDir = parts[0];

    // Allow files in allowed top-level directories (js/, css/, next-app/)
    if (ALLOWED_TOP_DIRS.includes(topDir)) return true;

    // Allow specific root-level files
    if (parts.length === 1 && (ALLOWED_ROOT_FILES.includes(topDir) || topDir === 'landing.html')) return true;

    // Everything else is blocked
    return false;
}

const server = http.createServer((req, res) => {
    const url = new URL(req.url, `http://${req.headers.host}`);

    if (!isPathSafe(url.pathname)) {
        res.writeHead(403, { 'Content-Type': 'text/plain' });
        res.end('403 Forbidden');
        return;
    }

    let filePath = path.join(ROOT_DIR, url.pathname === '/' ? 'landing.html' : url.pathname.split('?')[0].split('#')[0]);

    // Resolve to ensure it stays within ROOT_DIR
    const resolved = path.resolve(filePath);
    if (resolved !== ROOT_DIR && !resolved.startsWith(ROOT_DIR + path.sep)) {
        res.writeHead(403, { 'Content-Type': 'text/plain' });
        res.end('403 Forbidden');
        return;
    }

    const extname = String(path.extname(filePath)).toLowerCase();
    const contentType = MIME_TYPES[extname] || 'application/octet-stream';

    fs.readFile(filePath, (error, content) => {
        if (error) {
            if (error.code === 'ENOENT') {
                // Return empty favicon instead of 404 to avoid console noise
                if (url.pathname === '/favicon.ico') {
                    res.writeHead(204);
                    res.end();
                    return;
                }
                res.writeHead(404, { 'Content-Type': 'text/html' });
                res.end('<h1>404 Not Found</h1>', 'utf-8');
            } else {
                res.writeHead(500);
                res.end('Internal server error');
            }
        } else {
            res.writeHead(200, {
                'Content-Type': contentType,
                'X-Content-Type-Options': 'nosniff',
                'X-Frame-Options': 'DENY',
                'Content-Security-Policy': "default-src 'self'; script-src 'self' 'unsafe-inline' blob: https://cdn.jsdelivr.net https://pagead2.googlesyndication.com https://accounts.google.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com data:; img-src 'self' data: blob: https:; connect-src 'self' http://localhost:3000 https://api.stripe.com https://cdn.jsdelivr.net; frame-src 'self' https://js.stripe.com https://hooks.stripe.com; object-src 'none'; base-uri 'self'; form-action 'self'; frame-ancestors 'none'"
            });
            res.end(content, 'utf-8');
        }
    });
});

server.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}/`);
});
