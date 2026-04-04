import React from 'react';
import { fonts, cardStyle } from '../../styles/theme';

export default function StatCard({ label, value, sub, color, icon }) {
  return (
    <div style={{ ...cardStyle, padding: 14 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
        <span style={{ fontSize: 10, color: '#64748b', textTransform: 'uppercase',
          letterSpacing: '1.5px', fontWeight: 600, fontFamily: fonts.body }}>{label}</span>
        <span style={{ fontSize: 18, display: 'flex', alignItems: 'center', color: color || '#64748b' }}>{icon}</span>
      </div>
      <div style={{ fontSize: 22, fontWeight: 800, color, fontFamily: fonts.heading }}>{value}</div>
      <div style={{ fontSize: 10, color: '#475569', marginTop: 2, fontFamily: fonts.body }}>{sub}</div>
    </div>
  );
}
