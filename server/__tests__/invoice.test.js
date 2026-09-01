const Invoice = require('../../js/invoice.js').default;

describe('Invoice', () => {
  function makeInvoice(overrides = {}) {
    return new Invoice({
      invoiceNumber: 'INV-001',
      invoiceDate: '2025-01-15',
      dueDate: '2025-02-15',
      clientName: 'Test Client',
      items: [
        { description: 'Item 1', quantity: 2, unitPrice: 50 },
        { description: 'Item 2', quantity: 1, unitPrice: 100 },
      ],
      ...overrides,
    });
  }

  describe('getSubtotal()', () => {
    it('calculates subtotal from line items', () => {
      const inv = makeInvoice();
      expect(inv.getSubtotal()).toBe(200);
    });

    it('returns 0 for empty items', () => {
      const inv = makeInvoice({ items: [] });
      expect(inv.getSubtotal()).toBe(0);
    });

    it('handles decimal quantities and prices', () => {
      const inv = makeInvoice({
        items: [{ description: 'Service', quantity: 1.5, unitPrice: 33.33 }],
      });
      expect(inv.getSubtotal()).toBeCloseTo(49.995, 2);
    });
  });

  describe('getTaxAmount()', () => {
    it('returns 0 when taxType is none', () => {
      const inv = makeInvoice({ taxType: 'none' });
      expect(inv.getTaxAmount()).toBe(0);
    });

    it('calculates percentage tax', () => {
      const inv = makeInvoice({ taxType: 'percentage', taxRate: 10 });
      expect(inv.getTaxAmount()).toBe(20);
    });

    it('returns fixed tax amount', () => {
      const inv = makeInvoice({ taxType: 'fixed', taxRate: 25 });
      expect(inv.getTaxAmount()).toBe(25);
    });
  });

  describe('getDiscountAmount()', () => {
    it('returns 0 when discountType is none', () => {
      const inv = makeInvoice({ discountType: 'none' });
      expect(inv.getDiscountAmount()).toBe(0);
    });

    it('calculates percentage discount', () => {
      const inv = makeInvoice({ discountType: 'percentage', discountValue: 15 });
      expect(inv.getDiscountAmount()).toBe(30);
    });

    it('returns fixed discount amount', () => {
      const inv = makeInvoice({ discountType: 'fixed', discountValue: 50 });
      expect(inv.getDiscountAmount()).toBe(50);
    });
  });

  describe('getTotal()', () => {
    it('returns subtotal when no tax or discount', () => {
      const inv = makeInvoice();
      expect(inv.getTotal()).toBe(200);
    });

    it('applies discount before tax (percentage discount + percentage tax)', () => {
      const inv = makeInvoice({
        discountType: 'percentage',
        discountValue: 10,
        taxType: 'percentage',
        taxRate: 20,
      });
      // subtotal=200, discount=20, discounted=180, tax=36, total=216
      expect(inv.getTotal()).toBe(216);
    });

    it('applies fixed discount and fixed tax', () => {
      const inv = makeInvoice({
        discountType: 'fixed',
        discountValue: 20,
        taxType: 'fixed',
        taxRate: 10,
      });
      // subtotal=200, discount=20, discounted=180, tax=10, total=190
      expect(inv.getTotal()).toBe(190);
    });

    it('handles discount only (no tax)', () => {
      const inv = makeInvoice({
        discountType: 'percentage',
        discountValue: 25,
        taxType: 'none',
      });
      // subtotal=200, discount=50, total=150
      expect(inv.getTotal()).toBe(150);
    });
  });

  describe('validate()', () => {
    it('passes for a valid invoice', () => {
      const inv = makeInvoice();
      const result = inv.validate();
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('fails when invoice number is empty', () => {
      const inv = makeInvoice({ invoiceNumber: '  ' });
      const result = inv.validate();
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Invoice number is required');
    });

    it('fails when client name is empty (non-draft)', () => {
      const inv = makeInvoice({ clientName: '' });
      const result = inv.validate(false);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Client name is required');
    });

    it('passes when client name is empty (draft)', () => {
      const inv = makeInvoice({ clientName: '' });
      const result = inv.validate(true);
      expect(result.isValid).toBe(true);
    });

    it('fails when due date is before invoice date', () => {
      const inv = makeInvoice({
        invoiceDate: '2025-06-01',
        dueDate: '2025-05-01',
      });
      const result = inv.validate();
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Due date must be after invoice date');
    });

    it('fails when items have negative quantity', () => {
      const inv = makeInvoice({
        items: [{ description: 'Bad', quantity: -1, unitPrice: 10 }],
      });
      const result = inv.validate();
      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.includes('Quantity cannot be negative'))).toBe(true);
    });

    it('fails when percentage tax rate is out of range', () => {
      const inv = makeInvoice({ taxType: 'percentage', taxRate: 150 });
      const result = inv.validate();
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Tax rate must be between 0 and 100%');
    });

    it('fails when percentage discount is out of range', () => {
      const inv = makeInvoice({ discountType: 'percentage', discountValue: -5 });
      const result = inv.validate();
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Discount percentage must be between 0 and 100%');
    });
  });

  describe('escapeHtml()', () => {
    it('escapes HTML special characters', () => {
      const inv = makeInvoice();
      expect(inv.escapeHtml('<script>alert("xss")</script>')).toBe(
        '&lt;script&gt;alert(&quot;xss&quot;)&lt;/script&gt;'
      );
    });

    it('escapes single quotes and ampersands', () => {
      const inv = makeInvoice();
      expect(inv.escapeHtml("O'Brien & Co")).toBe("O&#039;Brien &amp; Co");
    });

    it('returns empty string for null/undefined', () => {
      const inv = makeInvoice();
      expect(inv.escapeHtml(null)).toBe('');
      expect(inv.escapeHtml(undefined)).toBe('');
    });

    it('converts numbers to string', () => {
      const inv = makeInvoice();
      expect(inv.escapeHtml(42)).toBe('42');
    });
  });

  describe('sanitizeUrl()', () => {
    it('blocks javascript: URLs', () => {
      const inv = makeInvoice();
      expect(inv.sanitizeUrl('javascript:alert(1)')).toBe('');
    });

    it('blocks data: URLs', () => {
      const inv = makeInvoice();
      expect(inv.sanitizeUrl('data:text/html,<script>alert(1)</script>')).toBe('');
    });

    it('blocks vbscript: URLs', () => {
      const inv = makeInvoice();
      expect(inv.sanitizeUrl('vbscript:MsgBox(1)')).toBe('');
    });

    it('allows http/https URLs', () => {
      const inv = makeInvoice();
      expect(inv.sanitizeUrl('https://example.com')).toBe('https://example.com');
    });

    it('returns empty string for falsy input', () => {
      const inv = makeInvoice();
      expect(inv.sanitizeUrl('')).toBe('');
      expect(inv.sanitizeUrl(null)).toBe('');
    });
  });

  describe('toJSON()', () => {
    it('serializes all fields including computed totals', () => {
      const inv = makeInvoice({
        companyName: 'Acme Corp',
        notes: 'Thank you for your business',
      });
      const json = inv.toJSON();
      expect(json.companyName).toBe('Acme Corp');
      expect(json.invoiceNumber).toBe('INV-001');
      expect(json.subtotal).toBe(200);
      expect(json.total).toBe(200);
      expect(json.items).toHaveLength(2);
    });
  });

  describe('fromJSON()', () => {
    it('reconstructs an Invoice from JSON', () => {
      const inv = makeInvoice();
      const json = inv.toJSON();
      const restored = Invoice.fromJSON(json);
      expect(restored).toBeInstanceOf(Invoice);
      expect(restored.invoiceNumber).toBe('INV-001');
      expect(restored.getSubtotal()).toBe(200);
    });
  });

  describe('addItem / removeItem / updateItem', () => {
    it('adds an item', () => {
      const inv = makeInvoice({ items: [] });
      inv.addItem('New service', 3, 25);
      expect(inv.items).toHaveLength(1);
      expect(inv.items[0].description).toBe('New service');
      expect(inv.getSubtotal()).toBe(75);
    });

    it('removes an item by id', () => {
      const inv = makeInvoice();
      const id = inv.items[0].id;
      inv.removeItem(id);
      expect(inv.items).toHaveLength(1);
      expect(inv.items[0].description).toBe('Item 2');
    });

    it('updates an item by id', () => {
      const inv = makeInvoice();
      const id = inv.items[0].id;
      inv.updateItem(id, { quantity: 5, unitPrice: 20 });
      expect(inv.items[0].quantity).toBe(5);
      expect(inv.items[0].unitPrice).toBe(20);
      expect(inv.getSubtotal()).toBe(200);
    });

    it('ignores id in update payload', () => {
      const inv = makeInvoice();
      const originalId = inv.items[0].id;
      inv.updateItem(originalId, { id: 'hacked', quantity: 10 });
      expect(inv.items[0].id).toBe(originalId);
    });
  });

  describe('getCurrencySymbol()', () => {
    it('returns $ for USD', () => {
      const inv = makeInvoice({ currency: 'USD' });
      expect(inv.getCurrencySymbol()).toBe('$');
    });

    it('returns € for EUR', () => {
      const inv = makeInvoice({ currency: 'EUR' });
      expect(inv.getCurrencySymbol()).toBe('€');
    });

    it('returns currency code for unknown', () => {
      const inv = makeInvoice({ currency: 'XYZ' });
      expect(inv.getCurrencySymbol()).toBe('XYZ');
    });
  });
});
