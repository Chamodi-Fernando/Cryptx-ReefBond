/* ============================================
   🪸 ReefBond Design Tokens
   ============================================ */

export const colors = {
  // Background layers
  bg: {
    primary:   '#0a0e1a',
    secondary: '#0d1525',
    card:      'rgba(255,255,255,0.02)',
    cardHover: 'rgba(255,255,255,0.04)',
    elevated:  'rgba(255,255,255,0.03)',
  },
  // Borders
  border: {
    subtle:  'rgba(255,255,255,0.06)',
    medium:  'rgba(255,255,255,0.1)',
    strong:  'rgba(255,255,255,0.15)',
  },
  // Risk levels
  risk: {
    high:    '#ef4444',
    medium:  '#f59e0b',
    low:     '#10b981',
    highBg:  'rgba(239,68,68,0.1)',
    mediumBg:'rgba(245,158,11,0.1)',
    lowBg:   'rgba(16,185,129,0.1)',
  },
  // Accent
  accent: {
    blue:    '#38bdf8',
    purple:  '#8b5cf6',
    cyan:    '#06b6d4',
    blueBg:  'rgba(56,189,248,0.1)',
    purpleBg:'rgba(139,92,246,0.1)',
  },
  // Text
  text: {
    primary:   '#e2e8f0',
    secondary: '#94a3b8',
    muted:     '#64748b',
    dim:       '#475569',
    darkMuted: '#334155',
  },
};

export const fonts = {
  heading: "'Space Mono', monospace",
  body:    "'DM Sans', 'Segoe UI', sans-serif",
};

export const cardStyle = {
  padding: 16,
  borderRadius: 14,
  background: colors.bg.card,
  border: `1px solid ${colors.border.subtle}`,
  backdropFilter: 'blur(10px)',
};

export const glowShadow = (color, intensity = 0.3) =>
  `0 0 20px ${color}${Math.round(intensity * 255).toString(16).padStart(2, '0')}`;