import { ref, computed } from 'vue';
import { getApiUrl } from '../lib/api.js';

const token = ref(localStorage.getItem('token'));
const user = ref(null);

function loadUserFromStorage() {
  const u = localStorage.getItem('user');
  try {
    user.value = u ? JSON.parse(u) : null;
  } catch {
    user.value = null;
  }
}

loadUserFromStorage();

export function useAuth() {
  const isAuthenticated = computed(() => !!token.value);
  const isAdmin = computed(() => user.value?.role === 'admin');
  const currentUser = computed(() => user.value);

  async function fetchCurrentUser() {
    const t = localStorage.getItem('token');
    if (!t) {
      user.value = null;
      return null;
    }
    try {
      const res = await fetch(getApiUrl('auth/me'), {
        headers: { Authorization: `Bearer ${t}` },
      });
      if (!res.ok) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        token.value = null;
        user.value = null;
        return null;
      }
      const data = await res.json();
      user.value = data;
      localStorage.setItem('user', JSON.stringify(data));
      return data;
    } catch {
      user.value = null;
      return null;
    }
  }

  async function login(email, password) {
    const res = await fetch(getApiUrl('auth/login'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || 'Connexion impossible');
    }
    token.value = data.token;
    user.value = data.user;
    localStorage.setItem('token', data.token);
    localStorage.setItem('user', JSON.stringify(data.user));
    return data;
  }

  async function register({ email, password, firstName, lastName }) {
    const res = await fetch(getApiUrl('auth/register'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, firstName, lastName }),
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || 'Inscription impossible');
    }
    token.value = data.token;
    user.value = data.user;
    localStorage.setItem('token', data.token);
    localStorage.setItem('user', JSON.stringify(data.user));
    return data;
  }

  function logout() {
    token.value = null;
    user.value = null;
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  }

  return {
    isAuthenticated,
    isAdmin,
    currentUser,
    token,
    login,
    register,
    logout,
    fetchCurrentUser,
  };
}
