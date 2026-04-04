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

export async function registerOperator(name, location, walletAddress = '') {
  try {
    const res = await fetch(`${API_BASE}/operators/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, location, wallet_address: walletAddress })
    });
    if (!res.ok) throw new Error(res.statusText);
    return { data: await res.json(), ok: true };
  } catch { return { data: null, ok: false }; }
}

export async function getOperators() {
  return safeFetch(`${API_BASE}/operators`);
}

export async function deleteOperator(id) {
  try {
    const res = await fetch(`${API_BASE}/operators/${id}`, { method: 'DELETE' });
    return { data: await res.json(), ok: true };
  } catch { return { data: null, ok: false }; }
}

export async function recordPayout(location, dhwValue = 8.23) {
  try {
    const res = await fetch(`${API_BASE}/operators/payout`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ location, dhw_value: dhwValue, sst_value: 30.32, risk_percent: 99 })
    });
    if (!res.ok) throw new Error(res.statusText);
    return { data: await res.json(), ok: true };
  } catch { return { data: null, ok: false }; }
}

export async function getPayoutEvents() {
  return safeFetch(`${API_BASE}/operators/events/all`);
}