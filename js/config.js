const isLocalhost = ['localhost', '127.0.0.1', '[::1]'].includes(window.location.hostname);
export const API_BASE = isLocalhost ? 'http://localhost:3000' : window.location.origin;
