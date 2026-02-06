<template>
  <div class="events-list">
    <div class="filters">
      <input
        v-model="filters.search"
        type="text"
        placeholder="🔍 Rechercher un événement..."
        @input="debouncedSearch"
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
        @input="debouncedSearch"
      />
    </div>

    <div v-if="loading" class="loading">
      Chargement des événements...
    </div>

    <div v-else-if="error" class="error">
      ❌ {{ error }}
    </div>

    <div v-else-if="events.length === 0" class="empty">
      Aucun événement trouvé
    </div>

    <div v-else class="events-grid">
      <div
        v-for="event in events"
        :key="event.id"
        class="event-card"
        :class="{ full: event.isFull }"
      >
        <div class="event-header">
          <h3>{{ event.title }}</h3>
          <span class="event-date">
            📅 {{ formatDate(event.startAt) }}
          </span>
        </div>

        <div class="event-tags">
          <span v-for="tag in event.tags" :key="tag" class="tag">
            {{ tag }}
          </span>
        </div>

        <p class="event-description">
          {{ event.description || 'Pas de description' }}
        </p>

        <div class="event-info">
          <span>📍 {{ event.location }}</span>
          <span :class="{ full: event.isFull }">
            👥 {{ event.attendeesCount }}/{{ event.capacity }}
            {{ event.isFull ? '(Complet)' : '' }}
          </span>
        </div>

        <div class="event-actions">
          <button
            v-if="isAuthenticated"
            @click="registerToEvent(event.id)"
            :disabled="event.isFull || isRegistered(event.id)"
            class="btn-register"
          >
            {{ isRegistered(event.id) ? '✓ Inscrit' : 'S\'inscrire' }}
          </button>

          <button
            v-if="isAdmin"
            @click="editEvent(event.id)"
            class="btn-edit"
          >
            ✏️ Modifier
          </button>

          <button
            @click="viewDetails(event.id)"
            class="btn-details"
          >
            Voir détails
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';

const router = useRouter();

// État
const events = ref([]);
const myRegistrations = ref([]);
const loading = ref(false);
const error = ref(null);

const filters = reactive({
  search: '',
  tags: [],
  location: '',
});

const availableTags = [
  'sport', 'tech', 'culture', 'soiree', 'networking',
  'carriere', 'innovation', 'competition', 'bien-etre',
  'ecologie', 'musique', 'atelier', 'entrepreneuriat'
];

// Récupérer le token et le rôle depuis le localStorage
const token = computed(() => localStorage.getItem('token'));
const user = computed(() => {
  const userStr = localStorage.getItem('user');
  return userStr ? JSON.parse(userStr) : null;
});
const isAuthenticated = computed(() => !!token.value);
const isAdmin = computed(() => user.value?.role === 'admin');

// Fonctions
const fetchEvents = async () => {
  loading.value = true;
  error.value = null;

  try {
    // Construire l'URL avec les filtres
    const params = new URLSearchParams();
    if (filters.search) params.append('search', filters.search);
    if (filters.location) params.append('location', filters.location);
    if (filters.tags.length > 0) params.append('tags', filters.tags.join(','));

    const url = `http://api.localhost/api/events?${params.toString()}`;
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error('Erreur lors du chargement des événements');
    }

    events.value = await response.json();
  } catch (err) {
    error.value = err.message;
    console.error('Error fetching events:', err);
  } finally {
    loading.value = false;
  }
};

const fetchMyRegistrations = async () => {
  if (!isAuthenticated.value) return;

  try {
    const response = await fetch('http://api.localhost/api/events/my/registrations', {
      headers: {
        'Authorization': `Bearer ${token.value}`,
      },
    });

    if (response.ok) {
      const data = await response.json();
      myRegistrations.value = data.map(reg => reg.event.id);
    }
  } catch (err) {
    console.error('Error fetching registrations:', err);
  }
};

const toggleTag = (tag) => {
  const index = filters.tags.indexOf(tag);
  if (index > -1) {
    filters.tags.splice(index, 1);
  } else {
    filters.tags.push(tag);
  }
  fetchEvents();
};

// Debounce pour la recherche
let searchTimeout;
const debouncedSearch = () => {
  clearTimeout(searchTimeout);
  searchTimeout = setTimeout(() => {
    fetchEvents();
  }, 500);
};

const isRegistered = (eventId) => {
  return myRegistrations.value.includes(eventId);
};

const registerToEvent = async (eventId) => {
  try {
    const response = await fetch(`http://api.localhost/api/events/${eventId}/register`, {
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
    await fetchMyRegistrations();
    await fetchEvents();
  } catch (err) {
    console.error('Error registering:', err);
    alert('Erreur lors de l\'inscription');
  }
};

const editEvent = (eventId) => {
  router.push(`/admin/events/${eventId}/edit`);
};

const viewDetails = (eventId) => {
  router.push(`/events/${eventId}`);
};

const formatDate = (dateString) => {
  const date = new Date(dateString);
  return date.toLocaleDateString('fr-FR', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

// Charger les données au montage
onMounted(() => {
  fetchEvents();
  fetchMyRegistrations();
});
</script>

<style scoped>
.events-list {
  max-width: 1200px;
  margin: 0 auto;
  padding: 2rem;
}

.filters {
  margin-bottom: 2rem;
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.filters input {
  padding: 0.75rem;
  font-size: 1rem;
  border: 2px solid #e0e0e0;
  border-radius: 8px;
  transition: border-color 0.2s;
}

.filters input:focus {
  outline: none;
  border-color: #4CAF50;
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
  transition: all 0.2s;
  font-size: 0.9rem;
}

.filter-tags button:hover {
  border-color: #4CAF50;
  transform: translateY(-2px);
}

.filter-tags button.active {
  background: #4CAF50;
  color: white;
  border-color: #4CAF50;
}

.loading, .error, .empty {
  text-align: center;
  padding: 3rem;
  color: #666;
  font-size: 1.2rem;
}

.error {
  color: #f44336;
}

.events-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 1.5rem;
}

.event-card {
  background: white;
  border: 2px solid #e0e0e0;
  border-radius: 12px;
  padding: 1.5rem;
  transition: all 0.3s;
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.event-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.1);
  border-color: #4CAF50;
}

.event-card.full {
  opacity: 0.7;
  border-color: #ccc;
}

.event-header {
  display: flex;
  justify-content: space-between;
  align-items: start;
  gap: 1rem;
}

.event-header h3 {
  margin: 0;
  color: #213547;
  font-size: 1.3rem;
}

.event-date {
  font-size: 0.85rem;
  color: #666;
  white-space: nowrap;
}

.event-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.tag {
  padding: 0.25rem 0.75rem;
  background: #e3f2fd;
  color: #1976d2;
  border-radius: 12px;
  font-size: 0.8rem;
  font-weight: 500;
}

.event-description {
  color: #666;
  font-size: 0.95rem;
  line-height: 1.5;
  flex-grow: 1;
}

.event-info {
  display: flex;
  justify-content: space-between;
  padding-top: 0.5rem;
  border-top: 1px solid #f0f0f0;
  font-size: 0.9rem;
  color: #666;
}

.event-info .full {
  color: #f44336;
  font-weight: 600;
}

.event-actions {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.event-actions button {
  flex: 1;
  padding: 0.75rem;
  border: none;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  font-size: 0.9rem;
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

.btn-edit {
  background: #2196F3;
  color: white;
}

.btn-edit:hover {
  background: #0b7dda;
}

.btn-details {
  background: #f5f5f5;
  color: #333;
  border: 1px solid #ddd;
}

.btn-details:hover {
  background: #e0e0e0;
}
</style>
