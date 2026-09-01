// server/utils/invoiceEmailTemplate.js
const { escapeHtml } = require('./crypto'); // hmm crypto.js doesn't have escapeHtml. Let's make it self contained.

function escapeHtmlStr(str) {
  if (str === null || str === undefined) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function recalculateTotals(inv) {
  let subtotal = 0;
  (inv.items || []).forEach(item => {
    subtotal += (item.quantity || 0) * (item.unitPrice || 0);
  });
  let discountAmount = 0;
  if (inv.discountType === 'percentage') {
      discountAmount = subtotal * ((inv.discountValue || 0) / 100);
  } else if (inv.discountType === 'fixed') {
      discountAmount = inv.discountValue || 0;
  }
  const taxable = subtotal - discountAmount;
  let taxAmount = 0;
  if (inv.taxType === 'percentage') {
      taxAmount = taxable * ((inv.taxRate || 0) / 100);
  } else if (inv.taxType === 'fixed') {
      taxAmount = inv.taxRate || 0;
  }

  const baseTotal = taxable + taxAmount;
  let lateFeeAmount = 0;
  if (inv.lateFeeType && inv.lateFeeType !== 'none') {
      if (inv.lateFeeType === 'percentage') {
          lateFeeAmount = baseTotal * ((inv.lateFeeValue || 0) / 100);
      } else if (inv.lateFeeType === 'fixed') {
          lateFeeAmount = (inv.lateFeeValue || 0);
      }
  }

  inv.taxAmount = taxAmount;
  inv.discountAmount = discountAmount;
  inv.lateFeeAmount = lateFeeAmount;
  inv.total = baseTotal + lateFeeAmount;
}

function generateInvoiceHTML(invoiceData) {
  const inv = invoiceData;
  const symbol = {
    'USD': '$', 'EUR': '€', 'GBP': '£', 'CAD': 'C$',
    'AUD': 'A$', 'INR': '₹', 'JPY': '¥'
  }[inv.currency] || '$';
  const decimals = inv.currency === 'JPY' ? 0 : 2;
  const fmt = n => symbol + n.toFixed(decimals);

  let subtotal = 0;
  const itemsHTML = (inv.items || []).map(item => {
    const qty = item.quantity || 0;
    const price = item.unitPrice || 0;
    const amount = qty * price;
    subtotal += amount;
    return \`
    <tr>
      <td style="padding:8px;border-bottom:1px solid #ddd;">\${escapeHtmlStr(item.description)}</td>
      <td style="padding:8px;border-bottom:1px solid #ddd;text-align:right;">\${qty.toFixed(2)}</td>
      <td style="padding:8px;border-bottom:1px solid #ddd;text-align:right;">\${fmt(price)}</td>
      <td style="padding:8px;border-bottom:1px solid #ddd;text-align:right;">\${fmt(amount)}</td>
    </tr>
  \`;
  }).join('');

  let discountAmount = 0;
  if (inv.discountType === 'percentage') {
      discountAmount = subtotal * ((inv.discountValue || 0) / 100);
  } else if (inv.discountType === 'fixed') {
      discountAmount = inv.discountValue || 0;
  }

  const taxable = subtotal - discountAmount;
  let taxAmount = 0;
  if (inv.taxType === 'percentage') {
      taxAmount = taxable * ((inv.taxRate || 0) / 100);
  } else if (inv.taxType === 'fixed') {
      taxAmount = inv.taxRate || 0;
  }

  const baseTotal = taxable + taxAmount;
  let lateFeeAmount = 0;
  if (inv.lateFeeType && inv.lateFeeType !== 'none') {
      if (inv.lateFeeType === 'percentage') {
          lateFeeAmount = baseTotal * ((inv.lateFeeValue || 0) / 100);
      } else if (inv.lateFeeType === 'fixed') {
          lateFeeAmount = (inv.lateFeeValue || 0);
      }
  }

  const total = baseTotal + lateFeeAmount;

  return \`
    <div style="font-family:Arial,sans-serif;max-width:700px;margin:0 auto;padding:20px;">
      <div style="text-align:center;margin-bottom:30px;">
        <h1 style="color:#333;margin:0;">\${escapeHtmlStr(inv.documentType || 'Invoice')}</h1>
        <p style="color:#666;font-size:18px;">#\${escapeHtmlStr(inv.invoiceNumber)}</p>
      </div>
      <div style="margin-bottom:20px;">
        <h3 style="color:#555;">From</h3>
        <p style="margin:0;">\${escapeHtmlStr(inv.companyName)}<br>\${escapeHtmlStr(inv.companyAddress)}<br>\${escapeHtmlStr(inv.companyEmail)}</p>
      </div>
      <div style="margin-bottom:20px;">
        <h3 style="color:#555;">To</h3>
        <p style="margin:0;">\${escapeHtmlStr(inv.clientName)}<br>\${escapeHtmlStr(inv.clientAddress)}<br>\${escapeHtmlStr(inv.clientEmail)}</p>
      </div>
      <table style="width:100%;border-collapse:collapse;margin-bottom:20px;">
        <thead>
          <tr style="background:#f5f5f5;">
            <th style="padding:10px;text-align:left;">Description</th>
            <th style="padding:10px;text-align:right;">Qty</th>
            <th style="padding:10px;text-align:right;">Rate</th>
            <th style="padding:10px;text-align:right;">Amount</th>
          </tr>
        </thead>
        <tbody>\${itemsHTML}</tbody>
      </table>
      <div style="text-align:right;font-size:16px;">
        <p>Subtotal: \${fmt(subtotal)}</p>
        \${inv.taxType !== 'none' ? \`<p>Tax: \${fmt(taxAmount)}</p>\` : ''}
        \${inv.discountType !== 'none' ? \`<p>Discount: -\${fmt(discountAmount)}</p>\` : ''}
        \${inv.lateFeeType && inv.lateFeeType !== 'none' ? \`<p>Late Fee: \${fmt(lateFeeAmount)}</p>\` : ''}
        <p style="font-size:20px;font-weight:bold;">Total: \${fmt(total)}</p>
      </div>
      \${inv.paymentLinkUrl && inv.documentType !== 'Receipt' && inv.documentType !== 'Estimate' && inv.documentType !== 'Quote'
        ? \`<div style="text-align:center;margin-top:20px;"><a href="\${escapeHtmlStr(inv.paymentLinkUrl)}" style="background:#5e6ad2;color:#fff;padding:12px 24px;text-decoration:none;border-radius:4px;font-weight:bold;display:inline-block;">Pay Now</a></div>\`
        : ''}
      \${inv.notes ? \`<div style="margin-top:20px;padding:15px;background:#f9f9f9;border-radius:5px;"><p style="margin:0;">\${escapeHtmlStr(inv.notes)}</p></div>\` : ''}
      <div style="margin-top:30px;text-align:center;color:#999;font-size:12px;">
        <p>Generated by Invoice Generator</p>
      </div>
    </div>
  \`;
}

module.exports = {
    recalculateTotals,
    generateInvoiceHTML,
    escapeHtml: escapeHtmlStr
};
