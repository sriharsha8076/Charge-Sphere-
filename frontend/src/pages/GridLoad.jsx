import React, { useState, useEffect } from 'react';
import { gridService } from '../services/api';
import { Activity, Zap, AlertTriangle, ShieldCheck, RefreshCw, Plus, Minus, RotateCcw } from 'lucide-react';

export default function GridLoad() {
  const [gridStatus, setGridStatus] = useState(null);
  const [zones, setZones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState({});
  const [feedback, setFeedback] = useState(null);

  const fetchGridData = async () => {
    setLoading(true);
    try {
      const [statusRes, zonesRes] = await Promise.all([
        gridService.getGridStatus().catch(() => null),
        gridService.getGridZones().catch(() => [])
      ]);
      setGridStatus(statusRes);
      setZones(Array.isArray(zonesRes) ? zonesRes : []);
    } catch (err) {
      console.error('Failed to load grid data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGridData();
    const interval = setInterval(fetchGridData, 10000);
    return () => clearInterval(interval);
  }, []);

  const handleAdjustLoad = async (zoneId, deltaKw) => {
    setActionLoading(prev => ({ ...prev, [zoneId]: true }));
    try {
      if (deltaKw > 0) {
        await gridService.addLoad(zoneId, deltaKw);
        setFeedback({ type: 'success', text: `Injected +${deltaKw} kW to Zone #${zoneId}. Grid load updated.` });
      } else {
        await gridService.removeLoad(zoneId, Math.abs(deltaKw));
        setFeedback({ type: 'success', text: `Reduced ${deltaKw} kW from Zone #${zoneId}. Grid load relieved.` });
      }
      fetchGridData();
    } catch (err) {
      setFeedback({ type: 'error', text: `Failed to adjust load: ${err.message}` });
    } finally {
      setActionLoading(prev => ({ ...prev, [zoneId]: false }));
    }
  };

  const handleResetZone = async (zone) => {
    setActionLoading(prev => ({ ...prev, [zone.id]: true }));
    try {
      // Reset to a stable baseline load (e.g. 250 kW or 50% capacity)
      const baselineKw = Math.round(zone.maxCapacityKw * 0.45);
      await gridService.updateZoneLoad(zone.id, baselineKw);
      setFeedback({ type: 'success', text: `Reset Zone #${zone.id} (${zone.name}) to normal baseline of ${baselineKw} kW.` });
      fetchGridData();
    } catch (err) {
      setFeedback({ type: 'error', text: `Failed to reset zone: ${err.message}` });
    } finally {
      setActionLoading(prev => ({ ...prev, [zone.id]: false }));
    }
  };

  return (
    <div className="container">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 800, color: '#111827', display: 'flex', alignItems: 'center', gap: 10 }}>
            <Activity size={26} color="#22c55e" />
            Vijayawada Grid Zones & Load Simulator
          </h1>
          <p style={{ color: '#6b7280', fontSize: 13, marginTop: 4 }}>
            Live power distribution telemetry across 5 municipal grid zones. Stations in zones &gt;90% capacity are automatically bypassed by SOA.
          </p>
        </div>
        <button
          onClick={fetchGridData}
          className="btn btn-secondary"
          style={{ display: 'flex', alignItems: 'center', gap: 6 }}
        >
          <RefreshCw size={14} className={loading ? 'spin' : ''} />
          Refresh
        </button>
      </div>

      {feedback && (
        <div className={`alert alert-${feedback.type}`} style={{ marginBottom: 20 }}>
          {feedback.text}
        </div>
      )}

      {/* Grid Overall Status KPIs */}
      <div className="kpi-grid" style={{ marginBottom: 24 }}>
        <div className="kpi-card">
          <div className="kpi-top">
            <span className="kpi-title">Average Grid Load</span>
            <div className={`kpi-icon-box ${(gridStatus?.averageGridLoadPercentage || 0) >= 80 ? 'red' : 'green'}`}>
              <Activity size={18} />
            </div>
          </div>
          <div className="kpi-value">{loading ? '...' : `${gridStatus?.averageGridLoadPercentage?.toFixed(1) || '0.0'}%`}</div>
          <div className="kpi-sub">
            Status: <strong style={{ color: gridStatus?.gridStatus === 'OVERLOADED' ? '#ef4444' : '#16a34a' }}>{gridStatus?.gridStatus || 'NORMAL'}</strong>
          </div>
        </div>

        <div className="kpi-card">
          <div className="kpi-top">
            <span className="kpi-title">Active Grid Zones</span>
            <div className="kpi-icon-box blue"><Zap size={18} /></div>
          </div>
          <div className="kpi-value">{loading ? '...' : zones.length}</div>
          <div className="kpi-sub">Vijayawada Municipal Electrical Grid</div>
        </div>

        <div className="kpi-card">
          <div className="kpi-top">
            <span className="kpi-title">Overloaded Zones (&gt;90%)</span>
            <div className="kpi-icon-box red"><AlertTriangle size={18} /></div>
          </div>
          <div className="kpi-value">
            {loading ? '...' : zones.filter(z => (z.currentLoadKw / z.maxCapacityKw) >= 0.9).length}
          </div>
          <div className="kpi-sub">Automatically rerouted away from stations</div>
        </div>

        <div className="kpi-card">
          <div className="kpi-top">
            <span className="kpi-title">SOA Bypass Threshold</span>
            <div className="kpi-icon-box orange"><ShieldCheck size={18} /></div>
          </div>
          <div className="kpi-value">90.0%</div>
          <div className="kpi-sub">Load Balancer Service (:8085) Policy</div>
        </div>
      </div>

      {/* 5 Grid Zones Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: 20 }}>
        {zones.map((z) => {
          const loadPct = Math.round((z.currentLoadKw / z.maxCapacityKw) * 100);
          const isOverloaded = loadPct >= 90;
          const isHigh = loadPct >= 70 && !isOverloaded;
          const statusColor = isOverloaded ? '#ef4444' : isHigh ? '#f59e0b' : '#22c55e';
          const statusBg = isOverloaded ? '#fef2f2' : isHigh ? '#fffbeb' : '#f0fdf4';

          return (
            <div key={z.id} className="card" style={{ padding: 22, borderTop: `4px solid ${statusColor}` }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
                <div>
                  <div style={{ fontWeight: 800, fontSize: 17, color: '#111827' }}>{z.name}</div>
                  <div style={{ fontSize: 12, color: '#6b7280' }}>Zone ID: #{z.id} · Vijayawada Sector</div>
                </div>
                <span style={{
                  fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 12,
                  background: statusBg, color: statusColor, textTransform: 'uppercase'
                }}>
                  {isOverloaded ? 'OVERLOADED' : isHigh ? 'HIGH LOAD' : 'NORMAL'}
                </span>
              </div>

              {/* Meter */}
              <div style={{ marginBottom: 16 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 6 }}>
                  <span style={{ color: '#4b5563', fontWeight: 600 }}>Current Load:</span>
                  <span style={{ fontWeight: 800, color: statusColor }}>
                    {z.currentLoadKw} kW / {z.maxCapacityKw} kW ({loadPct}%)
                  </span>
                </div>
                <div style={{ width: '100%', height: 10, background: '#e5e7eb', borderRadius: 6, overflow: 'hidden' }}>
                  <div style={{
                    width: `${Math.min(loadPct, 100)}%`, height: '100%',
                    background: statusColor, borderRadius: 6, transition: 'width 0.4s ease'
                  }} />
                </div>
              </div>

              {/* Overload Notice */}
              {isOverloaded && (
                <div style={{
                  display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px',
                  background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 8,
                  color: '#b91c1c', fontSize: 12, marginBottom: 16
                }}>
                  <AlertTriangle size={16} flexShrink={0} />
                  <span><strong>SOA Rerouting Active:</strong> Stations in this zone are bypassed to prevent transformer failure.</span>
                </div>
              )}

              {/* Simulator Controls */}
              <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: 14 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', marginBottom: 8 }}>
                  Grid Load Simulation Controls
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button
                    onClick={() => handleAdjustLoad(z.id, 50)}
                    disabled={actionLoading[z.id]}
                    className="btn btn-secondary"
                    style={{ flex: 1, padding: '6px 10px', fontSize: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}
                    title="Simulate high EV charging load"
                  >
                    <Plus size={14} color="#ef4444" />
                    +50 kW
                  </button>
                  <button
                    onClick={() => handleAdjustLoad(z.id, -50)}
                    disabled={actionLoading[z.id] || z.currentLoadKw <= 50}
                    className="btn btn-secondary"
                    style={{ flex: 1, padding: '6px 10px', fontSize: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}
                    title="Relieve load"
                  >
                    <Minus size={14} color="#22c55e" />
                    -50 kW
                  </button>
                  <button
                    onClick={() => handleResetZone(z)}
                    disabled={actionLoading[z.id]}
                    className="btn btn-secondary"
                    style={{ padding: '6px 10px', fontSize: 12, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                    title="Reset to normal baseline"
                  >
                    <RotateCcw size={14} />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
