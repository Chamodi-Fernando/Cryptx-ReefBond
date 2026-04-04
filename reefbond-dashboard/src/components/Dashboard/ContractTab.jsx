import React, { useState, useEffect } from 'react';
import { LuSatellite, LuBrain, LuLink, LuCoins, LuZap, LuClipboardList, LuCircleCheck, LuMapPin } from 'react-icons/lu';
import { FaMask } from 'react-icons/fa';
import { cardStyle, fonts } from '../../styles/theme';
import { getOperators, registerOperator, deleteOperator, recordPayout, getPayoutEvents } from '../../services/api';

const LOCATIONS = ['hikkaduwa', 'mirissa', 'unawatuna', 'galle', 'weligama', 'trincomalee', 'pigeon_island', 'nilaveli', 'batticaloa'];

const FLOW_STEPS = [
  { title: 'NOAA Satellite', desc: 'SST data collected', icon: <LuSatellite size={24} />, color: '#38bdf8' },
  { title: 'AI Prediction', desc: 'XGBoost + SHAP', icon: <LuBrain size={24} />, color: '#8b5cf6' },
  { title: 'Oracle Push', desc: 'DHW → On-chain', icon: <LuLink size={24} />, color: '#f59e0b' },
  { title: 'Auto Payout', desc: 'No claim needed!', icon: <LuCoins size={24} />, color: '#10b981' },
];

