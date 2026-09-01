# Read the file
with open('D:/CODE/Invoice generator/index.html', 'r', encoding='utf-8') as f:
    content = f.read()

old = """</section>
<section id="templates" class="page-section">
        <!-- Templates content -->
    </section>
<section id="pricing" class="page-section">
        <!-- Pricing content -->
    </section>
</main>"""

new = """</section>
<section id="templates" class="page-section">
        <main class="main-content page-container" id="mainContent">
            <a href="index.html" class="nav-back">← Back to Generator</a>

            <div class="page-header">
                <h1>Manage Templates</h1>
                <p>Pre-fill your company details by saving them to a template profile.</p>
            </div>

            <div class="history-grid" id="historyGrid">
                <div class="history-card">
                    <div class="history-label">Total Templates</div>
                    <div class="history-value" id="totalTemplates">0</div>
                </div>
                <div class="history-card">
                    <div class="history-label">With Logo</div>
                    <div class="history-value" id="withLogo">0</div>
                </div>
                <div class="history-card">
                    <div class="history-label">Custom Theme</div>
                    <div class="history-value" id="withCustomTheme">0</div>
                </div>
            </div>

            <div class="toolbar">
                <div class="toolbar-search">
                    <input type="text" id="searchInput" placeholder="Search by name, email, or phone...">
                </div>
                <div class="toolbar-actions">
                    <button class="btn btn-primary" id="addTemplateBtn">+ Add Template</button>
                </div>
            </div>

            <div class="table-wrapper">
                <table class="data-table">
                    <thead>
                        <tr>
                            <th>Template Name</th>
                            <th>Company Settings</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody id="templateTableBody"></tbody>
                </table>
            </div>

            <div class="pagination" id="pagination">
                <span>Showing <strong id="pageStart">0</strong> to <strong id="pageEnd">0</strong> of <strong id="pageTotal">0</strong> templates</span>
                <div class="pagination-actions">
                    <button class="btn btn-secondary btn-sm" id="prevPageBtn" disabled>Previous</button>
                    <button class="btn btn-secondary btn-sm" id="nextPageBtn" disabled>Next</button>
                </div>
            </div>
        </main>

        <div class="modal-overlay" id="templateModal" role="dialog" aria-modal="true" aria-labelledby="modalTitle">
            <div class="modal-box">
                <h2 id="modalTitle">Add Template</h2>
                <form id="templateForm">
                    <div class="form-group">
                        <label for="templateName">Template Name *</label>
                        <input type="text" id="templateName" required>
                    </div>
                    <div class="form-group">
                        <label for="companyName">Company Name *</label>
                        <input type="text" id="companyName" required>
                    </div>
                    <div class="form-group">
                        <label for="companyEmail">Company Email</label>
                        <input type="email" id="companyEmail">
                    </div>
                    <div class="form-group">
                        <label for="companyPhone">Company Phone</label>
                        <input type="tel" id="companyPhone">
                    </div>
                    <div class="form-group">
                        <label for="companyAddress">Company Address</label>
                        <input type="text" id="companyAddress">
                    </div>
                    <div class="form-group">
                       <label for="companyLogo">Company Logo (Base64 or URL)</label>
                       <input type="text" id="companyLogo" placeholder="data:image/png;base64,...">
                    </div>
                </form>
                <div class="modal-actions">
                    <button class="btn btn-secondary" id="modalCancelBtn">Cancel</button>
                    <button class="btn btn-primary" id="modalSaveBtn">Save Template</button>
                </div>
            </div>
    </section>
    <section id="pricing" class="page-section">
        <main class="main-content">
            <div class="pricing-page">
                <div class="pricing-header">
                    <span class="pricing-eyebrow">Pricing</span>
                    <h1>Pricing that grows <span>with you</span></h1>
                    <p>Choose an affordable plan that's packed with the best features for engaging your audience, creating customer loyalty, and driving sales.</p>
                </div>

                <!-- Currency indicator -->
                <div class="billing-toggle-container">
                    <span class="billing-label active" id="labelMonthly" onclick="window.pricing && window.pricing.annual !== false && setBilling(false)">Monthly</span>
                    <label class="switch">
                        <input type="checkbox" id="billingToggle" onchange="window.pricing && window.pricing.updatePrices && window.pricing.updatePrices()">
                        <span class="slider round"></span>
                    </label>
                    <span class="billing-label" id="labelYearly" onclick="window.pricing && window.pricing.annual !== true && setBilling(true)">Yearly <span class="discount-badge">Save up to 17%</span></span>
                </div>
                <div id="currencyNotice" style="text-align:center;margin-bottom:1.5rem;font-size:0.82rem;color:var(--text-muted);min-height:1.2em;"></div>

                <div class="pricing-grid">
                    <!-- Freelancer -->
                    <div class="pricing-card" id="card-free">
                        <div>
                            <div class="plan-name">Freelancer</div>
                            <div class="plan-desc">The essentials to provide your best work for clients.</div>
                        </div>
                        <div class="plan-price">
                            <span class="price-symbol" id="sym0"></span>
                            <span class="price-amount" id="price0">Free</span>
                            <span class="price-period" id="period0"></span>
                        </div>
                        <ul class="plan-features">
                            <li>20 invoices per day</li>
                            <li>48-hour support response time</li>
                            <li>Ad supported</li>
                        </ul>
                        <button class="plan-btn plan-btn-outline" id="btn-free" onclick="window.pricing && window.pricing.handleFree && window.pricing.handleFree()">Get started</button>
                    </div>

                    <!-- Startup (Most Popular) -->
                    <div class="pricing-card popular" id="card-pro">
                        <div class="popular-badge">Most popular</div>
                        <div>
                            <div class="plan-name">Startup</div>
                            <div class="plan-desc">A plan that scales with your rapidly growing business.</div>
                        </div>
                        <div class="plan-price">
                            <span class="price-symbol" id="sym1"></span>
                            <span class="price-amount" id="price1">300</span>
                            <span class="price-period" id="period1">/month</span>
                        </div>
                        <ul class="plan-features">
                            <li>500 invoices per day</li>
                            <li>24-hour support response time</li>
                            <li>No ads</li>
                        </ul>
                        <button class="plan-btn plan-btn-primary" id="btn-pro" onclick="window.pricing && window.pricing.handleSubscribe && window.pricing.handleSubscribe('startup')">Buy plan</button>
                    </div>

                    <!-- Enterprise -->
                    <div class="pricing-card" id="card-business">
                        <div>
                            <div class="plan-name">Enterprise</div>
                            <div class="plan-desc">Dedicated support and infrastructure for your company.</div>
                        </div>
                        <div class="plan-price">
                            <span class="price-symbol" id="sym2"></span>
                            <span class="price-amount" id="price2">600</span>
                            <span class="price-period" id="period2">/month</span>
                        </div>
                        <ul class="plan-features">
                            <li>Unlimited invoices</li>
                            <li>12-hour, dedicated support response time</li>
                            <li>No ads</li>
                        </ul>
                        <button class="plan-btn plan-btn-outline" id="btn-biz" onclick="window.pricing && window.pricing.handleSubscribe && window.pricing.handleSubscribe('business')">Buy plan</button>
                    </div>
                </div>
            </div>
        </main>
    </section>
</main>"""

if old in content:
    content = content.replace(old, new)
    with open('D:/CODE/Invoice generator/index.html', 'w', encoding='utf-8') as f:
        f.write(content)
    print("Replacement successful!")
else:
    print("Old text not found!")
    # Let's debug
    idx = content.find('<section id="templates"')
    if idx >= 0:
        print(f"Found at index {idx}")
        print(content[idx:idx+200])