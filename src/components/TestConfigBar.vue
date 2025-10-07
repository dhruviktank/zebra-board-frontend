<template>
  <div class="test-config" v-if="!isFinished">
    <!-- Mode selection -->
    <div class="mode">
      <button class="text-button" :class="{ active: mode === 'time' }" @click="setMode('time')">
        <font-awesome-icon icon="fa-regular fa-clock" /> Time
      </button>
      <button class="text-button" :class="{ active: mode === 'words' }" @click="setMode('words')">
        <font-awesome-icon icon="fa-solid fa-font" /> Words
      </button>
    </div>

    <div class="divider"></div>

    <!-- Time options -->
    <div class="time" v-if="mode === 'time'">
      <button v-for="t in timeOptions" :key="t" class="text-button" :class="{ active: selectedValue === t }"
        @click="selectValue(t)">
        {{ t }}
      </button>
    </div>

    <!-- Word options -->
    <div class="words" v-if="mode === 'words'">
      <button v-for="w in wordOptions" :key="w" class="text-button" :class="{ active: selectedValue === w }"
        @click="selectValue(w)">
        {{ w }}
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref, watch } from "vue";

const props = defineProps({
  isFinished: { type: Boolean, default: false },
  initialMode: { type: String, default: 'time' },
  initialValue: { type: Number, default: 15 }
});
const emit = defineEmits(['config-change']);

const mode = ref(props.initialMode);
const selectedValue = ref(props.initialValue);

const timeOptions = [15, 30, 60];
const wordOptions = [10, 25, 50];

const pushChange = () => {
  emit('config-change', { mode: mode.value, value: selectedValue.value });
};

const setMode = (newMode) => {
  if (mode.value === newMode) return;
  mode.value = newMode;
  selectedValue.value = newMode === 'time' ? timeOptions[0] : wordOptions[0];
  pushChange();
};

const selectValue = (val) => {
  if (selectedValue.value === val) return;
  selectedValue.value = val;
  pushChange();
};

watch(() => props.isFinished, (f) => {
  if (!f) pushChange();
});

// initial emit
pushChange();
</script>

<style scoped>
.test-config {
  position: sticky;
  /* top: 0.5rem; */
  display: flex;
  justify-content: center;
  align-items: center;
  /* gap: 1rem; */
  /* padding: 0.8rem 1.5rem; */
  border-radius: 6px;
  /* box-shadow: 0 2px 6px rgba(0, 0, 0, 0.05); */
  background: rgba(20, 20, 20, 0.5);
  /* z-index: 10; */
  /* font-size: 1.1rem; */
}

.text-button {
  background: transparent;
  padding: 1rem;
  border: none;
  color: gray;
}

.text-button.active {
  color: white;
}

.divider {
  background-color: #6f6f6f;
  height: 1.4rem;
  width: 0.4rem;
}

.mode,
.time,
.words {
  padding: 0 0.5rem;
}

.time.hidden,
.words.hidden {
  display: none;
}

/* Minimal mobile responsiveness */
@media (max-width: 560px) {
  .test-config { flex-wrap: nowrap; overflow-x: auto; scrollbar-width: none; -ms-overflow-style: none; }
  .test-config::-webkit-scrollbar { display: none; }
  .text-button { padding: 0.55rem 0.55rem; font-size: .85rem; }
  .mode, .time, .words { padding: 0 0.25rem; }
  .divider { height: 1rem; width: 0.28rem; }
}
@media (max-width: 420px) {
  .text-button { padding: 0.45rem 0.45rem; font-size: .78rem; }
  .mode, .time, .words { padding: 0 0.2rem; }
  .divider { height: 0.9rem; }
}
@media (max-width: 340px) {
  .text-button { padding: 0.4rem 0.4rem; font-size: .72rem; }
  .mode, .time, .words { padding: 0 0.18rem; }
  .divider { height: 0.85rem; width: 0.25rem; }
}
</style>
