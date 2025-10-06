<template>
  <header class="header">
    <div class="left">
      <router-link to="/" class="logo">
        <img 
          src="../assets/logo.png" 
          loading="eager" 
          fetchpriority="high" 
          alt="ZebraBoard Logo" 
          class="logo-img" 
        />
      </router-link>
      <button class="icon"><font-awesome-icon icon="fa-regular fa-keyboard" style="color: rgb(128, 128, 128)"/></button>
      <button class="icon"><font-awesome-icon icon="fa-solid fa-gear" style="color: rgb(128, 128, 128)" /></button>
    </div>
    <div class="right">
      <router-link v-if="isLoggedIn" to="/profile" class="icon user-link" title="Profile">
        <font-awesome-icon icon="fa-solid fa-user" style="color: rgb(255, 255, 255)" />
      </router-link>
      <router-link v-else to="/login" class="icon user-link" title="Login">
        <font-awesome-icon icon="fa-solid fa-right-to-bracket" style="color: rgb(128, 128, 128)" />
      </router-link>
    </div>
  </header>
</template>

<script setup>
import { useAuth } from '../composables/useAuth';
const { isLoggedIn } = useAuth();
</script>

<style scoped>
.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.8rem 1.5rem;
}

.left, .right {
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

.user-link:hover svg { filter: brightness(1.2); }

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
</style>
