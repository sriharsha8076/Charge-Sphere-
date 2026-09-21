import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { chargingService, stationService } from '../services/api';
import { BatteryCharging, Clock, Zap, MapPin, ArrowLeft } from 'lucide-react';

export default function ChargingSessionPage({ currentUser }) {
  const [session, setSession] = useState(null);
  const [station, setStation] = useState(null);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [loading, setLoading] = useState(true);
  const [stopping, setStopping] = useState(false);
  const navigate = useNavigate();

  useEffect(() => { fetchSessionData(); }, [currentUser]);

  useEffect(() => {
    let timer;
    if (session && session.status === 'ACTIVE') {
      timer = setInterval(() => { setElapsedSeconds(prev => prev + 1); }, 1000);
    }
    return () => clearInterval(timer);
  }, [session]);

  const fetchSessionData = async () => {
    try {
      const userId = currentUser ? currentUser.id : 1;
      const s = await chargingService.getActiveUserSession(userId);
      setSession(s);
      if (s && s.stationId) {
        const st = await stationService.getStationById(s.stationId);
        setStation(st);
        const start = new Date(s.startTime).getTime();
        const now = new Date().getTime();
        setElapsedSeconds(Math.max(0, Math.floor((now - start) / 1000)));
      }
    } catch (err) {
      console.error('Error fetching charging session:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleStopCharging = async () => {
    if (!session) return;
    setStopping(true);
    try {
      await chargingService.stopSession({ sessionId: session.id, userId: currentUser?.id || 1 });
      navigate('/history');
    } catch (err) {
      alert('Failed to stop charging session');
    } finally {
      setStopping(false);
    }
  };

  const formatTime = (totalSecs) => {
    const hrs = Math.floor(totalSecs / 3600);
    const mins = Math.floor((totalSecs % 3600) / 60);
    const secs = totalSecs % 60;
    return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  if (loading) {
    return (
      <div className="container" style={{ textAlign: 'center', padding: 60, color: '#A0AEC0' }}>
        Loading live session data...
      </div>
    );
  }

  if (!session) {
    return (
      <div className="container" style={{ maxWidth: 560, paddingTop: 40 }}>
        <div className="glass-card" style={{ textAlign: 'center', padding: '48px 24px' }}>
          <BatteryCharging size={52} color="#CBD5E0" style={{ marginBottom: 16 }} />
          <h2 style={{ fontSize: 20, fontWeight: 700, color: '#1A202C', marginBottom: 8 }}>No Active Session</h2>
          <p style={{ color: '#A0AEC0', fontSize: 14, margin: '0 auto 24px', maxWidth: 360 }}>
            You do not have any ongoing EV charging sessions. Use the SOA Smart Allocator to start.
          </p>
          <button onClick={() => navigate('/smart-charging')} className="btn btn-primary">
            Start Smart Allocation <Zap size={16} />
          </button>
        </div>
      </div>
    );
  }

  const targetEnergy = session.energyConsumedKwh || 25.0;
  const currentEnergy = Math.min(targetEnergy, (targetEnergy * (elapsedSeconds / 1800))).toFixed(2);
  const currentPct = Math.min(100, Math.round((currentEnergy / targetEnergy) * 100));
  const currentCost = (currentEnergy * (station ? station.pricePerKwh : 14.50)).toFixed(2);

  return (
    <div className="container" style={{ maxWidth: 860 }}>
      <button onClick={() => navigate('/')} className="btn btn-secondary" style={{ marginBottom: 20, fontSize: 13 }}>
        <ArrowLeft size={14} /> Back to Dashboard
      </button>

      {/* Main Session Card */}
      <div className="glass-card" style={{ border: '1.5px solid #BFDBFE' }}>
        {/* Session Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
          <div>
            <div style={{ marginBottom: 8 }}>
              <span className="badge badge-green">
                <span className="pulse-dot"></span> LIVE FAST CHARGING
              </span>
            </div>
            <h1 style={{ fontSize: 22, fontWeight: 800, color: '#1A202C' }}>
              {station ? station.name : `Station #${session.stationId}`}
            </h1>
            <div style={{ fontSize: 13, color: '#2563EB', display: 'flex', alignItems: 'center', gap: 4, marginTop: 4 }}>
              <MapPin size={13} /> {station ? station.location : 'Vijayawada'} &nbsp;|&nbsp; Port #{session.portId}
            </div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: 11, color: '#A0AEC0', textTransform: 'uppercase', marginBottom: 3 }}>Session ID</div>
            <div style={{ fontSize: 15, fontWeight: 700, color: '#2563EB', fontFamily: 'monospace' }}>
              #EV-{session.id}
            </div>
          </div>
        </div>

        {/* Progress Bar (visual, simpler than dark ring) */}
        <div style={{ background: '#F8F9FA', borderRadius: 14, padding: '20px 24px', marginBottom: 24, border: '1px solid #E2E8F0' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Zap size={18} color="#2563EB" />
              <span style={{ fontWeight: 700, color: '#1A202C', fontSize: 15 }}>Charging Progress</span>
            </div>
            <span style={{ fontSize: 22, fontWeight: 800, color: '#2563EB' }}>{currentPct}%</span>
          </div>
          <div className="progress-bar-track" style={{ height: 16, borderRadius: 8 }}>
            <div className="progress-bar-fill" style={{
              width: `${currentPct}%`,
              background: 'linear-gradient(90deg, #2563EB 0%, #0891B2 100%)',
              borderRadius: 8
            }} />
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: '#A0AEC0', marginTop: 6 }}>
            <span>{currentEnergy} kWh delivered</span>
            <span>Target: {targetEnergy} kWh</span>
          </div>
        </div>

        {/* Metrics Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: 14, marginBottom: 24 }}>
          <div style={{ background: '#F8F9FA', padding: 16, borderRadius: 12, border: '1px solid #E2E8F0', textAlign: 'center' }}>
            <Clock size={20} color="#7C3AED" style={{ marginBottom: 6 }} />
            <div style={{ fontSize: 11, color: '#A0AEC0', textTransform: 'uppercase', marginBottom: 3 }}>Duration</div>
            <div style={{ fontSize: 20, fontWeight: 800, color: '#1A202C', fontFamily: 'monospace' }}>
              {formatTime(elapsedSeconds)}
            </div>
          </div>
          <div style={{ background: '#F0FDF4', padding: 16, borderRadius: 12, border: '1px solid #BBF7D0', textAlign: 'center' }}>
            <Zap size={20} color="#16A34A" style={{ marginBottom: 6 }} />
            <div style={{ fontSize: 11, color: '#A0AEC0', textTransform: 'uppercase', marginBottom: 3 }}>Energy Delivered</div>
            <div style={{ fontSize: 18, fontWeight: 800, color: '#16A34A' }}>
              {currentEnergy} <span style={{ fontSize: 12 }}>kWh</span>
            </div>
          </div>
          <div style={{ background: '#FFFBEB', padding: 16, borderRadius: 12, border: '1px solid #FDE68A', textAlign: 'center' }}>
            <div style={{ fontSize: 20, color: '#D97706', fontWeight: 800, marginBottom: 6 }}>₹</div>
            <div style={{ fontSize: 11, color: '#A0AEC0', textTransform: 'uppercase', marginBottom: 3 }}>Current Cost</div>
            <div style={{ fontSize: 18, fontWeight: 800, color: '#D97706' }}>₹{currentCost}</div>
          </div>
          <div style={{ background: '#EFF6FF', padding: 16, borderRadius: 12, border: '1px solid #BFDBFE', textAlign: 'center' }}>
            <BatteryCharging size={20} color="#2563EB" style={{ marginBottom: 6 }} />
            <div style={{ fontSize: 11, color: '#A0AEC0', textTransform: 'uppercase', marginBottom: 3 }}>Tariff Rate</div>
            <div style={{ fontSize: 18, fontWeight: 800, color: '#2563EB' }}>
              ₹{station ? station.pricePerKwh : 14.50}<span style={{ fontSize: 11 }}>/kWh</span>
            </div>
          </div>
        </div>

        {/* Stop Button */}
        <button
          onClick={handleStopCharging}
          className="btn btn-danger"
          style={{ width: '100%', padding: '14px', fontSize: 15 }}
          disabled={stopping}
        >
          {stopping ? 'Stopping Session...' : 'Stop Charging & Complete Session'}
        </button>
      </div>
    </div>
  );
}
