import React, { useState, useEffect, useCallback } from 'react';
import { LuShell, LuTriangleAlert } from 'react-icons/lu';
import Header from './components/Layout/Header';
import TabNav from './components/Layout/TabNav';
import OverviewTab from './components/Dashboard/OverviewTab';
import PredictionTab from './components/Dashboard/PredictionTab';
import ContractTab from './components/Dashboard/ContractTab';
import DemoTab from './components/Dashboard/DemoTab';
import { fetchStats, fetchPrediction, fetchTimeline } from './services/api';
import { colors, fonts } from './styles/theme';

export default function App() {
  const [stats, setStats] = useState(null);
  const [prediction, setPrediction] = useState(null);
  const [timeline, setTimeline] = useState(null);
  const [selectedSite, setSelectedSite] = useState('Hikkaduwa');
  const [activeTab, setActiveTab] = useState('overview');
  const [isLive, setIsLive] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [s, p, t] = await Promise.all([
        fetchStats(),
        fetchPrediction('hikkaduwa'),
        fetchTimeline('hikkaduwa', 90),
      ]);

      if (s.ok) { setStats(s.data); setIsLive(true); }
      else setError('Cannot connect to API. Make sure reefbond_api.py is running on localhost:8000');

      if (p.ok) setPrediction(p.data);
      if (t.ok) setTimeline(t.data);
    } catch (err) {
      setError('Cannot connect to API. Run: python reefbond_api.py');
    }
    setLoading(false);
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  

  // Change site prediction
  const handleSiteChange = async (siteName) => {
    setSelectedSite(siteName);
    const locationKey = siteName.toLowerCase().replace(' ', '_');
    const [p, t] = await Promise.all([
      fetchPrediction(locationKey),
      fetchTimeline(locationKey, 90),
    ]);
    if (p.ok) setPrediction(p.data);
    if (t.ok) setTimeline(t.data);
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: `linear-gradient(145deg, ${colors.bg.primary} 0%, ${colors.bg.secondary} 50%, ${colors.bg.primary} 100%)`,
      color: colors.text.primary,
      fontFamily: fonts.body,
      padding: '20px 24px',
      position: 'relative',
      overflow: 'hidden',
    }}>
      <div style={{
        position: 'fixed', top: -250, right: -250, width: 600, height: 600,
        background: 'radial-gradient(circle, rgba(239,68,68,0.04) 0%, transparent 70%)',
        pointerEvents: 'none', borderRadius: '50%',
      }} />
      <div style={{
        position: 'fixed', bottom: -200, left: -200, width: 500, height: 500,
        background: 'radial-gradient(circle, rgba(56,189,248,0.03) 0%, transparent 70%)',
        pointerEvents: 'none', borderRadius: '50%',
      }} />

      <Header isLive={isLive} />

      {loading && (
        <div style={{
          display: 'flex', flexDirection: 'column', alignItems: 'center',
          justifyContent: 'center', minHeight: '60vh', gap: 16,
        }}>
          <div style={{ animation: 'spin 2s linear infinite', color: '#38bdf8' }}><LuShell size={48} /></div>
          <div style={{ fontSize: 14, color: '#64748b' }}>Connecting to ReefBond API...</div>
          <div style={{ fontSize: 11, color: '#475569' }}>localhost:8000</div>
          <style>{`@keyframes spin { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }`}</style>
        </div>
      )}

      {!loading && error && (
        <div style={{
          display: 'flex', flexDirection: 'column', alignItems: 'center',
          justifyContent: 'center', minHeight: '60vh', gap: 16,
        }}>
          <div style={{ color: '#ef4444' }}><LuTriangleAlert size={48} /></div>
          <div style={{ fontSize: 16, color: '#ef4444', fontWeight: 700 }}>API Not Connected</div>
          <div style={{ fontSize: 12, color: '#64748b', textAlign: 'center', maxWidth: 400, lineHeight: 1.6 }}>
            {error}
          </div>
          <div style={{
            marginTop: 8, padding: '12px 20px', borderRadius: 8,
            background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)',
            fontFamily: "'Space Mono', monospace", fontSize: 12, color: '#38bdf8',
          }}>
            cd reefbond && python reefbond_api.py
          </div>
          <button onClick={loadData} style={{
            marginTop: 12, padding: '10px 24px', borderRadius: 10, border: 'none',
            background: 'linear-gradient(135deg, #38bdf8, #3b82f6)',
            color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer',
            fontFamily: fonts.body,
          }}>
            ↻ Retry Connection
          </button>
        </div>
      )}

      {!loading && !error && stats && (
        <>
          <TabNav activeTab={activeTab} onTabChange={setActiveTab} />

          {activeTab === 'overview' && timeline && (
            <OverviewTab stats={stats} timeline={timeline} prediction={prediction}
              selectedSite={selectedSite} onSelectSite={handleSiteChange} />
          )}
          {activeTab === 'predict' && prediction && (
            <PredictionTab prediction={prediction} />
          )}
          {activeTab === 'contract' && <ContractTab />}
          {activeTab === 'demo' && <DemoTab />}
        </>
      )}

      <div style={{
        marginTop: 24, textAlign: 'center', fontSize: 10, color: '#334155',
        padding: '14px 0', borderTop: '1px solid rgba(255,255,255,0.04)',
      }}>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}><LuShell size={12} /> ReefBond v1.0</span> — Parametric Coral Bleaching Insurance | CryptX 2.0 Hackathon
        | NOAA Coral Reef Watch + XGBoost + Polygon
      </div>
    </div>
  );
}