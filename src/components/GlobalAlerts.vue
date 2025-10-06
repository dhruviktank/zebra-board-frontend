<template>
  <div class="alerts-wrapper" aria-live="polite" aria-atomic="true">
    <transition-group name="alert-fade" tag="div">
      <div v-for="m in messages" :key="m.id" class="alert" :class="m.type" role="alert">
        <span class="text">{{ m.text }}</span>
        <button class="close" @click="dismiss(m.id)" aria-label="Dismiss">×</button>
      </div>
    </transition-group>
  </div>
</template>
<script setup>
import { useAlerts } from '../composables/useAlerts';
const { messages, dismiss } = useAlerts();
</script>
<style scoped>
.alerts-wrapper { position: fixed; top: 1rem; right: 1rem; display:flex; flex-direction:column; gap:.55rem; max-width: 320px; z-index: 9999; }
.alert { display:flex; align-items:flex-start; gap:.65rem; font-size:.75rem; line-height:1.25; padding:.65rem .75rem .65rem .8rem; border-radius:6px; border:1px solid transparent; box-shadow:0 4px 16px -4px rgba(0,0,0,.45); backdrop-filter: blur(6px); background:rgba(20,26,31,.9); color:#d8dde2; position:relative; overflow:hidden; }
.alert:before { content:""; position:absolute; inset:0; opacity:.07; background:linear-gradient(145deg,rgba(255,255,255,.35),transparent 60%); pointer-events:none; }
.alert.error { border-color:#5a1d1d; background:rgba(78,16,16,.92); color:#f6d4d4; }
.alert.success { border-color:#1f5634; background:rgba(17,63,35,.93); color:#d3f6e1; }
.alert.info { border-color:#1d3e52; background:rgba(17,40,56,.94); color:#cde9f7; }
.close { background:none; border:none; color:inherit; cursor:pointer; font-size:1rem; line-height:1; padding:0 .25rem; margin-left:auto; opacity:.7; }
.close:hover { opacity:1; }
.alert-fade-enter-active, .alert-fade-leave-active { transition: all .25s ease; }
.alert-fade-enter-from { opacity:0; transform:translateY(-6px); }
.alert-fade-leave-to { opacity:0; transform:translateY(-6px); }
</style>
