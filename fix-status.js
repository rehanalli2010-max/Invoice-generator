const fs = require('fs');
let code = fs.readFileSync('js/invoice.js', 'utf8');

// Find currency meta-item
const target = `<div class="meta-item">
                                <span class="meta-label">\${t('currency')}</span>
                                <span class="meta-value">\${this.escapeHtml(this.currency)}</span>
                            </div>`;

const replace = `<div class="meta-item">
                                <span class="meta-label">\${t('currency')}</span>
                                <span class="meta-value">\${this.escapeHtml(this.currency)}</span>
                            </div>
                            <div class="meta-item">
                                <span class="meta-label">Payment Status</span>
                                <span class="meta-value"><strong>\${this.status === 'completed' ? 'Complete' : (this.status === 'pending' ? 'Pending' : (this.status || 'Pending').replace(/^./, c => c.toUpperCase()))}</strong></span>
                            </div>`;
                            
code = code.replace(target, replace);
fs.writeFileSync('js/invoice.js', code);
console.log('Fixed invoice.js');
