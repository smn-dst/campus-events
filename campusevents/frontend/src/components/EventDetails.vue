<template>
  <div class="event-details">
    <div v-if="loading" class="loading">
      Chargement...
    </div>

    <div v-else-if="error" class="error">
      ❌ {{ error }}
    </div>

    <div v-else-if="event" class="content">
      <!-- En-tête -->
      <div class="header">
        <button @click="goBack" class="btn-back">
          ← Retour
        </button>
        
        <div class="header-info">
          <h1>{{ event.title }}</h1>
          <div class="tags">
            <span v-for="tag in event.tags" :key="tag" class="tag">
              {{ tag }}
            </span>
          </div>
        </div>
      </div>

      <!-- Informations principales -->
      <div class="info-grid">
        <div class="info-card">
          <div class="icon">📅</div>
          <div>
            <div class="label">Date & Heure</div>
            <div class="value">{{ formatDate(event.startAt) }}</div>
            <div v-if="event.endAt" class="secondary">
              Fin : {{ formatDate(event.endAt) }}
            </div>
          </div>
        </div>

        <div class="info-card">
          <div class="icon">📍</div>
          <div>
            <div class="label">Lieu</div>
            <div class="value">{{ event.location }}</div>
          </div>
        </div>

        <div class="info-card" :class="{ full: event.isFull }">
          <div class="icon">👥</div>
          <div>
            <div class="label">Participants</div>
            <div class="value">
              {{ event.attendeesCount }}/{{ event.capacity }}
            </div>
            <div v-if="event.isFull" class="secondary full-text">
              Complet !
            </div>
            <div v-else class="secondary">
              {{ event.availableSpots }} places restantes
            </div>
          </div>
        </div>

        <div class="info-card">
          <div class="icon">👤</div>
          <div>
            <div class="label">Organisateur</div>
            <div class="value">
              {{ event.createdBy.firstName }} {{ event.createdBy.lastName }}
            </div>
          </div>
        </div>
      </div>

      <!-- Description -->
      <div class="section">
        <h2>📋 Description</h2>
        <p class="description">
          {{ event.description || 'Aucune description disponible.' }}
        </p>
      </div>

      <!-- Actions -->
      <div v-if="isAuthenticated" class="actions">
        <button
          v-if="!isRegistered"
          @click="register"
          :disabled="event.isFull || isPastEvent"
          class="btn-register"
        >
          {{ event.isFull ? 'Événement complet' : isPastEvent ? 'Événement passé' : 'S\'inscrire' }}
        </button>

        <button
          v-else
          @click="unregister"
          :disabled="isPastEvent"
          class="btn-unregister"
        >
          {{ isPastEvent ? 'Événement passé' : 'Se désinscrire' }}
        </button>

        <button
          v-if="isAdmin"
          @click="editEvent"
          class="btn-edit"
        >
          ✏️ Modifier l'événement
        </button>
      </div>

      <div v-else class="auth-notice">
        <p>👉 Connectez-vous pour vous inscrire à cet événement</p>
      </div>

      <!-- Liste des participants (pour les utilisateurs connectés) -->
      <div v-if="isAuthenticated && attendees.length > 0" class="section">
        <h2>👥 Participants ({{ attendees.length }})</h2>
        <div class="attendees-list">
          <div
            v-for="attendee in attendees"
            :key="attendee.user.id"
            class="attendee"
          >
            <div class="attendee-avatar">
              {{ attendee.user.firstName[0] }}{{ attendee.user.lastName[0] }}
            </div>
            <div>
              <div class="attendee-name">
                {{ attendee.user.firstName }} {{ attendee.user.lastName }}
              </div>
              <div class="attendee-date">
                Inscrit le {{ formatShortDate(attendee.registeredAt) }}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';

const props = defineProps({
  eventId: {
    type: String,
    required: true,
  },
});

const router = useRouter();

// État
const event = ref(null);
const attendees = ref([]);
const loading = ref(false);
const error = ref(null);
const isRegistered = ref(false);

// Authentification
const token = computed(() => localStorage.getItem('token'));
const user = computed(() => {
  const userStr = localStorage.getItem('user');
  return userStr ? JSON.parse(userStr) : null;
});
const isAuthenticated = computed(() => !!token.value);
const isAdmin = computed(() => user.value?.role === 'admin');

const isPastEvent = computed(() => {
  if (!event.value) return false;
  return new Date(event.value.startAt) < new Date();
});

// Fonctions
const fetchEvent = async () => {
  loading.value = true;
  error.value = null;

  try {
    const response = await fetch(`http://api.localhost/api/events/${props.eventId}`);

    if (!response.ok) {
      throw new Error('Événement introuvable');
    }

    event.value = await response.json();
  } catch (err) {
    error.value = err.message;
    console.error('Error fetching event:', err);
  } finally {
    loading.value = false;
  }
};

const fetchAttendees = async () => {
  if (!isAuthenticated.value) return;

  try {
    const response = await fetch(`http://api.localhost/api/events/${props.eventId}/attendees`, {
      headers: {
        'Authorization': `Bearer ${token.value}`,
      },
    });

    if (response.ok) {
      const data = await response.json();
      attendees.value = data.attendees;
      
      // Vérifier si l'utilisateur est inscrit
      isRegistered.value = data.attendees.some(
        a => a.user.id === user.value.id
      );
    }
  } catch (err) {
    console.error('Error fetching attendees:', err);
  }
};

