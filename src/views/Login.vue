<template>
    <div class="auth-page">
        <div class="auth-container">
            <h1 class="auth-title">Welcome to Zebraboard</h1>
            <p class="auth-sub">Sign in to continue your typing journey</p>
            <div v-if="successMsg" class="banner success">{{ successMsg }}</div>
            <div v-if="infoMsg" class="banner info">{{ infoMsg }}</div>
            <div class="auth-tabs" role="tablist">
                <button :class="['tab-btn', activeTab === 'login' && 'active']" @click="activeTab = 'login'"
                    role="tab">Login</button>
                <button :class="['tab-btn', activeTab === 'register' && 'active']" @click="activeTab = 'register'"
                    role="tab">Register</button>
            </div>

            <form v-if="activeTab === 'login'" class="form" @submit.prevent="submitLogin">
                <div class="field">
                    <input v-model.trim="loginIdentifier" type="text" placeholder="Username or Email" autocomplete="username" aria-label="Username or Email" />
                </div>
                <div class="field">
                    <input v-model="loginPassword" type="password" placeholder="Password" autocomplete="current-password" aria-label="Password" />
                    <div class="field-line single">
                        <button type="button" class="link-sm" @click.prevent>Forgot Password?</button>
                    </div>
                </div>
                <button class="primary-btn wide" :disabled="authLoading" type="submit">{{ authLoading ? 'Logging in...' : 'Login' }}</button>
                <p v-if="authError" class="error-text">{{ authError }}</p>
                <div class="divider"><span>Or continue with</span></div>
                <div class="social-row">
                    <button type="button" class="social-btn" :disabled="popupLoading === 'google'" @click="oauthPopup('google')">
                      <span class="icon" v-if="popupLoading !== 'google'">G</span>
                      <span v-else class="spinner" />
                      Google
                    </button>
                    <button type="button" class="social-btn" :disabled="popupLoading === 'github'" @click="oauthPopup('github')">
                      <span class="icon" v-if="popupLoading !== 'github'">Gh</span>
                      <span v-else class="spinner" />
                      GitHub
                    </button>
                </div>
                <p class="alt-text">Don't have an account? <button type="button" class="link-sm"
                        @click="activeTab = 'register'">Create one now</button></p>
            </form>

            <form v-else class="form" @submit.prevent="submitRegister">
                <div class="field">
                    <input v-model.trim="regUsername" type="text" placeholder="Username" aria-label="Username" autocomplete="username" />
                </div>
                <div class="field">
                    <input v-model.trim="regEmail" type="email" placeholder="Email (optional)" aria-label="Email" autocomplete="email" />
                </div>
                <div class="field">
                    <input v-model="regPassword" type="password" placeholder="Password" aria-label="Password" autocomplete="new-password" />
                </div>
                <div class="field">
                    <input v-model="regConfirm" type="password" placeholder="Confirm Password" aria-label="Confirm Password" autocomplete="new-password" />
                </div>
                <button class="primary-btn wide" :disabled="authLoading" type="submit">{{ authLoading ? 'Creating...' : 'Register' }}</button>
                <p v-if="authError" class="error-text">{{ authError }}</p>
                <div class="divider"><span>Or continue with</span></div>
                <div class="social-row">
                    <button type="button" class="social-btn" :disabled="popupLoading === 'google'" @click="oauthPopup('google')">
                      <span class="icon" v-if="popupLoading !== 'google'">G</span>
                      <span v-else class="spinner" />
                      Google
                    </button>
                    <button type="button" class="social-btn" :disabled="popupLoading === 'github'" @click="oauthPopup('github')">
                      <span class="icon" v-if="popupLoading !== 'github'">Gh</span>
                      <span v-else class="spinner" />
                      GitHub
                    </button>
                </div>
                <p class="alt-text">Already have an account? <button type="button" class="link-sm"
                        @click="activeTab = 'login'">Login</button></p>
            </form>
        </div>
    </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { useAuth } from '../composables/useAuth';
