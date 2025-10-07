<template>
  <div class="profile-wrapper">
    <div v-if="!isLoggedIn" class="login-prompt">
      <h1>You're not logged in</h1>
      <p class="hint">Sign in to view your typing statistics and recent results.</p>
      <router-link to="/login" class="go-login">Go to Login</router-link>
    </div>
    <div v-else class="profile-panel">
      <header class="panel-header">
        <h1>{{ user.username }}</h1>
        <button class="logout" @click="logout">Logout</button>
      </header>
      <div class="stats-cards">
        <div class="card"><div class="label">Tests</div><div class="value">{{ agg.count }}</div></div>
        <div class="card"><div class="label">Best WPM</div><div class="value">{{ agg.bestWpm }}</div></div>
        <div class="card"><div class="label">Avg WPM</div><div class="value">{{ agg.avgWpm }}</div></div>
        <div class="card"><div class="label">Avg Accuracy</div><div class="value">{{ agg.avgAccuracy }}%</div></div>
      </div>
      <section class="recent" v-if="!loading && results.length">
        <h2>Recent Results</h2>
        <div class="results-table-wrapper">
        <table class="results-table">
          <thead>
            <tr><th>Date</th><th>Mode</th><th>Target</th><th>WPM</th><th>Acc</th><th>Chars</th><th>Dur</th></tr>
          </thead>
          <tbody>
            <tr v-for="r in results" :key="r.id">
              <td>{{ formatDate(r.timestamp) }}</td>
              <td>{{ r.mode }}</td>
              <td>{{ r.mode === 'time' ? r.testValue + 's' : r.testValue + 'w' }}</td>
              <td>{{ r.wpm }}</td>
              <td>{{ r.accuracy }}%</td>
              <td>{{ r.totalChars }}</td>
              <td>{{ r.durationSeconds }}s</td>
            </tr>
          </tbody>
        </table>
        </div>
      </section>
      <div v-else-if="loading" class="empty">Loading...</div>
      <div v-else-if="loadError" class="empty">{{ loadError }}</div>
      <div v-else class="empty">No results yet. Take a test!</div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useAuth } from '../composables/useAuth';
import { fetchUserResults, fetchUserAggregate } from '../utils/results';

const { user, isLoggedIn, logout } = useAuth();
const results = ref([]);
const agg = ref({ count:0, bestWpm:0, avgWpm:0, avgAccuracy:0 });
const loading = ref(false);
const loadError = ref('');


async function loadRemote() {
  if (!isLoggedIn.value) return;
  loading.value = true; loadError.value='';
  try {
    const list = await fetchUserResults(user.value.id, { take: 10 });
    results.value = list.map(r => ({
      id: r.id,
      wpm: r.wpm,
      accuracy: r.accuracy,
      mode: r.mode,
      testValue: r.mode === 'time' ? (r.durationSec || r.durationSeconds || 0) : (r.characters ? Math.round((r.characters||0)/5) : ''),
      timestamp: r.createdAt || r.timestamp,
      totalChars: r.characters || 0,
      durationSeconds: r.durationSec || r.durationSeconds || 0
    }));
    agg.value = await fetchUserAggregate(user.value.id);
  } catch (e) {
    loadError.value = 'Failed to load results';
  } finally { loading.value = false; }
}

function formatDate(ts) {
  const d = new Date(ts);
  if (isNaN(d.getTime())) return '';
  return d.toLocaleDateString(undefined,{ month:'short', day:'numeric'}) + ' ' + d.toLocaleTimeString(undefined,{hour:'2-digit', minute:'2-digit'});
}

onMounted(loadRemote);
</script>

