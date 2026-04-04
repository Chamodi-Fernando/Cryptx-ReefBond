import React from 'react';
import { LuSparkles, LuCircle, LuSearch, LuLightbulb } from 'react-icons/lu';
import { RiskGauge } from '../Charts';
import { cardStyle, fonts } from '../../styles/theme';

export default function PredictionTab({ prediction }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
      {/* Gauge + Stats */}
      <div style={{ ...cardStyle, padding: 24, textAlign: 'center' }}>
        <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 4, color: '#e2e8f0', display: 'flex', alignItems: 'center', gap: 8, justifyContent: 'center' }}><LuSparkles size={16} /> 14-Day Bleaching Forecast</div>
        <div style={{ fontSize: 11, color: '#64748b', marginBottom: 20 }}>{prediction.region} — {prediction.date}</div>
        <RiskGauge percent={prediction.bleaching_risk_percent} />

        <div style={{
          marginTop: 14, padding: '8px 20px', borderRadius: 20, display: 'inline-block',
          background: 'rgba(239,68,68,0.12)', color: '#ef4444',
          fontSize: 12, fontWeight: 700, letterSpacing: '1px',
          border: '1px solid rgba(239,68,68,0.25)',
        }}>
          <LuCircle size={12} style={{ fill: '#ef4444', verticalAlign: 'middle', marginRight: 4 }} /> {prediction.risk_level} RISK
        </div>

        <div style={{ marginTop: 20, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
          {[
            ['SST', `${prediction.sst}°C`],
            ['Anomaly', `+${prediction.sst_anomaly}°C`],
            ['HotSpot', `${prediction.hotspot}`],
            ['DHW', `${prediction.dhw} °C-wk`],
          ].map(([l, v]) => (
            <div key={l} style={{
              padding: 10, borderRadius: 8,
              background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)',
            }}>
              <div style={{ fontSize: 9, color: '#64748b', textTransform: 'uppercase', letterSpacing: '1px' }}>{l}</div>
              <div style={{ fontSize: 15, fontWeight: 700, fontFamily: fonts.heading, color: '#e2e8f0', marginTop: 2 }}>{v}</div>
            </div>
          ))}
        </div>
      </div>

      {/* SHAP Explanation */}
      <div style={{ ...cardStyle, padding: 24 }}>
        <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 4, color: '#e2e8f0', display: 'flex', alignItems: 'center', gap: 8 }}><LuSearch size={16} /> SHAP Explainability</div>
        <div style={{ fontSize: 10, color: '#64748b', marginBottom: 20 }}>
          Why did the AI make this prediction? Top contributing factors:
        </div>

        {prediction.top_factors?.map((f, i) => {
          const maxImpact = prediction.top_factors[0]?.impact || 1;
          const barWidth = (f.impact / maxImpact) * 100;
          const color = f.direction === 'increases' ? '#ef4444' : '#10b981';
          return (
            <div key={i} style={{ marginBottom: 14 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
                <span style={{ fontSize: 11, fontWeight: 600, fontFamily: fonts.heading, color: '#cbd5e1' }}>
                  {f.feature}
                </span>
                <span style={{ fontSize: 10, color, fontWeight: 600 }}>
                  {f.direction === 'increases' ? '↑' : '↓'} {f.impact.toFixed(4)}
                </span>
              </div>
              <div style={{ height: 7, borderRadius: 4, background: 'rgba(255,255,255,0.04)', overflow: 'hidden' }}>
                <div style={{
                  height: '100%', width: `${barWidth}%`, borderRadius: 4, background: color,
                  transition: 'width 1s ease', boxShadow: `0 0 10px ${color}30`,
                }} />
              </div>
            </div>
          );
        })}

        <div style={{
          marginTop: 20, padding: 14, borderRadius: 10,
          background: 'rgba(56,189,248,0.05)', border: '1px solid rgba(56,189,248,0.12)',
          fontSize: 11, color: '#94a3b8', lineHeight: 1.6,
        }}>
          <LuLightbulb size={14} style={{ flexShrink: 0, verticalAlign: 'middle', marginRight: 6 }} />{prediction.explanation}
        </div>
      </div>
    </div>
  );
}