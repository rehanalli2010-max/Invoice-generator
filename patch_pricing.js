const fs = require('fs');

let html = fs.readFileSync('pricing.html', 'utf8');

// 1. Add toggle HTML
const toggleHtml = `                    <div class="billing-toggle-container">
                        <span class="billing-label active" id="labelMonthly" onclick="setBilling(false)">Monthly</span>
                        <label class="switch">
                            <input type="checkbox" id="billingToggle" onchange="toggleBilling()">
                            <span class="slider round"></span>
                        </label>
                        <span class="billing-label" id="labelYearly" onclick="setBilling(true)">Yearly <span class="discount-badge">Save up to 17%</span></span>
                    </div>
                    <div id="currencyNotice"`;

html = html.replace('<div id="currencyNotice"', toggleHtml);

// 2. Add styles
const css = `        .billing-toggle-container {
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 1rem;
            margin-bottom: 2rem;
            margin-top: -1.5rem;
        }
        .billing-label {
            font-size: 0.95rem;
            font-weight: 600;
            color: var(--text-muted);
            cursor: pointer;
            transition: color 0.3s;
            display: flex;
            align-items: center;
            gap: 0.5rem;
            user-select: none;
        }
        .billing-label.active {
            color: var(--text-main);
        }
        .discount-badge {
            background: var(--accent);
            color: white;
            font-size: 0.65rem;
            padding: 0.2rem 0.5rem;
            border-radius: var(--radius-pill);
            font-weight: 700;
            text-transform: uppercase;
            letter-spacing: 0.05em;
        }
        /* Toggle Switch */
        .switch {
            position: relative;
            display: inline-block;
            width: 48px;
            height: 26px;
        }
        .switch input { opacity: 0; width: 0; height: 0; }
        .slider {
            position: absolute;
            cursor: pointer;
            top: 0; left: 0; right: 0; bottom: 0;
            background-color: var(--border);
            transition: .4s;
        }
        .slider:before {
            position: absolute;
            content: "";
            height: 18px;
            width: 18px;
            left: 4px;
            bottom: 4px;
            background-color: white;
            transition: .4s;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        input:checked + .slider {
            background-color: var(--accent);
        }
        input:checked + .slider:before {
            transform: translateX(22px);
        }
        .slider.round { border-radius: 26px; }
        .slider.round:before { border-radius: 50%; }
`;
html = html.replace('</style>', css + '    </style>');

// 3. Script basics
const scriptStart = `        // ── Base prices in INR ──────────────────────────────────────────
        const BASE = { freelancer: 0, startup: 300, enterprise: 600 };`;
const scriptNew = `        // ── Base prices in INR ──────────────────────────────────────────
        const BASE = { freelancer: 0, startup: 300, enterprise: 600 };
        const YEARLY_BASE = { freelancer: 0, startup: 2500, enterprise: 6000 };

        let isYearly = false;
        let currentCurrency = null;
        let currentCountryName = null;

        function setBilling(yearly) {
            document.getElementById('billingToggle').checked = yearly;
            toggleBilling();
        }

        function toggleBilling() {
            isYearly = document.getElementById('billingToggle').checked;
            document.getElementById('labelMonthly').classList.toggle('active', !isYearly);
            document.getElementById('labelYearly').classList.toggle('active', isYearly);
            if (currentCurrency) {
                applyPrices(currentCurrency, currentCountryName);
            }
        }`;
html = html.replace(scriptStart, scriptNew);

const formatOld = `        function formatPrice(inrAmount, currency) {
            if (inrAmount === 0) return { symbol: '', amount: 'Free', period: '' };
            const converted = inrAmount * currency.rate;
            const display = currency.dec === 0
                ? Math.round(converted).toLocaleString()
                : converted.toFixed(currency.dec);
            return { symbol: currency.symbol, amount: display, period: '/month' };
        }`;
const formatNew = `        function formatPrice(inrAmount, currency, isYearlyPlan) {
            if (inrAmount === 0) return { symbol: '', amount: 'Free', period: '' };

            let amountToConvert = inrAmount;
            let periodText = isYearlyPlan ? '/month, billed yearly' : '/month';

            if (isYearlyPlan) {
                amountToConvert = inrAmount / 12;
            }

            const converted = amountToConvert * currency.rate;
            const display = currency.dec === 0
                ? Math.round(converted).toLocaleString()
                : converted.toFixed(currency.dec);

            return { symbol: currency.symbol, amount: display, period: periodText };
        }`;
html = html.replace(formatOld, formatNew);

const applyOld = `        function applyPrices(currency, countryName) {
            const plans = [
                { base: BASE.freelancer, sym: 'sym0', price: 'price0', period: 'period0' },
                { base: BASE.startup,    sym: 'sym1', price: 'price1', period: 'period1' },
                { base: BASE.enterprise, sym: 'sym2', price: 'price2', period: 'period2' },
            ];
            plans.forEach(p => {
                const { symbol, amount, period } = formatPrice(p.base, currency);
                document.getElementById(p.sym).textContent = symbol;
                document.getElementById(p.price).textContent = amount;
                document.getElementById(p.period).textContent = period;
            });
            const notice = document.getElementById('currencyNotice');
            if (countryName) {
                notice.textContent = \`Prices shown in \${currency.code} for \${countryName}\`;
            }
        }`;
const applyNew = `        function applyPrices(currency, countryName) {
            currentCurrency = currency;
            currentCountryName = countryName;

            const prices = isYearly ? YEARLY_BASE : BASE;

            const plans = [
                { base: prices.freelancer, sym: 'sym0', price: 'price0', period: 'period0' },
                { base: prices.startup,    sym: 'sym1', price: 'price1', period: 'period1' },
                { base: prices.enterprise, sym: 'sym2', price: 'price2', period: 'period2' },
            ];

            plans.forEach(p => {
                const { symbol, amount, period } = formatPrice(p.base, currency, isYearly);
                document.getElementById(p.sym).textContent = symbol;
                document.getElementById(p.price).textContent = amount;
                document.getElementById(p.period).textContent = period;
            });

            const notice = document.getElementById('currencyNotice');
            if (countryName) {
                notice.textContent = \`Prices shown in \${currency.code} for \${countryName}\`;
            }
        }`;
html = html.replace(applyOld, applyNew);

fs.writeFileSync('pricing.html', html, 'utf8');
console.log('Update complete!');