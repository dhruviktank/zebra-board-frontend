import { ref, computed } from 'vue';
import router from '../router';
import { api, TOKEN_KEY, API_BASE_URL } from '../utils/api';

const USER_KEY = 'zb_user_v1';

function loadUser() {
  try { return JSON.parse(localStorage.getItem(USER_KEY)) || null; } catch { return null; }
}

const userRef = ref(loadUser());
const tokenRef = ref(localStorage.getItem(TOKEN_KEY) || null);
const pendingVerificationRef = ref(false);

function persistUser(u) {
  if (u) localStorage.setItem(USER_KEY, JSON.stringify(u));
  else localStorage.removeItem(USER_KEY);
  userRef.value = u;
}

function persistToken(t) {
  if (t) localStorage.setItem(TOKEN_KEY, t); else localStorage.removeItem(TOKEN_KEY);
  tokenRef.value = t;
}

async function fetchMe() {
  try {
    const me = await api.get('/auth/me');
    persistUser(me);
    return me;
  } catch (e) {
    // If unauthorized, clear token
    if (e.status === 401) {
      persistToken(null);
      persistUser(null);
    }
    throw e;
  }
}

export function useAuth() {
  const user = computed(() => userRef.value);
  const token = computed(() => tokenRef.value);
  const isLoggedIn = computed(() => !!userRef.value && !!tokenRef.value);
  const pendingVerification = computed(() => pendingVerificationRef.value);

  // Supports login via either username OR email.
  // Accepts { username, password } (legacy) OR { identifier, password } where identifier can be username or email.
  async function login(payload) {
    const { password } = payload;
    const identifier = payload.identifier || payload.username || payload.email;
    if (!identifier || !password) throw new Error('Identifier and password required');
    // Heuristic: if identifier contains '@' treat as email; backend expected to accept either field.
    const body = identifier.includes('@') ? { email: identifier, password } : { username: identifier, password };
    const resp = await api.post('/users/login', body);
    if (resp.token) {
      persistToken(resp.token);
    }
    persistUser(resp.user);
    return resp.user;
  }

  async function register({ username, email, password }) {
    const resp = await api.post('/users', { username, email, password });
    // New contract: when email provided server returns 202 + { pendingVerification: true } without user
    if (resp.pendingVerification) {
      pendingVerificationRef.value = true;
      // Expect backend not to return user; pass username/email via query for poll page
      try {
        router.push({ path: '/verify-email', query: { user: username, email } });
      } catch {/* ignore navigation errors */}
      return { pendingVerification: true, redirect: '/verify-email' };
    }
    persistUser(resp.user);
    pendingVerificationRef.value = false;
    return { pendingVerification: false, user: resp.user };
  }

  function logout() {
    persistToken(null);
    persistUser(null);
    pendingVerificationRef.value = false;
    try { router.replace('/'); } catch {/* ignore navigation errors */}
  }

  function buildProviderUrl(provider, redirectPath = '/profile', popup = false) {
    const base = API_BASE_URL.replace(/\/$/, '');
    const popupFlag = popup ? '&popup=1' : '';
    return `${base}/auth/${provider}?redirect=${encodeURIComponent(redirectPath)}${popupFlag}`;
  }

  function startOAuth(provider, redirectPath = '/profile') {
    window.location.href = buildProviderUrl(provider, redirectPath, false);
  }

  function startOAuthPopup(provider, redirectPath = '/profile') {
    return new Promise((resolve, reject) => {
      const width = 520; const height = 640;
      const left = window.screenX + Math.max(0, (window.outerWidth - width) / 2);
      const top = window.screenY + Math.max(0, (window.outerHeight - height) / 2 - 40);
      const url = buildProviderUrl(provider, redirectPath, true);
      const win = window.open(url, 'oauth_popup_' + provider, `width=${width},height=${height},left=${left},top=${top}`);
      if (!win) { reject(new Error('Popup blocked')); return; }

      const origin = API_BASE_URL.replace(/\/$/, '').replace(/^(https?:\/\/[^/]+).*/, '$1');
      let finished = false;
      const timer = setInterval(() => {
        if (win.closed) {
          clearInterval(timer);
          if (!finished) reject(new Error('Popup closed'));
        }
      }, 400);

      function cleanup() {
        finished = true;
        clearInterval(timer);
        window.removeEventListener('message', onMessage);
      }

      async function onMessage(e) {
        if (!e.data || e.data.source !== 'oauth-popup') return;
        // Optionally verify origin: if (e.origin !== origin) return;
        cleanup();
        try {
          await loginWithToken(e.data.token);
          resolve({ user: userRef.value, redirect: e.data.redirect });
        } catch (err) {
          reject(err);
        }
      }
      window.addEventListener('message', onMessage);
    });
  }

  // Called by OAuth callback view after parsing token
  async function loginWithToken(tokenValue) {
    persistToken(tokenValue);
    return await fetchMe();
  }

  return { user, token, isLoggedIn, pendingVerification, login, register, logout, startOAuth, startOAuthPopup, loginWithToken, fetchMe };
}
