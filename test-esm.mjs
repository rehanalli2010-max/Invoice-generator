import { readFileSync } from 'fs';
import { runInContext, createContext } from 'vm';

const code = readFileSync('D:/CODE/Invoice generator/js/app.js', 'utf8');

console.log("Checking ES module syntactically...");
// We can't trivially execute browser ESM in Node VM without massive polyfills,
// but we can check if it parses. Wait, Node -c already did that.
