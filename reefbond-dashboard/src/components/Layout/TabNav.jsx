import React from 'react';
import { LuChartBar, LuSparkles, LuLink, LuPlay } from 'react-icons/lu';
import { fonts } from '../../styles/theme';

const TABS = [
  { id: 'overview',  label: 'Overview',       icon: <LuChartBar size={14} /> },
  { id: 'predict',   label: 'AI Prediction',  icon: <LuSparkles size={14} /> },
  { id: 'contract',  label: 'Smart Contract', icon: <LuLink size={14} /> },
  { id: 'demo',      label: 'Live Demo',      icon: <LuPlay size={14} /> },
];

export default function TabNav({ activeTab, onTabChange }) {
  return (
    <div style={{
      display: 'flex', gap: 4, marginBottom: 16, padding: 3,
      background: 'rgba(255,255,255,0.03)', borderRadius: 10,
      border: '1px solid rgba(255,255,255,0.06)', width: 'fit-content',
    }}>
      {TABS.map(({ id, label, icon }) => (
        <button
          key={id}
          onClick={() => onTabChange(id)}
          style={{
            padding: '8px 18px', borderRadius: 8, border: 'none', cursor: 'pointer',
            background: activeTab === id ? 'rgba(56,189,248,0.12)' : 'transparent',
            color: activeTab === id ? '#38bdf8' : '#64748b',
            fontSize: 12, fontWeight: 600, fontFamily: fonts.body,
            transition: 'all 0.25s ease',
            borderBottom: activeTab === id ? '2px solid #38bdf8' : '2px solid transparent',
            display: 'flex', alignItems: 'center', gap: 6,
          }}
        >
          {icon} {label}
        </button>
      ))}
    </div>
  );
}