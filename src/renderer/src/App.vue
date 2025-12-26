<script setup lang="ts">
import { onMounted, ref } from 'vue';
import MainLayout from './components/MainLayout.vue';
import Settings from './components/Settings.vue';

const isSettingsOpen = ref<boolean>(false);

const handleKeyDown = (e: KeyboardEvent): void => {
  if (e.ctrlKey && e.key == ',') {
    isSettingsOpen.value = true;
  }
};

onMounted(() => {
  document.addEventListener('keydown', handleKeyDown);
});
</script>

<template>
  <MainLayout />

  <Settings :is-open="isSettingsOpen" @close="isSettingsOpen = false" />
</template>

<style>
#app {
  height: 100vh;
  width: 100vw;
}

body {
  margin: 0;
}
</style>
