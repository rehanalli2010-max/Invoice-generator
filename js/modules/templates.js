let allTemplates = [];
let filteredTemplates = [];
let editingTemplateId = null;

export async function initTemplatesPage() {
    // Run on templates.html page OR when templates section is shown in index.html
    const isTemplatesPage = window.location.pathname.endsWith('templates.html');
    const isTemplatesView = document.getElementById('templates')?.classList.contains('active');

    if (!isTemplatesPage && !isTemplatesView) return;

    // Wait for DOM to be ready
    setTimeout(async () => {
        document.getElementById('addTemplateBtn')?.addEventListener('click', () => window.app.openTemplateModal());
        document.getElementById('modalCancelBtn')?.addEventListener('click', () => window.app.closeTemplateModal());
        document.getElementById('modalSaveBtn')?.addEventListener('click', () => window.app.saveTemplateHandler());
        document.getElementById('searchInput')?.addEventListener('input', (e) => window.app.searchTemplates(e.target.value));

        await window.app.renderTemplateList();
    }, 100);
}

export async function renderTemplateList() {
    try {
        if (window.app.token && window.app.user) {
            allTemplates = await window.app.apiGetCompanyTemplates() || [];
        } else {
            allTemplates = window.app.storage.getCompanyTemplates();
        }

        window.app.searchTemplates(document.getElementById('searchInput')?.value || '');
    } catch (e) {
        console.error("Failed to render template list", e);
    }
}

export function searchTemplates(term) {
    const search = term.toLowerCase();
    filteredTemplates = allTemplates.filter(t => {
        return !search ||
               (t.name && t.name.toLowerCase().includes(search)) ||
               (t.data.companyName && t.data.companyName.toLowerCase().includes(search));
    });

    // Update stats
    const totalEl = document.getElementById('totalTemplates');
    if (totalEl) totalEl.textContent = allTemplates.length;

    const withLogoEl = document.getElementById('withLogo');
    if (withLogoEl) withLogoEl.textContent = allTemplates.filter(t => t.data && t.data.companyLogo).length;

    const withThemeEl = document.getElementById('withCustomTheme');
    if (withThemeEl) withThemeEl.textContent = allTemplates.filter(t => t.data && t.data.theme && t.data.theme !== 'default').length;

    const tbody = document.getElementById('templateTableBody');
    if (!tbody) return;

    tbody.innerHTML = '';
    if (filteredTemplates.length === 0) {
        tbody.innerHTML = '<tr><td colspan="3" class="empty-state">No templates found</td></tr>';
        return;
    }

    filteredTemplates.forEach(t => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>
                <strong>${t.name}</strong><br>
                <small style="color:var(--text-muted)">Created: ${new Date(t.created_at || t.createdAt).toLocaleDateString()}</small>
            </td>
            <td>
                <strong>${t.data.companyName || 'N/A'}</strong><br>
                <small style="color:var(--text-muted)">${t.data.companyEmail || ''}</small>
            </td>
            <td>
                <button class="btn btn-secondary btn-sm" onclick="window.app.openTemplateModal('${t.id}')">✏️ Edit</button>
                <button class="btn btn-secondary btn-sm" onclick="window.app.deleteTemplateHandler('${t.id}')" style="color:var(--danger)">🗑️ Delete</button>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

export function openTemplateModal(id = null) {
    editingTemplateId = id;
    const modal = document.getElementById('templateModal');
    const title = document.getElementById('modalTitle');
    const form = document.getElementById('templateForm');

    form.reset();

    if (id) {
        title.textContent = 'Edit Template';
        const t = allTemplates.find(x => x.id === id);
        if (t) {
            document.getElementById('templateName').value = t.name || '';
            document.getElementById('companyName').value = t.data.companyName || '';
            document.getElementById('companyEmail').value = t.data.companyEmail || '';
            document.getElementById('companyPhone').value = t.data.companyPhone || '';
            document.getElementById('companyAddress').value = t.data.companyAddress || '';
            document.getElementById('companyLogo').value = t.data.companyLogo || '';
        }
    } else {
        title.textContent = 'Add Template';
    }

    modal.classList.add('open');
}

export function closeTemplateModal() {
    document.getElementById('templateModal').classList.remove('open');
    editingTemplateId = null;
}

export async function saveTemplateHandler() {
    const isPaid = window.app.user && (window.app.user.tier === 'startup' || window.app.user.tier === 'business');
    if (!editingTemplateId && window.app.user && !isPaid) {
        if (allTemplates.length >= 1) {
             alert('Free users can only save 1 company profile. Please upgrade to Pro or Business to save up to 15 profiles.');
             if(window.app.openPortal) window.app.openPortal();
             return;
        }
    }

    const templateName = document.getElementById('templateName').value.trim();
    if (!templateName) {
        alert("Template name is required");
        return;
    }

    const data = {
         companyName: document.getElementById('companyName').value.trim(),
         companyEmail: document.getElementById('companyEmail').value.trim(),
         companyPhone: document.getElementById('companyPhone').value.trim(),
         companyAddress: document.getElementById('companyAddress').value.trim(),
         companyLogo: document.getElementById('companyLogo').value.trim()
    };

    if (window.app.token) {
        try {
            if (editingTemplateId) {
                // To support Edit properly over API, we need a PUT endpoint or just delete+recreate.
                await window.app.apiDeleteCompanyTemplate(editingTemplateId);
            }
            await window.app.apiSaveCompanyTemplate({ name: templateName, data });
            if (typeof window.app.showNotification === 'function') window.app.showNotification('Template Saved', 'success');
        } catch (err) {
             const errStr = String(err.error || err.message || err);
             if (err.limitReached || errStr.toLowerCase().includes('upgrade') || errStr.toLowerCase().includes('maximum')) {
                  alert(errStr);
                  if (window.app.openPortal) window.app.openPortal();
             } else {
                 if (typeof window.app.showNotification === 'function') window.app.showNotification(errStr, 'error');
             }
        }
    } else {
        const payload = { name: templateName, data };
        if (editingTemplateId) {
             payload.id = editingTemplateId;
        }
        window.app.storage.saveCompanyTemplate(payload);
        if (typeof window.app.showNotification === 'function') window.app.showNotification('Template Saved (Offline)', 'success');
    }

    window.app.closeTemplateModal();
    await window.app.renderTemplateList();
}

export async function deleteTemplateHandler(id) {
    if (!confirm('Are you sure you want to delete this template?')) return;

    if (window.app.token) {
        const success = await window.app.apiDeleteCompanyTemplate(id);
        if (success) {
            if (typeof window.app.showNotification === 'function') window.app.showNotification('Template deleted', 'success');
            await window.app.renderTemplateList();
        } else {
            if (typeof window.app.showNotification === 'function') window.app.showNotification('Failed to delete template', 'error');
        }
    } else {
        window.app.storage.deleteCompanyTemplate(id);
        if (typeof window.app.showNotification === 'function') window.app.showNotification('Template deleted (Offline)', 'success');
        await window.app.renderTemplateList();
    }
}
