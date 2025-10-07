<template>
  <footer class="footer">
    <div class="footer-left">
      <router-link to="/contact" class="link">Contact</router-link>
      <a href="https://github.com/dhruviktank" target="_blank" rel="noopener" class="link">
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

/* Minimal mobile responsiveness */
@media (max-width: 560px) {
  .footer { padding: 0.7rem 1rem; }
  .footer-left, .footer-right { gap: 0.75rem; }
}
@media (max-width: 420px) {
  .footer { flex-direction: column; text-align: center; gap: 0.5rem; }
  .footer-right { font-size: 0.8rem; }
}
@media (max-width: 340px) {
  .footer { padding: 0.6rem 0.7rem; }
  .footer-right span, .footer-left .link { font-size: 0.78rem; }
  .version { font-size: 0.7rem; }
}
</style>
