<template>
  <div class="app-container">
    <AppHeader />
    <GlobalAlerts />
    <main class="main-content">
      <router-view />
    </main>
    <AppFooter />
  </div>
</template>

<script setup>
import AppHeader from './components/Header.vue';
import AppFooter from './components/Footer.vue';
import GlobalAlerts from './components/GlobalAlerts.vue';
</script>

<style>
.app-container {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  background: #0f0f0f;
  color: #b5b5b5;
}

.main-content {
  flex: 1;
  padding: 1rem;
}
</style>