const register = async () => {
  try {
    const response = await fetch(`http://api.localhost/api/events/${props.eventId}/register`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token.value}`,
      },
    });

    if (!response.ok) {
      const data = await response.json();
      alert(data.error || 'Erreur lors de l\'inscription');
      return;
    }

    alert('✅ Inscription réussie !');
    await fetchEvent();
    await fetchAttendees();
  } catch (err) {
    console.error('Error registering:', err);
    alert('Erreur lors de l\'inscription');
  }
};

const unregister = async () => {
  if (!confirm('Êtes-vous sûr de vouloir vous désinscrire ?')) {
    return;
  }

  try {
    const response = await fetch(`http://api.localhost/api/events/${props.eventId}/register`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token.value}`,
      },
    });

    if (!response.ok) {
      const data = await response.json();
      alert(data.error || 'Erreur lors de la désinscription');
      return;
    }

    alert('✅ Désinscription réussie');
    await fetchEvent();
    await fetchAttendees();
  } catch (err) {
    console.error('Error unregistering:', err);
    alert('Erreur lors de la désinscription');
  }
};

const editEvent = () => {
  router.push(`/admin/events/${props.eventId}/edit`);
};

const goBack = () => {
  router.back();
};

const formatDate = (dateString) => {
  const date = new Date(dateString);
  return date.toLocaleDateString('fr-FR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

const formatShortDate = (dateString) => {
  const date = new Date(dateString);
  return date.toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
};

// Charger les données au montage
onMounted(() => {
  fetchEvent();
  fetchAttendees();
});
</script>

<style scoped>
.event-details {
  max-width: 900px;
  margin: 0 auto;
  padding: 2rem;
}

.loading, .error {
  text-align: center;
  padding: 3rem;
  font-size: 1.2rem;
}

.error {
  color: #f44336;
}

.content {
  display: flex;
  flex-direction: column;
  gap: 2rem;
}

.header {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.btn-back {
  align-self: flex-start;
  padding: 0.5rem 1rem;
  background: #f5f5f5;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 600;
  transition: all 0.2s;
}

.btn-back:hover {
  background: #e0e0e0;
  transform: translateX(-4px);
}

.header-info h1 {
  margin: 0;
  color: #213547;
  font-size: 2rem;
}

.tags {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin-top: 0.75rem;
}

.tag {
  padding: 0.5rem 1rem;
  background: #e3f2fd;
  color: #1976d2;
  border-radius: 20px;
  font-size: 0.9rem;
  font-weight: 500;
}

.info-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
}

.info-card {
  background: white;
  border: 2px solid #e0e0e0;
  border-radius: 12px;
  padding: 1.5rem;
  display: flex;
  gap: 1rem;
  align-items: start;
  transition: all 0.2s;
}

.info-card:hover {
  border-color: #4CAF50;
  transform: translateY(-2px);
}

.info-card.full {
  border-color: #f44336;
}

.icon {
  font-size: 2rem;
}

.label {
  font-size: 0.85rem;
  color: #666;
  margin-bottom: 0.25rem;
}

.value {
  font-size: 1.1rem;
  font-weight: 600;
  color: #213547;
}

.secondary {
  font-size: 0.85rem;
  color: #666;
  margin-top: 0.25rem;
}

.full-text {
  color: #f44336;
  font-weight: 600;
}

.section {
  background: white;
  border: 2px solid #e0e0e0;
  border-radius: 12px;
  padding: 2rem;
}

.section h2 {
  margin: 0 0 1rem 0;
  color: #213547;
  font-size: 1.4rem;
}

.description {
  color: #444;
  line-height: 1.8;
  font-size: 1.05rem;
}

.actions {
  display: flex;
  gap: 1rem;
  flex-wrap: wrap;
}

.actions button {
  flex: 1;
  padding: 1rem 2rem;
  border: none;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  font-size: 1rem;
}

.btn-register {
  background: #4CAF50;
  color: white;
}

.btn-register:hover:not(:disabled) {
  background: #45a049;
  transform: scale(1.02);
}

.btn-register:disabled {
  background: #ccc;
  cursor: not-allowed;
}

.btn-unregister {
  background: #ff9800;
  color: white;
}

.btn-unregister:hover:not(:disabled) {
  background: #f57c00;
}

.btn-edit {
  background: #2196F3;
  color: white;
}

.btn-edit:hover {
  background: #0b7dda;
}

.auth-notice {
  background: #e3f2fd;
  border: 2px solid #2196F3;
  border-radius: 12px;
  padding: 1.5rem;
  text-align: center;
}

.auth-notice p {
  margin: 0;
  color: #1565c0;
  font-weight: 500;
  font-size: 1.05rem;
}

.attendees-list {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
  gap: 1rem;
}

.attendee {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1rem;
  background: #f5f5f5;
  border-radius: 8px;
  transition: all 0.2s;
}

.attendee:hover {
  background: #e8f5e9;
  transform: scale(1.02);
}

.attendee-avatar {
  width: 50px;
  height: 50px;
  border-radius: 50%;
  background: #4CAF50;
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  font-size: 1.1rem;
}

.attendee-name {
  font-weight: 600;
  color: #213547;
}

.attendee-date {
  font-size: 0.85rem;
  color: #666;
}
</style>
