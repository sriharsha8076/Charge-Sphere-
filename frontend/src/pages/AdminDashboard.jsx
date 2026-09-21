import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { stationService, gridService, chargingService, userService } from '../services/api';
import {
  MapPin, Zap, Activity, BarChart2, RefreshCw, Plus, Trash2,
  AlertTriangle, TrendingUp, Users, BatteryCharging, DollarSign,
  CheckCircle, Clock, Plug, Navigation, ArrowRight
} from 'lucide-react';

// ── Gauge SVG ──────────────────────────────────────────
function GridGauge({ pct = 0 }) {
  const r = 70;
  const cx = 90, cy = 90;
  const startAngle = -210;
  const sweepDeg = 240;
  const angle = startAngle + (pct / 100) * sweepDeg;

  const toXY = (deg, radius) => {
    const rad = (deg * Math.PI) / 180;
    return { x: cx + radius * Math.cos(rad), y: cy + radius * Math.sin(rad) };
  };

  const arcPath = (deg1, deg2, ro, ri) => {
    const s = toXY(deg1, ro), e = toXY(deg2, ro);
    const s2 = toXY(deg2, ri), e2 = toXY(deg1, ri);
    const la = deg2 - deg1 > 180 ? 1 : 0;
    return `M ${s.x} ${s.y} A ${ro} ${ro} 0 ${la} 1 ${e.x} ${e.y} L ${s2.x} ${s2.y} A ${ri} ${ri} 0 ${la} 0 ${e2.x} ${e2.y} Z`;
  };

  const color = pct >= 90 ? '#ef4444' : pct >= 70 ? '#f59e0b' : '#22c55e';
  const needleEnd = toXY(angle, 55);

  return (
    <svg width="180" height="120" viewBox="0 0 180 120" className="gauge-svg">
      {/* Background arc */}
      <path d={arcPath(-210, 30, r, r - 14)} fill="#f3f4f6" />
      {/* Colored arc */}
      <path d={arcPath(-210, startAngle + (pct / 100) * sweepDeg, r, r - 14)} fill={color} />
      {/* Tick marks */}
      {[0, 25, 50, 75, 100].map(t => {
        const a = startAngle + (t / 100) * sweepDeg;
        const p1 = toXY(a, r + 2), p2 = toXY(a, r + 8);
        return <line key={t} x1={p1.x} y1={p1.y} x2={p2.x} y2={p2.y} stroke="#d1d5db" strokeWidth="1.5" />;
      })}
      {/* Needle */}
      <line x1={cx} y1={cy} x2={needleEnd.x} y2={needleEnd.y} stroke="#374151" strokeWidth="2.5" strokeLinecap="round" />
      <circle cx={cx} cy={cy} r="5" fill="#374151" />
    </svg>
  );
}

