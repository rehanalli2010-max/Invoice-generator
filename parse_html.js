const fs = require('fs');

let html = fs.readFileSync('index.html', 'utf8');
const mainStartIndex = html.indexOf('<main class="main-content" id="mainContent">');
if (mainStartIndex === -1) {
    console.error("Main not found");
    process.exit(1);
}

// Everything before <main
const headHtml = html.substring(0, mainStartIndex);
// Check if there is an <aside tag inside main, wait no dashboard widgets might exist.

// I will just use regex to extract each section by id.
const ids = ['home', 'new-invoice', 'history', 'clients'];
const sections = {};

let remaining = html.substring(mainStartIndex);

for (const id of ids) {
    const startStr = `<section id="${id}"`;
    const idx = remaining.indexOf(startStr);
    if (idx !== -1) {
        // find next section start or end of main, wait find <section id= again
        sections[id] = remaining.substring(idx);
    }
}

// Since sections overlap in the string `sections[id]`, let's just chop them.
// A better way: find indexes of all section starts.
const sectionStarts = [];
for (const id of ids) {
    const idx = remaining.indexOf(`<section id="${id}"`);
    if (idx !== -1) {
        sectionStarts.push({id, idx});
    }
}

// Add the other modal parts that might be after the views.
// What's after the views? Let's check where the views end. 
// "clients" section is typically the last one.
const clientsIdx = remaining.indexOf(`<section id="clients"`);

// Let's find where clients ends. We'll search for the next sibling div or modal...
// Wait, we replaced div with section. Let's see what's in clients.
