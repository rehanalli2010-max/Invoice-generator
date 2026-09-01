global.window = {
    location: { hostname: 'localhost', origin: 'http://localhost' },
    addEventListener: (e, cb) => {},
    matchMedia: () => ({ matches: false }),
    navigator: {},
    localStorage: { getItem: () => null, setItem: () => {} }
};
global.document = {
    addEventListener: (e, cb) => { if (e === 'DOMContentLoaded') setTimeout(cb, 50); },
    querySelector: () => ({ classList: { add: () => {}, remove: () => {} }, style: {}, getBoundingClientRect: () => ({}) }),
    getElementById: () => ({ style: {}, classList: { add: () => {}, remove: () => {} }, getBoundingClientRect: () => ({}), addEventListener: () => {}, removeEventListener: () => {} }),
    querySelectorAll: () => []
};
global.localStorage = global.window.localStorage;
global.window.document = global.document;

import('./js/app.js').then(() => {
    console.log('App loaded');
    setTimeout(() => {
        global.window.app.init();
        console.log('Init done');
    }, 100);
}).catch(err => console.error('Import error:', err));
