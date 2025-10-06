<template>
  <div class="test-container">
    <TestConfigBar :is-finished="isFinished" :initial-mode="mode" :initial-value="testValue"
      :key="mode + '-' + testValue" @config-change="applyConfig" @mousedown.prevent.stop="forceFocus" />
    <div class="timer-display" v-if="!isFinished">
      <span v-if="mode === 'time'">{{ remainingTime }}s</span>
      <span v-else>{{ elapsedTimeDisplay }}s</span>
    </div>
    <div v-if="!isFinished" class="typing-box" @mousedown.prevent="focusInput" @click.prevent ref="typingBox">
      <transition name="fade-fast" mode="out-in">
        <p class="typing-content" :key="paragraphKey" :style="{ transform: `translateY(-${shiftHeight}px)` }"
          :class="{ blurred: !isFocused }">
          <span v-for="(char, index) in chars" :key="index" :class="{
            correct: index < currentIndex && chars[index] === typed[index],
            incorrect: index < currentIndex && chars[index] !== typed[index],
            current: index === currentIndex,
            blink: !isTyping
          }">{{ char }}</span>
        </p>
      </transition>
      <transition name="fade-fast" mode="in-out">
        <div v-if="!isFocused" class="overlay">
          <font-awesome-icon icon="fa-solid fa-arrow-pointer" style="color: white; margin-right: 0.5rem;" size="sm" />
          Click here to start
        </div>
      </transition>
    </div>

    <!-- Hidden Input -->
    <input ref="hiddenInput" @blur="blurInput" @input="handleInput" v-model="typed" class="hidden-input"
      autocomplete="off" />

    <!-- Retry Button -->
    <button v-if="!isFinished" class="retry-btn" @mousedown.prevent.stop="forceFocus" @click="retryTest">
      <font-awesome-icon icon="fa-solid fa-rotate-right" />
    </button>

    <!-- Result Screen -->
    <div v-else class="result-screen">
      <h2 class="result-title">Test Results</h2>
      <div class="result-summary">
        <div class="metric primary">
          <div class="metric-label">WPM</div>
          <div class="metric-value">{{ wpm }}</div>
        </div>
        <div class="metric">
          <div class="metric-label">Accuracy</div>
          <div class="metric-value">{{ accuracy }}%</div>
        </div>
        <div class="metric">
          <div class="metric-label">Mode</div>
          <div class="metric-value small">{{ modeLabel }}</div>
        </div>
        <div class="metric">
          <div class="metric-label">Target</div>
          <div class="metric-value small">{{ testTargetLabel }}</div>
        </div>
        <div class="metric">
          <div class="metric-label">Duration</div>
          <div class="metric-value small">{{ elapsedTimeSeconds.toFixed(1) }}s</div>
        </div>
      </div>
      <div class="detail-stats">
        <div class="detail-row"><span>Correct Chars</span><span>{{ correctChars }}</span></div>
        <div class="detail-row"><span>Incorrect Chars</span><span>{{ incorrectChars }}</span></div>
        <div class="detail-row"><span>Total Typed</span><span>{{ typed.length }}</span></div>
      </div>
      <div class="actions">
        <button class="action-btn" @click="retryTest"><font-awesome-icon icon="fa-solid fa-rotate-right" />
          Retry</button>
        <button class="action-btn ghost" @click="quickSwitchMode">Switch to {{ nextModeLabel }}</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, nextTick, onMounted } from "vue";
import { saveResult, saveResultRemote } from "../utils/results";
import { useAuth } from '../composables/useAuth';
import TestConfigBar from "../components/TestConfigBar.vue";

// Paragraph generation
// Easy to medium difficulty word list (expanded for better paragraph variety)
const sampleWords = [
  'time','game','light','sound','water','earth','fire','stone','cloud','river','mountain','forest','garden','night','day','summer','winter','spring','autumn','storm','wind','rain','snow','sun','moon','star','sky','path','road','bridge','field','house','room','window','door','table','chair','paper','music','story','dream','focus','speed','quick','sharp','calm','smart','clean','clear','strong','steady','simple','happy','bright','fresh','quiet','wild','brave','wise','still','early','ready','smooth','green','blue','gold','silver','value','logic','code','debug','build','test','result','score','learn','level','skill','goal','habit','track','typing','finger','hand','brain','energy','power','drive','shift','space','enter','letter','word','cursor','screen','clock','bench','zebra','board'
];
const { user, isLoggedIn } = useAuth();
const paragraph = ref("");
const paragraphKey = ref(0); // used for transition key
const paragraphWords = ref([]); // store array of generated words (restored)
const wordsModeTargetText = ref(""); // full target text for words mode
const chars = computed(() => paragraph.value.split(""));
const typed = ref("");
const currentIndex = ref(0);

