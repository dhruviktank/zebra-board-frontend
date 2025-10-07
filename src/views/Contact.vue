<template>
  <div class="contact-wrapper">
    <h1>Contact & Suggestions</h1>
  <p class="intro">Have feedback, feature ideas, or found a bug? Drop a quick message below (login required).</p>
    <div class="layout">
      <section class="info">
        <h2>Reach Me</h2>
        <ul>
          <li><strong>Email:</strong> <a :href="'mailto:' + publicEmail">{{ publicEmail }}</a></li>
          <li><strong>GitHub:</strong> <a :href="githubUrl" target="_blank" rel="noopener">{{ githubHandle }}</a></li>
        </ul>
        <p class="note">If you're logged in the message automatically links to your account.</p>
      </section>
      <section class="form-section">
        <h2>Send a Suggestion</h2>
        <div v-if="!isLoggedIn" class="login-req">
          <p>You need to be logged in to send a suggestion.</p>
          <router-link to="/login" class="login-btn">Go to Login</router-link>
        </div>
        <form v-else @submit.prevent="submit" novalidate>
          <label>Message
            <textarea v-model="message" rows="5" maxlength="2000" required placeholder="Your idea, issue, or feedback..." />
          </label>
          <div class="actions">
            <button type="submit" :disabled="submitting || !canSubmit">{{ submitting ? 'Sending...' : 'Send' }}</button>
            <span class="status ok" v-if="success">Thanks! Received.</span>
            <span class="status err" v-else-if="error">{{ error }}</span>
          </div>
        </form>
      </section>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';
import { useAuth } from '../composables/useAuth';
import { api } from '../utils/api';

const { isLoggedIn } = useAuth();
const message = ref('');
const submitting = ref(false);
const success = ref(false);
const error = ref('');

const publicEmail = 'contact@dhruviktank.tech'; // replace with real
const githubHandle = 'dhruviktank';
const githubUrl = 'https://github.com/dhruviktank';

const canSubmit = computed(() => message.value.trim().length > 4 && !submitting.value);

async function submit() {
  if (!canSubmit.value) return;
  submitting.value = true; success.value = false; error.value='';
  try {
    if (!isLoggedIn.value) { error.value = 'Login required'; submitting.value=false; return; }
    const payload = { message: message.value.trim() };
    await api.post('/suggestions', payload);
    success.value = true;
    message.value = '';
  } catch (e) {
    error.value = e?.response?.data?.error || 'Send failed';
  } finally { submitting.value = false; }
}
</script>

<style scoped>
.contact-wrapper { max-width:920px; margin:2.2rem auto 3rem; padding:0 1rem 2rem; font-family:"Segoe UI", Roboto, Arial, sans-serif; }
h1 { margin:0 0 .75rem; font-size:2rem; font-weight:600; }
.intro { margin:0 0 1.5rem; color:#9aa7b4; font-size:.9rem; }
.layout { display:grid; gap:2rem; grid-template-columns: 260px 1fr; align-items:start; }
@media (max-width:800px){ .layout { grid-template-columns:1fr; } }
h2 { margin:.2rem 0 .7rem; font-size:1.05rem; letter-spacing:.5px; }
.info ul { list-style:none; padding:0; margin:0 0 1rem; font-size:.85rem; }
.info li { margin:.35rem 0; }
a { color:#4da3ff; text-decoration:none; }
a:hover { text-decoration:underline; }
.note { font-size:.7rem; color:#768089; }
form { display:flex; flex-direction:column; gap:.9rem; }
label { display:flex; flex-direction:column; gap:.35rem; font-size:.7rem; text-transform:uppercase; letter-spacing:1px; color:#89939b; font-weight:600; }
input, textarea { background:#181a1d; border:1px solid #2a2f35; border-radius:8px; padding:.65rem .75rem; color:#e5e9ec; font-size:.85rem; font-family:inherit; resize:vertical; }
input:focus, textarea:focus { outline:none; border-color:#3d82ff; box-shadow:0 0 0 1px #3d82ff55; }
.row { display:flex; gap:.8rem; }
.row label { flex:1; }
.actions { display:flex; align-items:center; gap:.8rem; }
button { background:#ffffff; color:#101416; font-weight:600; border:1px solid #ffffff; padding:.6rem 1.05rem; border-radius:8px; cursor:pointer; font-size:.75rem; letter-spacing:.4px; }
button:hover:not(:disabled) { background:#e6e6e6; }
button:disabled { opacity:.5; cursor:not-allowed; }
.status { font-size:.7rem; }
.status.ok { color:#4ad68a; }
.status.err { color:#ff6b6b; }
</style>