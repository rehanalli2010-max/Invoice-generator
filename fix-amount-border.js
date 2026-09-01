const fs = require('fs');

const styleFile = 'css/style.css';
let styleContent = fs.readFileSync(styleFile, 'utf8');

// Looking at the problem, we need the `.item-amount` to look like an input box or a label with a background.
// The user says "The Amount box should: have smoothly rounded corners on ALL FOUR corners ... have the same visual corner treatment as the other input fields"
// Let's modify the `.item-amount` to look like `.item-row input`!

// Replace .item-amount styles
const itemAmountRegex = /\.item-amount\s*\{([\s\S]*?)\}/;
const match = styleContent.match(itemAmountRegex);

if (match) {
    const replacement = `.item-amount {
    font-weight: 700;
    font-variant-numeric: tabular-nums;
    color: var(--text-main);
    font-size: 0.9375rem;

    /* Styling to match inputs */
    padding: 0.5rem 0.5rem;
    background: var(--bg-card);
    border: 2px solid var(--border);
    border-radius: var(--radius-sm);
    box-sizing: border-box;

    display: block;
    width: 100%;
    
    /* Extra styles for better visual alignment */
    line-height: normal;
    text-align: left;
    
    /* Make sure overflow works correctly for corners */
    overflow: hidden;
}`;
    styleContent = styleContent.replace(itemAmountRegex, replacement);
    fs.writeFileSync(styleFile, styleContent, 'utf8');
    console.log('Fixed .item-amount styling.');
} else {
    console.log('Could not find .item-amount in CSS.');
}