// ── Bar Chart ───────────────────────────────────────────
function BarChart({ data }) {
  const max = Math.max(...data.map(d => d.val), 1);
  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div style={{ display: 'flex', alignItems: 'flex-end', gap: 6, flex: 1, paddingTop: 24, paddingBottom: 0 }}>
        {data.map((d, i) => {
          const h = Math.round((d.val / max) * 130);
          const isLast = i === data.length - 1;
          return (
            <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
              <div style={{ position: 'relative', width: '100%', height: Math.max(h, 4), borderRadius: '4px 4px 0 0',
                background: isLast
                  ? 'linear-gradient(180deg,#15803d,#22c55e)'
                  : 'rgba(34,197,94,0.55)'
              }}>
                {isLast && (
                  <div style={{
                    position: 'absolute', top: -20, left: '50%', transform: 'translateX(-50%)',
                    fontSize: 9, fontWeight: 700, color: '#111827', whiteSpace: 'nowrap',
                    background: '#f0fdf4', border: '1px solid #bbf7d0',
                    borderRadius: 4, padding: '1px 5px'
                  }}>
                    {d.val} kWh
                  </div>
                )}
              </div>
              <div style={{ fontSize: 9, color: '#9ca3af', whiteSpace: 'nowrap' }}>{d.label}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Line Chart (Revenue) ─────────────────────────────────
function LineChart({ data }) {
  if (!data || data.length < 2) {
    return (
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#9ca3af', fontSize: 13 }}>
        No revenue data yet.
      </div>
    );
  }
  const max = Math.max(...data.map(d => d.val), 1);
  const w = 100, h = 100;
  const pts = data.map((d, i) => ({
    x: (i / (data.length - 1)) * w,
    y: h - (d.val / max) * h * 0.85 - 7,
  }));
  const pathD = pts.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
  const areaD = `${pathD} L ${pts[pts.length - 1].x} ${h} L ${pts[0].x} ${h} Z`;

  return (
    <div style={{ flex: 1, position: 'relative' }}>
      <svg viewBox={`0 0 ${w} ${h}`} style={{ width: '100%', height: 140, overflow: 'visible' }} preserveAspectRatio="none">
        <defs>
          <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#8b5cf6" stopOpacity="0.25" />
            <stop offset="100%" stopColor="#8b5cf6" stopOpacity="0" />
          </linearGradient>
        </defs>
        <path d={areaD} fill="url(#revenueGrad)" />
        <path d={pathD} fill="none" stroke="#8b5cf6" strokeWidth="2" strokeLinejoin="round" />
        {pts.map((p, i) => (
          <circle key={i} cx={p.x} cy={p.y} r="2.5" fill="#8b5cf6" />
        ))}
        {pts.length > 0 && (
          <text x={pts[pts.length - 1].x} y={pts[pts.length - 1].y - 6}
            textAnchor="middle" fontSize="6" fill="#7c3aed" fontWeight="700">
            ₹{data[data.length - 1]?.val?.toLocaleString()}
          </text>
        )}
      </svg>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 2 }}>
        {data.map((d, i) => (
          <span key={i} style={{ fontSize: 9, color: '#9ca3af' }}>{d.label}</span>
        ))}
      </div>
    </div>
  );
}

// ── Donut Chart ─────────────────────────────────────────
function DonutChart({ inUse, available, offline, total }) {
  const pctUse = total > 0 ? Math.round((inUse / total) * 100) : 0;
  const pctAvail = total > 0 ? Math.round((available / total) * 100) : 0;
  const pctOff = Math.max(0, 100 - pctUse - pctAvail);

  const segments = [
    { pct: pctUse, color: '#3b82f6' },
    { pct: pctAvail, color: '#22c55e' },
    { pct: pctOff, color: '#ef4444' },
  ];

  let cumulative = 0;
  const r = 52, cx = 70, cy = 70;
  const circumference = 2 * Math.PI * r;

  const arcs = segments.map(s => {
    const len = (s.pct / 100) * circumference;
    const offset = circumference - len;
    const rotation = -90 + (cumulative / 100) * 360;
    cumulative += s.pct;
    return { ...s, len, offset, rotation };
  });

  return (
    <div className="donut-wrap">
      <div className="donut-center-wrap">
        <svg width="140" height="140" viewBox="0 0 140 140">
          <circle cx={cx} cy={cy} r={r} fill="none" stroke="#f3f4f6" strokeWidth="16" />
          {total > 0 && arcs.map((a, i) => (
            <circle key={i} cx={cx} cy={cy} r={r} fill="none"
              stroke={a.color} strokeWidth="16"
              strokeDasharray={`${a.len} ${circumference - a.len}`}
              strokeDashoffset={a.offset}
              transform={`rotate(${a.rotation} ${cx} ${cy})`}
              strokeLinecap="butt"
            />
          ))}
        </svg>
        <div className="donut-center-text">
          <div className="donut-pct">{pctUse}%</div>
          <div className="donut-sub">Utilization<br />Rate</div>
        </div>
      </div>
      <div className="donut-legend">
        {[
          { color: '#3b82f6', label: 'In Use', count: inUse, pct: pctUse },
          { color: '#22c55e', label: 'Available', count: available, pct: pctAvail },
          { color: '#ef4444', label: 'Offline', count: offline, pct: pctOff },
        ].map(item => (
          <div key={item.label} className="donut-legend-item">
            <span className="donut-legend-label">
              <span className="donut-legend-dot" style={{ background: item.color }} />
              {item.label}
            </span>
            <span className="donut-legend-value">{item.count} ({item.pct}%)</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Map Placeholder ──────────────────────────────────────
function StationMap({ stations }) {
  const pins = stations.length > 0 ? stations.slice(0, 8).map((s, i) => ({
    x: 15 + (i % 4) * 22 + Math.sin(i * 1.3) * 8,
    y: 12 + Math.floor(i / 4) * 30 + Math.cos(i * 0.7) * 8,
    available: s.availablePorts > 0,
    offline: s.availablePorts === 0 && s.totalPorts === 0,
    name: s.name,
  })) : [];

  return (
    <div className="map-placeholder">
      <div className="map-grid" />
      <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', opacity: 0.15 }} viewBox="0 0 100 100" preserveAspectRatio="xMidYMid meet">
        <path d="M35,5 Q50,3 60,8 L70,15 Q75,20 72,28 L78,35 Q82,42 78,50 L72,58 Q68,65 62,70 L55,80 Q50,90 45,85 L38,75 Q32,65 28,55 L22,45 Q18,35 22,25 L28,15 Z" fill="#3b82f6" />
      </svg>

      {pins.map((p, i) => (
        <div
          key={i}
          title={p.name || `Station ${i + 1}`}
          style={{
            position: 'absolute',
            left: `${p.x}%`,
            top: `${p.y}%`,
            width: 18,
            height: 18,
            borderRadius: '50% 50% 50% 0',
            transform: 'rotate(-45deg)',
            background: p.offline ? '#ef4444' : p.available ? '#22c55e' : '#f59e0b',
            boxShadow: `0 2px 6px rgba(0,0,0,0.3)`,
            cursor: 'pointer',
            transition: 'transform 0.2s',
          }}
        >
          <div style={{
            width: 8, height: 8,
            background: 'white',
            borderRadius: '50%',
            position: 'absolute',
            top: '50%', left: '50%',
            transform: 'translate(-50%,-50%)',
          }} />
        </div>
      ))}

      {stations.length === 0 && (
        <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#9ca3af', fontSize: 13 }}>
          Loading station data...
        </div>
      )}

      <div style={{ position: 'absolute', left: '38%', top: '22%', fontSize: 9, color: '#1e40af', fontWeight: 600 }}>Hyderabad</div>
      <div style={{ position: 'absolute', left: '56%', top: '30%', fontSize: 9, color: '#1e40af', fontWeight: 600 }}>Vijayawada</div>
      <div style={{ position: 'absolute', left: '40%', top: '58%', fontSize: 9, color: '#1e40af', fontWeight: 600 }}>Bengaluru</div>
      <div style={{ position: 'absolute', left: '56%', top: '68%', fontSize: 9, color: '#1e40af', fontWeight: 600 }}>Chennai</div>

      <div className="map-legend">
        {[
          { color: '#22c55e', label: 'Available' },
          { color: '#f59e0b', label: 'In Use' },
          { color: '#ef4444', label: 'Offline' },
        ].map(l => (
          <div key={l.label} className="map-legend-item">
            <div className="map-dot" style={{ background: l.color }} />
            {l.label}
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Helper: compute last 7 days labels ──────────────────
function getLast7DayLabels() {
  const labels = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    labels.push(d.toLocaleDateString('en-IN', { month: 'short', day: 'numeric' }));
  }
  return labels;
}

function computeDailyData(sessions, field) {
  const labels = getLast7DayLabels();
  const today = new Date();
  const result = labels.map((label, idx) => {
    const targetDate = new Date();
    targetDate.setDate(today.getDate() - (6 - idx));
    const dayStr = targetDate.toDateString();
    const val = sessions
      .filter(s => new Date(s.startTime).toDateString() === dayStr)
      .reduce((acc, s) => acc + (s[field] || 0), 0);
    return { label, val: Math.round(val * 10) / 10 };
  });
  return result;
}

// ══════════════════════════════════════════════════════════
//  MAIN COMPONENT
// ══════════════════════════════════════════════════════════
export default function AdminDashboard({ currentUser }) {
  const [stations, setStations] = useState([]);
  const [gridZones, setGridZones] = useState([]);
  const [gridStatus, setGridStatus] = useState({});
  const [chargingStats, setChargingStats] = useState({});
  const [activeSessions, setActiveSessions] = useState([]);
  const [allSessions, setAllSessions] = useState([]);
  const [userCount, setUserCount] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newStation, setNewStation] = useState({
    name: '', location: '', gridZoneId: 1, pricePerKwh: 14.0, totalPorts: 4
  });

  useEffect(() => {
    fetchData();
    const t = setInterval(fetchData, 10000);
    return () => clearInterval(t);
  }, []);

  const fetchData = async () => {
    try {
      const [stData, gzData, gStatus, cStats, uCount, actSess, allSess] = await Promise.all([
        stationService.getAllStations().catch(() => []),
        gridService.getAllZones().catch(() => []),
        gridService.getOverallStatus().catch(() => ({})),
        chargingService.getChargingStats().catch(() => ({})),
        userService.getUserCount().catch(() => null),
        chargingService.getAllActiveSessions().catch(() => []),
        chargingService.getAllSessions().catch(() => []),
      ]);
      setStations(stData || []);
      setGridZones(gzData || []);
      setGridStatus(gStatus || {});
      setChargingStats(cStats || {});
      setActiveSessions(actSess || []);
      setAllSessions(allSess || []);
      setUserCount(uCount);
    } catch (err) {
      console.error('Dashboard fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteStation = async (id) => {
    if (!window.confirm('Remove this station?')) return;
    try { await stationService.deleteStation(id); fetchData(); }
    catch { alert('Failed to delete station'); }
  };

  const handleCreateStation = async (e) => {
    e.preventDefault();
    try {
      await stationService.createStation(newStation);
      setShowAddModal(false);
      setNewStation({ name: '', location: '', gridZoneId: 1, pricePerKwh: 14.0, totalPorts: 4 });
      fetchData();
    } catch { alert('Failed to create station'); }
  };

  // ── Real derived stats ────────────────────────────────
  const totalStations = stations.length;
  const activeSess = chargingStats.activeSessions ?? activeSessions.length;
  const energyToday = chargingStats.totalEnergyConsumedKwh ?? 0;
  const revenueToday = chargingStats.totalRevenue ?? 0;
  const gridLoadPct = Math.round(gridStatus.averageGridLoadPercentage || 0);
  const gridCapacity = 100; // MW
  const gridCurrent = Math.round(gridCapacity * (gridLoadPct / 100));
  const gridAvail = gridCapacity - gridCurrent;
  const gridColor = gridLoadPct >= 90 ? '#ef4444' : gridLoadPct >= 70 ? '#f59e0b' : '#22c55e';
  const gridStatusLabel = gridLoadPct >= 90 ? 'Overloaded' : gridLoadPct >= 70 ? 'High Load' : 'Stable';
  const gridStatusClass = gridLoadPct >= 90
    ? 'grid-status-pill grid-status-overloaded'
    : gridLoadPct >= 70
      ? 'grid-status-pill grid-status-warning'
      : 'grid-status-pill grid-status-stable';

  const inUsePorts = stations.reduce((s, st) => s + (st.totalPorts - st.availablePorts), 0);
  const availPorts = stations.reduce((s, st) => s + st.availablePorts, 0);
  const totalPortCount = stations.reduce((s, st) => s + st.totalPorts, 0);
  const offlinePorts = Math.max(0, totalPortCount - inUsePorts - availPorts);
  const totalPorts = totalPortCount;

  const gzMap = {};
  gridZones.forEach(z => { gzMap[z.id] = z; });

  // ── Real chart data from all sessions ──────────────────
  const energyChartData = computeDailyData(allSessions, 'energyConsumedKwh');
  const revenueChartData = computeDailyData(allSessions, 'totalCost');

  // ── Real activity feed from recent sessions ────────────
  const activityFeed = [...activeSessions]
    .sort((a, b) => new Date(b.startedAt || b.startTime) - new Date(a.startedAt || a.startTime))
    .slice(0, 5)
    .map(s => {
      const st = stations.find(x => x.id === s.stationId) || {};
      const startedAt = new Date(s.startedAt || s.startTime);
      const diffMin = Math.round((Date.now() - startedAt.getTime()) / 60000);
      const timeAgo = diffMin < 1 ? 'just now' : diffMin < 60 ? `${diffMin} min ago` : `${Math.floor(diffMin / 60)}h ago`;
      return {
        icon: <BatteryCharging size={14} />,
        iconBg: '#dcfce7',
        iconColor: '#16a34a',
        title: 'Charging session active',
        sub: st.name ? `${st.name} • Port #${s.portId}` : `Station #${s.stationId} • Port #${s.portId}`,
        time: timeAgo,
      };
    });

  // If no active sessions, show placeholder message
  const showActivityEmpty = !loading && activityFeed.length === 0;

  // ── Active sessions table rows (real data only) ────────
  const tableRows = activeSessions.slice(0, 6);

  return (
    <div>
      {/* ── KPI Cards ── */}
      <div className="kpi-grid">
        <div className="kpi-card">
          <div className="kpi-icon-wrap" style={{ background: '#dcfce7' }}>
            <MapPin size={22} color="#16a34a" />
          </div>
          <div className="kpi-body">
            <div className="kpi-label">Total Charging Stations</div>
            <div className="kpi-value">{loading ? '—' : totalStations}</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 3 }}>
              <span className="kpi-sub">{loading ? '...' : `${availPorts} ports available`}</span>
            </div>
          </div>
        </div>

        <div className="kpi-card">
          <div className="kpi-icon-wrap" style={{ background: '#dbeafe' }}>
            <BatteryCharging size={22} color="#2563eb" />
          </div>
          <div className="kpi-body">
            <div className="kpi-label">Active Charging Sessions</div>
            <div className="kpi-value">{loading ? '—' : activeSess}</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 3 }}>
              <span className="kpi-sub">Charging right now</span>
            </div>
          </div>
        </div>

        <div className="kpi-card">
          <div className="kpi-icon-wrap" style={{ background: '#fffbeb' }}>
            <Zap size={22} color="#d97706" />
          </div>
          <div className="kpi-body">
            <div className="kpi-label">Total Energy Delivered</div>
            <div className="kpi-value">
              {loading ? '—' : energyToday.toLocaleString()} <span style={{ fontSize: 14, fontWeight: 600 }}>kWh</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 3 }}>
              <span className="kpi-sub">All sessions combined</span>
            </div>
          </div>
        </div>

        <div className="kpi-card">
          <div className="kpi-icon-wrap" style={{ background: '#f5f3ff' }}>
            <span style={{ fontSize: 20, color: '#7c3aed' }}>₹</span>
          </div>
          <div className="kpi-body">
            <div className="kpi-label">Total Revenue</div>
            <div className="kpi-value">₹ {loading ? '—' : revenueToday.toLocaleString()}</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 3 }}>
              <span className="kpi-sub">{userCount !== null ? `${userCount} registered users` : 'All billing combined'}</span>
            </div>
          </div>
        </div>
      </div>

      {/* ── Row 2: Map | Grid Status | Recent Activity ── */}
      <div className="main-grid">
        {/* Map */}
        <div className="card card-pad">
          <div className="section-title">
            <MapPin size={16} color="#3b82f6" />
            Charging Station Locations
          </div>
          <StationMap stations={stations} />
        </div>

        {/* Grid Status */}
        <div className="card card-pad">
          <div className="section-title">
            <Activity size={16} color="#f59e0b" />
            Grid Load Status
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <GridGauge pct={gridLoadPct} />
            <div style={{ textAlign: 'center', marginTop: -4 }}>
              <div style={{ fontSize: 28, fontWeight: 800, color: '#111827', lineHeight: 1 }}>
                {loading ? '—' : `${gridLoadPct}%`}
              </div>
              <div style={{ fontSize: 12, color: '#6b7280', marginTop: 2 }}>Current Grid Load</div>
              <div className={gridStatusClass} style={{ marginTop: 8 }}>
                <span className="pulse-dot" />
                {gridStatusLabel}
              </div>
              <div style={{ fontSize: 11, color: '#6b7280', marginTop: 4 }}>
                {gridLoadPct >= 90
                  ? 'Grid is overloaded! SOA bypassing high-load zones.'
                  : gridLoadPct >= 70
                    ? 'Grid is under high load. Monitor closely.'
                    : 'Grid operating within safe limits'}
              </div>
            </div>
          </div>

          <div className="grid-stats-list" style={{ marginTop: 16 }}>
            <div className="grid-stat-row">
              <span className="gsr-label">Total Capacity</span>
              <span className="gsr-value">{gridCapacity} MW</span>
            </div>
            <div className="grid-stat-row">
              <span className="gsr-label">Current Load</span>
              <span className="gsr-value" style={{ color: gridColor }}>{gridCurrent} MW</span>
            </div>
            <div className="grid-stat-row">
              <span className="gsr-label">Available Capacity</span>
              <span className="gsr-value" style={{ color: '#16a34a' }}>{gridAvail} MW</span>
            </div>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="card card-pad">
          <div className="section-title-row">
            <div className="section-title" style={{ marginBottom: 0 }}>
              <Clock size={16} color="#6b7280" /> Recent Activity
            </div>
            <Link to="/history" className="view-all-link" style={{ textDecoration: 'none' }}>View All →</Link>
          </div>
          <div className="activity-list">
            {loading ? (
              <div style={{ color: '#9ca3af', fontSize: 13, textAlign: 'center', padding: '20px 0' }}>
                Loading activity...
              </div>
            ) : showActivityEmpty ? (
              <div style={{ color: '#9ca3af', fontSize: 13, textAlign: 'center', padding: '20px 0' }}>
                No active sessions right now.
              </div>
            ) : (
              activityFeed.map((item, i) => (
                <div key={i} className="activity-item">
                  <div className="activity-icon" style={{ background: item.iconBg, color: item.iconColor }}>
                    {item.icon}
                  </div>
                  <div className="activity-body">
                    <div className="activity-title">{item.title}</div>
                    <div className="activity-sub">{item.sub}</div>
                  </div>
                  <div className="activity-time">{item.time}</div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* ── Row 3: Donut | Energy Bar Chart | Revenue Line ── */}
      <div className="chart-grid">
        {/* Station Utilization Donut */}
        <div className="card card-pad">
          <div className="section-title">
            <BarChart2 size={16} color="#3b82f6" /> Station Utilization
          </div>
          <DonutChart inUse={inUsePorts} available={availPorts} offline={offlinePorts} total={totalPorts} />
        </div>

        {/* Energy Bar Chart */}
        <div className="card card-pad">
          <div className="section-title">
            <Zap size={16} color="#22c55e" /> Energy Consumption (Last 7 Days)
          </div>
          {loading ? (
            <div style={{ color: '#9ca3af', fontSize: 13, textAlign: 'center', padding: '40px 0' }}>Loading chart...</div>
          ) : (
            <BarChart data={energyChartData} />
          )}
        </div>

        {/* Revenue Line Chart */}
        <div className="card card-pad" style={{ display: 'flex', flexDirection: 'column' }}>
          <div className="section-title">
            <TrendingUp size={16} color="#8b5cf6" /> Revenue Trend (Last 7 Days)
          </div>
          {loading ? (
            <div style={{ color: '#9ca3af', fontSize: 13, textAlign: 'center', padding: '40px 0' }}>Loading chart...</div>
          ) : (
            <LineChart data={revenueChartData} />
          )}
        </div>
      </div>

      {/* ── Row 4: Sessions Table | Quick Actions ── */}
      <div className="bottom-grid">
        {/* Active Sessions */}
        <div className="card card-pad">
          <div className="section-title-row">
            <div className="section-title" style={{ marginBottom: 0 }}>
              <BatteryCharging size={16} color="#2563eb" /> Active Charging Sessions
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <Link to="/history" className="view-all-link" style={{ textDecoration: 'none' }}>View All →</Link>
              <button onClick={() => setShowAddModal(true)} className="btn btn-primary" style={{ padding: '5px 12px', fontSize: 12 }}>
                <Plus size={13} /> Add Station
              </button>
              <button onClick={fetchData} className="btn btn-secondary" style={{ padding: '5px 10px', fontSize: 12 }}>
                <RefreshCw size={12} className={loading ? 'spin' : ''} />
              </button>
            </div>
          </div>
          <div style={{ overflowX: 'auto', marginTop: 4 }}>
            <table className="custom-table">
              <thead>
                <tr>
                  <th>Session ID</th>
                  <th>User</th>
                  <th>Station</th>
                  <th>Port</th>
                  <th>Start Time</th>
                  <th>Energy (kWh)</th>
                  <th>Cost</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={8} style={{ textAlign: 'center', color: '#9ca3af', padding: 28 }}>
                      Loading sessions...
                    </td>
                  </tr>
                ) : tableRows.length === 0 ? (
                  <tr>
                    <td colSpan={8} style={{ textAlign: 'center', color: '#9ca3af', padding: 28 }}>
                      No active charging sessions right now.{' '}
                      <Link to="/smart-charging" style={{ color: '#2563eb', fontWeight: 600 }}>Start one →</Link>
                    </td>
                  </tr>
                ) : (
                  tableRows.map((row, i) => {
                    const st = stations.find(s => s.id === row.stationId) || {};
                    const stName = st.name || `Station #${row.stationId}`;
                    const startT = row.startedAt || row.startTime
                      ? new Date(row.startedAt || row.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                      : '—';
                    return (
                      <tr key={row.id || i}>
                        <td style={{ fontWeight: 600, fontSize: 12, fontFamily: 'monospace', color: '#2563eb' }}>
                          #EV-{row.id}
                        </td>
                        <td>{row.userId || '—'}</td>
                        <td style={{ fontWeight: 600 }}>{stName}</td>
                        <td style={{ color: '#6b7280' }}>Port #{row.portId}</td>
                        <td style={{ color: '#6b7280' }}>{startT}</td>
                        <td style={{ fontWeight: 700 }}>{row.energyConsumedKwh ?? '—'}</td>
                        <td style={{ fontWeight: 700, color: '#d97706' }}>₹{row.totalCost ?? '—'}</td>
                        <td><span className="status-charging">Charging</span></td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Quick Actions */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div className="card card-pad" style={{ paddingBottom: 12 }}>
            <div className="section-title">⚡ Quick Actions</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <Link to="/stations" className="quick-action-btn qa-green">
                <MapPin size={16} /> Find Charging Station
              </Link>
              <Link to="/smart-charging" className="quick-action-btn qa-blue">
                <Zap size={16} /> Start Smart Allocation
              </Link>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <Link to="/history" className="quick-action-btn qa-orange" style={{ fontSize: 12 }}>
                  <span>₹</span> View Bills
                </Link>
                <button
                  onClick={() => setShowAddModal(true)}
                  className="quick-action-btn qa-purple"
                  style={{ fontSize: 12, border: 'none' }}
                >
                  <Plus size={14} /> Add Station
                </button>
              </div>
            </div>
          </div>

          <div className="qa-eco-card">
            <div style={{
              width: 36, height: 36, borderRadius: 10,
              background: '#dcfce7', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
            }}>
              <span style={{ fontSize: 18 }}>🌿</span>
            </div>
            <div>
              <div style={{ fontSize: 13, fontWeight: 800, color: '#14532d', lineHeight: 1.3 }}>Clean Energy. Brighter Future.</div>
              <div style={{ fontSize: 11, color: '#16a34a', marginTop: 2 }}>Join us in building a sustainable EV ecosystem.</div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Add Station Modal ── */}
      {showAddModal && (
        <div style={{
          position: 'fixed', inset: 0,
          background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(3px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 1000, padding: 24
        }}>
          <div className="card card-pad" style={{ width: '100%', maxWidth: 460 }}>
            <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 20 }}>Add New Charging Station</h3>
            <form onSubmit={handleCreateStation} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 5, color: '#374151' }}>Station Name</label>
                <input type="text" className="form-input" required placeholder="e.g. Tadepalli EV Hub"
                  value={newStation.name} onChange={e => setNewStation({ ...newStation, name: e.target.value })} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 5, color: '#374151' }}>Location</label>
                <input type="text" className="form-input" required placeholder="e.g. Tadepalli Bypass, Vijayawada"
                  value={newStation.location} onChange={e => setNewStation({ ...newStation, location: e.target.value })} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 5, color: '#374151' }}>Grid Zone</label>
                  <select className="form-input" value={newStation.gridZoneId}
                    onChange={e => setNewStation({ ...newStation, gridZoneId: parseInt(e.target.value) })}>
                    {gridZones.map(z => <option key={z.id} value={z.id}>{z.zoneName}</option>)}
                    {gridZones.length === 0 && <option value={1}>Zone 1</option>}
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 5, color: '#374151' }}>Total Ports</label>
                  <input type="number" min="2" max="12" className="form-input" required
                    value={newStation.totalPorts} onChange={e => setNewStation({ ...newStation, totalPorts: parseInt(e.target.value) })} />
                </div>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 5, color: '#374151' }}>Price per kWh (₹)</label>
                <input type="number" step="0.5" className="form-input" required
                  value={newStation.pricePerKwh} onChange={e => setNewStation({ ...newStation, pricePerKwh: parseFloat(e.target.value) })} />
              </div>
              <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
                <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>Create Station</button>
                <button type="button" className="btn btn-secondary" onClick={() => setShowAddModal(false)}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
