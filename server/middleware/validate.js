function validateInvoice(req, res, next) {
  const { data } = req.body;
  if (!data) {
    return res.status(400).json({ error: 'Invoice data required' });
  }

  const errors = [];

  if (data.invoiceNumber !== undefined && (typeof data.invoiceNumber !== 'string' || data.invoiceNumber.trim().length === 0 || data.invoiceNumber.trim().length > 100)) {
    errors.push('Invoice number must be a string (max 100 chars)');
  }

  if (data.clientName !== undefined && (typeof data.clientName !== 'string' || data.clientName.length > 500)) {
    errors.push('Client name must be a string (max 500 chars)');
  }

  if (data.items !== undefined) {
    if (!Array.isArray(data.items)) {
      errors.push('Items must be an array');
    } else {
      data.items.forEach((item, i) => {
        if (item.description !== undefined && typeof item.description !== 'string') {
          errors.push(`Item ${i + 1}: description must be a string`);
        }
        if (item.quantity !== undefined && (typeof item.quantity !== 'number' || item.quantity < 0)) {
          errors.push(`Item ${i + 1}: quantity must be a non-negative number`);
        }
        if (item.unitPrice !== undefined && (typeof item.unitPrice !== 'number' || item.unitPrice < 0)) {
          errors.push(`Item ${i + 1}: unit price must be a non-negative number`);
        }
      });
    }
  }

  if (data.taxType !== undefined && !['none', 'percentage', 'fixed'].includes(data.taxType)) {
    errors.push('Invalid tax type');
  }

  if (data.discountType !== undefined && !['none', 'percentage', 'fixed'].includes(data.discountType)) {
    errors.push('Invalid discount type');
  }

  if (data.taxRate !== undefined) {
    const rate = Number(data.taxRate);
    if (data.taxType === 'percentage' && (isNaN(rate) || rate < 0 || rate > 100)) {
      errors.push('Percentage tax rate must be between 0 and 100');
    }
    if (data.taxType === 'fixed' && (isNaN(rate) || rate < 0)) {
      errors.push('Fixed tax amount must be non-negative');
    }
  }

  if (data.discountValue !== undefined) {
    const val = Number(data.discountValue);
    if (data.discountType === 'percentage' && (isNaN(val) || val < 0 || val > 100)) {
      errors.push('Percentage discount must be between 0 and 100');
    }
    if (data.discountType === 'fixed' && (isNaN(val) || val < 0)) {
      errors.push('Fixed discount must be non-negative');
    }
  }

  if (data.invoiceDate && isNaN(Date.parse(data.invoiceDate))) {
    errors.push('Invalid invoice date');
  }

  if (data.dueDate && isNaN(Date.parse(data.dueDate))) {
    errors.push('Invalid due date');
  }

  if (data.currency !== undefined && !['USD', 'EUR', 'GBP', 'CAD', 'AUD', 'INR', 'JPY'].includes(data.currency)) {
    errors.push('Invalid currency');
  }

  if (data.documentType !== undefined && !['Invoice', 'Estimate', 'Quote', 'Receipt'].includes(data.documentType)) {
    errors.push('Invalid document type');
  }

  if (data.recurring !== undefined && !['none', 'weekly', 'monthly', 'quarterly'].includes(data.recurring)) {
    errors.push('Invalid recurring option');
  }

  if (data.notes !== undefined && (typeof data.notes !== 'string' || data.notes.length > 5000)) {
    errors.push('Notes too long (max 5000 chars)');
  }

  if (data.companyName !== undefined && typeof data.companyName !== 'string') {
    errors.push('Company name must be a string');
  }

  // Validate companyLogo - must be valid base64 image (PNG/JPEG) under 2MB
  if (data.companyLogo !== undefined && data.companyLogo !== '') {
    if (typeof data.companyLogo !== 'string') {
      errors.push('Company logo must be a string');
    } else {
      // Check if it's a data URL
      const dataUrlMatch = data.companyLogo.match(/^data:image\/(png|jpeg|jpg);base64,(.+)$/);
      if (!dataUrlMatch) {
        errors.push('Company logo must be a valid base64 encoded PNG or JPEG image');
      } else {
        // Check size: base64 is ~33% larger than binary, so 2MB base64 ≈ 2.6MB string
        const base64Data = dataUrlMatch[2];
        const approxBytes = base64Data.length * 0.75;
        if (approxBytes > 2 * 1024 * 1024) {
          errors.push('Company logo exceeds 2MB size limit');
        }
      }
    }
  }

  if (errors.length > 0) {
    return res.status(400).json({ error: 'Validation failed', details: errors });
  }

  next();
}

function validateClient(req, res, next) {
  const { name } = req.body;
  if (!name || typeof name !== 'string' || !name.trim()) {
    return res.status(400).json({ error: 'Client name is required' });
  }
  if (name.trim().length > 500) {
    return res.status(400).json({ error: 'Client name too long (max 500 chars)' });
  }
  next();
}

function validateEmailConfig(req, res, next) {
  const { host, user, pass } = req.body;
  if (!host || typeof host !== 'string' || !host.trim()) {
    return res.status(400).json({ error: 'SMTP host is required' });
  }
  if (!user || typeof user !== 'string' || !user.trim()) {
    return res.status(400).json({ error: 'SMTP user is required' });
  }
  if (!pass || typeof pass !== 'string') {
    return res.status(400).json({ error: 'SMTP password is required' });
  }
  next();
}

module.exports = { validateInvoice, validateClient, validateEmailConfig };