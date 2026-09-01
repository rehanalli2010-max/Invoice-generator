# Invoice Generator

A professional invoice generator built with HTML, CSS, and JavaScript.

## Features

### Core Features
- **Complete Invoice Creation**: Fill in company info, client details, line items, tax, and discount
- **Dynamic Line Items**: Add, remove, and edit items with real-time calculations
- **Real-time Preview**: See invoice updates live as you type
- **Multiple Currencies**: Support for USD, EUR, GBP, CAD, AUD, INR, JPY
- **Tax & Discount Options**: Percentage or fixed amount calculations
- **Responsive Design**: Works on desktop, tablet, and mobile
- **Print/PDF Export**: Professional invoice printing

### Advanced Features
- **Invoice History**: Save and load previous invoices
- **LocalStorage**: Data persistence in browser
- **JSON Export/Import**: Backup and restore invoices
- **Form Validation**: Required field validation and error messages
- **Notifications**: User-friendly feedback for actions
- **Print Styles**: Optimized printing with @media print

### Professional Design
- Clean, modern UI with professional color scheme
- Professional invoice template with company branding
- Accessible form elements and controls
- Mobile-responsive layout
- Smooth animations and transitions

## File Structure

```
invoice-generator/
├── index.html          # Main HTML structure
├── css/
│   └── style.css      # All styling and responsive design
├── js/
│   ├── app.js         # Main application logic and UI handling
│   ├── invoice.js     # Invoice calculation and formatting
│   └── storage.js     # LocalStorage management and data persistence
└── README.md          # This documentation
```

## Quick Start

1. Open `index.html` in any modern web browser
2. Fill in the company and client information
3. Add line items (description, quantity, price)
4. Configure tax and discount as needed
5. Use the preview to see the final invoice
6. Save, print, or export as needed

## Usage Guide

### Creating an Invoice
1. **Company Information**: Enter your company details
2. **Client Information**: Fill in client details (required fields marked with *)
3. **Invoice Details**: Set invoice number, dates, currency, and payment terms
4. **Line Items**: Add products/services with quantity and price
5. **Tax & Discount**: Configure tax and discount settings
6. **Review**: Check the live preview on the right side

### Actions
- **Save Draft**: Saves invoice to browser storage
- **Preview**: Updates the invoice preview
- **Print/PDF**: Opens print dialog for professional invoice
- **Export JSON**: Downloads invoice as JSON file
- **Reset**: Clears form and starts fresh
- **History**: View and manage saved invoices

### Invoice Management
- **History Modal**: View all saved invoices with status indicators
- **Load**: Click "Load" to restore any saved invoice
- **Delete**: Remove invoices from history
- **Clear All**: Delete all saved invoices (irreversible)

## Browser Compatibility

Works in all modern browsers including:
- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## Storage

- Uses `localStorage` for data persistence
- Data remains even after browser restart
- Each invoice saved with timestamp and metadata
- Export/import functionality for backup

## Printing Tips

1. Click "Print/PDF" button
2. Browser print dialog will open
3. Select "Save as PDF" option for digital copies
4. Choose appropriate paper size (A4 or Letter)
5. Ensure "Background graphics" is enabled for colors

## Development

### Adding New Features
1. **New Fields**: Add to `Invoice` class in `invoice.js`
2. **UI Elements**: Add to HTML form and connect in `app.js`
3. **Styling**: Add CSS rules in `style.css`

### Code Structure
- **invoice.js**: Business logic and calculations
- **storage.js**: Data persistence and management
- **app.js**: UI interactions and application flow

### Styling Conventions
- CSS Custom Properties (variables) for theming
- Mobile-first responsive design
- BEM-like class naming for components
- Print-specific styles with `@media print`

## License

Free to use for personal and commercial projects.

## Support

For issues or feature requests, please check the code documentation or create an issue in the repository.

---

**Tip**: Always validate your invoice data before printing or saving. Required fields are marked with asterisks (*).
