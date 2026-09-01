const fs = require('fs');
let code = fs.readFileSync('js/app.js', 'utf8');

// Insert watermark logic
if (!code.includes('invoiceWatermark.style.display')) {
    const toReplace = `            if (!this.user || this.user.tier === 'free') {
                await this.showInterstitialAd();
            }

            this.showNotification('Generating Image...', 'info');

            try {`;
    
    const replacement = `            if (!this.user || this.user.tier === 'free') {
                await this.showInterstitialAd();
            }

            this.showNotification('Generating Image...', 'info');

            const watermarkEl = element.querySelector('#invoiceWatermark');
            const isFree = !this.user || this.user.tier === 'free';

            try {
                if (watermarkEl && isFree) {
                    watermarkEl.style.display = 'block';
                }`;

    code = code.replace(toReplace, replacement);

    // Now insert the cleanup inside finally block
    const finallyBlock = `            } finally {
                Object.assign(element.style, originalStyle);
            }`;
    const finallyReplacement = `            } finally {
                Object.assign(element.style, originalStyle);
                if (watermarkEl && isFree) {
                    watermarkEl.style.display = 'none';
                }
            }`;
    
    code = code.replace(finallyBlock, finallyReplacement);
    
    fs.writeFileSync('js/app.js', code);
    console.log("downloadImage patched with watermark logic");
} else {
    console.log("Watermark logic already in place");
}
