<template>
  <div class="verify-wrapper">
    <div class="verify-container">
      <div class="verify-card">
        <div class="verify-accent" aria-hidden="true"></div>
        <div class="verify-icon">
          <font-awesome-icon icon="fa-regular fa-clock" style="color: white;" class="icon" />
        </div>
        <h1 class="verify-title">Awaiting Email Verification</h1>
        <p v-if="!verified && username" class="verify-text">
          An email with a verification link has been sent to <span class="highlight">{{ email }}</span>. Please check
          your inbox and click the link to complete your registration.
        </p>
        <p v-if="!verified && !username" class="verify-text warn">Missing username context – please return to login and
          register again.</p>
        <p v-else-if="verified" class="verify-text success">Email verified! Redirecting you to login…</p>

        <div v-if="!verified" class="info-block">
          <div class="info-inner">
            <font-awesome-icon icon="fa-regular fa-clock" style="color: white;" class="icon" />
            <div>This page will automatically update once you've verified your email. No need to refresh.</div>
          </div>
          <div v-if="errorMsg" class="error-msg">{{ errorMsg }}</div>
        </div>

        <div v-if="!verified" class="actions">
          <button @click="manualRefresh" :disabled="refreshing" class="refresh-btn">
            <span v-if="refreshing" class="spinner" aria-hidden="true"></span>
            <span>{{ refreshing ? 'Checking...' : 'Refresh Status' }}</span>
          </button>
        </div>

        <div v-if="!verified" class="resend-section">
          <div class="resend-note">Didn't receive the email? Check your spam folder.</div>
          <div class="resend-links">
            <button @click="resend" :disabled="resending" class="link-btn">{{ resending ? 'Sending…' : 'Resend Email'
            }}</button>
          </div>
          <div v-if="resendMsg" class="resend-msg" :class="{ success: resendSuccess, fail: !resendSuccess }">{{
            resendMsg }}</div>
        </div>

        <div v-if="verified" class="after-verify">
          <button @click="goLogin" class="link-btn">Go to Login</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount } from 'vue';
import { api } from '../utils/api';
import { useRoute, useRouter } from 'vue-router';

const route = useRoute();
const router = useRouter();
const username = route.query.user || route.query.username || '';
const email = route.query.email || 'your email';
const token = route.query.token || '';
const verified = ref(false);
let poller;
const errorMsg = ref('');
const refreshing = ref(false);
const resending = ref(false);
const resendMsg = ref('');
const resendSuccess = ref(false);

async function poll(manual = false) {
  if (!username || verified.value) return;
  try {
    if (manual) refreshing.value = true;
    const status = await api.get(`/users/verification-status?username=${encodeURIComponent(username)}`);
    if (status.verified) {
      verified.value = true;
      clearInterval(poller);
      setTimeout(() => router.replace({ path: '/login', query: { verified: 1, user: username } }), 900);
    }
  } catch { /* ignore */ }
  finally {
    if (manual) setTimeout(() => (refreshing.value = false), 400); else refreshing.value = false;
  }
}

function goLogin() {
  router.push({ path: '/login' });
}

// Resend capability removed for minimal design (can be reintroduced later)

async function directVerify() {
  if (!token) return false;
  try {
    const resp = await fetch(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000'}/auth/verify-email?token=${encodeURIComponent(token)}&mode=json`, {
      headers: { 'Accept': 'application/json' }
    });
    const data = await resp.json().catch(() => ({}));
    if (resp.ok && data.verified) {
      verified.value = true;
      setTimeout(() => router.replace({ path: '/login', query: { verified: 1, user: data.username } }), 1100);
      return true;
    } else if (!resp.ok) {
      errorMsg.value = data.error || 'Verification failed or token expired';
    }
  } catch (e) {
    errorMsg.value = 'Network error verifying token';
  }
  return false;
}

function manualRefresh() {
  poll(true);
}

async function resend() {
  if (resending.value) return;
  resending.value = true;
  resendMsg.value = '';
  resendSuccess.value = false;
  try {
    // Placeholder: backend endpoint may not exist yet.
    const base = import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000';
    const resp = await fetch(`${base}/auth/resend-verification`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username })
    });
    if (resp.ok) {
      resendMsg.value = 'Verification email resent.';
      resendSuccess.value = true;
    } else {
      resendMsg.value = 'Unable to resend right now.';
    }
  } catch {
    resendMsg.value = 'Resend not available.';
  } finally {
    setTimeout(() => (resending.value = false), 600);
  }
}

