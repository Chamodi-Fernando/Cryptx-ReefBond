import React from 'react';
import { LuShell } from 'react-icons/lu';
import { fonts } from '../../styles/theme';

export default function Header({ isLive }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>

      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <LuShell size={32} color="#38bdf8" />
        <div>
          <h1 style={{
            margin: 0, fontSize: 24, fontFamily: fonts.heading, fontWeight: 700,
            letterSpacing: '-0.5px',
            background: 'linear-gradient(135deg, #f0f9ff, #38bdf8)',
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
          }}>
            ReefBond
          </h1>
          <div style={{
            fontSize: 10, color: '#64748b', letterSpacing: '2.5px',
            textTransform: 'uppercase', marginTop: 2, fontFamily: fonts.body,
          }}>
            Parametric Coral Insurance Protocol
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
        {/* Live / Demo indicator */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 6, padding: '6px 14px',
          borderRadius: 20,
          background: isLive ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)',
          border: `1px solid ${isLive ? 'rgba(16,185,129,0.3)' : 'rgba(239,68,68,0.3)'}`,
          fontSize: 11, fontWeight: 600, fontFamily: fonts.body,
        }}>
          <div style={{
            width: 6, height: 6, borderRadius: '50%',
            background: isLive ? '#10b981' : '#ef4444',
            boxShadow: `0 0 8px ${isLive ? '#10b981' : '#ef4444'}`,
            animation: 'pulse-dot 2s infinite',
          }} />
          {isLive ? 'API CONNECTED' : 'DEMO MODE'}
        </div>

        {/* Date */}
        <div style={{
          fontSize: 11, color: '#475569', padding: '6px 12px',
          background: 'rgba(255,255,255,0.03)', borderRadius: 8,
          border: '1px solid rgba(255,255,255,0.06)', fontFamily: fonts.body,
        }}>
          {new Date().toLocaleDateString('en-LK', { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' })}
        </div>
      </div>

      <style>{`
        @keyframes pulse-dot {
          0%, 100% { opacity: 0.6; }
          50% { opacity: 1; }
        }
      `}</style>
    </div>
  );
}