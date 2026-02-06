<template>
  <div class="admin-dashboard">
    <div class="dashboard-header">
      <h1>Dashboard Admin</h1>
      <router-link to="/admin/events/new" class="btn-create">➕ Créer un événement</router-link>
    </div>

    <p v-if="flashMessage" :class="['flash', flashType]">{{ flashMessage }}</p>

    <div class="filters">
      <input
        v-model="filters.search"
        type="text"
        placeholder="🔍 Rechercher..."
        @input="debouncedFetch"
      />
      <div class="filter-tags">
        <button
          v-for="tag in availableTags"
          :key="tag"
          :class="{ active: filters.tags.includes(tag) }"
          @click="toggleTag(tag)"
        >
          {{ tag }}
        </button>
      </div>
      <input
        v-model="filters.location"
        type="text"
        placeholder="📍 Lieu"
        @input="debouncedFetch"
      />
    </div>

    <div v-if="loading" class="loading">Chargement des événements...</div>
    <div v-else-if="error" class="error">❌ {{ error }}</div>
    <div v-else-if="events.length === 0" class="empty">Aucun événement.</div>

    <div v-else class="events-table-wrap">
      <table class="events-table">
        <thead>
          <tr>
            <th>Titre</th>
            <th>Lieu</th>
            <th>Date</th>
            <th>Participants</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="event in events" :key="event.id">
            <td>
              <router-link :to="`/events/${event.id}`" class="event-title">{{ event.title }}</router-link>
            </td>
            <td>{{ event.location }}</td>
            <td>{{ formatDate(event.startAt) }}</td>
            <td :class="{ full: event.isFull }">
              {{ event.attendeesCount }}/{{ event.capacity }}
            </td>
            <td class="actions">
              <button type="button" class="btn-sm btn-edit" @click="goEdit(event.id)">Modifier</button>
              <button type="button" class="btn-sm btn-attendees" @click="openAttendees(event)">Inscrits</button>
              <button type="button" class="btn-sm btn-delete" @click="confirmDelete(event)">Supprimer</button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <div v-if="attendeesModal" class="modal-overlay" @click.self="attendeesModal = null">
      <div class="modal">
        <h3>Inscrits — {{ attendeesEvent?.title }}</h3>
        <div v-if="attendeesLoading" class="loading">Chargement...</div>
        <div v-else-if="attendees.length === 0" class="empty">Aucun inscrit.</div>
        <ul v-else class="attendees-list">
          <li v-for="a in attendees" :key="a.registrationId" class="attendee">
            <span class="name">{{ a.user.firstName }} {{ a.user.lastName }}</span>
            <span class="email">{{ a.user.email }}</span>
            <span class="date">{{ formatShortDate(a.registeredAt) }}</span>
          </li>
        </ul>
        <button type="button" class="btn-close" @click="attendeesModal = null">Fermer</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, watch } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { getApiUrl, apiFetch } from '../lib/api.js';

const router = useRouter();
const route = useRoute();

const events = ref([]);
const loading = ref(false);
const error = ref(null);
const flashMessage = ref('');
const flashType = ref('success');
const attendeesModal = ref(null);
const attendeesEvent = ref(null);
const attendees = ref([]);
const attendeesLoading = ref(false);

const filters = reactive({
  search: '',
  tags: [],
  location: '',
});

const availableTags = [
  'sport', 'tech', 'culture', 'soiree', 'networking',
  'carriere', 'innovation', 'competition', 'bien-etre',
  'ecologie', 'musique', 'atelier', 'entrepreneuriat',
];

function setFlash(msg, type = 'success') {
  flashMessage.value = msg;
  flashType.value = type;
  setTimeout(() => { flashMessage.value = ''; }, 4000);
}

async function fetchEvents() {
  loading.value = true;
  error.value = null;
  try {
    const params = new URLSearchParams();
    if (filters.search) params.append('search', filters.search);
    if (filters.location) params.append('location', filters.location);
    if (filters.tags.length > 0) params.append('tags', filters.tags.join(','));
    const res = await fetch(`${getApiUrl('events')}?${params.toString()}`);
    if (!res.ok) throw new Error('Erreur chargement');
    events.value = await res.json();
  } catch (err) {
    error.value = err.message;
  } finally {
    loading.value = false;
  }
}

let debounceTimer;
function debouncedFetch() {
  clearTimeout(debounceTimer);
  debounceTimer = setTimeout(fetchEvents, 500);
}

function toggleTag(tag) {
  const i = filters.tags.indexOf(tag);
  if (i > -1) filters.tags.splice(i, 1);
  else filters.tags.push(tag);
  fetchEvents();
}

