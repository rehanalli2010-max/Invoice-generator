const fs = require('fs');
let code = fs.readFileSync('index.html', 'utf8');

const toReplace = `<div class="form-group" style="grid-column: 1 / -1;">
                                    <label for="paymentLink" data-i18n="invoiceForm.paymentLink">Payment Collection Link (Optional)</label>
                                    <input type="url" id="paymentLink" placeholder="e.g. https://paypal.me/yourusername or Stripe links">
                                </div>`;

const replacement = `<div class="form-group" style="grid-column: 1 / -1; position: relative;" id="paymentLinkWrapper">
                                    <label for="paymentLink" data-i18n="invoiceForm.paymentLink">Payment Collection Link</label>
                                    <div class="input-with-icon">
                                        <input type="url" id="paymentLink" placeholder="e.g. https://paypal.me/yourusername or Stripe links">
                                        <span class="premium-lock" style="display: none; position: absolute; right: 10px; top: 12px; cursor: pointer;" title="Premium Feature">🔒 UI_LOCK</span>
                                    </div>
                                    <div id="paymentLinkLockOverlay" style="display: none; position: absolute; top: 0; left: 0; right: 0; bottom: 0; z-index: 5; border-radius: var(--radius-md); background: rgba(255,255,255,0.4); cursor: pointer;" onclick="if(window.pricing && window.pricing.handleSubscribe) window.pricing.handleSubscribe('startup')"></div>
                                </div>`;

if (code.includes('Payment Collection Link (Optional)') && !code.includes('paymentLinkWrapper')) {
    code = code.replace(toReplace, replacement.replace('UI_LOCK', ''));
    fs.writeFileSync('index.html', code);
    console.log('Payment link html patched');
} else {
    console.log('Payment link html already patched');
}
