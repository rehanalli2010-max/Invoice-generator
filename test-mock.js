global.window = { location: { hostname: 'localhost', origin: 'http://localhost' }, addEventListener: () => {}, navigator: {}, localStorage: { getItem: () => null, setItem: () => {} }, document: { addEventListener: () => {}, querySelector: () => ({ classList: { add: () => {}, remove: () => {} } }), getElementById: () => ({ style: {} }), querySelectorAll: () => [] } };
global.document = global.window.document;
global.localStorage = global.window.localStorage;
import('./js/app.js').then(() => console.log('OK')).catch(err => console.error('Error:', err));
