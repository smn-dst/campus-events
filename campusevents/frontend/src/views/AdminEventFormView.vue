<template>
  <div class="admin-form-view">
    <EventForm
      :event-id="eventId"
      @success="onSuccess"
      @cancel="onCancel"
    />
  </div>
</template>

<script setup>
import { computed } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import EventForm from '../components/EventForm.vue';

const router = useRouter();
const route = useRoute();

const eventId = computed(() => route.params.id || null);

function onSuccess(flash) {
  router.push({ path: '/admin', query: { flash: flash || 'updated' } });
}

function onCancel() {
  router.back();
}
</script>

<style scoped>
.admin-form-view {
  max-width: 800px;
  margin: 0 auto;
  padding: 2rem;
}
</style>
