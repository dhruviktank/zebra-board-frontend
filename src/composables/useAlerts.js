import { ref } from 'vue';

const messages = ref([]); // { id, type: 'error'|'info'|'success', text, timeout }
let counter = 0;

function push({ text, type = 'info', timeout = 5000 }) {
  const id = ++counter;
  messages.value.push({ id, text, type });
  if (timeout) {
    setTimeout(() => dismiss(id), timeout);
  }
  return id;
}

function error(text, timeout) { return push({ text, type: 'error', timeout }); }
function success(text, timeout) { return push({ text, type: 'success', timeout }); }
function info(text, timeout) { return push({ text, type: 'info', timeout }); }

function dismiss(id) { messages.value = messages.value.filter(m => m.id !== id); }
function clear() { messages.value = []; }

export function useAlerts() { return { messages, push, error, success, info, dismiss, clear }; }