const hiddenInput = ref(null);
const typingBox = ref(null);
const currentSpanPos = ref(0); // restored for potential future use


const shiftHeight = ref(0);
const lineHeight = 45; // match CSS line-height 
const maxVisibleLines = 2;

const isFinished = ref(false);
const isFocused = ref(false);
const startTime = ref(null);
const endTime = ref(null); // capture finish time for accurate duration
const isTyping = ref(false);
const mode = ref('time');
const testValue = ref(15); // seconds for time mode or words count for words mode
const remainingTime = ref(testValue.value); // countdown for time mode
const elapsed = ref(0); // elapsed seconds (words mode)
let timerInterval = null;
const paddingTopPx = ref(0); // dynamic vertical padding for scroll math

// Words typed reactive (for words mode progress + completion) - restored
const wordsTyped = computed(() => {
  if (!typed.value) return 0;
  return typed.value.trim().split(/\s+/).filter(w => w.length).length;
});

// (progress logic removed earlier)

let typingTimeout = null;

const correctChars = computed(() => {
  const t = typed.value;
  const arr = t.split("");
  let count = 0;
  for (let i = 0; i < arr.length; i++) {
    const expected = chars.value[i];
    if (expected === undefined) break; // safety
    if (arr[i].toLowerCase() === expected.toLowerCase()) count++;
  }
  return count;
});
const incorrectChars = computed(() => Math.max(0, typed.value.length - correctChars.value));
// Live elapsed time (seconds) using high-resolution start/end, independent of display timers
const elapsedTimeSeconds = computed(() => {
  if (!startTime.value) return 0;
  if (endTime.value) return (endTime.value - startTime.value) / 1000;
  return (Date.now() - startTime.value) / 1000;
});

// WPM: (correct characters / 5) per minute based on actual elapsed time
const wpm = computed(() => {
  const secs = elapsedTimeSeconds.value;
  if (secs <= 0) return 0;
  // Net WPM based on correct chars; fallback to gross if user has only incorrect chars
  const net = (correctChars.value / 5) * (60 / secs);
  if (correctChars.value === 0 && typed.value.length > 0) {
    const gross = (typed.value.length / 5) * (60 / secs);
    return Math.max(0, Math.round(gross));
  }
  return Math.max(0, Math.round(net));
});
const modeLabel = computed(() => mode.value === 'time' ? 'Time' : 'Words');
const accuracy = computed(() => {
  if (!typed.value.length) return 100;
  return Math.round((correctChars.value / typed.value.length) * 100);
});
const elapsedTimeDisplay = computed(() => Math.floor(elapsed.value));
const testTargetLabel = computed(() => mode.value === 'time' ? `${testValue.value}s` : `${testValue.value} words`);
// Label for the quick switch button shows the OTHER mode you will switch to.
const nextModeLabel = computed(() => mode.value === 'time' ? 'Words' : 'Time');

onMounted(() => {
  regenerateParagraph();
  nextTick(() => {
    const currentSpan = typingBox.value?.querySelector("span.current");
    currentSpanPos.value = currentSpan ? currentSpan.offsetTop : 0; // restored assignment
    if (typingBox.value) {
      const styles = getComputedStyle(typingBox.value);
      paddingTopPx.value = parseFloat(styles.paddingTop) || 0;
    }
    focusInput();
  });
});

const fullReset = () => {
  clearInterval(timerInterval);
  timerInterval = null;
  startTime.value = null;
  endTime.value = null;
  elapsed.value = 0;
  remainingTime.value = mode.value === 'time' ? testValue.value : 0;
  typed.value = '';
  currentIndex.value = 0;
  shiftHeight.value = 0;
  currentSpanPos.value = 0;
  isFinished.value = false;
};

const applyConfig = ({ mode: m, value }) => {
  mode.value = m;
  testValue.value = value;
  regenerateParagraph();
  // Always perform a full reset on value or mode change to avoid timer accumulation
  fullReset();
  nextTick(() => {
    focusInput();
    // Optionally auto-start countdown for time mode (uncomment if desired)
    // if (mode.value === 'time') startTimerIfNeeded();
  });
};

const resetTimer = () => {
  clearInterval(timerInterval);
  elapsed.value = 0;
  if (mode.value === 'time') {
    remainingTime.value = testValue.value;
  } else {
    remainingTime.value = 0; // not used
  }
};

const startTimerIfNeeded = () => {
  if (timerInterval) return;
  startTime.value = startTime.value || Date.now();
  timerInterval = setInterval(() => {
    if (mode.value === 'time') {
      remainingTime.value -= 1;
      if (remainingTime.value <= 0) {
        remainingTime.value = 0;
        finishTest();
      }
    } else { // words mode
      elapsed.value += 1;
    }
  }, 1000);
};

