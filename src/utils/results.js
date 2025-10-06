// Simple localStorage-backed results store
// Schema: { id, wpm, accuracy, mode, testValue, timestamp, correct, incorrect, totalChars, durationSeconds }
// When user is logged in we also attempt to persist remotely.

import { api } from './api';

const KEY = 'zb_results_v1';

function loadAll() {
  try { return JSON.parse(localStorage.getItem(KEY)) || []; } catch { return []; }
}
function saveAll(arr) { localStorage.setItem(KEY, JSON.stringify(arr)); }

export function saveResult(result) {
  const list = loadAll();
  list.unshift(result); // most recent first
  // optional cap
  if (list.length > 200) list.pop();
  saveAll(list);
}

export function getResults() { return loadAll(); }

export function aggregateStats() {
  const list = loadAll();
  if (!list.length) return { count:0, bestWpm:0, avgWpm:0, avgAccuracy:0 };
  let bestWpm = 0, sumWpm = 0, sumAcc = 0;
  list.forEach(r => { bestWpm = Math.max(bestWpm, r.wpm); sumWpm += r.wpm; sumAcc += r.accuracy; });
  return {
    count: list.length,
    bestWpm,
    avgWpm: Math.round(sumWpm / list.length),
    avgAccuracy: Math.round(sumAcc / list.length)
  };
}

// Remote save (fire-and-forget). Caller supplies user (optional) so we can attach userId.
export async function saveResultRemote(result, user) {
  try {
    const payload = {
      userId: user?.id,
      wpm: result.wpm,
      accuracy: result.accuracy,
      rawWpm: result.wpm, // no separate net/raw right now
      characters: result.totalChars,
      durationSec: result.durationSeconds,
      mode: result.mode
    };
    await api.post('/test-results', payload);
  } catch (e) {
    // swallow silently; could enqueue for later retry
    // console.warn('Remote save failed', e);
  }
}
