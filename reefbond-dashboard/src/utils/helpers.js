export function getRiskColor(percent) {
  if (percent > 70) return '#ef4444';
  if (percent > 40) return '#f59e0b';
  return '#10b981';
}

export function getRiskLabel(percent) {
  if (percent > 70) return 'HIGH';
  if (percent > 40) return 'MEDIUM';
  return 'LOW';
}

export function getRiskBg(percent) {
  if (percent > 70) return 'rgba(239,68,68,0.1)';
  if (percent > 40) return 'rgba(245,158,11,0.1)';
  return 'rgba(16,185,129,0.1)';
}

export function formatDate(dateStr) {
  return new Date(dateStr).toLocaleDateString('en-LK', {
    year: 'numeric', month: 'short', day: 'numeric',
  });
}