import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Settings as SettingsIcon, Server, Database, Shield, Bell, RefreshCw, CheckCircle, AlertCircle, Trash2 } from 'lucide-react';

export default function Settings({ currentUser, onLogout }) {
  const [refreshInterval, setRefreshInterval] = useState(
    localStorage.getItem('voltgrid_refresh_interval') || '10'
  );
  const [audioAlerts, setAudioAlerts] = useState(
    localStorage.getItem('voltgrid_audio_alerts') === 'true'
  );
  const [healthStatus, setHealthStatus] = useState({
    gateway: 'CHECKING',
    eureka: 'CHECKING',
    db: 'CONNECTED'
  });
  const [saveMsg, setSaveMsg] = useState(null);

  const checkConnectivity = async () => {
    setHealthStatus(prev => ({ ...prev, gateway: 'CHECKING', eureka: 'CHECKING' }));
    try {
      await axios.get('http://localhost:8080/stations', { timeout: 2000 }).catch(e => {
        if (e.response && (e.response.status === 401 || e.response.status === 200)) return true;
        throw e;
      });
      setHealthStatus(prev => ({ ...prev, gateway: 'ONLINE' }));
    } catch {
      setHealthStatus(prev => ({ ...prev, gateway: 'OFFLINE' }));
    }

    try {
      await axios.get('http://localhost:8761/actuator/health', { timeout: 2000 });
      setHealthStatus(prev => ({ ...prev, eureka: 'ONLINE' }));
    } catch {
      setHealthStatus(prev => ({ ...prev, eureka: 'OFFLINE' }));
    }
  };

  useEffect(() => {
    checkConnectivity();
  }, []);

  const handleSavePreferences = (e) => {
    e.preventDefault();
    localStorage.setItem('voltgrid_refresh_interval', refreshInterval);
    localStorage.setItem('voltgrid_audio_alerts', audioAlerts.toString());
    setSaveMsg('Platform settings saved successfully.');
    setTimeout(() => setSaveMsg(null), 3000);
  };

  const handleClearCache = () => {
    if (window.confirm('Clear cached local state and re-authenticate?')) {
      localStorage.removeItem('ev_user');
      localStorage.removeItem('voltgrid_refresh_interval');
      window.location.href = '/login';
    }
  };

  return (
    <div className="container">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 800, color: '#111827', display: 'flex', alignItems: 'center', gap: 10 }}>
            <SettingsIcon size={26} color="#22c55e" />
            Platform & System Settings
          </h1>
          <p style={{ color: '#6b7280', fontSize: 13, marginTop: 4 }}>
            System configuration, gateway routing status, and local workspace preferences.
          </p>
        </div>
        <button
          onClick={checkConnectivity}
          className="btn btn-secondary"
          style={{ display: 'flex', alignItems: 'center', gap: 6 }}
        >
          <RefreshCw size={14} />
          Check Health
        </button>
      </div>

      {saveMsg && (
        <div className="alert alert-success" style={{ marginBottom: 20 }}>
          {saveMsg}
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(380px, 1fr))', gap: 20, marginBottom: 24 }}>
        {/* SOA Infrastructure Health */}
        <div className="card" style={{ padding: 22 }}>
          <div style={{ fontWeight: 800, fontSize: 16, color: '#111827', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
            <Server size={18} color="#22c55e" />
            Microservice Connectivity Status
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', background: '#f8fafc', borderRadius: 8, border: '1px solid #e2e8f0' }}>
              <div>
                <div style={{ fontWeight: 700, fontSize: 13, color: '#1e293b' }}>Spring Cloud API Gateway</div>
                <div style={{ fontSize: 11, color: '#64748b' }}>http://localhost:8080 (Reactive WebFlux)</div>
              </div>
              <span style={{
                fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 8,
                background: healthStatus.gateway === 'ONLINE' ? '#dcfce7' : '#fee2e2',
                color: healthStatus.gateway === 'ONLINE' ? '#15803d' : '#b91c1c'
              }}>
                {healthStatus.gateway}
              </span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', background: '#f8fafc', borderRadius: 8, border: '1px solid #e2e8f0' }}>
              <div>
                <div style={{ fontWeight: 700, fontSize: 13, color: '#1e293b' }}>Netflix Eureka Service Registry</div>
                <div style={{ fontSize: 11, color: '#64748b' }}>http://localhost:8761 (Heartbeat: 30s)</div>
              </div>
              <span style={{
                fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 8,
                background: healthStatus.eureka === 'ONLINE' ? '#dcfce7' : '#fee2e2',
                color: healthStatus.eureka === 'ONLINE' ? '#15803d' : '#b91c1c'
              }}>
                {healthStatus.eureka}
              </span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', background: '#f8fafc', borderRadius: 8, border: '1px solid #e2e8f0' }}>
              <div>
                <div style={{ fontWeight: 700, fontSize: 13, color: '#1e293b' }}>PostgreSQL Database</div>
                <div style={{ fontSize: 11, color: '#64748b' }}>localhost:5432/ev_charging_db</div>
              </div>
              <span style={{ fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 8, background: '#dcfce7', color: '#15803d' }}>
                ONLINE
              </span>
            </div>
          </div>
        </div>

        {/* Dashboard Preferences Form */}
        <div className="card" style={{ padding: 22 }}>
          <div style={{ fontWeight: 800, fontSize: 16, color: '#111827', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
            <Shield size={18} color="#3b82f6" />
            Dashboard & Polling Preferences
          </div>

          <form onSubmit={handleSavePreferences}>
            <div style={{ marginBottom: 16 }}>
              <label style={{ fontSize: 13, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 6 }}>
                Auto-Refresh Polling Frequency
              </label>
              <select
                value={refreshInterval}
                onChange={(e) => setRefreshInterval(e.target.value)}
                style={{ width: '100%', padding: '8px 12px', borderRadius: 6, border: '1px solid #d1d5db' }}
              >
                <option value="5">Real-time (Every 5 seconds)</option>
                <option value="10">Standard (Every 10 seconds)</option>
                <option value="30">Eco Mode (Every 30 seconds)</option>
              </select>
              <div style={{ fontSize: 11, color: '#9ca3af', marginTop: 4 }}>
                Governs live telemetry refresh rates across active sessions and grid zone monitoring.
              </div>
            </div>

            <div style={{ marginBottom: 20 }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', fontSize: 13, color: '#374151', fontWeight: 600 }}>
                <input
                  type="checkbox"
                  checked={audioAlerts}
                  onChange={(e) => setAudioAlerts(e.target.checked)}
                  style={{ width: 16, height: 16, accentColor: '#22c55e' }}
                />
                Enable Audio Tone on Grid Overload Alert (&gt;90%)
              </label>
            </div>

            <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>
              Save Platform Preferences
            </button>
          </form>
        </div>
      </div>

      {/* Danger Zone */}
      <div className="card" style={{ padding: 22, border: '1px solid #fecaca', background: '#fffaf0' }}>
        <div style={{ fontWeight: 800, fontSize: 15, color: '#b91c1c', marginBottom: 6 }}>
          Local Session & Cache Maintenance
        </div>
        <p style={{ fontSize: 12, color: '#7f1d1d', marginBottom: 14 }}>
          Clear the active JWT token, refresh tokens, and local cache. You will be redirected to the sign-in screen.
        </p>
        <button
          onClick={handleClearCache}
          className="btn"
          style={{ background: '#ef4444', color: 'white', display: 'flex', alignItems: 'center', gap: 6, fontSize: 13 }}
        >
          <Trash2 size={15} />
          Clear Cache & Sign Out
        </button>
      </div>
    </div>
  );
}
