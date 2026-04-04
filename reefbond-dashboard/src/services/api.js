const API_BASE = 'http://localhost:8000';

async function safeFetch(url) {
  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error(res.statusText);
    return { data: await res.json(), ok: true };
  } catch {
    return { data: null, ok: false };
  }
}

export async function fetchStats() {
  return safeFetch(`${API_BASE}/stats`);
}

export async function fetchPrediction(location = 'hikkaduwa') {
  return safeFetch(`${API_BASE}/predict/${location}`);
}

export async function fetchTimeline(location = 'hikkaduwa', days = 90) {
  return safeFetch(`${API_BASE}/timeline/${location}?days=${days}`);
}

export async function fetchDHW(location) {
  return safeFetch(`${API_BASE}/dhw/${location}`);
}

export async function triggerOracle(location = 'hikkaduwa') {
  try {
    const res = await fetch(`${API_BASE}/oracle/trigger?location=${location}`, { method: 'POST' });
    if (!res.ok) throw new Error(res.statusText);
    return { data: await res.json(), ok: true };
  } catch {
    return { data: null, ok: false };
  }
}