const fs = require('fs');

const file = 'js/modules/history.js';
let content = fs.readFileSync(file, 'utf8');

const actionRegex = /case 'mark-paid':[\s\S]*?break;/;
const actionReplaceStr = `case 'mark-paid':
                    console.log('mark-paid clicked for invoice ' + invoiceId);
                    if (window.app && window.app.storage) {
                        try {
                            const inv = window.app.storage.getInvoice(invoiceId);
                            if (inv) {
                                console.log('Found invoice:', inv.id, 'current status:', inv.status);
                                inv.status = 'Paid'; // Changed 'paid' to 'Paid' for consistency with logic
                                
                                // Actually save to localStorage if it's there
                                window.app.storage.saveInvoice(inv);
                                
                                // Direct hack for this particular bug if regular save doesn't stick
                                const allInvoices = window.app.storage.getInvoices();
                                const idx = allInvoices.findIndex(i => i.id === invoiceId);
                                if (idx > -1) {
                                    allInvoices[idx].status = 'Paid';
                                    localStorage.setItem('invoice-generator-invoices', JSON.stringify(allInvoices));
                                    console.log('Saved directly to localStorage');
                                }
                                
                                // Need to force dashboard stats to refresh
                                if (typeof window.app.renderHistoryList === 'function') {
                                    window.app.renderHistoryList();
                                }
                                if (typeof window.app.renderDashboard === 'function') {
                                    window.app.renderDashboard();
                                }
                                if (typeof window.app.updateAnalyticsDashboard === 'function') {
                                    window.app.updateAnalyticsDashboard();
                                }
                            } else {
                                console.log('Invoice not found in storage');
                            }
                        } catch(e) {
                            console.error('Error marking paid', e);
                        }
                    }
                    break;`;
                    
content = content.replace(actionRegex, actionReplaceStr);

fs.writeFileSync(file, content);
console.log('Patched history.js with direct storage fallback');
