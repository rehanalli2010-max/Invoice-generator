/**
 * Internationalization (i18n) Module
 * Supports EN, ES, FR with locale-aware formatting
 */
const i18n = {
    currentLocale: 'en',
    locales: {
        en: {
            code: 'en',
            name: 'English',
            nativeName: 'English',
            currencyLocale: 'en-US',
            labels: {
                invoice: 'Invoice',
                estimate: 'Estimate',
                quote: 'Quote',
                receipt: 'Receipt',
                from: 'From',
                billedTo: 'Billed To',
                dateIssued: 'Date Issued',
                dateDue: 'Date Due',
                terms: 'Terms',
                currency: 'Currency',
                description: 'Description',
                qty: 'Qty',
                unit: 'Unit',
                rate: 'Rate',
                amount: 'Amount',
                subtotal: 'Subtotal',
                tax: 'Tax',
                discount: 'Discount',
                total: 'Total',
                amountDue: 'Amount Due',
                notes: 'Notes / Payment Information',
                signature: 'Authorized Signature',
                payNow: 'Pay Now',
                status: {
                    draft: 'Draft',
                    sent: 'Sent',
                    paid: 'Paid',
                    overdue: 'Overdue',
                    pending: 'Pending',
                    dueToday: 'Due Today'
                },
                actions: {
                    send: 'Send to Client',
                    duplicate: 'Duplicate',
                    markPaid: 'Mark Paid',
                    markUnpaid: 'Mark Unpaid',
                    load: 'Load',
                    delete: 'Delete',
                    save: 'Save',
                    cancel: 'Cancel',
                    close: 'Close'
                },
                email: {
                    configure: 'Configure Email',
                    host: 'SMTP Host',
                    port: 'Port',
                    secure: 'Use SSL/TLS',
                    user: 'Username',
                    pass: 'Password',
                    fromName: 'From Name',
                    fromEmail: 'From Email',
                    save: 'Save Settings',
                    test: 'Test Connection',
                    sending: 'Sending...',
                    sent: 'Invoice sent successfully!'
                },
                charts: {
                    revenueOverTime: 'Revenue Over Time',
                    statusBreakdown: 'Status Breakdown',
                    topClients: 'Top Clients',
                    noData: 'No data available'
                },
                customFields: {
                    title: 'Custom Fields',
                    addField: 'Add Field',
                    fieldName: 'Field Name',
                    fieldValue: 'Field Value',
                    remove: 'Remove'
                },
                recurring: {
                    none: 'One-time',
                    weekly: 'Weekly',
                    monthly: 'Monthly',
                    quarterly: 'Quarterly'
                },
                nav: {
                    analytics: 'Analytics',
                    dashboard: 'Dashboard',
                    newInvoice: 'New Invoice',
                    history: 'History',
                    clients: 'Clients',
                    pricing: 'Pricing',
                    toggleTheme: 'Toggle Theme',
                    signIn: 'Sign In',
                    signOut: 'Sign Out',
                    upgrade: 'Upgrade to Pro'
                },
                dashboard: {
                    greeting: 'Overview',
                    subtitle: 'Stay updated with your store\'s performance today.',
                    viewReport: 'View Full Report',
                    keyInsights: 'Key Insights',
                    allTimeRevenue: 'All-time Revenue',
                    websiteVisits: 'Website Visits',
                    currentVisits: 'Current Visits',
                    visitor: 'Visitor',
                    conversionRate: 'Conversion Rate',
                    adClicks: 'Ad Campaign Clicks',
                    vsLastMonth: 'vs last month',
                    vsLastYear: 'vs last year',
                    revenue: 'Revenue',
                    revenueCosts: 'Paid vs Outstanding',
                    paid: 'Paid',
                    outstanding: 'Outstanding',
                    statusBreakdown: 'Status Breakdown',
                    topClients: 'Top Clients',
                    noData: 'No data available',
                    totalInvoices: 'Total Invoices',
                    pendingInvoices: 'Pending Invoices',
                    overdueInvoices: 'Overdue Invoices',
                    averageInvoice: 'Average Invoice',
                    totalRevenue: 'Total Revenue',
                    search: 'Search...'
                },
                invoiceForm: {
                    createInvoice: 'Create Invoice',
                    companyInfo: 'Company Information',
                    companyName: 'Company Name',
                    companyEmail: 'Company Email',
                    companyPhone: 'Company Phone',
                    companyAddress: 'Company Address',
                    companyLogo: 'Company Logo (Upload Image)',
                    invoiceTheme: 'Invoice Theme',
                    clientInfo: 'Client Information',
                    clientName: 'Client Name',
                    clientEmail: 'Client Email',
                    clientPhone: 'Client Phone',
                    clientAddress: 'Client Address',
                    savedClients: 'Saved Clients',
                    selectClient: '-- Select a saved client --',
                    saveClient: 'Save Client',
                    manageClients: 'Manage Clients',
                    documentDetails: 'Document Details',
                    documentType: 'Document Type',
                    number: 'Number',
                    date: 'Date',
                    dueDate: 'Due Date',
                    currency: 'Currency',
                    paymentTerms: 'Payment Terms',
                    paymentLink: 'Payment Collection Link (Optional)',
                    recurring: 'Recurring',
                    notes: 'Notes / Payment Information',
                    lineItems: 'Line Items',
                    description: 'Description',
                    unit: 'Unit',
                    quantity: 'Quantity',
                    unitPrice: 'Unit Price',
                    amount: 'Amount',
                    action: 'Action',
                    addItem: '+ Add Item',
                    taxDiscount: 'Tax & Discount',
                    taxType: 'Tax Type',
                    taxRate: 'Tax Rate/Amount',
                    discountType: 'Discount Type',
                    discountValue: 'Discount Value',
                    signature: 'Authorize Signature',
                    signHere: 'Sign below (Using mouse or finger)',
                    clearSignature: 'Clear Signature',
                    saveDraft: 'Save Draft',
                    print: 'Print',
                    downloadImage: 'Download Image',
                    downloadPDF: 'Download PDF',
                    exportJSON: 'Export JSON',
                    reset: 'Reset',
                    required: 'Required'
                },
                history: {
                    title: 'Analytics',
                    search: 'Search by client, number, email...',
                    importJSON: 'Import JSON',
                    exportAll: 'Export All',
                    noInvoices: 'No invoices saved yet',
                    totalRevenue: 'Total Revenue',
                    pendingInvoices: 'Pending Invoices',
                    overdueInvoices: 'Overdue Invoices',
                    totalInvoices: 'Total Invoices',
                    averageInvoice: 'Average Invoice'
                },
                common: {
                    loading: 'Loading...',
                    saving: 'Saving...',
                    success: 'Success',
                    error: 'Error',
                    confirm: 'Confirm',
                    cancel: 'Cancel',
                    close: 'Close',
                    areYouSure: 'Are you sure?',
                    noClient: 'No client',
                    all: 'All',
                    export: 'Export',
                    delete: 'Delete',
                    selected: 'Selected'
                }
            }
        },
        es: {
            code: 'es',
            name: 'Spanish',
            nativeName: 'Español',
            currencyLocale: 'es-ES',
            labels: {
                invoice: 'Factura',
                estimate: 'Presupuesto',
                quote: 'Cotización',
                receipt: 'Recibo',
                from: 'De',
                billedTo: 'Facturado A',
                dateIssued: 'Fecha de Emisión',
                dateDue: 'Fecha de Vencimiento',
                terms: 'Términos',
                currency: 'Moneda',
                description: 'Descripción',
                qty: 'Cant',
                unit: 'Unidad',
                rate: 'Precio',
                amount: 'Importe',
                subtotal: 'Subtotal',
                tax: 'Impuesto',
                discount: 'Descuento',
                total: 'Total',
                amountDue: 'Monto Adeudado',
                notes: 'Notas / Información de Pago',
                signature: 'Firma Autorizada',
                payNow: 'Pagar Ahora',
                status: {
                    draft: 'Borrador',
                    sent: 'Enviado',
                    paid: 'Pagado',
                    overdue: 'Vencido',
                    pending: 'Pendiente',
                    dueToday: 'Vence Hoy'
                },
                actions: {
                    send: 'Enviar al Cliente',
                    duplicate: 'Duplicar',
                    markPaid: 'Marcar Pagado',
                    markUnpaid: 'Marcar No Pagado',
                    load: 'Cargar',
                    delete: 'Eliminar',
                    save: 'Guardar',
                    cancel: 'Cancelar',
                    close: 'Cerrar'
                },
                email: {
                    configure: 'Configurar Correo',
                    host: 'Servidor SMTP',
                    port: 'Puerto',
                    secure: 'Usar SSL/TLS',
                    user: 'Usuario',
                    pass: 'Contraseña',
                    fromName: 'Nombre Remitente',
                    fromEmail: 'Correo Remitente',
                    save: 'Guardar Configuración',
                    test: 'Probar Conexión',
                    sending: 'Enviando...',
                    sent: '¡Factura enviada exitosamente!'
                },
                charts: {
                    revenueOverTime: 'Ingresos en el Tiempo',
                    statusBreakdown: 'Desglose de Estados',
                    topClients: 'Principales Clientes',
                    noData: 'No hay datos disponibles'
                },
                customFields: {
                    title: 'Campos Personalizados',
                    addField: 'Agregar Campo',
                    fieldName: 'Nombre del Campo',
                    fieldValue: 'Valor del Campo',
                    remove: 'Eliminar'
                },
                recurring: {
                    none: 'Una Vez',
                    weekly: 'Semanal',
                    monthly: 'Mensual',
                    quarterly: 'Trimestral'
                },
                nav: {
                    analytics: 'Analíticas',
                    newInvoice: 'Nueva Factura',
                    history: 'Historial',
                    clients: 'Clientes',
                    pricing: 'Precios',
                    toggleTheme: 'Cambiar Tema',
                    signIn: 'Iniciar Sesión',
                    signOut: 'Cerrar Sesión',
                    upgrade: 'Actualizar a Pro'
                },
                dashboard: {
                    greeting: 'Buenos días',
                    subtitle: 'Manténgase al día con el rendimiento de su tienda.',
                    viewReport: 'Ver Informe Completo',
                    keyInsights: 'Información Clave',
                    allTimeRevenue: 'Ingresos Totales',
                    websiteVisits: 'Visitas al Sitio',
                    currentVisits: 'Visitas Actuales',
                    visitor: 'Visitante',
                    conversionRate: 'Tasa de Conversión',
                    adClicks: 'Clics en Anuncios',
                    vsLastMonth: 'vs mes anterior',
                    vsLastYear: 'vs año anterior',
                    revenue: 'Ingresos',
                    revenueCosts: 'Pagado vs Pendiente',
                    paid: 'Pagado',
                    outstanding: 'Pendiente',
                    statusBreakdown: 'Desglose de Estados',
                    topClients: 'Principales Clientes',
                    noData: 'No hay datos disponibles',
                    totalInvoices: 'Facturas Totales',
                    pendingInvoices: 'Facturas Pendientes',
                    overdueInvoices: 'Facturas Vencidas',
                    averageInvoice: 'Factura Promedio',
                    totalRevenue: 'Ingresos Totales',
                    search: 'Buscar...'
                },
                invoiceForm: {
                    createInvoice: 'Crear Factura',
                    companyInfo: 'Información de la Empresa',
                    companyName: 'Nombre de la Empresa',
                    companyEmail: 'Correo de la Empresa',
                    companyPhone: 'Teléfono',
                    companyAddress: 'Dirección',
                    companyLogo: 'Logo (Subir Imagen)',
                    invoiceTheme: 'Tema de Factura',
                    clientInfo: 'Información del Cliente',
                    clientName: 'Nombre del Cliente',
                    clientEmail: 'Correo del Cliente',
                    clientPhone: 'Teléfono',
                    clientAddress: 'Dirección',
                    savedClients: 'Clientes Guardados',
                    selectClient: '-- Seleccionar cliente --',
                    saveClient: 'Guardar Cliente',
                    manageClients: 'Gestionar Clientes',
                    documentDetails: 'Detalles del Documento',
                    documentType: 'Tipo de Documento',
                    number: 'Número',
                    date: 'Fecha',
                    dueDate: 'Fecha de Vencimiento',
                    currency: 'Moneda',
                    paymentTerms: 'Términos de Pago',
                    paymentLink: 'Enlace de Pago (Opcional)',
                    recurring: 'Recurrente',
                    notes: 'Notas / Información de Pago',
                    lineItems: 'Partidas',
                    description: 'Descripción',
                    unit: 'Unidad',
                    quantity: 'Cantidad',
                    unitPrice: 'Precio Unitario',
                    amount: 'Importe',
                    action: 'Acción',
                    addItem: '+ Agregar Partida',
                    taxDiscount: 'Impuesto y Descuento',
                    taxType: 'Tipo de Impuesto',
                    taxRate: 'Tasa/Importe de Impuesto',
                    discountType: 'Tipo de Descuento',
                    discountValue: 'Valor del Descuento',
                    signature: 'Firma Autorizada',
                    signHere: 'Firme abajo (usando mouse o dedo)',
                    clearSignature: 'Limpiar Firma',
                    saveDraft: 'Guardar Borrador',
                    print: 'Imprimir',
                    downloadImage: 'Descargar Imagen',
                    downloadPDF: 'Descargar PDF',
                    exportJSON: 'Exportar JSON',
                    reset: 'Restablecer',
                    required: 'Requerido'
                },
                history: {
                    title: 'Historial y Analíticas',
                    search: 'Buscar por cliente, número, correo...',
                    importJSON: 'Importar JSON',
                    exportAll: 'Exportar Todo',
                    noInvoices: 'No hay facturas guardadas',
                    totalRevenue: 'Ingresos Totales',
                    pendingInvoices: 'Facturas Pendientes',
                    overdueInvoices: 'Facturas Vencidas',
                    totalInvoices: 'Facturas Totales',
                    averageInvoice: 'Factura Promedio'
                },
                common: {
                    loading: 'Cargando...',
                    saving: 'Guardando...',
                    success: 'Éxito',
                    error: 'Error',
                    confirm: 'Confirmar',
                    cancel: 'Cancelar',
                    close: 'Cerrar',
                    areYouSure: '¿Está seguro?',
                    noClient: 'Sin cliente',
                    all: 'Todos',
                    export: 'Exportar',
                    delete: 'Eliminar',
                    selected: 'Seleccionados'
                }
            }
        },
        de: {
            code: 'de',
            name: 'German',
            nativeName: 'Deutsch',
            currencyLocale: 'de-DE',
            labels: {
                invoice: 'Rechnung',
                estimate: 'Kostenvoranschlag',
                quote: 'Angebot',
                receipt: 'Quittung',
                from: 'Von',
                billedTo: 'Rechnung an',
                dateIssued: 'Ausstellungsdatum',
                dateDue: 'Fällig am',
                terms: 'Bedingungen',
                currency: 'Währung',
                description: 'Beschreibung',
                qty: 'Menge',
                unit: 'Einheit',
                rate: 'Preis',
                amount: 'Betrag',
                subtotal: 'Zwischensumme',
                tax: 'Steuer',
                discount: 'Rabatt',
                total: 'Gesamt',
                amountDue: 'Fälliger Betrag',
                notes: 'Notizen / Zahlungsinformationen',
                signature: 'Unterschrift',
                payNow: 'Jetzt bezahlen',
                status: {
                    draft: 'Entwurf',
                    sent: 'Gesendet',
                    paid: 'Bezahlt',
                    overdue: 'Überfällig',
                    pending: 'Ausstehend',
                    dueToday: 'Heute fällig'
                },
                actions: {
                    send: 'An Kunden senden',
                    duplicate: 'Duplizieren',
                    markPaid: 'Als bezahlt markieren',
                    markUnpaid: 'Als unbezahlt markieren',
                    load: 'Laden',
                    delete: 'Löschen',
                    save: 'Speichern',
                    cancel: 'Abbrechen',
                    close: 'Schließen'
                },
                email: {
                    configure: 'E-Mail konfigurieren',
                    host: 'SMTP-Host',
                    port: 'Port',
                    secure: 'SSL/TLS verwenden',
                    user: 'Benutzername',
                    pass: 'Passwort',
                    fromName: 'Absendername',
                    fromEmail: 'Absender-E-Mail',
                    save: 'Einstellungen speichern',
                    test: 'Verbindung testen',
                    sending: 'Senden...',
                    sent: 'Rechnung erfolgreich gesendet!'
                },
                charts: {
                    revenueOverTime: 'Umsatz im Zeitverlauf',
                    statusBreakdown: 'Statusaufteilung',
                    topClients: 'Top-Kunden',
                    noData: 'Keine Daten verfügbar'
                },
                customFields: {
                    title: 'Benutzerdefinierte Felder',
                    addField: 'Feld hinzufügen',
                    fieldName: 'Feldname',
                    fieldValue: 'Feldwert',
                    remove: 'Entfernen'
                },
                recurring: {
                    none: 'Einmalig',
                    weekly: 'Wöchentlich',
                    monthly: 'Monatlich',
                    quarterly: 'Vierteljährlich'
                },
                nav: {
                    analytics: 'Analysen',
                    newInvoice: 'Neue Rechnung',
                    history: 'Verlauf',
                    clients: 'Kunden',
                    pricing: 'Preise',
                    toggleTheme: 'Design wechseln',
                    signIn: 'Anmelden',
                    signOut: 'Abmelden',
                    upgrade: 'Upgrade auf Pro'
                },
                dashboard: {
                    greeting: 'Guten Morgen',
                    subtitle: 'Bleiben Sie mit der Leistung Ihres Shops auf dem Laufenden.',
                    viewReport: 'Vollständigen Bericht anzeigen',
                    keyInsights: 'Wichtige Erkenntnisse',
                    allTimeRevenue: 'Gesamtumsatz',
                    websiteVisits: 'Website-Besuche',
                    currentVisits: 'Aktuelle Besuche',
                    visitor: 'Besucher',
                    conversionRate: 'Konversionsrate',
                    adClicks: 'Anzeigenklicks',
                    vsLastMonth: 'vs. letztem Monat',
                    vsLastYear: 'vs. letztem Jahr',
                    revenue: 'Umsatz',
                    revenueCosts: 'Bezahlt vs Ausstehend',
                    paid: 'Bezahlt',
                    outstanding: 'Ausstehend',
                    statusBreakdown: 'Statusaufteilung',
                    topClients: 'Top-Kunden',
                    noData: 'Keine Daten verfügbar',
                    totalInvoices: 'Rechnungen gesamt',
                    pendingInvoices: 'Ausstehende Rechnungen',
                    overdueInvoices: 'Überfällige Rechnungen',
                    averageInvoice: 'Durchschnittliche Rechnung',
                    totalRevenue: 'Gesamtumsatz',
                    search: 'Suchen...'
                },
                invoiceForm: {
                    createInvoice: 'Rechnung erstellen',
                    companyInfo: 'Unternehmensinformationen',
                    companyName: 'Unternehmensname',
                    companyEmail: 'Unternehmens-E-Mail',
                    companyPhone: 'Telefon',
                    companyAddress: 'Adresse',
                    companyLogo: 'Firmenlogo (Bild hochladen)',
                    invoiceTheme: 'Rechnungsdesign',
                    clientInfo: 'Kundeninformationen',
                    clientName: 'Kundenname',
                    clientEmail: 'Kunden-E-Mail',
                    clientPhone: 'Telefon',
                    clientAddress: 'Adresse',
                    savedClients: 'Gespeicherte Kunden',
                    selectClient: '-- Kunden auswählen --',
                    saveClient: 'Kunden speichern',
                    manageClients: 'Kunden verwalten',
                    documentDetails: 'Dokumentdetails',
                    documentType: 'Dokumenttyp',
                    number: 'Nummer',
                    date: 'Datum',
                    dueDate: 'Fälligkeitsdatum',
                    currency: 'Währung',
                    paymentTerms: 'Zahlungsbedingungen',
                    paymentLink: 'Zahlungslink (optional)',
                    recurring: 'Wiederkehrend',
                    notes: 'Notizen / Zahlungsinformationen',
                    lineItems: 'Positionen',
                    description: 'Beschreibung',
                    unit: 'Einheit',
                    quantity: 'Menge',
                    unitPrice: 'Einzelpreis',
                    amount: 'Betrag',
                    action: 'Aktion',
                    addItem: '+ Position hinzufügen',
                    taxDiscount: 'Steuer & Rabatt',
                    taxType: 'Steuerart',
                    taxRate: 'Steuersatz/-betrag',
                    discountType: 'Rabattart',
                    discountValue: 'Rabattwert',
                    signature: 'Unterschrift',
                    signHere: 'Unterschreiben Sie unten (Maus oder Finger)',
                    clearSignature: 'Unterschrift löschen',
                    saveDraft: 'Entwurf speichern',
                    print: 'Drucken',
                    downloadImage: 'Bild herunterladen',
                    downloadPDF: 'PDF herunterladen',
                    exportJSON: 'JSON exportieren',
                    reset: 'Zurücksetzen',
                    required: 'Erforderlich'
                },
                history: {
                    title: 'Rechnungsverlauf & Analysen',
                    search: 'Suche nach Kunde, Nummer, E-Mail...',
                    importJSON: 'JSON importieren',
                    exportAll: 'Alle exportieren',
                    noInvoices: 'Noch keine Rechnungen gespeichert',
                    totalRevenue: 'Gesamtumsatz',
                    pendingInvoices: 'Ausstehende Rechnungen',
                    overdueInvoices: 'Überfällige Rechnungen',
                    totalInvoices: 'Rechnungen gesamt',
                    averageInvoice: 'Durchschnittliche Rechnung'
                },
                common: {
                    loading: 'Wird geladen...',
                    saving: 'Wird gespeichert...',
                    success: 'Erfolg',
                    error: 'Fehler',
                    confirm: 'Bestätigen',
                    cancel: 'Abbrechen',
                    close: 'Schließen',
                    areYouSure: 'Sind Sie sicher?',
                    noClient: 'Kein Kunde',
                    all: 'Alle',
                    export: 'Exportieren',
                    delete: 'Löschen',
                    selected: 'Ausgewählt'
                }
            }
        },
        fr: {
            code: 'fr',
            name: 'French',
            nativeName: 'Français',
            currencyLocale: 'fr-FR',
            labels: {
                invoice: 'Facture',
                estimate: 'Devis',
                quote: 'Soumission',
                receipt: 'Reçu',
                from: 'De',
                billedTo: 'Facturé À',
                dateIssued: 'Date d\'Émission',
                dateDue: 'Date d\'Échéance',
                terms: 'Conditions',
                currency: 'Devise',
                description: 'Description',
                qty: 'Qté',
                unit: 'Unité',
                rate: 'Prix',
                amount: 'Montant',
                subtotal: 'Sous-total',
                tax: 'Taxe',
                discount: 'Remise',
                total: 'Total',
                amountDue: 'Montant Dû',
                notes: 'Notes / Informations de Paiement',
                signature: 'Signature Autorisée',
                payNow: 'Payer Maintenant',
                status: {
                    draft: 'Brouillon',
                    sent: 'Envoyé',
                    paid: 'Payé',
                    overdue: 'En Retard',
                    pending: 'En Attente',
                    dueToday: 'Échoit Aujourd\'hui'
                },
                actions: {
                    send: 'Envoyer au Client',
                    duplicate: 'Dupliquer',
                    markPaid: 'Marquer Payé',
                    markUnpaid: 'Marquer Non Payé',
                    load: 'Charger',
                    delete: 'Supprimer',
                    save: 'Enregistrer',
                    cancel: 'Annuler',
                    close: 'Fermer'
                },
                email: {
                    configure: 'Configurer l\'Email',
                    host: 'Serveur SMTP',
                    port: 'Port',
                    secure: 'Utiliser SSL/TLS',
                    user: 'Utilisateur',
                    pass: 'Mot de Passe',
                    fromName: 'Nom de l\'Expéditeur',
                    fromEmail: 'Email de l\'Expéditeur',
                    save: 'Enregistrer',
                    test: 'Tester la Connexion',
                    sending: 'Envoi en cours...',
                    sent: 'Facture envoyée avec succès!'
                },
                charts: {
                    revenueOverTime: 'Revenus dans le Temps',
                    statusBreakdown: 'Répartition des Statuts',
                    topClients: 'Meilleurs Clients',
                    noData: 'Aucune donnée disponible'
                },
                customFields: {
                    title: 'Champs Personnalisés',
                    addField: 'Ajouter un Champ',
                    fieldName: 'Nom du Champ',
                    fieldValue: 'Valeur du Champ',
                    remove: 'Supprimer'
                },
                recurring: {
                    none: 'Unique',
                    weekly: 'Hebdomadaire',
                    monthly: 'Mensuel',
                    quarterly: 'Trimestriel'
                },
                nav: {
                    analytics: 'Analytiques',
                    newInvoice: 'Nouvelle Facture',
                    history: 'Historique',
                    clients: 'Clients',
                    pricing: 'Tarifs',
                    toggleTheme: 'Changer de Thème',
                    signIn: 'Connexion',
                    signOut: 'Déconnexion',
                    upgrade: 'Passer à Pro'
                },
                dashboard: {
                    greeting: 'Bonjour',
                    subtitle: 'Restez informé des performances de votre boutique.',
                    viewReport: 'Voir le Rapport Complet',
                    keyInsights: 'Indicateurs Clés',
                    allTimeRevenue: 'Revenus Totaux',
                    websiteVisits: 'Visites du Site',
                    currentVisits: 'Visites Actuelles',
                    visitor: 'Visiteur',
                    conversionRate: 'Taux de Conversion',
                    adClicks: 'Clics Publicitaires',
                    vsLastMonth: 'vs mois dernier',
                    vsLastYear: 'vs année dernière',
                    revenue: 'Revenus',
                    revenueCosts: 'Payé vs Impayé',
                    paid: 'Payé',
                    outstanding: 'Impayé',
                    statusBreakdown: 'Répartition des Statuts',
                    topClients: 'Meilleurs Clients',
                    noData: 'Aucune donnée disponible',
                    totalInvoices: 'Factures Totales',
                    pendingInvoices: 'Factures en Attente',
                    overdueInvoices: 'Factures en Retard',
                    averageInvoice: 'Facture Moyenne',
                    totalRevenue: 'Revenus Totaux',
                    search: 'Rechercher...'
                },
                invoiceForm: {
                    createInvoice: 'Créer une Facture',
                    companyInfo: 'Informations sur l\'Entreprise',
                    companyName: 'Nom de l\'Entreprise',
                    companyEmail: 'Email de l\'Entreprise',
                    companyPhone: 'Téléphone',
                    companyAddress: 'Adresse',
                    companyLogo: 'Logo (Télécharger une Image)',
                    invoiceTheme: 'Thème de Facture',
                    clientInfo: 'Informations du Client',
                    clientName: 'Nom du Client',
                    clientEmail: 'Email du Client',
                    clientPhone: 'Téléphone',
                    clientAddress: 'Adresse',
                    savedClients: 'Clients Enregistrés',
                    selectClient: '-- Sélectionner un client --',
                    saveClient: 'Enregistrer le Client',
                    manageClients: 'Gérer les Clients',
                    documentDetails: 'Détails du Document',
                    documentType: 'Type de Document',
                    number: 'Numéro',
                    date: 'Date',
                    dueDate: 'Date d\'Échéance',
                    currency: 'Devise',
                    paymentTerms: 'Conditions de Paiement',
                    paymentLink: 'Lien de Paiement (Optionnel)',
                    recurring: 'Récurrent',
                    notes: 'Notes / Informations de Paiement',
                    lineItems: 'Lignes d\'Articles',
                    description: 'Description',
                    unit: 'Unité',
                    quantity: 'Quantité',
                    unitPrice: 'Prix Unitaire',
                    amount: 'Montant',
                    action: 'Action',
                    addItem: '+ Ajouter un Article',
                    taxDiscount: 'Taxe & Remise',
                    taxType: 'Type de Taxe',
                    taxRate: 'Taux/Montant de Taxe',
                    discountType: 'Type de Remise',
                    discountValue: 'Valeur de la Remise',
                    signature: 'Signature Autorisée',
                    signHere: 'Signez ci-dessous (souris ou doigt)',
                    clearSignature: 'Effacer la Signature',
                    saveDraft: 'Enregistrer le Brouillon',
                    print: 'Imprimer',
                    downloadImage: 'Télécharger l\'Image',
                    downloadPDF: 'Télécharger le PDF',
                    exportJSON: 'Exporter JSON',
                    reset: 'Réinitialiser',
                    required: 'Requis'
                },
                history: {
                    title: 'Historique et Analytiques',
                    search: 'Rechercher par client, numéro, email...',
                    importJSON: 'Importer JSON',
                    exportAll: 'Tout Exporter',
                    noInvoices: 'Aucune facture enregistrée',
                    totalRevenue: 'Revenus Totaux',
                    pendingInvoices: 'Factures en Attente',
                    overdueInvoices: 'Factures en Retard',
                    totalInvoices: 'Factures Totales',
                    averageInvoice: 'Facture Moyenne'
                },
                common: {
                    loading: 'Chargement...',
                    saving: 'Enregistrement...',
                    success: 'Succès',
                    error: 'Erreur',
                    confirm: 'Confirmer',
                    cancel: 'Annuler',
                    close: 'Fermer',
                    areYouSure: 'Êtes-vous sûr ?',
                    noClient: 'Aucun client',
                    all: 'Tous',
                    export: 'Exporter',
                    delete: 'Supprimer',
                    selected: 'Sélectionnés'
                }
            }
        }
    },

    /**
     * Get current locale code
     */
    getLocale() {
        return this.currentLocale;
    },

    /**
     * Set current locale
     */
    setLocale(locale) {
        if (this.locales[locale]) {
            this.currentLocale = locale;
            localStorage.setItem('invoice-locale', locale);
            return true;
        }
        return false;
    },

    /**
     * Load saved locale preference
     */
    loadLocale() {
        const saved = localStorage.getItem('invoice-locale');
        if (saved && this.locales[saved]) {
            this.currentLocale = saved;
        }
        return this.currentLocale;
    },

    /**
     * Get translated label
     */
    t(key) {
        const keys = key.split('.');
        let value = this.locales[this.currentLocale].labels;
        for (const k of keys) {
            if (value && value[k] !== undefined) {
                value = value[k];
            } else {
                // Fallback to English
                let fallback = this.locales.en.labels;
                for (const fk of keys) {
                    if (fallback && fallback[fk] !== undefined) {
                        fallback = fallback[fk];
                    } else {
                        return key;
                    }
                }
                return fallback;
            }
        }
        return value;
    },

    /**
     * Format currency with locale
     */
    formatCurrency(amount, currency = 'USD') {
        const locale = this.locales[this.currentLocale].currencyLocale;
        try {
            return new Intl.NumberFormat(locale, {
                style: 'currency',
                currency: currency
            }).format(amount);
        } catch {
            // Fallback
            const symbols = {
                'USD': '$', 'EUR': '\u20AC', 'GBP': '\u00A3',
                'CAD': 'C$', 'AUD': 'A$', 'INR': '\u20B9', 'JPY': '\u00A5'
            };
            return (symbols[currency] || currency) + amount.toFixed(2);
        }
    },

    /**
     * Format date with locale
     */
    formatDate(dateString) {
        if (!dateString) return '';
        const locale = this.locales[this.currentLocale].currencyLocale;
        const tz = localStorage.getItem('invoice-tz') || Intl.DateTimeFormat().resolvedOptions().timeZone;
        try {
            const date = new Date(dateString + 'T12:00:00');
            return date.toLocaleDateString(locale, {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                timeZone: tz
            });
        } catch {
            return dateString;
        }
    },

    /**
     * Get all available locales
     */
    getLocales() {
        return Object.entries(this.locales).map(([code, locale]) => ({
            code,
            name: locale.name,
            nativeName: locale.nativeName
        }));
    },

    /**
     * Translate the entire DOM: scans for [data-i18n] attributes
     * and replaces textContent / placeholder / title.
     */
    translateDOM(root = document) {
        root.querySelectorAll('[data-i18n]').forEach(el => {
            const key = el.getAttribute('data-i18n');
            const attr = el.getAttribute('data-i18n-attr');
            if (attr) {
                el.setAttribute(attr, this.t(key));
            } else {
                const translated = this.t(key);
                if (el.childNodes.length === 1 && el.childNodes[0].nodeType === Node.TEXT_NODE) {
                    el.textContent = translated;
                } else {
                    const textNode = Array.from(el.childNodes).find(n => n.nodeType === Node.TEXT_NODE && n.textContent.trim());
                    if (textNode) {
                        textNode.textContent = translated;
                    } else if (el.childElementCount === 0) {
                        el.textContent = translated;
                    } else {
                        const wrapper = document.createElement('span');
                        wrapper.textContent = translated;
                        el.prepend(wrapper);
                    }
                }
            }
        });
    },

    /**
     * Create and return a locale switcher <select> element
     */
    createLocaleSwitcher() {
        const select = document.createElement('select');
        select.className = 'locale-switcher';
        select.setAttribute('aria-label', 'Language');
        this.getLocales().forEach(locale => {
            const opt = document.createElement('option');
            opt.value = locale.code;
            opt.textContent = locale.nativeName;
            if (locale.code === this.currentLocale) opt.selected = true;
            select.appendChild(opt);
        });
        select.addEventListener('change', (e) => {
            this.setLocale(e.target.value);
            this.translateDOM();
            document.documentElement.lang = e.target.value;
            if (window.app && typeof window.app.translateUI === 'function') {
                window.app.translateUI();
            }
        });
        return select;
    }
};

// Initialize locale on load
i18n.loadLocale();

// Export for module use
window.i18n = i18n;
export default i18n;
