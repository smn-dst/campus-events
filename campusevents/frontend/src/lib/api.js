const API_BASE = import.meta.env.DEV
  ? ''
  : (import.meta.env.VITE_API_URL ?? 'http://api.localhost').replace(/\/$/, '');

export function getApiUrl(path = '') {
  const p = path.startsWith('/') ? path.slice(1) : path;
  const full = p.startsWith('api/') ? p : `api/${p}`;
  return API_BASE ? `${API_BASE}/${full}` : `/${full}`;
}

export async function apiFetch(path, options = {}) {
  const url = path.startsWith('http') ? path : getApiUrl(path);
  const token = localStorage.getItem('token');
  const headers = {
    ...(options.headers || {}),
    'Content-Type': 'application/json',
  };
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }
  const response = await fetch(url, { ...options, headers });
  if (response.status === 401) {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  }
  return response;
}
