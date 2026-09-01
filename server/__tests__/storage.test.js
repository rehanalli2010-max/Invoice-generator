

class MockStorage {
  constructor() {
    this._store = {};
  }
  getItem(key) { return this._store[key] ?? null; }
  setItem(key, value) { this._store[key] = String(value); }
  removeItem(key) { delete this._store[key]; }
  clear() { this._store = {}; }
}

beforeEach(() => {
  global.localStorage = new MockStorage();
  global.sessionStorage = new MockStorage();
});

const InvoiceStorage = require('../../js/storage.js').default || require('../../js/storage.js');

describe('InvoiceStorage', () => {
  let storage;

  beforeEach(() => {
    storage = new InvoiceStorage();
  });

  describe('saveInvoice()', () => {
    it('saves a new invoice', () => {
      const result = storage.saveInvoice({
        id: 'inv-1',
        invoiceNumber: 'INV-001',
        clientName: 'Test',
        total: 100,
      });
      expect(result).toBe(true);
      const invoices = storage.getInvoices();
      expect(invoices).toHaveLength(1);
      expect(invoices[0].invoiceNumber).toBe('INV-001');
    });

    it('updates existing invoice by id', () => {
      storage.saveInvoice({ id: 'inv-1', invoiceNumber: 'INV-001', total: 100 });
      storage.saveInvoice({ id: 'inv-1', invoiceNumber: 'INV-001', total: 200 });
      expect(storage.getInvoices()).toHaveLength(1);
      expect(storage.getInvoices()[0].total).toBe(200);
    });

    it('rejects duplicate invoice numbers', () => {
      storage.saveInvoice({ id: 'inv-1', invoiceNumber: 'INV-001', total: 100 });
      const result = storage.saveInvoice({ id: 'inv-2', invoiceNumber: 'INV-001', total: 50 });
      expect(result).toBe(false);
    });

    it('rejects non-object input', () => {
      expect(storage.saveInvoice(null)).toBe(false);
      expect(storage.saveInvoice('string')).toBe(false);
    });
  });

  describe('getInvoices()', () => {
    it('returns empty array when no invoices', () => {
      expect(storage.getInvoices()).toEqual([]);
    });

    it('returns all saved invoices', () => {
      storage.saveInvoice({ id: 'inv-1', invoiceNumber: 'INV-001', total: 100 });
      storage.saveInvoice({ id: 'inv-2', invoiceNumber: 'INV-002', total: 200 });
      expect(storage.getInvoices()).toHaveLength(2);
    });
  });

  describe('getInvoice()', () => {
    it('finds invoice by id', () => {
      storage.saveInvoice({ id: 'inv-1', invoiceNumber: 'INV-001' });
      storage.saveInvoice({ id: 'inv-2', invoiceNumber: 'INV-002' });
      const found = storage.getInvoice('inv-2');
      expect(found.invoiceNumber).toBe('INV-002');
    });

    it('returns undefined for missing id', () => {
      expect(storage.getInvoice('nonexistent')).toBeUndefined();
    });
  });

  describe('deleteInvoice()', () => {
    it('deletes an invoice by id', () => {
      storage.saveInvoice({ id: 'inv-1', invoiceNumber: 'INV-001' });
      storage.saveInvoice({ id: 'inv-2', invoiceNumber: 'INV-002' });
      expect(storage.deleteInvoice('inv-1')).toBe(true);
      expect(storage.getInvoices()).toHaveLength(1);
      expect(storage.getInvoices()[0].id).toBe('inv-2');
    });

    it('returns false for nonexistent id', () => {
      expect(storage.deleteInvoice('nonexistent')).toBe(false);
    });
  });

  describe('clearAllInvoices()', () => {
    it('removes all invoices', () => {
      storage.saveInvoice({ id: 'inv-1', invoiceNumber: 'INV-001' });
      expect(storage.clearAllInvoices()).toBe(true);
      expect(storage.getInvoices()).toEqual([]);
    });
  });

  describe('getNextInvoiceNumber()', () => {
    it('returns INV-001 on first call', () => {
      expect(storage.getNextInvoiceNumber()).toBe('INV-001');
    });

    it('increments on each call', () => {
      expect(storage.getNextInvoiceNumber()).toBe('INV-001');
      expect(storage.getNextInvoiceNumber()).toBe('INV-002');
      expect(storage.getNextInvoiceNumber()).toBe('INV-003');
    });
  });

  describe('togglePaymentStatus()', () => {
    it('toggles from sent to paid', () => {
      storage.saveInvoice({ id: 'inv-1', status: 'sent' });
      expect(storage.togglePaymentStatus('inv-1')).toBe(true);
      expect(storage.getInvoice('inv-1').status).toBe('paid');
    });

    it('toggles from paid to sent', () => {
      storage.saveInvoice({ id: 'inv-1', status: 'paid' });
      storage.togglePaymentStatus('inv-1');
      expect(storage.getInvoice('inv-1').status).toBe('sent');
    });

    it('returns false for nonexistent id', () => {
      expect(storage.togglePaymentStatus('nonexistent')).toBe(false);
    });
  });

  describe('getInvoiceStatus()', () => {
    it('returns Paid when status is paid', () => {
      expect(storage.getInvoiceStatus({ status: 'paid' })).toBe('Paid');
    });

    it('returns Overdue when due date is past', () => {
      expect(storage.getInvoiceStatus({ status: 'sent', dueDate: '2020-01-01' })).toBe('Overdue');
    });

    it('returns Due Today when due date is today', () => {
      const today = new Date().toISOString().split('T')[0];
      expect(storage.getInvoiceStatus({ status: 'sent', dueDate: today })).toBe('Due Today');
    });

    it('returns Pending when due date is future', () => {
      expect(storage.getInvoiceStatus({ status: 'sent', dueDate: '2099-12-31' })).toBe('Pending');
    });
  });

  describe('searchInvoices()', () => {
    it('finds invoices by client name', () => {
      storage.saveInvoice({ id: 'inv-1', clientName: 'Acme Corp' });
      storage.saveInvoice({ id: 'inv-2', clientName: 'Beta Inc' });
      const results = storage.searchInvoices('acme');
      expect(results).toHaveLength(1);
      expect(results[0].clientName).toBe('Acme Corp');
    });

    it('finds invoices by invoice number', () => {
      storage.saveInvoice({ id: 'inv-1', invoiceNumber: 'INV-001' });
      const results = storage.searchInvoices('INV-001');
      expect(results).toHaveLength(1);
    });
  });

  describe('client management', () => {
    it('saves and retrieves clients', () => {
      storage.saveClient({ id: 'c1', name: 'Client A', email: 'a@test.com' });
      const clients = storage.getClients();
      expect(clients).toHaveLength(1);
      expect(clients[0].name).toBe('Client A');
    });

    it('updates existing client by id', () => {
      storage.saveClient({ id: 'c1', name: 'Client A' });
      storage.saveClient({ id: 'c1', name: 'Client A Updated' });
      expect(storage.getClients()).toHaveLength(1);
      expect(storage.getClients()[0].name).toBe('Client A Updated');
    });

    it('deletes a client', () => {
      storage.saveClient({ id: 'c1', name: 'Client A' });
      storage.saveClient({ id: 'c2', name: 'Client B' });
      expect(storage.deleteClient('c1')).toBe(true);
      expect(storage.getClients()).toHaveLength(1);
    });

    it('clears all clients', () => {
      storage.saveClient({ id: 'c1', name: 'Client A' });
      expect(storage.clearAllClients()).toBe(true);
      expect(storage.getClients()).toEqual([]);
    });

    it('rejects client without name', () => {
      expect(storage.saveClient({ email: 'test@test.com' })).toBe(false);
    });
  });
});