onMounted(async () => {
  // Attempt direct verification if token is present
  if (token) {
    const ok = await directVerify();
    if (ok) return;
  }
  // Start polling (even if token present but failed) every 5s
  poll();
  poller = setInterval(poll, 5000);
});

onBeforeUnmount(() => { clearInterval(poller); });
</script>

<style scoped>
.verify-wrapper {
  display: flex;
  align-items: center;
  justify-content: center;
  color: #d3d7dc;
  font-family: system-ui, -apple-system, Segoe UI, Roboto, Ubuntu, sans-serif;
}

.verify-card {
  position: relative;
  padding: 2.5rem 2.75rem 3.25rem;
  background: rgba(19, 19, 19, 0.75);
  border: 1px solid #3a3a3a;
  border-radius: 1rem;
  box-shadow: 0 10px 35px -5px rgba(0, 0, 0, 0.55);
  overflow: hidden;
}
.verify-card:hover::before {
  opacity: 1;
}

.verify-icon {
  width: 2rem;
  height: 2rem;
  margin: 0 auto 1.5rem;
  border-radius: 999px;
  background: rgba(174, 174, 174, 0.18);
  border: 1px solid rgba(255, 255, 255, 0.45);
  display: flex;
  align-items: center;
  justify-content: center;
  color: #ffffff;
}

.verify-icon .icon {
  font-size: 1.8rem;
}

.verify-title {
  font-size: 1.5rem;
  text-align: center;
  font-weight: 600;
  color: #fff;
}

.verify-text {
  font-size: .9rem;
  max-width: 30rem;
  margin: 0 auto 2rem;
  color: #88929d;
}

.verify-text .highlight {
  color: #e5e8eb;
  font-weight: 500;
}

.verify-text.warn {
  color: #e6b85c;
}

.verify-text.success {
  color: #37d993;
  font-weight: 500;
}

/* Info block */
.info-block {
  margin: 0 0 2.4rem;
}

.info-inner {
  display: flex;
  gap: .75rem;
  padding: 1rem 1.25rem;
  background: rgba(32, 41, 53, 0.5);
  border: 1px solid #27313d;
  border-radius: .75rem;
  font-size: .8rem;
  color: #8a96a3;
}

.info-icon {
  width: 1.25rem;
  height: 1.25rem;
  color: #39c3eb;
  flex-shrink: 0;
}

.error-msg {
  margin-top: .7rem;
  font-size: .68rem;
  color: #ef6262;
}

/* Actions */
.actions {
  margin-bottom: 2.4rem;
  text-align: center;
}

.refresh-btn {
  width: 30%;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: .55rem;
  padding: .85rem 1.25rem;
  font-size: .8rem;
  font-weight: 500;
  color: #d5dadd;
  background: #202a34;
  border: 1px solid #2d3a46;
  border-radius: .55rem;
  cursor: pointer;
}

.refresh-btn:hover:not(:disabled) {
  background: #2a3843;
}

.refresh-btn:disabled {
  opacity: .6;
  cursor: not-allowed;
}

.spinner {
  width: 1rem;
  height: 1rem;
  border: 2px solid rgba(255, 255, 255, .25);
  border-top-color: #fff;
  border-radius: 50%;
  animation: spin .9s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

/* Resend */
.resend-section {
  margin-top: 2.8rem;
  text-align: center;
  font-size: .68rem;
  letter-spacing: .75px;
  color: #6f7a85;
}

.resend-note {
  margin-bottom: 1rem;
}

.resend-links {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 1.25rem;
  color: #37b6e0;
  font-weight: 500;
}

.link-btn {
  background: none;
  border: none;
  padding: 0;
  font: inherit;
  color: #36b5df;
  cursor: pointer;
  position: relative;
}

.link-btn:hover {
  text-decoration: underline;
}

.link-btn:disabled {
  opacity: .5;
  cursor: not-allowed;
  text-decoration: none;
}

.sep {
  color: #48525b;
}

.resend-msg {
  margin-top: .8rem;
  font-size: .66rem;
}

.resend-msg.success {
  color: #37d993;
}

.resend-msg.fail {
  color: #e16060;
}

/* After verify */
.after-verify {
  margin-top: 1.5rem;
  text-align: center;
}

/* Footer */
.footer-hint {
  padding-top: 2.7rem;
  text-align: center;
  font-size: .6rem;
  color: #4d5963;
}
</style>
