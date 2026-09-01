import { API_BASE } from '../config.js';

export function showSettingsModal() {
  const self = this;
  let modal = document.getElementById('settingsModal');
  if (!modal) {
    const div = document.createElement('div');
    div.id = 'settingsModal';
    div.className = 'modal';
    div.setAttribute('role', 'dialog');
    div.setAttribute('aria-modal', 'true');
    div.setAttribute('aria-hidden', 'true');
    div.innerHTML = `
      <div class="modal-content" style="max-width: 520px;">
        <div class="modal-header">
          <h2>Settings</h2>
          <button class="close-btn" onclick="document.getElementById('settingsModal').classList.remove('show')" aria-label="Close">&times;</button>
        </div>
        <div class="modal-body">
          <form id="settingsForm">
            <h3 style="margin:0 0 0.75rem;">Invoice Numbering</h3>
            <div class="form-row">
              <div class="form-group">
                <label for="invPrefix">Prefix</label>
                <input type="text" id="invPrefix" placeholder="INV-" value="INV-">
              </div>
              <div class="form-group">
                <label for="invStartNumber">Starting Number</label>
                <input type="number" id="invStartNumber" min="1" value="1">
              </div>
            </div>
            <div class="form-row">
              <div class="form-group" style="grid-column:1/-1;">
                <label for="invFormat">Format Pattern</label>
                <select id="invFormat">
                  <option value="PREFIX-XXXX">INV-0001</option>
                  <option value="PREFIX-XXXXXX">INV-000001</option>
                  <option value="PREFIX-XX">INV-01</option>
                  <option value="PREFIX/YYYY/XXXX">INV/2024/0001</option>
                  <option value="PREFIX/YYYY/MM/XXXX">INV/2024/12/0001</option>
                </select>
                <small style="color:var(--text-muted);">PREFIX = your prefix, XXXX = padded number, YYYY = year, MM = month</small>
              </div>
            </div>

            <hr style="margin:1rem 0;">

            <h3 style="margin:0 0 0.75rem;">Timezone</h3>
            <div class="form-row">
              <div class="form-group">
                <label for="timezoneSelect">Timezone</label>
                <select id="timezoneSelect">
                </select>
              </div>
            </div>

            <div style="display:flex;gap:0.75rem;justify-content:flex-end;margin-top:1.5rem;">
              <button type="button" class="btn btn-secondary" id="settingsCancel">Cancel</button>
              <button type="submit" class="btn btn-primary">Save Settings</button>
            </div>
          </form>
        </div>
      </div>
    `;
    document.body.appendChild(div);
    modal = div;

    const tzSelect = document.getElementById('timezoneSelect');
    const tzList = Intl.supportedValuesOf('timeZone');
    const currentTz = Intl.DateTimeFormat().resolvedOptions().timeZone;
    tzList.forEach(tz => {
      const opt = document.createElement('option');
      opt.value = tz;
      opt.textContent = tz;
      if (tz === currentTz) opt.selected = true;
      tzSelect.appendChild(opt);
    });

    document.getElementById('settingsForm').addEventListener('submit', async (e) => {
      e.preventDefault();
      const prefix = document.getElementById('invPrefix').value.trim();
      const startNumber = parseInt(document.getElementById('invStartNumber').value) || 1;
      const format = document.getElementById('invFormat').value;
      const timezone = document.getElementById('timezoneSelect').value;

      if (!prefix) {
        self.showNotification('Prefix is required', 'error');
        return;
      }

      if (self.token) {
        try {
          await self.apiRequest('/api/numbering', {
            method: 'PUT',
            body: { prefix, startNumber, format }
          });
          if (timezone) {
            await self.apiRequest('/api/auth/timezone', {
              method: 'PUT',
              body: { timezone }
            });
          }
          localStorage.setItem('invoice-tz', timezone);
          self.showNotification('Settings saved', 'success');
          modal.classList.remove('show');
          modal.setAttribute('aria-hidden', 'true');
          document.body.style.overflow = '';
        } catch (err) {
          self.showNotification(err.message || 'Failed to save settings', 'error');
        }
      } else {
        localStorage.setItem('inv-prefix', prefix);
        localStorage.setItem('inv-start-number', String(startNumber));
        localStorage.setItem('inv-format', format);
        localStorage.setItem('invoice-tz', timezone);
        self.showNotification('Settings saved locally', 'success');
        modal.classList.remove('show');
        modal.setAttribute('aria-hidden', 'true');
        document.body.style.overflow = '';
      }
    });

    document.getElementById('settingsCancel').addEventListener('click', () => {
      modal.classList.remove('show');
      modal.setAttribute('aria-hidden', 'true');
      document.body.style.overflow = '';
    });

    window.addEventListener('click', (e) => {
      if (e.target === modal) {
        modal.classList.remove('show');
        modal.setAttribute('aria-hidden', 'true');
        document.body.style.overflow = '';
      }
    });
  }

  if (self.token) {
    self.apiRequest('/api/numbering').then(config => {
      if (config) {
        document.getElementById('invPrefix').value = config.prefix || 'INV-';
        document.getElementById('invStartNumber').value = config.startNumber || 1;
        document.getElementById('invFormat').value = config.format || 'PREFIX-XXXX';
      }
    }).catch(() => {});
  } else {
    document.getElementById('invPrefix').value = localStorage.getItem('inv-prefix') || 'INV-';
    document.getElementById('invStartNumber').value = localStorage.getItem('inv-start-number') || '1';
    document.getElementById('invFormat').value = localStorage.getItem('inv-format') || 'PREFIX-XXXX';
  }

  modal.classList.add('show');
  modal.setAttribute('aria-hidden', 'false');
  document.body.style.overflow = 'hidden';
}
