<template>
  <div class="callback-page">
    <div class="box">
      <p class="status" v-if="loading">Finalizing sign in...</p>
      <p class="status error" v-else-if="error">{{ error }}</p>
      <p class="status" v-else>Signed in. Redirecting...</p>
    </div>
  </div>
</template>

<script setup>
import { onMounted, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useAuth } from '../composables/useAuth';

const loading = ref(true);
const error = ref('');
const route = useRoute();
const router = useRouter();
const { loginWithToken } = useAuth();

function extractTokenFromHash() {
  const hash = window.location.hash || '';
  if (!hash.startsWith('#')) return null;
  const params = new URLSearchParams(hash.slice(1));
  return params.get('token');
}

onMounted(async () => {
  const token = extractTokenFromHash();
  const redirect = route.query.redirect || '/profile';
  if (!token) {
    error.value = 'Missing token in callback';
    loading.value = false;
    return;
  }
  try {
    await loginWithToken(token);
    router.replace(redirect);
  } catch (e) {
    error.value = e.message || 'Failed to complete sign in';
  } finally {
    loading.value = false;
  }
});
</script>

<style scoped>
.callback-page { display:flex; align-items:center; justify-content:center; min-height:50vh; }
.box { background:#11171b; border:1px solid #1c2429; padding:2rem 2.5rem; border-radius:8px; }
.status { font-size:.85rem; color:#e3e8ec; }
.status.error { color:#ff6d6d; }
</style>
