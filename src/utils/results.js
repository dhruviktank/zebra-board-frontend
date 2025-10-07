import { api } from './api';

// Fetch results for a user from server (paginated). Always fresh (no caching).
export async function fetchUserResults(userId, { take = 100 } = {}) {
  if (!userId) return [];
  const params = new URLSearchParams({ userId: String(userId), take: String(take) });
  const res = await api.get(`/test-results?${params.toString()}`);
  return Array.isArray(res) ? res : [];
}

// Fetch aggregate stats for a user from server
export async function fetchUserAggregate(userId) {
  if (!userId) return { count:0, bestWpm:0, avgWpm:0, avgAccuracy:0 };
  const params = new URLSearchParams({ userId: String(userId) });
  const res = await api.get(`/test-results/aggregate/by-user?${params.toString()}`);
  return res || { count:0, bestWpm:0, avgWpm:0, avgAccuracy:0 };
}

// Compute aggregate stats from provided list (server results). Accepts optional list param to avoid refetch.
export function aggregateStatsFrom(list) {
  if (!list || !list.length) return { count:0, bestWpm:0, avgWpm:0, avgAccuracy:0 };
  let bestWpm = 0, sumWpm = 0, sumAcc = 0;
  for (const r of list) {
    bestWpm = Math.max(bestWpm, r.wpm || 0);
    sumWpm += r.wpm || 0;
    sumAcc += r.accuracy || 0;
  }
  return {
    count: list.length,
    bestWpm,
    avgWpm: Math.round(sumWpm / list.length),
    avgAccuracy: Math.round(sumAcc / list.length)
  };
}

export async function saveResultRemote(result, user) {
  if (!user?.id) return;
  try {
    const payload = {
      userId: user.id,
      wpm: result.wpm,
      accuracy: result.accuracy,
      rawWpm: result.wpm,
      characters: result.totalChars,
      durationSec: result.durationSeconds,
      mode: result.mode
    };
    await api.post('/test-results', payload);
  } catch (e) {
    // silently ignore; could enqueue retry strategy here
  }
}
