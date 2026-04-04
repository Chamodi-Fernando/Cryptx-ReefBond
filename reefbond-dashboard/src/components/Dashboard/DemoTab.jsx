import React, { useState } from 'react';
import { LuThermometer, LuBrain, LuLink, LuCoins, LuPlay, LuCircleCheck, LuLoader, LuPartyPopper } from 'react-icons/lu';
import { triggerOracle } from '../../services/api';
import { cardStyle, fonts } from '../../styles/theme';

const DEMO_STEPS = [
  { label: 'SST rises to 30.32°C in Hikkaduwa',                icon: <LuThermometer size={20} /> },
  { label: 'AI detects 99.8% bleaching risk (6 weeks early)',   icon: <LuBrain size={20} /> },
  { label: 'Oracle pushes DHW 8.23 on-chain',                   icon: <LuLink size={20} /> },
  { label: 'Smart contract auto-pays Chaminda 0.05 ETH',        icon: <LuCoins size={20} /> },
];

export default function DemoTab() {
  const [demoStep, setDemoStep] = useState(0);

  const runDemo = async () => {
    setDemoStep(1);
    setTimeout(() => setDemoStep(2), 2000);
    setTimeout(() => setDemoStep(3), 4000);
    setTimeout(() => setDemoStep(4), 6000);
    try { await triggerOracle('hikkaduwa'); } catch {}
  };

  const reset = () => setDemoStep(0);

  return (
    <div style={{ maxWidth: 620, margin: '0 auto' }}>
      <div style={{ ...cardStyle, padding: 28, textAlign: 'center' }}>
        <div style={{ fontSize: 24, marginBottom: 8, color: '#38bdf8' }}><LuPlay size={24} /></div>
        <h2 style={{ fontSize: 20, fontWeight: 800, margin: '0 0 8px', fontFamily: fonts.heading, color: '#e2e8f0' }}>
          Live Demo — The Chaminda Story
        </h2>
        <p style={{ fontSize: 12, color: '#64748b', lineHeight: 1.7, margin: '0 0 24px', maxWidth: 480, marginInline: 'auto' }}>
          Chaminda runs a dive center in Hikkaduwa. Watch how ReefBond automatically
          pays him when coral bleaching hits — without filing a single claim.
        </p>

        <button
          onClick={demoStep === 4 ? reset : runDemo}
          disabled={demoStep > 0 && demoStep < 4}
          style={{
            padding: '14px 36px', borderRadius: 12, border: 'none', cursor: 'pointer',
            background: demoStep === 0 ? 'linear-gradient(135deg, #38bdf8, #3b82f6)'
              : demoStep === 4 ? 'linear-gradient(135deg, #10b981, #059669)' : '#1e293b',
            color: '#fff', fontSize: 14, fontWeight: 700, fontFamily: fonts.body,
            transition: 'all 0.3s',
            boxShadow: demoStep === 0 ? '0 4px 24px rgba(56,189,248,0.3)' : 'none',
            opacity: (demoStep > 0 && demoStep < 4) ? 0.6 : 1,
          }}
        >
          {demoStep === 0 ? (<><LuPlay size={14} style={{ verticalAlign: 'middle', marginRight: 6 }} />Start Demo</>) : demoStep === 4 ? '↺  Reset Demo' : (<><LuLoader size={14} style={{ verticalAlign: 'middle', marginRight: 6 }} />Processing...</>)}
        </button>

        {/* Steps */}
        <div style={{ marginTop: 28, textAlign: 'left' }}>
          {DEMO_STEPS.map((step, i) => {
            const isDone = demoStep > i;
            const isCurrent = demoStep === i + 1;
            return (
              <div key={i} style={{
                display: 'flex', alignItems: 'center', gap: 14, padding: '12px 14px',
                marginBottom: 6, borderRadius: 10,
                transition: 'all 0.5s ease',
                background: isDone ? 'rgba(16,185,129,0.06)' : isCurrent ? 'rgba(56,189,248,0.06)' : 'transparent',
                border: `1px solid ${isDone ? 'rgba(16,185,129,0.2)' : isCurrent ? 'rgba(56,189,248,0.2)' : 'rgba(255,255,255,0.04)'}`,
                transform: isCurrent ? 'scale(1.02)' : 'scale(1)',
              }}>
                <div style={{ fontSize: 20, minWidth: 32, textAlign: 'center', display: 'flex', alignItems: 'center', justifyContent: 'center', color: isDone ? '#10b981' : isCurrent ? '#38bdf8' : '#64748b' }}>
                  {isDone ? <LuCircleCheck size={20} /> : isCurrent ? <LuLoader size={20} /> : step.icon}
                </div>
                <div style={{
                  fontSize: 13, fontWeight: 600,
                  color: isDone ? '#10b981' : isCurrent ? '#38bdf8' : '#64748b',
                }}>
                  {step.label}
                </div>
              </div>
            );
          })}
        </div>

        {/* Success message */}
        {demoStep === 4 && (
          <div style={{
            marginTop: 20, padding: 18, borderRadius: 12,
            background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.25)',
            animation: 'fadeSlideUp 0.6s ease',
          }}>
            <div style={{ fontSize: 16, fontWeight: 800, color: '#10b981', marginBottom: 6, display: 'flex', alignItems: 'center', gap: 8, justifyContent: 'center' }}>
              <LuPartyPopper size={18} /> Payout Complete!
            </div>
            <div style={{ fontSize: 12, color: '#94a3b8', lineHeight: 1.6 }}>
              Chaminda received <b style={{ color: '#10b981' }}>0.05 ETH</b>. He filed nothing. He clicked nothing.
              <br />
              <b style={{ color: '#10b981' }}>The reef's suffering is the claim.</b>
            </div>
          </div>
        )}
      </div>

      <style>{`
        @keyframes fadeSlideUp {
          from { opacity: 0; transform: translateY(12px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}