export default function ContractTab() {
  const [operators, setOperators] = useState([]);
  const [events, setEvents] = useState([]);
  const [name, setName] = useState('');
  const [location, setLocation] = useState('hikkaduwa');
  const [wallet, setWallet] = useState('');
  const [payoutLoc, setPayoutLoc] = useState('hikkaduwa');
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState('');

  const loadData = async () => {
    const [opsRes, evtsRes] = await Promise.all([getOperators(), getPayoutEvents()]);
    if (opsRes.ok) setOperators(opsRes.data);
    if (evtsRes.ok) setEvents(evtsRes.data);
  };

  useEffect(() => { loadData(); }, []);

  const handleRegister = async () => {
    if (!name) { setMsg('Enter operator name!'); return; }
    setLoading(true); setMsg('');
    const res = await registerOperator(name, location, wallet);
    if (res.ok) {
      const charged = Number(res?.data?.premium_paid ?? 0).toFixed(3);
      setMsg(`Registered: ${name} at ${location}. Premium charged: ${charged} ETH`);
      setName(''); setWallet('');
      loadData();
    } else { setMsg('Registration failed!'); }
    setLoading(false);
  };

  const handleDelete = async (id, opName) => {
    if (!window.confirm(`Delete ${opName}?`)) return;
    await deleteOperator(id);
    loadData();
  };

  const handlePayout = async () => {
    setLoading(true); setMsg('');
    const res = await recordPayout(payoutLoc);
    if (res.ok) {
      setMsg(`Payout triggered at ${payoutLoc}! ${res.data.operators_paid} operator(s) paid.`);
      loadData();
    } else {
      const detail = res?.data?.detail ? ` (${res.data.detail})` : '';
      setMsg(`Payout failed — no operators at this location?${detail}`);
    }
    setLoading(false);
  };

  const inputStyle = {
    padding: '10px 12px', borderRadius: 8, border: '1px solid rgba(255,255,255,0.1)',
    background: 'rgba(255,255,255,0.05)', color: '#e2e8f0', fontSize: 13,
    fontFamily: fonts.body, outline: 'none', width: '100%',
  };

  const btnStyle = (color) => ({
    padding: '10px 20px', borderRadius: 8, border: 'none', cursor: 'pointer',
    background: color, color: '#fff', fontSize: 13, fontWeight: 700,
    fontFamily: fonts.body, opacity: loading ? 0.6 : 1, whiteSpace: 'nowrap',
  });

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>

      {/* Flow diagram */}
      <div style={{ ...cardStyle, gridColumn: '1 / -1', padding: 20 }}>
        <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 16, color: '#e2e8f0', display: 'flex', alignItems: 'center', gap: 8 }}><LuLink size={16} /> Smart Contract Payout Flow</div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 6 }}>
          {FLOW_STEPS.map((s, i) => (
            <React.Fragment key={i}>
              <div style={{ textAlign: 'center', flex: 1, padding: 14, borderRadius: 12, background: `${s.color}08`, border: `1px solid ${s.color}25` }}>
                <div style={{ marginBottom: 4, display: 'flex', justifyContent: 'center', color: s.color }}>{s.icon}</div>
                <div style={{ fontSize: 11, fontWeight: 700, color: s.color }}>{s.title}</div>
                <div style={{ fontSize: 9, color: '#64748b', marginTop: 2 }}>{s.desc}</div>
              </div>
              {i < FLOW_STEPS.length - 1 && <div style={{ color: '#334155', fontSize: 18 }}>→</div>}
            </React.Fragment>
          ))}
        </div>
      </div>

      {/* Register Operator */}
      <div style={{ ...cardStyle, padding: 20 }}>
        <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 14, color: '#e2e8f0', display: 'flex', alignItems: 'center', gap: 8 }}><FaMask size={16} /> Register Dive Operator</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <input style={inputStyle} placeholder="Operator Name (e.g. Chandana Dive Center)" value={name} onChange={e => setName(e.target.value)} />
          <select style={{ ...inputStyle, cursor: 'pointer' }} value={location} onChange={e => setLocation(e.target.value)}>
            {LOCATIONS.map(l => <option key={l} value={l} style={{ background: '#1e293b' }}>{l.charAt(0).toUpperCase() + l.slice(1).replace('_', ' ')}</option>)}
          </select>
          <input style={inputStyle} placeholder="Wallet Address (optional)" value={wallet} onChange={e => setWallet(e.target.value)} />
          <button style={btnStyle('#3b82f6')} onClick={handleRegister} disabled={loading}>
            {loading ? 'Registering...' : '+ Register Operator'}
          </button>
        </div>
        {msg && <div style={{ marginTop: 10, padding: '8px 12px', borderRadius: 6, background: msg.includes('fail') ? 'rgba(239,68,68,0.1)' : 'rgba(16,185,129,0.1)', color: msg.includes('fail') ? '#ef4444' : '#10b981', fontSize: 12 }}>{msg}</div>}
      </div>

      {/* Trigger Payout */}
      <div style={{ ...cardStyle, padding: 20 }}>
        <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 14, color: '#e2e8f0', display: 'flex', alignItems: 'center', gap: 8 }}><LuZap size={16} /> Trigger Bleaching Payout</div>
        <div style={{ fontSize: 11, color: '#64748b', marginBottom: 12 }}>
          Simulate oracle reporting DHW threshold crossed → auto-pay all operators at location
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <select style={{ ...inputStyle, flex: 1 }} value={payoutLoc} onChange={e => setPayoutLoc(e.target.value)}>
            {LOCATIONS.map(l => <option key={l} value={l} style={{ background: '#1e293b' }}>{l.charAt(0).toUpperCase() + l.slice(1).replace('_', ' ')}</option>)}
          </select>
          <button style={btnStyle('linear-gradient(135deg, #f59e0b, #ef4444)')} onClick={handlePayout} disabled={loading}>
            <LuZap size={14} style={{ verticalAlign: 'middle', marginRight: 4 }} /> Trigger
          </button>
        </div>

        {/* Stats summary */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginTop: 16 }}>
          <div style={{ padding: 10, borderRadius: 8, background: 'rgba(56,189,248,0.05)', border: '1px solid rgba(56,189,248,0.15)', textAlign: 'center' }}>
            <div style={{ fontSize: 20, fontWeight: 800, color: '#38bdf8', fontFamily: fonts.heading }}>{operators.length}</div>
            <div style={{ fontSize: 9, color: '#64748b', textTransform: 'uppercase' }}>Operators</div>
          </div>
          <div style={{ padding: 10, borderRadius: 8, background: 'rgba(16,185,129,0.05)', border: '1px solid rgba(16,185,129,0.15)', textAlign: 'center' }}>
            <div style={{ fontSize: 20, fontWeight: 800, color: '#10b981', fontFamily: fonts.heading }}>{events.length}</div>
            <div style={{ fontSize: 9, color: '#64748b', textTransform: 'uppercase' }}>Payouts</div>
          </div>
        </div>
      </div>

      {/* Registered Operators List */}
      <div style={{ ...cardStyle, gridColumn: '1 / -1', padding: 20 }}>
        <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 14, color: '#e2e8f0', display: 'flex', alignItems: 'center', gap: 8 }}>
          <LuClipboardList size={16} /> Registered Operators
          <span style={{ fontSize: 11, color: '#64748b', fontWeight: 400 }}>({operators.length} total)</span>
        </div>

        {operators.length === 0 && (
          <div style={{ color: '#475569', fontSize: 12, textAlign: 'center', padding: 20 }}>
            No operators registered yet. Use the form above to register.
          </div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {operators.map(op => (
            <div key={op.id} style={{
              display: 'grid', gridTemplateColumns: '2fr 1.5fr 1fr 1fr auto', gap: 12, alignItems: 'center',
              padding: '12px 14px', borderRadius: 10,
              background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', fontSize: 12,
            }}>
              <div>
                <div style={{ fontWeight: 700, color: '#e2e8f0' }}>{op.name}</div>
                <div style={{ fontSize: 10, color: '#475569', marginTop: 2 }}>ID: {op.id}</div>
              </div>
              <div>
                <div style={{ color: '#38bdf8', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4 }}><LuMapPin size={12} /> {op.location}</div>
              </div>
              <div>
                <div style={{ fontSize: 10, color: '#64748b' }}>Premium</div>
                <div style={{ color: '#f59e0b', fontWeight: 600 }}>{Number(op.premium_paid || 0).toFixed(3)} ETH</div>
              </div>
              <div>
                <div style={{ fontSize: 10, color: '#64748b' }}>Payouts</div>
                <div style={{ color: '#10b981', fontWeight: 600 }}>{op.total_payouts.toFixed(2)} ETH</div>
              </div>
              <button onClick={() => handleDelete(op.id, op.name)} style={{
                padding: '6px 10px', borderRadius: 6, border: '1px solid rgba(239,68,68,0.3)',
                background: 'rgba(239,68,68,0.1)', color: '#ef4444', fontSize: 10, cursor: 'pointer',
                fontWeight: 700, minWidth: 62,
              }}>Delete</button>
            </div>
          ))}
        </div>
      </div>

      {/* Payout Events */}
      <div style={{ ...cardStyle, gridColumn: '1 / -1', padding: 20 }}>
        <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 14, color: '#e2e8f0', display: 'flex', alignItems: 'center', gap: 8 }}>
          <LuCircleCheck size={16} /> Payout Events
          <span style={{ fontSize: 11, color: '#64748b', fontWeight: 400 }}>({events.length} events)</span>
        </div>

        {events.length === 0 && (
          <div style={{ color: '#475569', fontSize: 12, textAlign: 'center', padding: 20 }}>
            No payout events yet. Register operators, then trigger a bleaching event.
          </div>
        )}

        {events.map((evt, i) => (
          <div key={evt.id || i} style={{
            display: 'grid', gridTemplateColumns: '2fr 1.5fr 1fr 1fr 1fr', gap: 10, fontSize: 11,
            padding: '10px 12px', borderRadius: 8, marginBottom: 6,
            background: 'rgba(16,185,129,0.04)', border: '1px solid rgba(16,185,129,0.12)',
          }}>
            <div><span style={{ color: '#64748b' }}>Operator</span><br /><b style={{ color: '#e2e8f0' }}>{evt.operator_name}</b></div>
            <div><span style={{ color: '#64748b' }}>Location</span><br /><b style={{ color: '#38bdf8' }}>{evt.location}</b></div>
            <div><span style={{ color: '#64748b' }}>DHW</span><br /><b style={{ color: '#ef4444' }}>{evt.dhw_value} °C-wk</b></div>
            <div><span style={{ color: '#64748b' }}>Payout</span><br /><b style={{ color: '#10b981' }}>{evt.payout_amount} ETH</b></div>
            <div><span style={{ color: '#64748b' }}>TX</span><br /><span style={{ color: '#8b5cf6', fontSize: 9, wordBreak: 'break-all' }}>{evt.tx_hash?.slice(0, 14)}...</span></div>
          </div>
        ))}
      </div>

      {/* Contract details */}
      <div style={{ ...cardStyle, gridColumn: '1 / -1', padding: 18 }}>
        <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 12, color: '#e2e8f0', display: 'flex', alignItems: 'center', gap: 8 }}><LuClipboardList size={16} /> Contract Details</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, fontSize: 11 }}>
          {[
            ['Network', 'Polygon Amoy Testnet', '#8b5cf6'],
            ['DHW Threshold', '4.0 °C-weeks', '#f59e0b'],
            ['AI Model Accuracy', '89.87%', '#10b981'],
          ].map(([label, value, color]) => (
            <div key={label} style={{ padding: 10, borderRadius: 8, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)' }}>
              <div style={{ color: '#64748b', fontSize: 9, textTransform: 'uppercase', letterSpacing: '1px' }}>{label}</div>
              <div style={{ fontWeight: 700, color, marginTop: 4 }}>{value}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}