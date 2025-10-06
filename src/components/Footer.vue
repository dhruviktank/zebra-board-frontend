<template>
  <footer class="footer">
    <div class="footer-left">
      <router-link to="/contact" class="link">Contact</router-link>
      <a href="https://github.com/your-repo" target="_blank" rel="noopener" class="link">
        GitHub
      </a>
    </div>

    <div class="footer-right">
      <span>© {{ new Date().getFullYear() }} ZebraBoard</span>
      <span class="version">v1.0.0</span>
    </div>
  </footer>
</template>

<script setup>
// Nothing needed for now
</script>

<style scoped>
.footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.8rem 1.5rem;
  /* background: #fafafa; */
  /* border-top: 1px solid #eee; */
  font-size: 0.9rem;
  color: #a5a5a5;
}

.footer-left,
.footer-right {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.link {
  text-decoration: none;
  color: #a5a5a5;
  transition: color 0.2s;
}

.link:hover {
  color: black;
}

.version {
  font-size: 0.85rem;
  color: #a5a5a5;
}
</style>
