import React from 'react';
import { LuMapPin, LuThermometer, LuTrendingUp, LuFlame, LuTriangleAlert, LuMap, LuChartLine } from 'react-icons/lu';
import StatCard from '../Cards/StatCard';
import SriLankaMap from '../Map/SriLankaMap';
import { MiniChart } from '../Charts';
import { cardStyle } from '../../styles/theme';
import { REEF_SITES } from '../../data/reefSites';

// Map site name to region key in stats
function getRegionForSite(siteName) {
  const site = REEF_SITES.find(s => s.name === siteName);
  if (!site) return 'Southern Sri Lanka';
  return site.region === 'southern' ? 'Southern Sri Lanka' : 'Eastern Sri Lanka';
}

export default function OverviewTab({ stats, timeline, prediction, selectedSite, onSelectSite }) {
  // Get the correct region based on selected site
  const regionKey = getRegionForSite(selectedSite);
  const region = stats?.regions?.[regionKey];

  // Use prediction data if available (more accurate for selected site)
  const sst = prediction?.sst ?? region?.current_sst ?? '--';
  const anomaly = prediction?.sst_anomaly ?? region?.current_anomaly ?? '--';
  const dhw = prediction?.dhw ?? region?.current_dhw ?? '--';
  const risk = prediction?.bleaching_risk_percent ?? region?.bleaching_risk_percent ?? '--';

  const riskData = timeline?.map(t => t.risk_percent) || [];
  const sstData = timeline?.map(t => t.sst) || [];

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
      {/* Selected site indicator */}
      <div style={{
        gridColumn: '1 / -1', display: 'flex', alignItems: 'center', gap: 8,
        padding: '8px 14px', borderRadius: 8,
        background: 'rgba(56,189,248,0.05)', border: '1px solid rgba(56,189,248,0.15)',
      }}>
        <LuMapPin size={14} color="#38bdf8" />
        <span style={{ fontSize: 12, color: '#38bdf8', fontWeight: 700 }}>{selectedSite}</span>
        <span style={{ fontSize: 11, color: '#64748b' }}>— {regionKey}</span>
        <span style={{ fontSize: 10, color: '#475569', marginLeft: 'auto' }}>
          {prediction?.date || region?.last_updated || ''}
        </span>
      </div>

      {/* Top stat cards — changes based on selected site */}
      <div style={{ gridColumn: '1 / -1', display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10 }}>
        <StatCard label="SST" value={`${sst}°C`} sub="Sea Temperature" color="#ef4444" icon={<LuThermometer size={18} />} />
        <StatCard label="Anomaly" value={`+${anomaly}°C`} sub="Above Normal" color="#f59e0b" icon={<LuTrendingUp size={18} />} />
        <StatCard label="DHW" value={`${dhw}`} sub="°C-weeks" color="#8b5cf6" icon={<LuFlame size={18} />} />
        <StatCard label="Risk" value={`${risk}%`} sub="Bleaching Risk" color="#ef4444" icon={<LuTriangleAlert size={18} />} />
      </div>

      {/* Map */}
      <div style={cardStyle}>
        <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8, color: '#e2e8f0' }}>
          <LuMap size={16} /> Reef Monitoring Sites
          <span style={{ fontSize: 10, color: '#475569', fontWeight: 400, marginLeft: 'auto' }}>Click a site to view data</span>
        </div>
        <SriLankaMap selectedSite={selectedSite} onSelectSite={onSelectSite} stats={stats} />
        <div style={{ display: 'flex', gap: 14, marginTop: 12, justifyContent: 'center' }}>
          {[['#ef4444', 'High Risk'], ['#f59e0b', 'Medium'], ['#10b981', 'Safe']].map(([c, l]) => (
            <div key={l} style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 10, color: '#94a3b8' }}>
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: c }} />{l}
            </div>
          ))}
        </div>
      </div>

      {/* Risk Timeline */}
      <div style={cardStyle}>
        <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 6, display: 'flex', alignItems: 'center', gap: 8, color: '#e2e8f0' }}>
          <LuChartLine size={16} /> 90-Day Risk Timeline
        </div>
        <div style={{ fontSize: 10, color: '#64748b', marginBottom: 14 }}>
          Bleaching risk % — <b style={{ color: '#38bdf8' }}>{selectedSite}</b>
        </div>

        {riskData.length > 0 ? (
          <>
            <MiniChart data={riskData} height={110} color="#ef4444" />
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6 }}>
              <span style={{ fontSize: 9, color: '#475569' }}>{timeline[0]?.date}</span>
              <span style={{ fontSize: 9, color: '#475569' }}>{timeline[timeline.length - 1]?.date}</span>
            </div>
          </>
        ) : (
          <div style={{ height: 110, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#475569', fontSize: 11 }}>
            No timeline data for this location
          </div>
        )}

        <div style={{ marginTop: 16 }}>
          <div style={{ fontSize: 10, color: '#64748b', marginBottom: 8 }}>SST Trend (°C)</div>
          {sstData.length > 0 ? (
            <MiniChart data={sstData} height={60} color="#38bdf8" />
          ) : (
            <div style={{ height: 60, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#475569', fontSize: 11 }}>
              No SST data
            </div>
          )}
        </div>
      </div>
    </div>
  );
}