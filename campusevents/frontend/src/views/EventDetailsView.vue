<template>
  <EventDetails :event-id="route.params.id" />
</template>

<script setup>
import { useRoute } from 'vue-router';
import EventDetails from '../components/EventDetails.vue';

const route = useRoute();
</script>