const focusInput = () => {
  if (!isFocused.value) {
    isFocused.value = true;
  }
  nextTick(() => hiddenInput.value && hiddenInput.value.focus({ preventScroll: true }));
};

const forceFocus = () => {
  focusInput();
};

const blurInput = () => {
  if (isFocused.value) {
    isFocused.value = false;
    nextTick(() => hiddenInput.value && hiddenInput.value.blur());
  }
};

const handleInput = () => {
  startTimerIfNeeded();
  currentIndex.value = typed.value.length;

  if (mode.value === 'words') {
    // Normalize typed input: collapse internal whitespace, preserve whether user finished last word
    const normalized = typed.value.replace(/\s+/g, ' ').trimEnd();
    if (normalized.length) {
      // Build expected target (first testValue words) each time in case mode/value changed
      const expected = wordsModeTargetText.value;
      // Completion criteria:
      // 1. User has typed exactly all required words (normalized equality)
      // 2. Or typed the required text plus trailing whitespace
      if (normalized === expected || (normalized.startsWith(expected) && normalized.slice(expected.length).trim() === '')) {
        finishTest();
        return;
      }
    }
  }
  if (currentIndex.value >= chars.value.length) {
    finishTest();
    return;
  }

  nextTick(() => {
    const currentSpan = typingBox.value.querySelector("span.current");
    if (!currentSpan) return;
    const spanOffset = currentSpan.offsetTop;
    const adjusted = Math.max(0, spanOffset - paddingTopPx.value);
    const currentLine = Math.round(adjusted / lineHeight);
    shiftHeight.value = Math.max(0, (currentLine - (maxVisibleLines - 1)) * lineHeight);
    currentSpanPos.value = spanOffset; // restored
  });
  isTyping.value = true;
  clearTimeout(typingTimeout);
  typingTimeout = setTimeout(() => {
    isTyping.value = false;
  }, 1000);
};


const finishTest = () => {
  isFinished.value = true;
  endTime.value = Date.now();
  blurInput();
  clearInterval(timerInterval);
  timerInterval = null;
  // Persist result
  try {
    const duration = (endTime.value - startTime.value) / 1000;
    const resultObj = {
      id: endTime.value,
      wpm: wpm.value,
      accuracy: accuracy.value,
      mode: mode.value,
      testValue: testValue.value,
      timestamp: new Date().toISOString(),
      correct: correctChars.value,
      incorrect: incorrectChars.value,
      totalChars: typed.value.length,
      durationSeconds: Math.round(duration * 10) / 10
    };
    saveResult(resultObj);
    if (isLoggedIn.value) {
      // remote persistence (async, no await to keep UI snappy)
      saveResultRemote(resultObj, user.value);
    }
  } catch (e) { /* swallow localStorage errors */ }
};

const retryTest = () => {
  regenerateParagraph();
  fullReset();
  nextTick(() => focusInput());
};

const quickSwitchMode = () => {
  const newMode = mode.value === 'time' ? 'words' : 'time';
  applyConfig({ mode: newMode, value: newMode === 'time' ? 15 : 10 });
};

const regenerateParagraph = () => {
  const targetWords = mode.value === 'words' ? testValue.value : Math.max(30, testValue.value * 3);
  const words = Array.from({ length: targetWords }, () => sampleWords[Math.floor(Math.random() * sampleWords.length)]);
  paragraph.value = words.join(' ');
  // paragraph.value = "long down problem out as find line eye set write";
  // const words = paragraph.value.split(' '); // restored split from paragraph
  paragraphWords.value = words; // restored
  wordsModeTargetText.value = words.slice(0, testValue.value).join(' ');
  paragraphKey.value++;
};
</script>

<style scoped>
.test-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-top: 2rem;
  gap: 2rem;
  user-select: none;
  cursor: default;
  font-family: "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
}


.typing-box {
  width: 75%;
  height: 8.5rem;
  border-radius: 8px;
  font-size: 2rem;
  line-height: 2.8rem;
  /* text-align: justify; */
  position: relative;
  overflow: hidden;
  /* letter-spacing: 0.2rem; */
  /* word-spacing: 0.1rem; */
  color: rgb(128, 128, 128);
  /* font-family: Cambria, Cochin, Georgia, Times, 'Times New Roman', serif; */
  font-family: 'Courier New', Courier, monospace;
  transition: all 0.3s ease;
  padding: 0.4rem 0.9rem 0.4rem 0.9rem;
}

.typing-box p {
  margin: 0;
  transition: transform 0.25s ease-in-out;
  will-change: transform;
  transform: translateZ(0);
  /* promote layer for smoother scrolling */
}