import { useAlerts } from '../composables/useAlerts';
const activeTab = ref('login');
const loginIdentifier = ref('');
const loginPassword = ref('');
const regUsername = ref('');
const regEmail = ref('');
const regPassword = ref('');
const regConfirm = ref('');
const authLoading = ref(false);
const authError = ref('');
const popupLoading = ref('');
const router = useRouter();
const route = useRoute();
const successMsg = ref('');
const infoMsg = ref('');
const { isLoggedIn, login, register, startOAuthPopup } = useAuth();
const { error: pushError, success: pushSuccess } = useAlerts();

onMounted(() => {
    if (isLoggedIn.value) router.replace('/profile');
    const q = route.query;
    if (q.verified) {
        successMsg.value = 'Email verified successfully. You can now log in.';
    if (q.user && !loginIdentifier.value) loginIdentifier.value = q.user;
        activeTab.value = 'login';
    } else if (q.registered) {
        infoMsg.value = 'Registration complete. Please verify your email to continue.';
    }
});

function oauthPopup(provider) {
    popupLoading.value = provider;
    startOAuthPopup(provider, '/profile')
      .then(res => {
        router.push(res.redirect || '/profile');
      })
      .catch(err => {
        if (err.message === 'Popup blocked') {
          // fallback full redirect (rare)
          window.location.href = `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000'}/auth/${provider}?redirect=/profile`;
        } else if (err.message !== 'Popup closed') {
          authError.value = err.message || 'OAuth failed';
        }
      })
      .finally(() => { popupLoading.value = ''; });
}

async function submitLogin() {
    console.log(loginIdentifier)
    authError.value = '';
    if (!loginIdentifier.value || !loginPassword.value) {
        authError.value = 'Identifier and password required';
        return;
    }
    authLoading.value = true;
    try {
        await login({ identifier: loginIdentifier.value, password: loginPassword.value });
        pushSuccess('Login successful');
        router.push('/profile');
    } catch (e) {
        authError.value = e.message || 'Login failed';
        pushError(authError.value);
    } finally {
        authLoading.value = false;
    }
}

async function submitRegister() {
    authError.value = '';
    if (!regUsername.value || !regPassword.value) {
        authError.value = 'Username and password required';
        return;
    }
    if (regPassword.value !== regConfirm.value) {
        authError.value = 'Passwords do not match';
        return;
    }
    authLoading.value = true;
    try {
        const result = await register({ username: regUsername.value, email: regEmail.value || undefined, password: regPassword.value });
        if (result.pendingVerification) {
            authError.value = '';
            pushSuccess('Check your email to verify your account.');
        } else {
            pushSuccess('Registration successful');
            router.push('/profile');
        }
    } catch (e) {
        authError.value = (e.data && e.data.error) || e.message || 'Registration failed';
        pushError(authError.value);
    } finally {
        authLoading.value = false;
    }
}
</script>

