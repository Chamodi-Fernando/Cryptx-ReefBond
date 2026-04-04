import React from 'react';
import { fonts } from '../../styles/theme';
import { getRiskColor } from '../../utils/helpers';

export function RiskGauge({ percent, size = 180 }) {
  const radius = (size - 20) / 2;
  const circumference = Math.PI * radius;
  const offset = circumference - (percent / 100) * circumference;
  const color = getRiskColor(percent);

  return (
    <div style={{ position: 'relative', width: size, height: size / 2 + 35, margin: '0 auto' }}>
      <svg width={size} height={size / 2 + 10} viewBox={`0 0 ${size} ${size / 2 + 10}`}>
        <path
          d={`M 10 ${size / 2} A ${radius} ${radius} 0 0 1 ${size - 10} ${size / 2}`}
          fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="16" strokeLinecap="round"
        />
        <path
          d={`M 10 ${size / 2} A ${radius} ${radius} 0 0 1 ${size - 10} ${size / 2}`}
          fill="none" stroke={color} strokeWidth="16" strokeLinecap="round"
          strokeDasharray={circumference} strokeDashoffset={offset}
          style={{ transition: 'stroke-dashoffset 1.5s ease, stroke 0.5s ease',
            filter: `drop-shadow(0 0 10px ${color}80)` }}
        />
      </svg>
      <div style={{ position: 'absolute', bottom: 10, left: '50%', transform: 'translateX(-50%)', textAlign: 'center' }}>
        <div style={{ fontSize: size * 0.2, fontWeight: 800, color, letterSpacing: '-1px',
          fontFamily: fonts.heading }}>{percent.toFixed(1)}%</div>
      </div>
    </div>
  );
}

export function MiniChart({ data, height = 60, color = '#ef4444' }) {
  if (!data || data.length < 2) {
    return (
      <div style={{ height, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#475569', fontSize: 11 }}>
        Insufficient data
      </div>
    );
  }

  // Convert all values to numbers
  const numData = data.map(v => typeof v === 'string' ? parseFloat(v) : Number(v)).filter(v => !isNaN(v));
  if (numData.length < 2) {
    return (
      <div style={{ height, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#475569', fontSize: 11 }}>
        No valid data
      </div>
    );
  }

  const max = Math.max(...numData);
  const min = Math.min(...numData);
  const range = max - min;
  const padding = 4;
  const drawH = height - padding * 2;
  const w = 400; // higher resolution SVG

  // If all values are the same, draw a flat line in the middle
  const points = numData.map((v, i) => {
    const x = (i / (numData.length - 1)) * w;
    const y = range === 0
      ? padding + drawH / 2
      : padding + drawH - ((v - min) / range) * drawH;
    return `${x},${y}`;
  }).join(' ');

  const gradId = `grad-${color.replace('#', '')}-${Math.random().toString(36).slice(2, 6)}`;
  const areaPoints = `0,${height} ${points} ${w},${height}`;

  return (
    <svg viewBox={`0 0 ${w} ${height}`} style={{ width: '100%', height, display: 'block' }} preserveAspectRatio="none">
      <defs>
        <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.3" />
          <stop offset="100%" stopColor={color} stopOpacity="0.02" />
        </linearGradient>
      </defs>
      {/* Area fill */}
      <polygon points={areaPoints} fill={`url(#${gradId})`} />
      {/* Line */}
      <polyline
        points={points}
        fill="none"
        stroke={color}
        strokeWidth="2"
        vectorEffect="non-scaling-stroke"
        strokeLinejoin="round"
        strokeLinecap="round"
      />
      {/* Latest point dot */}
      {numData.length > 0 && (() => {
        const lastX = w;
        const lastV = numData[numData.length - 1];
        const lastY = range === 0
          ? padding + drawH / 2
          : padding + drawH - ((lastV - min) / range) * drawH;
        return (
          <circle cx={lastX} cy={lastY} r="4" fill={color} stroke="#0a0e1a" strokeWidth="2"
            style={{ filter: `drop-shadow(0 0 4px ${color})` }} />
        );
      })()}
    </svg>
  );
}