<style scoped>
.profile-wrapper { max-width: 1100px; margin: 0 auto; padding: 0 1.25rem 1rem; font-family: "Segoe UI", Roboto, Arial, sans-serif; }
.login-prompt { text-align:center; padding:3rem 1.5rem 3rem; border:1px dashed #2a3238; border-radius:14px; background:#12181c; }
.login-prompt h1 { margin:0 0 1rem; font-size:2rem; font-weight:600; color:#e5e9ec; }
.login-prompt .hint { margin:0 0 1.4rem; color:#97a3ad; font-size:.9rem; }
.go-login { display:inline-block; background:#ffffff; color:#0f1417; font-weight:600; padding:.7rem 1.1rem; border-radius:8px; text-decoration:none; font-size:.8rem; letter-spacing:.4px; transition:background .2s, color .2s; }
.go-login:hover { background:#e6e6e6; }
.profile-panel { display:flex; flex-direction:column; gap:1.5rem; }
.panel-header { display:flex; justify-content:space-between; align-items:center; }
.panel-header h1 { margin:0; font-size:2rem; }
.logout { background:transparent; border:1px solid #444; color:#bbb; padding:0.5rem .9rem; border-radius:8px; cursor:pointer; }
.logout:hover { background:#1d1d1d; color:#fff; }
.stats-cards { display:grid; gap:0.9rem; grid-template-columns:repeat(auto-fit,minmax(130px,1fr)); }
.card { background:#181818; border:1px solid #262626; padding:0.9rem .9rem .8rem; border-radius:10px; display:flex; flex-direction:column; gap:.25rem; }
.card .label { font-size:.65rem; text-transform:uppercase; letter-spacing:1.2px; color:#8a95a3; font-weight:600; }
.card .value { font-size:1.6rem; font-weight:600; color:#f5f5f5; }
.recent h2 { margin:0 0 .6rem; font-size:1.2rem; }
.results-table { width:100%; border-collapse:collapse; font-size:0.8rem; }
.results-table th, .results-table td { padding:0.5rem 0.45rem; text-align:left; border-bottom:1px solid #222; }
.results-table th { font-weight:600; font-size:0.7rem; letter-spacing:1px; text-transform:uppercase; color:#9aa7b4; }
.results-table tbody tr:hover { background:#181818; }
.results-table-wrapper { width:100%; }
.results-table-wrapper::-webkit-scrollbar { height:6px; }
.results-table-wrapper::-webkit-scrollbar-track { background:transparent; }
.results-table-wrapper::-webkit-scrollbar-thumb { background:#333; border-radius:3px; }
.results-table-wrapper::-webkit-scrollbar-thumb:hover { background:#444; }
.empty { padding:1rem; text-align:center; color:#777; }
@media (max-width:640px) { .results-table { font-size:0.7rem; } .card .value { font-size:1.3rem; } .panel-header h1 { font-size:1.5rem; } }
@media (max-width:560px){
  .profile-wrapper { padding:0 0.85rem 1rem; }
  .stats-cards { gap:0.7rem; }
  .card { padding:0.75rem 0.75rem 0.65rem; }
  .card .value { font-size:1.25rem; }
  .panel-header h1 { font-size:1.35rem; }
  .logout { padding:0.45rem 0.75rem; font-size:.7rem; }
}
@media (max-width:480px){
  .panel-header { flex-direction:column; align-items:flex-start; gap:.6rem; }
  .results-table-wrapper { overflow-x:auto; -webkit-overflow-scrolling:touch; }
  .results-table { min-width:520px; }
  .login-prompt h1 { font-size:1.65rem; }
  .login-prompt { padding:2.4rem 1.1rem 2.6rem; }
  .go-login { padding:.6rem .95rem; font-size:.75rem; }
}
@media (max-width:380px){
  .profile-wrapper { padding:0 0.65rem 0.9rem; }
  .card .value { font-size:1.15rem; }
  .card .label { font-size:.6rem; }
  .panel-header h1 { font-size:1.2rem; }
  .logout { padding:0.4rem 0.65rem; }
  .login-prompt h1 { font-size:1.45rem; }
  .login-prompt .hint { font-size:.8rem; }
}
</style>
