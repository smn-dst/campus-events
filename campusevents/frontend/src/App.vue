<template>
  <div class="app">
    <header class="header">
      <router-link to="/" class="logo">🎓 CampusEvents</router-link>
      <nav class="nav">
        <router-link to="/">Accueil</router-link>
        <router-link v-if="isAdmin" to="/admin">Admin</router-link>
      </nav>
      <div class="auth">
        <template v-if="isAuthenticated">
          <span class="user-email">{{ currentUser?.email }}</span>
          <button type="button" class="btn-logout" @click="logout">Déconnexion</button>
        </template>
        <template v-else>
          <button type="button" class="btn-login" @click="showLogin = true">Connexion</button>
          <button type="button" class="btn-register" @click="showRegister = true">S'inscrire</button>
        </template>
      </div>
    </header>

    <div v-if="showLogin" class="modal-overlay" @click.self="showLogin = false">
      <div class="modal">
        <h3>Connexion</h3>
        <form @submit.prevent="handleLogin">
          <input v-model="loginEmail" type="email" placeholder="Email" required />
          <input v-model="loginPassword" type="password" placeholder="Mot de passe" required />
          <p v-if="authError" class="error">{{ authError }}</p>
          <div class="modal-actions">
            <button type="submit">Se connecter</button>
            <button type="button" @click="showLogin = false">Annuler</button>
          </div>
        </form>
      </div>
    </div>

    <div v-if="showRegister" class="modal-overlay" @click.self="showRegister = false">
      <div class="modal">
        <h3>Inscription</h3>
        <form @submit.prevent="handleRegister">
          <input v-model="registerEmail" type="email" placeholder="Email" required />
          <input v-model="registerPassword" type="password" placeholder="Mot de passe" required />
          <input v-model="registerFirstName" type="text" placeholder="Prénom" required />
          <input v-model="registerLastName" type="text" placeholder="Nom" required />
          <p v-if="authError" class="error">{{ authError }}</p>
          <div class="modal-actions">
            <button type="submit">S'inscrire</button>
            <button type="button" @click="showRegister = false">Annuler</button>
          </div>
        </form>
      </div>
    </div>

    <main class="main">
      <router-view />
    </main>
  </div>
</template>

<script setup>
import { ref, watch, onMounted } from 'vue';
import { useRoute } from 'vue-router';
import { useAuth } from './composables/useAuth';

const route = useRoute();
const {
  isAuthenticated,
  isAdmin,
  currentUser,
  login,
  register: doRegister,
  logout,
  fetchCurrentUser,
} = useAuth();

onMounted(() => {
  if (isAuthenticated.value && !currentUser.value) {
    fetchCurrentUser();
  }
});

const showLogin = ref(false);
const showRegister = ref(false);
const loginEmail = ref('');
const loginPassword = ref('');
const registerEmail = ref('');
const registerPassword = ref('');
const registerFirstName = ref('');
const registerLastName = ref('');
const authError = ref('');

watch(() => route.query.login, (v) => {
  if (v === '1') showLogin.value = true;
});

async function handleLogin() {
  authError.value = '';
  try {
    await login(loginEmail.value, loginPassword.value);
    showLogin.value = false;
    loginPassword.value = '';
  } catch (e) {
    authError.value = e.message || 'Erreur de connexion';
  }
}

async function handleRegister() {
  authError.value = '';
  try {
    await doRegister({
      email: registerEmail.value,
      password: registerPassword.value,
      firstName: registerFirstName.value,
      lastName: registerLastName.value,
    });
    showRegister.value = false;
    registerPassword.value = '';
  } catch (e) {
    authError.value = e.message || 'Erreur d\'inscription';
  }
}
</script>

<style scoped>
.app {
  min-height: 100vh;
  font-family: system-ui, sans-serif;
  background: #f5f5f5;
}

.header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1rem 2rem;
  background: white;
  border-bottom: 2px solid #e0e0e0;
  flex-wrap: wrap;
  gap: 1rem;
}

.logo {
  font-size: 1.5rem;
  font-weight: 700;
  color: #213547;
  text-decoration: none;
}

.nav {
  display: flex;
  gap: 1.5rem;
}

.nav a {
  color: #333;
  text-decoration: none;
  font-weight: 500;
}

.nav a.router-link-active {
  color: #4CAF50;
}

.auth {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.user-email {
  font-size: 0.9rem;
  color: #666;
}

.btn-login, .btn-register, .btn-logout {
  padding: 0.5rem 1rem;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  border: none;
  font-size: 0.95rem;
}

.btn-login, .btn-register {
  background: #4CAF50;
  color: white;
}

.btn-logout {
  background: #f5f5f5;
  color: #333;
}

.btn-login:hover, .btn-register:hover {
  background: #45a049;
}

.btn-logout:hover {
  background: #e0e0e0;
}

.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,0.4);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 100;
}

.modal {
  background: white;
  padding: 2rem;
  border-radius: 12px;
  min-width: 320px;
  box-shadow: 0 8px 24px rgba(0,0,0,0.15);
}

.modal h3 {
  margin: 0 0 1.5rem;
  color: #213547;
}

.modal form {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.modal input {
  padding: 0.75rem;
  border: 2px solid #e0e0e0;
  border-radius: 8px;
  font-size: 1rem;
}

.modal input:focus {
  outline: none;
  border-color: #4CAF50;
}

.modal .error {
  color: #f44336;
  font-size: 0.9rem;
  margin: 0;
}

.modal-actions {
  display: flex;
  gap: 0.75rem;
  margin-top: 0.5rem;
}

.modal-actions button {
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
}

.modal-actions button[type="submit"] {
  background: #4CAF50;
  color: white;
}

.modal-actions button[type="button"] {
  background: #f5f5f5;
  color: #333;
}

.main {
  padding: 0;
}
</style>
