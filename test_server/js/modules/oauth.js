import { API_BASE } from '../config.js';

function handleOAuthResponse(data) {
  app.token = data.token;
  app.user = data.user;
  localStorage.setItem('invoice-auth-token', app.token);
  if (app.connectWebSocket) app.connectWebSocket(app.token);
  if (app.setupWebSocketListeners) app.setupWebSocketListeners();
  app.closeAuthModal();
  app.updateAuthUI();
  app.importLocalOnLogin().catch(() => {});
  app.renderHistoryList().catch(() => {});
  app.updateAnalyticsDashboard().catch(() => {});
  app.showNotification('Signed in successfully', 'success');
}

export async function handleGoogleSignIn() {
  const clientId = window._GOOGLE_CLIENT_ID;
  if (!clientId) {
    app.showNotification('Google Sign-In not configured', 'error');
    return;
  }
  try {
    let state = null;
    try {
      const token = localStorage.getItem('invoice-auth-token');
      const stateRes = await fetch(`${API_BASE}/api/oauth/state`, {
        headers: token ? { 'Authorization': `Bearer ${token}` } : {}
      });
      if (stateRes.ok) {
        const stateData = await stateRes.json();
        state = stateData.state;
      }
    } catch {
      // Backend offline — state unavailable
    }

    const tokenClient = google.accounts.oauth2.initTokenClient({
      client_id: clientId,
      scope: 'email profile',
      callback: async (response) => {
        if (response.access_token) {
          const userRes = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
            headers: { Authorization: `Bearer ${response.access_token}` }
          });
          const userInfo = await userRes.json().catch(() => ({}));
          if (userInfo.email) {
            const res = await fetch(`${API_BASE}/api/oauth/google`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ email: userInfo.email, name: userInfo.name, state })
            });
            let data;
            try {
                data = await res.json();
            } catch {
                data = { error: 'Authentication service error' };
            }
            if (data.token) handleOAuthResponse(data);
            else app.showNotification(data.error || 'Google sign-in failed', 'error');
          }
        }
      }
    });
    tokenClient.requestAccessToken();
  } catch {
    app.showNotification('Failed to sign in with Google', 'error');
  }
}

export async function handleGitHubSignIn() {
  const clientId = window._GITHUB_CLIENT_ID;
  if (!clientId) {
    app.showNotification('GitHub Sign-In not configured', 'error');
    return;
  }
  try {
    const redirectUri = window.location.origin + '/oauth-github-callback.html';
    const state = crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).slice(2);
    sessionStorage.setItem('github_oauth_state', state);
    const popup = window.open(
      `https://github.com/login/oauth/authorize?client_id=${clientId}&redirect_uri=${redirectUri}&scope=user:email&state=${encodeURIComponent(state)}`,
      'github-oauth',
      'width=600,height=700'
    );
    if (!popup) {
      app.showNotification('Popup blocked. Please allow popups for this site.', 'error');
      return;
    }

    let cleaned = false;
    const cleanup = () => {
      if (cleaned) return;
      cleaned = true;
      sessionStorage.removeItem('github_oauth_state');
      window.removeEventListener('message', handler);
      if (popupPoll) clearInterval(popupPoll);
    };

    const handler = async (event) => {
      if (event.origin !== window.location.origin) return;
      if (event.data.type === 'github-oauth') {
        cleanup();
        const { code, state: returnedState } = event.data;
        const storedState = sessionStorage.getItem('github_oauth_state');
        sessionStorage.removeItem('github_oauth_state');
        if (!returnedState || returnedState !== storedState) {
          app.showNotification('OAuth state mismatch — possible CSRF attack', 'error');
          return;
        }
        const res = await fetch(`${API_BASE}/api/oauth/github`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ code, state: returnedState })
        });
        const data = await res.json().catch(() => ({}));
        if (data.token) handleOAuthResponse(data);
        else app.showNotification(data.error || 'GitHub sign-in failed', 'error');
      }
    };
    window.addEventListener('message', handler);

    // Poll for popup close (user cancelled or browser blocked redirect)
    const popupPoll = setInterval(() => {
      try {
        if (popup.closed) {
          cleanup();
          app.showNotification('Sign-in cancelled', 'info');
        }
      } catch (e) {
        // Cross-origin access may throw — ignore
      }
    }, 500);

    // Safety timeout: clean up after 5 minutes regardless
    setTimeout(cleanup, 5 * 60 * 1000);
  } catch {
    app.showNotification('Failed to sign in with GitHub', 'error');
  }
}
