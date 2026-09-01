/**
 * LocalStorage management for invoices
 */
class InvoiceStorage {
    constructor() {
        this.KEY_INVOICES = 'invoice-generator-invoices';
        this.KEY_NEXT_NUMBER = 'invoice-generator-next-number';
        this.KEY_CLIENTS = 'invoice-generator-clients';
    }

    static generateId() {
        if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
            return crypto.randomUUID();
        }
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
            const r = Math.random() * 16 | 0;
            return (c === 'x' ? r : (r & 0x3 | 0x8)).toString(16);
        });
    }

    /**
     * Save invoice to storage
     */
    saveInvoice(invoiceData) {
        try {
            if (!invoiceData || typeof invoiceData !== 'object') return false;
            const data = JSON.parse(JSON.stringify(invoiceData));

            const lockKey = this.KEY_INVOICES + '_lock';
            const lockTime = sessionStorage.getItem(lockKey + '_time');
            // Auto-expire stale locks older than 5 seconds (handles page crash deadlock)
            if (sessionStorage.getItem(lockKey) && lockTime && (Date.now() - parseInt(lockTime)) < 5000) {
                return false;
            }
            sessionStorage.setItem(lockKey, '1');
            sessionStorage.setItem(lockKey + '_time', Date.now().toString());

            try {
                const invoices = this.getInvoices();

                // Check if invoice with same id already exists
                const existingIndex = data.id ? invoices.findIndex(inv => inv.id === data.id) : -1;

                if (existingIndex > -1) {
                    // Check if the updated invoice number conflicts with another invoice
                    if (data.invoiceNumber) {
                        const numberConflict = invoices.findIndex(
                            (inv, idx) => idx !== existingIndex && inv.invoiceNumber === data.invoiceNumber
                        );
                        if (numberConflict > -1) {
                            sessionStorage.removeItem(lockKey);
                            return false;
                        }
                    }
                    // Update existing by ID
                    invoices[existingIndex] = {
                        ...data,
                        updatedAt: new Date().toISOString()
                    };
                } else {
                    // FALLBACK DUPLICATE CHECK: if no match by ID, check by raw invoiceNumber
                    const numberIndex = data.invoiceNumber ? invoices.findIndex(inv => inv.invoiceNumber === data.invoiceNumber) : -1;

                    if (numberIndex > -1) {
                        // Do not allow overwriting if the same invoice number exists
                        return false;
                    } else {
                        // Fully new invoice
                        const newId = data.id || InvoiceStorage.generateId();
                        invoices.push({
                            ...data,
                            id: newId,
                            createdAt: data.createdAt || new Date().toISOString(),
                            updatedAt: new Date().toISOString()
                        });
                    }
                }

                localStorage.setItem(this.KEY_INVOICES, JSON.stringify(invoices));
                return true;
            } finally {
                sessionStorage.removeItem(lockKey);
            }
        } catch (error) {
            return false;
        }
    }

    /**
     * Get all invoices from storage
     */
    getInvoices() {
        try {
            const invoicesJson = localStorage.getItem(this.KEY_INVOICES);
            return invoicesJson ? JSON.parse(invoicesJson) : [];
        } catch (error) {
            return [];
        }
    }

    /**
     * Get a specific invoice by number
     */
    getInvoice(id) {
        const invoices = this.getInvoices();
        return invoices.find(inv => String(inv.id) === String(id));
    }

    /**
     * Delete an invoice by number
     */
    deleteInvoice(id) {
        try {
            const invoices = this.getInvoices();
            const filteredInvoices = invoices.filter(inv => String(inv.id) !== String(id));
            const deleted = filteredInvoices.length < invoices.length;
            localStorage.setItem(this.KEY_INVOICES, JSON.stringify(filteredInvoices));
            return deleted;
        } catch (error) {
            return false;
        }
    }

    /**
     * Clear all invoices from storage
     */
    clearAllInvoices() {
        try {
            localStorage.removeItem(this.KEY_INVOICES);
            localStorage.removeItem(this.KEY_NEXT_NUMBER);
            return true;
        } catch (error) {
            return false;
        }
    }

    /**
     * Get the next invoice number using configurable prefix/format
     */
    getNextInvoiceNumber() {
        try {
            const prefix = localStorage.getItem('inv-prefix') || 'INV';
            const format = localStorage.getItem('inv-format') || 'PREFIX-XXX';
            const startNumber = parseInt(localStorage.getItem('inv-start-number'), 10);
            const safeStart = isNaN(startNumber) || startNumber < 0 ? 1 : startNumber;

            const raw = localStorage.getItem(this.KEY_NEXT_NUMBER);
            let nextNumber = parseInt(raw, 10);
            if (isNaN(nextNumber) || nextNumber < safeStart) nextNumber = safeStart;

            // Advance the counter so the next call returns the next number
            localStorage.setItem(this.KEY_NEXT_NUMBER, (nextNumber + 1).toString());

            const padLen = format.replace('PREFIX', '').match(/X+/g)?.[0]?.length || 3;
            const paddedNumber = nextNumber.toString().padStart(padLen, '0');
            const now = new Date();
            let result = format
                .replace('PREFIX', prefix)
                .replace(/X+/g, paddedNumber)
                .replace('YYYY', now.getFullYear().toString())
                .replace('MM', (now.getMonth() + 1).toString().padStart(2, '0'));
            return result;
        } catch (error) {
            return 'INV-001';
        }
    }

    /**
     * Update invoice number counter based on existing invoices
     */
    updateInvoiceNumberCounter() {
        try {
            const prefix = localStorage.getItem('inv-prefix') || 'INV';
            const invoices = this.getInvoices();
            const maxNumber = invoices.reduce((max, inv) => {
                if (!inv.invoiceNumber) return max;
                const match = inv.invoiceNumber.match(new RegExp(prefix.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '(\\d+)'));
                if (match) {
                    const num = parseInt(match[1], 10);
                    return Math.max(max, num);
                }
                return max;
            }, 0);

            localStorage.setItem(this.KEY_NEXT_NUMBER, (maxNumber + 1).toString());
        } catch (error) {
        }
    }

    /**
     * Export invoices as JSON file
     */
    exportInvoices() {
        try {
            const invoices = this.getInvoices();
            const dataStr = JSON.stringify(invoices, null, 2);
            const dataBlob = new Blob([dataStr], { type: 'application/json' });

            const url = URL.createObjectURL(dataBlob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `invoices_${new Date().toISOString().split('T')[0]}.json`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);

            // Revoke URL after download completes to allow browser to fetch
            setTimeout(() => {
                URL.revokeObjectURL(url);
            }, 5000);

            return true;
        } catch (error) {
            return false;
        }
    }

    /**
     * Import invoices from JSON file
     */
    importInvoices(file) {
        return new Promise((resolve, reject) => {
            try {
                const reader = new FileReader();

                reader.onload = (event) => {
                    try {
                        const importedInvoices = JSON.parse(event.target.result);

                        if (!Array.isArray(importedInvoices)) {
                            reject('Invalid file format: expected an array of invoices');
                            return;
                        }

                        // Merge with existing invoices
                        const existingInvoices = this.getInvoices();
                        const combinedInvoices = [...existingInvoices];

                        importedInvoices.forEach(imported => {
                            const existingIndex = combinedInvoices.findIndex(
                                inv => inv.invoiceNumber === imported.invoiceNumber
                            );

                            if (existingIndex > -1) {
                                // Update existing
                                combinedInvoices[existingIndex] = imported;
                            } else {
                                // Add new
                                combinedInvoices.push(imported);
                            }
                        });

                        try {
                            localStorage.setItem(this.KEY_INVOICES, JSON.stringify(combinedInvoices));
                            this.updateInvoiceNumberCounter();
                        } catch (storageError) {
                            reject('Error saving to storage');
                            return;
                        }

                        resolve(`Successfully imported ${importedInvoices.length} invoice(s)`);
                    } catch (parseError) {
                        reject('Error parsing JSON file');
                    }
                };

                reader.onerror = () => {
                    reject('Error reading file');
                };

                reader.readAsText(file);
            } catch (error) {
                reject('Error importing invoices');
            }
        });
    }

    /**
     * Get invoice statistics
     */
    getStatistics() {
        const invoices = this.getInvoices();
        const total = invoices.length;
        const totals = invoices.reduce((sum, inv) => sum + (Number(inv.total) || 0), 0);
        const average = total > 0 ? totals / total : 0;

        const statusCounts = invoices.reduce((counts, inv) => {
            const status = this.getInvoiceStatus(inv);
            counts[status] = (counts[status] || 0) + 1;
            return counts;
        }, {});

        return {
            totalInvoices: total,
            totalRevenue: totals,
            averageInvoice: average,
            statusCounts
        };
    }

    /**
     * Determine invoice status based on due date (timezone-aware)
     */
    getInvoiceStatus(invoice) {
        if (invoice.status === 'paid') return 'Paid';

        const tz = localStorage.getItem('invoice-tz') || Intl.DateTimeFormat().resolvedOptions().timeZone;
        const now = new Date();
        const formatter = new Intl.DateTimeFormat('en-CA', { timeZone: tz, year: 'numeric', month: '2-digit', day: '2-digit' });
        const todayStr = formatter.format(now);

        const dueDateStr = invoice.dueDate;
        if (!dueDateStr) return 'Pending';

        if (dueDateStr < todayStr) {
            return 'Overdue';
        } else if (dueDateStr === todayStr) {
            return 'Due Today';
        } else {
            return 'Pending';
        }
    }

    togglePaymentStatus(id) {
        try {
            const invoices = this.getInvoices();
            const index = invoices.findIndex(inv => String(inv.id) === String(id));
            if (index === -1) return false;
            invoices[index].status = invoices[index].status === 'paid' ? 'sent' : 'paid';
            invoices[index].updatedAt = new Date().toISOString();
            localStorage.setItem(this.KEY_INVOICES, JSON.stringify(invoices));
            return true;
        } catch (error) {
            return false;
        }
    }

    /**
     * Search invoices
     */
    searchInvoices(searchTerm) {
        const invoices = this.getInvoices();
        const term = String(searchTerm || '').toLowerCase();

        return invoices.filter(inv =>
            (inv.clientName && inv.clientName.toLowerCase().includes(term)) ||
            (inv.invoiceNumber && inv.invoiceNumber.toLowerCase().includes(term)) ||
            (inv.clientEmail && inv.clientEmail.toLowerCase().includes(term)) ||
            (inv.notes && inv.notes.toLowerCase().includes(term))
        );
    }

    // --- Client Management ---
    getClients() {
        try {
            const clientsJson = localStorage.getItem(this.KEY_CLIENTS);
            return clientsJson ? JSON.parse(clientsJson) : [];
        } catch (error) {
            return [];
        }
    }

    saveClient(clientData) {
        try {
            if (!clientData || typeof clientData !== 'object') return false;
            const clients = this.getClients();
            if (!clientData.name || !clientData.name.trim()) return false;

            const existingIndex = clients.findIndex(c =>
                (clientData.id && c.id === clientData.id) ||
                (c.name === clientData.name && c.email === clientData.email)
            );

            if (existingIndex > -1) {
                // Update existing client
                clients[existingIndex] = {
                    ...clients[existingIndex],
                    ...clientData,
                    updatedAt: new Date().toISOString()
                };
            } else {
                // Add new client
                clients.push({
                    ...clientData,
                    id: clientData.id || InvoiceStorage.generateId(),
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString()
                });
            }

            localStorage.setItem(this.KEY_CLIENTS, JSON.stringify(clients));
            return true;
        } catch (error) {
            return false;
        }
    }

    deleteClient(clientId) {
        try {
            const clients = this.getClients();
            const filtered = clients.filter(c => c.id !== clientId);
            const deleted = filtered.length < clients.length;
            localStorage.setItem(this.KEY_CLIENTS, JSON.stringify(filtered));
            return deleted;
        } catch (error) {
            return false;
        }
    }

    /**
     * Duplicate an invoice with new number and date
     */
    duplicateInvoice(id) {
        try {
            const invoices = this.getInvoices();
            const source = invoices.find(inv => String(inv.id) === String(id));
            if (!source) return false;

            const newInvoice = JSON.parse(JSON.stringify(source));
            delete newInvoice.id;
            delete newInvoice.createdAt;
            delete newInvoice.updatedAt;

            // Generate new invoice number
            newInvoice.invoiceNumber = this.getNextInvoiceNumber();

            newInvoice.invoiceDate = new Date().toISOString().split('T')[0];
            newInvoice.dueDate = '';
            newInvoice.status = 'draft';

            return this.saveInvoice(newInvoice);
        } catch (error) {
            return false;
        }
    }

    clearAllClients() {
        try {
            localStorage.removeItem(this.KEY_CLIENTS);
            return true;
        } catch (error) {
            return false;
        }
    }
}

export default InvoiceStorage;
// CJS compat: allow `require('./storage.js')` in tests
if (typeof module !== 'undefined' && module.exports) {
    module.exports = InvoiceStorage;
    module.exports.default = InvoiceStorage;
}
