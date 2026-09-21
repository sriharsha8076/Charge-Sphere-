import React, { useState, useEffect } from 'react';
import { chargingService, stationService } from '../services/api';
import { BarChart2, TrendingUp, Zap, DollarSign, BatteryCharging, RefreshCw, Layers } from 'lucide-react';

export default function Analytics() {
  const [sessions, setSessions] = useState([]);
  const [stations, setStations] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      const [allSessions, allStations, chargingStats] = await Promise.all([
        chargingService.getAllSessions().catch(() => []),
        stationService.getAllStations().catch(() => []),
        chargingService.getStats().catch(() => null)
      ]);
      setSessions(Array.isArray(allSessions) ? allSessions : []);
      setStations(Array.isArray(allStations) ? allStations : []);
      setStats(chargingStats);
    } catch (err) {
      console.error('Failed to load analytics:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, []);

  // Compute 7-day energy and revenue aggregation from real sessions
  const last7Days = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().split('T')[0];
    const label = d.toLocaleDateString('en-IN', { month: 'short', day: 'numeric' });
    last7Days.push({ dateStr, label, kwh: 0, revenue: 0, count: 0 });
  }

  sessions.forEach(s => {
    if (!s.startTime) return;
    const sDate = s.startTime.split('T')[0];
    const match = last7Days.find(d => d.dateStr === sDate);
    if (match) {
      match.kwh += Number(s.energyConsumedKwh || 0);
      match.revenue += Number(s.totalCost || 0);
      match.count += 1;
    }
  });

  const maxKwh = Math.max(...last7Days.map(d => d.kwh), 10);
  const maxRevenue = Math.max(...last7Days.map(d => d.revenue), 100);

  // Station utilization
  const totalPorts = stations.reduce((acc, s) => acc + (s.totalPorts || 0), 0);
  const availablePorts = stations.reduce((acc, s) => acc + (s.availablePorts || 0), 0);
  const occupiedPorts = Math.max(0, totalPorts - availablePorts);
  const portUtilPct = totalPorts > 0 ? Math.round((occupiedPorts / totalPorts) * 100) : 0;

  return (
    <div className="container">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 800, color: '#111827', display: 'flex', alignItems: 'center', gap: 10 }}>
            <BarChart2 size={26} color="#22c55e" />
            Energy & Revenue Analytics
          </h1>
          <p style={{ color: '#6b7280', fontSize: 13, marginTop: 4 }}>
            Aggregated telemetry, energy consumption trends, and revenue performance computed from Charging Service.
          </p>
        </div>
        <button
          onClick={fetchAnalytics}
          className="btn btn-secondary"
          style={{ display: 'flex', alignItems: 'center', gap: 6 }}
        >
          <RefreshCw size={14} className={loading ? 'spin' : ''} />
          Refresh
        </button>
      </div>

      {/* KPI Cards */}
      <div className="kpi-grid" style={{ marginBottom: 24 }}>
        <div className="kpi-card">
          <div className="kpi-top">
            <span className="kpi-title">Total Energy Delivered</span>
            <div className="kpi-icon-box green"><Zap size={18} /></div>
          </div>
          <div className="kpi-value">{loading ? '...' : `${stats?.totalEnergyConsumedKwh?.toFixed(1) || '0.0'} kWh`}</div>
          <div className="kpi-sub">Across all Vijayawada stations</div>
        </div>

        <div className="kpi-card">
          <div className="kpi-top">
            <span className="kpi-title">Total Revenue Generated</span>
            <div className="kpi-icon-box blue"><DollarSign size={18} /></div>
          </div>
          <div className="kpi-value">{loading ? '...' : `₹${stats?.totalRevenue?.toLocaleString('en-IN') || '0'}`}</div>
          <div className="kpi-sub">Tariff billings collected</div>
        </div>

        <div className="kpi-card">
          <div className="kpi-top">
            <span className="kpi-title">Completed Sessions</span>
            <div className="kpi-icon-box orange"><BatteryCharging size={18} /></div>
          </div>
          <div className="kpi-value">{loading ? '...' : (stats?.completedSessions ?? sessions.filter(s => s.status === 'COMPLETED').length)}</div>
          <div className="kpi-sub">Historic charging cycles</div>
        </div>

        <div className="kpi-card">
          <div className="kpi-top">
            <span className="kpi-title">Port Utilization Rate</span>
            <div className="kpi-icon-box red"><Layers size={18} /></div>
          </div>
          <div className="kpi-value">{loading ? '...' : `${portUtilPct}%`}</div>
          <div className="kpi-sub">{occupiedPorts} of {totalPorts} ports in active use</div>
        </div>
      </div>

      {/* Chart Grids */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(450px, 1fr))', gap: 20, marginBottom: 24 }}>
        {/* 7-Day Energy Consumption Bar Chart */}
        <div className="card" style={{ padding: 22 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
            <div>
              <div style={{ fontWeight: 700, fontSize: 16, color: '#111827' }}>Daily Energy Consumption</div>
              <div style={{ fontSize: 12, color: '#6b7280' }}>Total kWh delivered per day over the last 7 days</div>
            </div>
            <span style={{ fontSize: 11, fontWeight: 700, background: '#dcfce7', color: '#15803d', padding: '3px 8px', borderRadius: 12 }}>
              Live Telemetry
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'flex-end', height: 200, gap: 12, paddingTop: 30 }}>
            {last7Days.map((d, i) => {
              const h = Math.max(Math.round((d.kwh / maxKwh) * 150), 6);
              return (
                <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
                  <div style={{ position: 'relative', width: '100%', display: 'flex', justifyContent: 'center' }}>
                    {d.kwh > 0 && (
                      <div style={{
                        position: 'absolute', top: -22, fontSize: 10, fontWeight: 700,
                        color: '#166534', background: '#f0fdf4', padding: '1px 5px', borderRadius: 4
                      }}>
                        {d.kwh.toFixed(0)}
                      </div>
                    )}
                    <div style={{
                      width: '80%', height: h, borderRadius: '6px 6px 0 0',
                      background: d.kwh > 0 ? 'linear-gradient(180deg, #22c55e, #16a34a)' : '#e5e7eb'
                    }} />
                  </div>
                  <div style={{ fontSize: 10, color: '#6b7280', whiteSpace: 'nowrap' }}>{d.label}</div>
                </div>
              );
            })}
          </div>
        </div>

        {/* 7-Day Revenue Trend */}
        <div className="card" style={{ padding: 22 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
            <div>
              <div style={{ fontWeight: 700, fontSize: 16, color: '#111827' }}>Daily Revenue Collected</div>
              <div style={{ fontSize: 12, color: '#6b7280' }}>Tariff billings generated per day (₹)</div>
            </div>
            <span style={{ fontSize: 11, fontWeight: 700, background: '#dbeafe', color: '#1e40af', padding: '3px 8px', borderRadius: 12 }}>
              Billing Ledger
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'flex-end', height: 200, gap: 12, paddingTop: 30 }}>
            {last7Days.map((d, i) => {
              const h = Math.max(Math.round((d.revenue / maxRevenue) * 150), 6);
              return (
                <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
                  <div style={{ position: 'relative', width: '100%', display: 'flex', justifyContent: 'center' }}>
                    {d.revenue > 0 && (
                      <div style={{
                        position: 'absolute', top: -22, fontSize: 10, fontWeight: 700,
                        color: '#1e40af', background: '#eff6ff', padding: '1px 5px', borderRadius: 4
                      }}>
                        ₹{d.revenue.toFixed(0)}
                      </div>
                    )}
                    <div style={{
                      width: '80%', height: h, borderRadius: '6px 6px 0 0',
                      background: d.revenue > 0 ? 'linear-gradient(180deg, #3b82f6, #2563eb)' : '#e5e7eb'
                    }} />
                  </div>
                  <div style={{ fontSize: 10, color: '#6b7280', whiteSpace: 'nowrap' }}>{d.label}</div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Session Breakdown Table */}
      <div className="card" style={{ overflow: 'hidden' }}>
        <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border-color)', fontWeight: 700, fontSize: 15 }}>
          Recent Charging Telemetry Log
        </div>
        <div className="table-responsive">
          <table className="table">
            <thead>
              <tr>
                <th>Session ID</th>
                <th>Station</th>
                <th>Port</th>
                <th>Energy (kWh)</th>
                <th>Cost (₹)</th>
                <th>Start Time</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {sessions.slice(0, 10).map((s) => {
                const station = stations.find(st => st.id === s.stationId);
                return (
                  <tr key={s.id}>
                    <td style={{ fontWeight: 700, color: '#111827' }}>#{s.id}</td>
                    <td>{station?.name || `Station #${s.stationId}`}</td>
                    <td>Port #{s.portId}</td>
                    <td style={{ fontWeight: 600, color: '#16a34a' }}>{s.energyConsumedKwh} kWh</td>
                    <td style={{ fontWeight: 600, color: '#1e40af' }}>₹{s.totalCost?.toFixed(2)}</td>
                    <td style={{ fontSize: 12, color: '#6b7280' }}>
                      {s.startTime ? new Date(s.startTime).toLocaleString('en-IN', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—'}
                    </td>
                    <td>
                      <span style={{
                        fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 10,
                        background: s.status === 'ACTIVE' ? '#dcfce7' : '#f3f4f6',
                        color: s.status === 'ACTIVE' ? '#15803d' : '#4b5563'
                      }}>
                        {s.status}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
