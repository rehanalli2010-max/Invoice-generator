const fs = require('fs');
let code = fs.readFileSync('js/modules/auth.js', 'utf8');

// When user tier changes or auth changes, we need to show/hide the lock overlay
const toReplace = `    [adHeader, adSidebar, adFooter].forEach(el => {
        if (el) el.classList.toggle('ad-hidden', isPaid);
    });`;

const replacement = `    [adHeader, adSidebar, adFooter].forEach(el => {
        if (el) el.classList.toggle('ad-hidden', isPaid);
    });

    const paymentLinkOverlay = document.getElementById('paymentLinkLockOverlay');
    const paymentLinkLock = document.querySelector('#paymentLinkWrapper .premium-lock');
    if (paymentLinkOverlay) paymentLinkOverlay.style.display = isPaid ? 'none' : 'block';
    if (paymentLinkLock) paymentLinkLock.style.display = isPaid ? 'none' : 'block';`;

if (code.includes('classList.toggle(\'ad-hidden\', isPaid);') && !code.includes('paymentLinkLockOverlay')) {
    code = code.replace(toReplace, replacement);
    fs.writeFileSync('js/modules/auth.js', code);
    console.log('Invoice UI lock logic patched');
} else {
    console.log('Invoice UI lock logic already patched');
}