function formatDate(dateString) {
  return new Date(dateString).toLocaleDateString('fr-FR', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function formatShortDate(dateString) {
  return new Date(dateString).toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

function goEdit(id) {
  router.push(`/admin/events/${id}/edit`);
}

async function openAttendees(event) {
  attendeesEvent.value = event;
  attendeesModal.value = event.id;
  attendees.value = [];
  attendeesLoading.value = true;
  try {
    const res = await apiFetch(`events/${event.id}/attendees`);
    if (res.ok) {
      const data = await res.json();
      attendees.value = data.attendees || [];
    }
  } catch (e) {
    setFlash('Erreur chargement des inscrits', 'error');
  } finally {
    attendeesLoading.value = false;
  }
}

async function confirmDelete(event) {
  if (!confirm(`Supprimer « ${event.title } » ?`)) return;
  try {
    const res = await apiFetch(`events/${event.id}`, { method: 'DELETE' });
    if (!res.ok) {
      const data = await res.json();
      throw new Error(data.error || 'Erreur suppression');
    }
    setFlash('Événement supprimé.');
    await fetchEvents();
  } catch (err) {
    setFlash(err.message || 'Erreur lors de la suppression', 'error');
  }
}

onMounted(() => {
  fetchEvents();
  const q = route.query.flash;
  if (q === 'created') setFlash('Événement créé avec succès.');
  else if (q === 'updated') setFlash('Événement mis à jour.');
  else if (q === 'deleted') setFlash('Événement supprimé.');
});

watch(() => route.query.flash, (q) => {
  if (q === 'created') setFlash('Événement créé avec succès.');
  else if (q === 'updated') setFlash('Événement mis à jour.');
  else if (q === 'deleted') setFlash('Événement supprimé.');
});
</script>

<style scoped>
.admin-dashboard {
  max-width: 1100px;
  margin: 0 auto;
  padding: 2rem;
}

.dashboard-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
  flex-wrap: wrap;
  gap: 1rem;
}

.dashboard-header h1 {
  margin: 0;
  color: #213547;
  font-size: 1.75rem;
}

.btn-create {
  padding: 0.75rem 1.5rem;
  background: #4CAF50;
  color: white;
  text-decoration: none;
  border-radius: 8px;
  font-weight: 600;
}

.btn-create:hover {
  background: #45a049;
}

.flash {
  padding: 1rem;
  border-radius: 8px;
  margin-bottom: 1rem;
}

.flash.success {
  background: #e8f5e9;
  color: #2e7d32;
}

.flash.error {
  background: #ffebee;
  color: #c62828;
}

.filters {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  margin-bottom: 2rem;
}

.filters input {
  padding: 0.75rem;
  border: 2px solid #e0e0e0;
  border-radius: 8px;
  font-size: 1rem;
}

.filter-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.filter-tags button {
  padding: 0.5rem 1rem;
  background: white;
  border: 2px solid #e0e0e0;
  border-radius: 20px;
  cursor: pointer;
  font-size: 0.9rem;
}

.filter-tags button.active {
  background: #4CAF50;
  color: white;
  border-color: #4CAF50;
}

.loading, .error, .empty {
  text-align: center;
  padding: 2rem;
  color: #666;
}

.error {
  color: #c62828;
}

.events-table-wrap {
  overflow-x: auto;
  background: white;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.08);
}

.events-table {
  width: 100%;
  border-collapse: collapse;
}

.events-table th,
.events-table td {
  padding: 1rem;
  text-align: left;
  border-bottom: 1px solid #eee;
}

.events-table th {
  background: #f5f5f5;
  font-weight: 600;
  color: #333;
}

.events-table td.full {
  color: #c62828;
}

.event-title {
  color: #1976d2;
  text-decoration: none;
  font-weight: 500;
}

.event-title:hover {
  text-decoration: underline;
}

.actions {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.btn-sm {
  padding: 0.4rem 0.75rem;
  border: none;
  border-radius: 6px;
  font-size: 0.85rem;
  font-weight: 600;
  cursor: pointer;
}

.btn-edit {
  background: #2196f3;
  color: white;
}

.btn-attendees {
  background: #ff9800;
  color: white;
}

.btn-delete {
  background: #f44336;
  color: white;
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
  max-width: 500px;
  width: 90%;
  max-height: 80vh;
  overflow: auto;
  box-shadow: 0 8px 24px rgba(0,0,0,0.15);
}

.modal h3 {
  margin: 0 0 1.5rem;
  color: #213547;
}

.attendees-list {
  list-style: none;
  padding: 0;
  margin: 0 0 1rem;
}

.attendee {
  display: grid;
  grid-template-columns: 1fr 1fr auto;
  gap: 1rem;
  padding: 0.75rem 0;
  border-bottom: 1px solid #eee;
  font-size: 0.95rem;
}

.attendee .name { font-weight: 500; }
.attendee .email { color: #666; }
.attendee .date { color: #999; font-size: 0.85rem; }

.btn-close {
  padding: 0.75rem 1.5rem;
  background: #f5f5f5;
  border: none;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
}

.btn-close:hover {
  background: #e0e0e0;
}
</style>
