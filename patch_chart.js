const fs = require('fs');
let code = fs.readFileSync('js/modules/dashboard.js', 'utf8');

// For renderProjectedEarningsChart
code = code.replace(
    /const sorted = \[\.\.\.byMonth\.values\(\)\]\.sort\(\(a, b\) => a\.date - b\.date\);/,
    `const sorted = [...byMonth.values()].sort((a, b) => a.date - b.date);
    if (sorted.length === 1) {
        const prevDate = new Date(sorted[0].date);
        prevDate.setMonth(prevDate.getMonth() - 1);
        sorted.unshift({ date: prevDate, paid: 0, pending: 0 });
    }`
);

// For renderRevenueCostsChart
code = code.replace(
    /const sorted = \[\.\.\.byMonth\.values\(\)\]\.sort\(\(a, b\) => a\.date - b\.date\);/,
    `const sorted = [...byMonth.values()].sort((a, b) => a.date - b.date);
    if (sorted.length === 1) {
        const prevDate = new Date(sorted[0].date);
        prevDate.setMonth(prevDate.getMonth() - 1);
        sorted.unshift({ date: prevDate, paid: 0, outstanding: 0 });
    }`
);

// For renderKeyInsightsChart (uses byDate instead of byMonth)
code = code.replace(
    /const sorted = \[\.\.\.byDate\.values\(\)\]\.sort\(\(a, b\) => a\.date - b\.date\);/,
    `const sorted = [...byDate.values()].sort((a, b) => a.date - b.date);
    if (sorted.length === 1) {
        const prevDate = new Date(sorted[0].date);
        prevDate.setDate(prevDate.getDate() - 1);
        sorted.unshift({ date: prevDate, total: 0 });
    }`
);

fs.writeFileSync('js/modules/dashboard.js', code);
