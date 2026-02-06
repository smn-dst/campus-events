<template>
  <div class="event-form">
    <h2>{{ isEdit ? '✏️ Modifier' : '➕ Créer' }} un événement</h2>

    <form @submit.prevent="handleSubmit">
      <div class="form-group">
        <label for="title">Titre *</label>
        <input
          id="title"
          v-model="form.title"
          type="text"
          required
          placeholder="Ex: Hackathon IA 2025"
        />
      </div>

      <div class="form-group">
        <label for="description">Description</label>
        <textarea
          id="description"
          v-model="form.description"
          rows="4"
          placeholder="Décrivez l'événement..."
        ></textarea>
      </div>

      <div class="form-row">
        <div class="form-group">
          <label for="location">Lieu *</label>
          <input
            id="location"
            v-model="form.location"
            type="text"
            required
            placeholder="Ex: Amphithéâtre A"
          />
        </div>

        <div class="form-group">
          <label for="capacity">Capacité *</label>
          <input
            id="capacity"
            v-model.number="form.capacity"
            type="number"
            min="1"
            required
          />
        </div>
      </div>

      <div class="form-group">
        <label>Tags</label>
        <div class="tags-selector">
          <button
            v-for="tag in availableTags"
            :key="tag"
            type="button"
            :class="{ selected: form.tags.includes(tag) }"
            @click="toggleTag(tag)"
          >
            {{ tag }}
          </button>
        </div>
      </div>

      <div class="form-row">
        <div class="form-group">
          <label for="startAt">Date de début *</label>
          <input
            id="startAt"
            v-model="form.startAt"
            type="datetime-local"
            required
          />
        </div>

        <div class="form-group">
          <label for="endAt">Date de fin</label>
          <input
            id="endAt"
            v-model="form.endAt"
            type="datetime-local"
          />
        </div>
      </div>

      <div v-if="error" class="error-message">
        ❌ {{ error }}
      </div>

      <div class="form-actions">
        <button type="submit" class="btn-submit" :disabled="loading">
          {{ loading ? 'Enregistrement...' : isEdit ? 'Mettre à jour' : 'Créer' }}
        </button>

        <button type="button" class="btn-cancel" @click="$emit('cancel')">
          Annuler
        </button>

        <button
          v-if="isEdit"
          type="button"
          class="btn-delete"
          @click="handleDelete"
        >
          🗑️ Supprimer
        </button>
      </div>
    </form>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, computed } from 'vue';

const props = defineProps({
  eventId: {
    type: String,
    default: null,
  },
});

const emit = defineEmits(['success', 'cancel']);

// État
const loading = ref(false);
const error = ref(null);
const isEdit = computed(() => !!props.eventId);

const form = reactive({
  title: '',
  description: '',
  location: '',
  tags: [],
  capacity: 50,
  startAt: '',
  endAt: '',
});

const availableTags = [
  'sport', 'tech', 'culture', 'soiree', 'networking',
  'carriere', 'innovation', 'competition', 'bien-etre',
  'ecologie', 'musique', 'atelier', 'entrepreneuriat'
];

// Récupérer le token
const token = localStorage.getItem('token');

// Fonctions
const toggleTag = (tag) => {
  const index = form.tags.indexOf(tag);
  if (index > -1) {
    form.tags.splice(index, 1);
  } else {
    form.tags.push(tag);
  }
};

const fetchEvent = async () => {
  if (!props.eventId) return;

  loading.value = true;
  try {
    const response = await fetch(`http://api.localhost/api/events/${props.eventId}`);
    
    if (!response.ok) {
      throw new Error('Événement introuvable');
    }

    const event = await response.json();
    
    // Remplir le formulaire
    form.title = event.title;
    form.description = event.description || '';
    form.location = event.location;
    form.tags = event.tags;
    form.capacity = event.capacity;
    
    // Convertir les dates ISO en format datetime-local
    form.startAt = formatDateForInput(event.startAt);
    form.endAt = event.endAt ? formatDateForInput(event.endAt) : '';
  } catch (err) {
    error.value = err.message;
  } finally {
    loading.value = false;
  }
};

