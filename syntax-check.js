const fs = require('fs');
const path = require('path');

function checkFile(file) {
    const code = fs.readFileSync(file, 'utf8');
    try {
        // Evaluate the raw code to see if it parses. 
        // For ESM we must catch 'Cannot use import' which means syntax is fine,
        // but if it's 'Invalid or unexpected token', it will throw a SyntaxError.
        new Function(code);
    } catch (e) {
        if (!e.message.includes('import') && !e.message.includes('export')) {
            console.log("ERROR in", file, ":", e.message);
        }
    }
}

const jsFiles = fs.readdirSync('D:/CODE/Invoice generator/js/').filter(f => f.endsWith('.js'));
jsFiles.forEach(f => checkFile(path.join('D:/CODE/Invoice generator/js', f)));

const modules = fs.readdirSync('D:/CODE/Invoice generator/js/modules').filter(f => f.endsWith('.js'));
modules.forEach(f => checkFile(path.join('D:/CODE/Invoice generator/js/modules', f)));

const globals = fs.readdirSync('D:/CODE/Invoice generator/js/globals').filter(f => f.endsWith('.js'));
globals.forEach(f => checkFile(path.join('D:/CODE/Invoice generator/js/globals', f)));
