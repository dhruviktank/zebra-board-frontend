const BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000';

// token localStorage key
const TOKEN_KEY = 'zb_token_v1';

function getToken() {
  try { return localStorage.getItem(TOKEN_KEY) || null; } catch { return null; }
}

async function request(path, { method = 'GET', body, headers = {} } = {}) {
  const authToken = getToken();
  const opts = { method, headers: { 'Accept': 'application/json', ...headers } };
  if (authToken) {
    opts.headers['Authorization'] = 'Bearer ' + authToken;
  }
  if (body !== undefined) {
    opts.headers['Content-Type'] = 'application/json';
    opts.body = JSON.stringify(body);
  }
  const res = await fetch(BASE + path, opts);
  let data = null;
  const text = await res.text();
  if (text) {
    try { data = JSON.parse(text); } catch { data = text; }
  }
    if (!res.ok) {
      const err = new Error((data && data.error) || res.statusText || 'Request failed');
      err.status = res.status;
      err.data = data;
      err.isApiError = true;
      throw err;
  }
  return data;
}

export const api = {
  get: (p) => request(p),
  post: (p, b) => request(p, { method: 'POST', body: b }),
  patch: (p, b) => request(p, { method: 'PATCH', body: b }),
  delete: (p) => request(p, { method: 'DELETE' })
};

export { BASE as API_BASE_URL, TOKEN_KEY };