const formatDateForInput = (isoDate) => {
  const date = new Date(isoDate);
  // Format: YYYY-MM-DDTHH:mm
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return `${year}-${month}-${day}T${hours}:${minutes}`;
};

const handleSubmit = async () => {
  loading.value = true;
  error.value = null;

  try {
    // Préparer les données
    const data = {
      title: form.title,
      description: form.description,
      location: form.location,
      tags: form.tags,
      capacity: form.capacity,
      startAt: new Date(form.startAt).toISOString(),
      endAt: form.endAt ? new Date(form.endAt).toISOString() : null,
    };

    // Valider les dates
    if (data.endAt && new Date(data.endAt) <= new Date(data.startAt)) {
      throw new Error('La date de fin doit être après la date de début');
    }

    const url = isEdit.value
      ? `http://api.localhost/api/events/${props.eventId}`
      : 'http://api.localhost/api/events';

    const method = isEdit.value ? 'PUT' : 'POST';

    const response = await fetch(url, {
      method,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Erreur lors de l\'enregistrement');
    }

    alert(isEdit.value ? '✅ Événement modifié !' : '✅ Événement créé !');
    emit('success');
  } catch (err) {
    error.value = err.message;
    console.error('Error saving event:', err);
  } finally {
    loading.value = false;
  }
};

const handleDelete = async () => {
  if (!confirm('Êtes-vous sûr de vouloir supprimer cet événement ?')) {
    return;
  }

  loading.value = true;
  error.value = null;

  try {
    const response = await fetch(`http://api.localhost/api/events/${props.eventId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Erreur lors de la suppression');
    }

    alert('✅ Événement supprimé !');
    emit('success');
  } catch (err) {
    error.value = err.message;
    console.error('Error deleting event:', err);
  } finally {
    loading.value = false;
  }
};

// Charger l'événement si on est en mode édition
onMounted(() => {
  if (isEdit.value) {
    fetchEvent();
  }
});
</script>

<style scoped>
.event-form {
  max-width: 700px;
  margin: 0 auto;
  padding: 2rem;
  background: white;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

h2 {
  margin-bottom: 2rem;
  color: #213547;
}

form {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.form-row {
  display: grid;
  grid-template-columns: 2fr 1fr;
  gap: 1rem;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

label {
  font-weight: 600;
  color: #333;
  font-size: 0.95rem;
}

input, textarea {
  padding: 0.75rem;
  border: 2px solid #e0e0e0;
  border-radius: 8px;
  font-size: 1rem;
  font-family: inherit;
  transition: border-color 0.2s;
}

input:focus, textarea:focus {
  outline: none;
  border-color: #4CAF50;
}

.tags-selector {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.tags-selector button {
  padding: 0.5rem 1rem;
  background: white;
  border: 2px solid #e0e0e0;
  border-radius: 20px;
  cursor: pointer;
  transition: all 0.2s;
  font-size: 0.9rem;
}

.tags-selector button:hover {
  border-color: #4CAF50;
}

.tags-selector button.selected {
  background: #4CAF50;
  color: white;
  border-color: #4CAF50;
}

.error-message {
  padding: 1rem;
  background: #ffebee;
  color: #c62828;
  border-radius: 8px;
  font-weight: 500;
}

.form-actions {
  display: flex;
  gap: 1rem;
  margin-top: 1rem;
}

.form-actions button {
  padding: 0.75rem 2rem;
  border: none;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  font-size: 1rem;
}

.btn-submit {
  flex: 1;
  background: #4CAF50;
  color: white;
}

.btn-submit:hover:not(:disabled) {
  background: #45a049;
  transform: translateY(-2px);
}

.btn-submit:disabled {
  background: #ccc;
  cursor: not-allowed;
}

.btn-cancel {
  background: #f5f5f5;
  color: #333;
}

.btn-cancel:hover {
  background: #e0e0e0;
}

.btn-delete {
  background: #f44336;
  color: white;
}

.btn-delete:hover {
  background: #d32f2f;
}
</style>
