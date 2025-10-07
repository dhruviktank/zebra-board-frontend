<template>
  <header class="header">
    <div class="left">
      <router-link to="/" class="logo">
        <img src="../assets/logo.png" loading="eager" fetchpriority="high" alt="ZebraBoard Logo" class="logo-img" />
      </router-link>
      <router-link to="/" class="icon" aria-label="Home" title="Home">
        <font-awesome-icon icon="fa-regular fa-keyboard" style="color: rgb(128, 128, 128)" />
      </router-link>
      <button class="icon"><font-awesome-icon icon="fa-solid fa-gear" style="color: rgb(128, 128, 128)" /></button>
    </div>
    <div class="right">
      <div v-if="isLoggedIn" class="user-menu" ref="menuRoot"
        @mouseenter="!isTouch && (hovering = true, openMenu())"
        @mouseleave="!isTouch && (hovering = false, scheduleClose())"
        aria-haspopup="true" :aria-expanded="menuOpen.toString()">
        <button class="user-trigger" aria-label="User menu" @click="toggleMenu" @keydown.down.prevent="openMenu()"
          @keydown.enter.prevent="toggleMenu" @keydown.space.prevent="toggleMenu" @keydown.esc.prevent="closeMenu()"
          :aria-expanded="menuOpen.toString()" :aria-haspopup="true">
          <font-awesome-icon icon="fa-solid fa-user" class="avatar" />
          <span class="username" :title="user?.username">{{ user?.username }}</span>
          <span class="caret">▾</span>
        </button>
        <div class="dropdown" role="menu" v-show="menuOpen" @mouseenter="hovering = true"
          @mouseleave="hovering = false; scheduleClose()">
          <router-link to="/profile" role="menuitem" class="dd-item" @click="closeMenu()">Profile</router-link>
          <button type="button" class="dd-item signout" role="menuitem" @click="onLogout">Sign out</button>
        </div>
      </div>
      <router-link v-else to="/login" class="icon user-link" title="Login">
        <font-awesome-icon icon="fa-solid fa-right-to-bracket" style="color: rgb(128, 128, 128)" />
      </router-link>
    </div>
  </header>
</template>

<script setup>
import { useAuth } from '../composables/useAuth';
import { ref, onMounted, onBeforeUnmount } from 'vue';
const { isLoggedIn, user, logout } = useAuth();

const menuOpen = ref(false);
const hovering = ref(false);
const menuRoot = ref(null);
const isTouch = ref(false);
let closeTimer = null;

function openMenu() { if (!menuOpen.value) menuOpen.value = true; }
function closeMenu(immediate = false) {
  if (immediate) { clearTimeout(closeTimer); menuOpen.value = false; return; }
  if (!hovering.value) menuOpen.value = false;
}
function toggleMenu() { menuOpen.value = !menuOpen.value; }
function scheduleClose() {
  clearTimeout(closeTimer);
  closeTimer = setTimeout(() => { if (!hovering.value) menuOpen.value = false; }, 140);
}

function handleDocumentClick(e) {
  if (!menuRoot.value) return;
  if (menuRoot.value.contains(e.target)) return;
  closeMenu(true);
}
function handleEsc(e) { if (e.key === 'Escape') closeMenu(true); }

onMounted(() => {
  // Detect touch capability (simple heuristic)
  isTouch.value = (('ontouchstart' in window) || navigator.maxTouchPoints > 0 || navigator.msMaxTouchPoints > 0);
  document.addEventListener('click', handleDocumentClick, { passive: true });
  document.addEventListener('keydown', handleEsc);
});
onBeforeUnmount(() => {
  document.removeEventListener('click', handleDocumentClick);
  document.removeEventListener('keydown', handleEsc);
  clearTimeout(closeTimer);
});

function onLogout() { try { logout(); } catch {/* ignore */ } closeMenu(true); }
</script>

<style scoped>
.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.8rem 1.5rem;
}

.left,
.right {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.icon {
  border: none;
  background: transparent;
  font-size: 1.2rem;
  cursor: pointer;
  text-decoration: none;
}

.user-link:hover svg {
  filter: brightness(1.2);
}

/* User menu */
.user-menu {
  position: relative;
  display: flex;
  align-items: center;
}

.user-trigger {
  display: flex;
  align-items: center;
  gap: .45rem;
  background: transparent;
  border: 1px solid transparent;
  padding: .35rem .6rem;
  border-radius: 18px;
  cursor: pointer;
  font-size: .75rem;
  line-height: 1;
  color: #dbe1e5;
  font-weight: 600;
}

.user-trigger:hover {
  background: #1e2226;
}

.user-trigger:focus {
  outline: 2px solid #3d82ff;
  outline-offset: 2px;
}

.avatar {
  font-size: 1rem;
  color: #ffffff;
}

.username {
  max-width: 120px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: .72rem;
  letter-spacing: .4px;
}

.caret {
  font-size: .6rem;
  opacity: .6;
}

.dropdown {
  position: absolute;
  top: 100%;
  right: 0;
  margin-top: 0;
  transform: translateY(6px);
  background: #121518;
  border: 1px solid #262c31;
  border-radius: 8px;
  min-width: 150px;
  flex-direction: column;
  padding: .4rem 0;
  box-shadow: 0 4px 18px -2px rgba(0, 0, 0, .55);
  z-index: 40;
}

.user-menu {
  padding-bottom: 6px;
}

.dd-item {
  background: none;
  border: none;
  text-align: left;
  padding: .55rem .9rem;
  font-size: .7rem;
  color: #d3dae0;
  cursor: pointer;
  text-decoration: none;
  display: flex;
  gap: .5rem;
  align-items: center;
}

.dd-item:hover {
  background: #1f2529;
  color: #ffffff;
}

.signout {
  color: #ff8070;
}

.signout:hover {
  color: #ffc3bb;
}

.logo {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  text-decoration: none;
}

.logo-img {
  width: 200px;
  object-fit: contain;
}

.logo-text {
  font-weight: bold;
  font-size: 1.2rem;
  color: black;
}

/* Minimal responsiveness: shrink logo and hide username on very small screens */
@media (max-width: 560px) {
  .logo-img { width: 160px; }
  .username { max-width: 80px; }
}
@media (max-width: 420px) {
  .logo-img { width: 130px; }
  .username { display: none; }
  .caret { display: none; }
}

</style>
