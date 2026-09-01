const fs = require('fs');
let code = fs.readFileSync('new_backend/src/controllers/invoice.controller.ts', 'utf8');

if (!code.includes('dailyActionCount')) {
    const toReplace = `    const { id, data, status, customFields, paidAt, dueAt } = req.body;

    const newInvoice = await prisma.invoice.create({`;
    
    const replacement = `    const { id, data, status, customFields, paidAt, dueAt } = req.body;

    // --- Premium Tier Limit Enforcement ---
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
        res.status(401).json({ error: 'User not found' });
        return;
    }

    const todayDateStr = new Date().toISOString().split('T')[0];
    let currentCount = user.dailyActionCount;
    
    // Reset limit if it is a new day
    if (user.dailyActionDate !== todayDateStr) {
        currentCount = 0;
    }

    // Assign limits based on Tier
    let invoiceLimit = 20; // Free
    if (user.tier === 'startup') invoiceLimit = 500;
    else if (user.tier === 'business' || user.tier === 'enterprise') invoiceLimit = 5000;

    if (currentCount >= invoiceLimit) {
        res.status(429).json({ error: \`Daily invoice limit of \${invoiceLimit} reached. Please upgrade your plan.\` });
        return;
    }

    // Update count immediately before creating to avoid race conditions
    await prisma.user.update({
        where: { id: userId },
        data: {
            dailyActionCount: currentCount + 1,
            dailyActionDate: todayDateStr
        }
    });
    // -------------------------------------

    const newInvoice = await prisma.invoice.create({`;

    code = code.replace(toReplace, replacement);
    fs.writeFileSync('new_backend/src/controllers/invoice.controller.ts', code);
    console.log("Invoice controller patched with daily limits.");
} else {
    console.log("Invoice limits already patched.");
}
