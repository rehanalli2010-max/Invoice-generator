const fs = require('fs');

const file = 'js/modules/history.js';
let content = fs.readFileSync(file, 'utf8');

const actionRegex = /case 'mark-paid':[\s\S]*?break;/;
const actionReplaceStr = `case 'mark-paid':
                    console.log('mark-paid clicked for invoice ' + invoiceId);
                    if (window.app && typeof window.app.updateInvoiceStatus === 'function') {
                        // Let's use the app's existing built-in logic to update status
                        // the system transitions expect "paid", not "Paid" for the actual status enum
                        window.app.updateInvoiceStatus(invoiceId, 'paid');
                    } else if (window.app && window.app.storage) {
                        // Fallback 
                        const inv = window.app.storage.getInvoice(invoiceId);
                        if (inv) {
                            inv.status = 'paid'; 
                            window.app.storage.saveInvoice(inv);
                            if (typeof window.app.renderHistoryList === 'function') {
                                window.app.renderHistoryList();
                            }
                            if (typeof window.app.renderDashboard === 'function') {
                                window.app.renderDashboard();
                            }
                        }
                    }
                    break;`;
                    
content = content.replace(actionRegex, actionReplaceStr);

fs.writeFileSync(file, content);
console.log('Patched history.js with updateInvoiceStatus');