.blurred {
  filter: blur(4px);
  pointer-events: none;
  transition: all 0.3s ease;
}

.overlay {
  z-index: 11;
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  backdrop-filter: blur(2px);
  font-size: 1.2rem;
  font-weight: normal;
  color: white;
  cursor: pointer;
  pointer-events: none;
  transition: all 0.3s ease;
}

.hidden-input {
  position: absolute;
  opacity: 0;
  pointer-events: none;
}

.typing-box span {
  white-space: pre-wrap;
  /* margin: 0 0.1rem; */
}

.correct {
  color: rgb(255, 255, 255);
}

.incorrect {
  color: rgb(255, 52, 52);
}

/* Restored border-left caret for current character */
.current {
  margin: 0;
  padding: 0;
  border-left: 2px solid #007BFF;
}

.current.blink {
  animation: blink 1s steps(2, start) infinite;
}

@keyframes blink {

  0%,
  49% {
    border-color: #007BFF;
  }

  50%,
  100% {
    border-color: transparent;
  }
}

@media (prefers-reduced-motion: reduce) {
  .current.blink {
    animation: none;
    border-color: #007BFF;
  }
}

.retry-btn {
  border: none;
  background: transparent;
  font-size: 1.1rem;
  cursor: pointer;
  color: #a5a5a5;
  transition: color 0.2s;
}

.retry-btn:hover {
  color: rgb(193, 193, 193);
}

/* Result redesign */
.result-screen {
  padding: 2rem 2.2rem;
  border-radius: 14px;
  border: 1px solid rgba(255, 255, 255, 0.09);
  background: linear-gradient(145deg, #171717, #101010);
  box-shadow: 0 4px 18px -4px rgba(0, 0, 0, 0.6), inset 0 1px 0 0 rgba(255, 255, 255, 0.04);
  width: clamp(340px, 68%, 880px);
  display: flex;
  flex-direction: column;
  gap: 1.6rem;
}

.result-title {
  margin: 0;
  font-size: 1.4rem;
  font-weight: 600;
  letter-spacing: 1px;
  color: #e2e2e2;
}

.result-summary {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(110px, 1fr));
  gap: 0.9rem 1rem;
}

.metric {
  background: #1e1e1e;
  border: 1px solid rgba(255, 255, 255, 0.06);
  padding: 0.7rem 0.75rem 0.65rem;
  border-radius: 10px;
  display: flex;
  flex-direction: column;
  gap: 0.3rem;
  position: relative;
  min-height: 82px;
}

.metric.primary {
  background: linear-gradient(160deg, #202d40, #18202b 45%, #141414);
  border-color: rgba(80, 140, 255, 0.35);
}

.metric-label {
  font-size: 0.68rem;
  text-transform: uppercase;
  letter-spacing: 1.3px;
  color: #8d98a6;
  font-weight: 600;
}

.metric-value {
  font-size: 2rem;
  line-height: 1;
  font-weight: 600;
  color: #f5f5f5;
  font-variant-numeric: tabular-nums;
}

.metric-value.small {
  font-size: 1.15rem;
}

.detail-stats {
  border: 1px solid rgba(255, 255, 255, 0.06);
  background: #161616;
  border-radius: 10px;
  padding: 0.9rem 1rem;
  display: flex;
  flex-direction: column;
  gap: 0.45rem;
}

.detail-row {
  display: flex;
  justify-content: space-between;
  font-size: 0.85rem;
  color: #c7c7c7;
}

.detail-row span:last-child {
  font-family: 'Courier New', monospace;
  color: #f0f0f0;
}

.actions {
  display: flex;
  gap: 0.75rem;
  flex-wrap: wrap;
}

.action-btn {
  background: #1f2933;
  border: 1px solid #314052;
  color: #d6e2ef;
  padding: 0.6rem 1.1rem;
  border-radius: 8px;
  font-size: 0.85rem;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  transition: background .18s ease, border-color .18s ease, transform .25s cubic-bezier(.33, 1, .68, 1);
}

.action-btn:hover {
  background: #273341;
}

.action-btn:active {
  transform: translateY(1px);
}

.action-btn.ghost {
  background: transparent;
  border-color: #394453;
  color: #9fb5ca;
}

.action-btn.ghost:hover {
  background: #1d2630;
}

.timer-display {
  font-size: 1.4rem;
  font-weight: 600;
  letter-spacing: 1px;
  color: #c9c9c9;
  margin-top: -0.5rem;
  user-select: none;
}

/* Smooth fade for paragraph regeneration */
.fade-fast-enter-active,
.fade-fast-leave-active {
  transition: opacity 120ms ease;
}

.fade-fast-enter-from,
.fade-fast-leave-to {
  opacity: 0;
}
</style>
