import React, { useState, useEffect } from 'react';
import { chargingService, stationService } from '../services/api';
import { History, Zap } from 'lucide-react';

export default function ChargingHistory({ currentUser }) {
  const [sessions, setSessions] = useState([]);
  const [stationsMap, setStationsMap] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => { loadHistory(); }, [currentUser]);

  const loadHistory = async () => {
    try {
      const userId = currentUser ? currentUser.id : 1;
      const history = await chargingService.getUserSessions(userId);
      const stations = await stationService.getAllStations();
      const stMap = {};
      if (stations && Array.isArray(stations)) {
        stations.forEach(st => { stMap[st.id] = st; });
      }
      setSessions(history || []);
      setStationsMap(stMap);
    } catch (err) {
      console.error('Error loading history:', err);
    } finally {
      setLoading(false);
    }
  };

  const totalEnergy = sessions.reduce((acc, s) => acc + (s.energyConsumedKwh || 0), 0);
  const totalCost = sessions.reduce((acc, s) => acc + (s.totalCost || 0), 0);
  const activeSessions = sessions.filter(s => s.status === 'ACTIVE').length;

  return (
    <div className="container">
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 28, flexWrap: 'wrap', gap: 16 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 800, color: '#1A202C', display: 'flex', alignItems: 'center', gap: 10 }}>
            <History size={24} color="#2563EB" /> EV Charging History
          </h1>
          <p style={{ color: '#718096', fontSize: 14, marginTop: 4 }}>
            Complete ledger of past and active charging sessions.
          </p>
        </div>

        {/* Summary Stats */}
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          <div className="stat-card" style={{ minWidth: 130, padding: '14px 18px' }}>
            <div className="stat-label">Total Sessions</div>
            <div className="stat-value" style={{ fontSize: 22, color: '#2563EB' }}>{sessions.length}</div>
            <div className="stat-sub">{activeSessions} active</div>
          </div>
          <div className="stat-card" style={{ minWidth: 130, padding: '14px 18px', borderTop: '3px solid #16A34A' }}>
            <div className="stat-label">Total Energy</div>
            <div className="stat-value" style={{ fontSize: 22, color: '#16A34A' }}>{totalEnergy.toFixed(1)}</div>
            <div className="stat-sub">kWh consumed</div>
          </div>
          <div className="stat-card" style={{ minWidth: 130, padding: '14px 18px', borderTop: '3px solid #D97706' }}>
            <div className="stat-label">Total Spent</div>
            <div className="stat-value" style={{ fontSize: 22, color: '#D97706' }}>₹{totalCost.toFixed(0)}</div>
            <div className="stat-sub">incl. all sessions</div>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="glass-card" style={{ textAlign: 'center', padding: 60, color: '#A0AEC0' }}>
          Loading charging history...
        </div>
      ) : sessions.length === 0 ? (
        <div className="glass-card" style={{ textAlign: 'center', padding: '48px 24px' }}>
          <Zap size={44} color="#CBD5E0" style={{ marginBottom: 12 }} />
          <h3 style={{ fontSize: 17, fontWeight: 700, color: '#4A5568', marginBottom: 6 }}>No Sessions Yet</h3>
          <p style={{ color: '#A0AEC0', fontSize: 14 }}>No charging sessions recorded. Start charging to see your history here.</p>
        </div>
      ) : (
        <div className="glass-card">
          <div style={{ overflowX: 'auto' }}>
            <table className="custom-table">
              <thead>
                <tr>
                  <th>Session ID</th>
                  <th>Date &amp; Time</th>
                  <th>Station &amp; Location</th>
                  <th>Port</th>
                  <th>Energy</th>
                  <th>Total Cost</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {sessions.map(s => {
                  const st = stationsMap[s.stationId] || {};
                  return (
                    <tr key={s.id}>
                      <td>
                        <span style={{ fontFamily: 'monospace', fontWeight: 700, color: '#2563EB', fontSize: 13 }}>
                          #EV-{s.id}
                        </span>
                      </td>
                      <td style={{ fontSize: 13, color: '#4A5568' }}>
                        {new Date(s.startTime).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
                      </td>
                      <td>
                        <div style={{ fontWeight: 700, color: '#1A202C', fontSize: 13 }}>
                          {st.name || `Station #${s.stationId}`}
                        </div>
                        <div style={{ fontSize: 12, color: '#A0AEC0' }}>{st.location || 'Vijayawada'}</div>
                      </td>
                      <td style={{ fontSize: 13, color: '#4A5568' }}>Port #{s.portId}</td>
                      <td>
                        <span style={{ fontWeight: 700, color: '#16A34A', fontSize: 14 }}>
                          {s.energyConsumedKwh} kWh
                        </span>
                      </td>
                      <td>
                        <span style={{ fontWeight: 700, color: '#D97706', fontSize: 14 }}>
                          ₹{s.totalCost}
                        </span>
                      </td>
                      <td>
                        <span className={`badge ${s.status === 'ACTIVE' ? 'badge-green' : s.status === 'COMPLETED' ? 'badge-blue' : 'badge-yellow'}`}>
                          {s.status === 'ACTIVE' && <span className="pulse-dot"></span>}
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
      )}
    </div>
  );
}