<style scoped>
/* Layout tuned to fit in viewport without vertical scroll on common heights (≥ 700px) */
.auth-page { display: flex; justify-content: center; align-items: center; min-height: calc(50vh - 64px); box-sizing: border-box; }
.auth-container { width: 100%; max-width: 500px; display: flex; flex-direction: column; align-items: center; }
.auth-title { font-size: 1.9rem; font-weight: 600; letter-spacing: .5px; margin: 0 0 .45rem; color: #e5e7eb; text-align: center; }
.auth-sub { margin: 0 0 1.15rem; font-size: .85rem; color: #9aa2ab; text-align: center; }
.auth-tabs { display: flex; width: 100%; background: #0f1417; border: 1px solid #181e22; border-radius: 6px; overflow: hidden; margin-bottom: 1.25rem; }
.tab-btn { flex: 1; background: transparent; border: none; padding: .85rem 0; color: #a6b0b8; font-weight: 600; font-size: .85rem; cursor: pointer; transition: background .18s, color .18s; letter-spacing: .3px; }
.tab-btn.active { background: #ffffff; color: #0f1417; font-weight: 700; }
.tab-btn:not(.active):hover { background: #121b20; color: #d2d8dc; }
.form { width: 100%; display: flex; flex-direction: column; gap: .9rem; }
.field { display: flex; flex-direction: column; gap: .45rem; }
.field-line { display: flex; align-items: center; justify-content: flex-end; }
.field-line.single { justify-content: flex-end; }
.field input { background: #171d21; border: 1px solid #1f262b; border-radius: 6px; padding: .75rem .85rem; color: #e3e8ec; font-size: .85rem; font-family: inherit; transition: border-color .18s, background .18s; }
.field input:focus { outline: none; border-color: #ffffff; background: #1d2429; }
.primary-btn { background: #ffffff; border: 1px solid #ffffff; color: #0f1417; font-weight: 600; padding: .75rem 1rem; border-radius: 6px; cursor: pointer; font-size: .83rem; letter-spacing: .3px; box-shadow: 0 4px 14px -4px rgba(255, 255, 255, 0.30); transition: background .2s, transform .25s cubic-bezier(.33, 1, .68, 1), color .2s; }
.primary-btn:hover { background: #e6e6e6; }
.primary-btn:active { transform: translateY(1px); }
.primary-btn.disabled { opacity: .5; cursor: not-allowed; box-shadow: none; }
.wide { width: 100%; }
.divider { position: relative; text-align: center; margin: 1.05rem 0 0.35rem; font-size: .62rem; letter-spacing: 1px; text-transform: uppercase; color: #546068; font-weight: 600; display: flex; align-items: center; gap: .65rem; }
.divider:before, .divider:after { content: ""; flex: 1; height: 1px; background: #1d2429; }
.divider span { flex: none; }
.social-row { display: flex; gap: .75rem; width: 100%; }
.social-btn { flex: 1; background: #171d21; border: 1px solid #1f262b; color: #d5dadd; border-radius: 6px; padding: .65rem .8rem; font-size: .75rem; font-weight: 600; letter-spacing: .3px; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: .55rem; transition: background .18s, border-color .18s; position: relative; }
.social-btn:hover { background: #1d2429; }
.icon { background: #232b31; width: 22px; height: 22px; display: inline-flex; align-items: center; justify-content: center; border-radius: 4px; font-size: .7rem; font-weight: 700; }
.spinner { width: 16px; height: 16px; border: 2px solid #2b353b; border-top-color: #ffffff; border-radius: 50%; animation: spin 0.7s linear infinite; display:inline-block; }
@keyframes spin { to { transform: rotate(360deg); } }
.alt-text { margin: .7rem 0 0; font-size: .68rem; color: #7f8b94; text-align: center; }
.link-sm { background: transparent; border: none; padding: 0; margin: 0; font-size: .7rem; font-weight: 600; color: #ffffff; cursor: pointer; letter-spacing: .3px; }
.link-sm:hover { text-decoration: underline; color: #e6e6e6; }
.banner { width:100%; padding:.6rem .75rem; border-radius:6px; font-size:.7rem; font-weight:600; margin-bottom:.75rem; text-align:center; letter-spacing:.3px; }
.banner.success { background:#103c1d; color:#c9f7d5; border:1px solid #1d5c32; }
.banner.info { background:#122b3a; color:#c5e7f9; border:1px solid #1c4961; }
@media (max-height:760px){ .banner{margin-bottom:.55rem;} }
@media (max-height:760px) { .auth-page { padding: 1.6rem 0.9rem 1.8rem; } .auth-title { font-size: 1.75rem; } .auth-sub { margin-bottom: .9rem; } .auth-tabs { margin-bottom: 1rem; } .form { gap: .75rem; } .divider { margin: 0.9rem 0 0.3rem; } .social-row { gap: .6rem; }}
@media (max-height:640px) { .auth-page { min-height: calc(100vh - 56px); padding: 1.1rem 0.7rem 1.2rem; } .auth-title { font-size: 1.55rem; } .auth-sub { font-size: .8rem; } .primary-btn { padding: .65rem .9rem; } .field input { padding: .6rem .75rem; }}
</style>