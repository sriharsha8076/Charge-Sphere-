import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { chargingService, stationService, notificationService } from '../services/api';
import { Zap, MapPin, BatteryCharging, ArrowRight, Bell, CheckCircle, AlertCircle, RefreshCw } from 'lucide-react';

export default function UserDashboard({ currentUser }) {
  const [activeSession, setActiveSession] = useState(null);
  const [sessionStation, setSessionStation] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [markingRead, setMarkingRead] = useState(null);

  useEffect(() => {
    if (!currentUser) return;
    loadDashboardData();
    const interval = setInterval(loadDashboardData, 10000);
    return () => clearInterval(interval);
  }, [currentUser]);

  const loadDashboardData = async () => {
    if (!currentUser) return;
    setError(null);
    try {
      const userId = currentUser.id;
      const session = await chargingService.getActiveUserSession(userId);
      setActiveSession(session);
      if (session && session.stationId) {
        const st = await stationService.getStationById(session.stationId);
        setSessionStation(st);
      } else {
        setSessionStation(null);
      }
      const notifs = await notificationService.getUserNotifications(userId);
      setNotifications(notifs || []);
    } catch (err) {
      console.error('Error loading user dashboard:', err);
      setError('Could not connect to backend services. Make sure all services are running.');
    } finally {
      setLoading(false);
    }
  };

  const handleStopSession = async () => {
    if (!activeSession || !currentUser) return;
    try {
      await chargingService.stopSession({ sessionId: activeSession.id, userId: currentUser.id });
      loadDashboardData();
    } catch (err) {
      alert('Failed to stop charging session. Please try again.');
    }
  };

  const handleMarkRead = async (notifId) => {
    if (markingRead === notifId) return;
    setMarkingRead(notifId);
    try {
      await notificationService.markAsRead(notifId);
      setNotifications(prev =>
        prev.map(n => n.id === notifId ? { ...n, isRead: true } : n)
      );
    } catch (err) {
      console.error('Failed to mark notification as read:', err);
    } finally {
      setMarkingRead(null);
    }
  };

  const unreadCount = notifications.filter(n => !n.isRead).length;

  return (
    <div className="container">
      {/* Welcome Banner */}
      <div style={{
        background: 'linear-gradient(135deg, #2563EB 0%, #0891B2 100%)',
        borderRadius: 16,
        padding: '28px 32px',
        marginBottom: 28,
        color: '#fff',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: 20
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
            <span className="badge" style={{ background: 'rgba(255,255,255,0.2)', color: '#fff', border: '1px solid rgba(255,255,255,0.3)' }}>
              <span className="pulse-dot" style={{ background: '#4ADE80' }}></span> Grid Online
            </span>
            <span className="badge" style={{ background: 'rgba(255,255,255,0.2)', color: '#fff', border: '1px solid rgba(255,255,255,0.3)' }}>
              SOA Smart Balancer
            </span>
          </div>
          <h1 style={{ fontSize: 26, fontWeight: 800, color: '#fff', marginBottom: 4 }}>
            Hello, {currentUser?.fullName || 'EV Driver'} 👋
          </h1>
          <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: 14 }}>
            Monitor active sessions, balance grid load, and find optimal EV stations.
          </p>
        </div>
        <Link to="/smart-charging" style={{
          display: 'inline-flex', alignItems: 'center', gap: 8,
          background: '#fff', color: '#2563EB', padding: '12px 22px',
          borderRadius: 10, fontWeight: 700, fontSize: 14, textDecoration: 'none',
          boxShadow: '0 2px 8px rgba(0,0,0,0.15)', flexShrink: 0
        }}>
          <Zap size={18} /> Smart Allocate Charging
        </Link>
      </div>

      {/* Error Banner */}
      {error && (
        <div style={{
          display: 'flex', alignItems: 'center', gap: 12,
          background: '#FEF2F2', border: '1px solid #FECACA',
          borderRadius: 10, padding: '14px 18px', marginBottom: 24
        }}>
          <AlertCircle size={18} color="#DC2626" style={{ flexShrink: 0 }} />
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#DC2626' }}>Connection Error</div>
            <div style={{ fontSize: 12, color: '#991B1B', marginTop: 2 }}>{error}</div>
          </div>
          <button
            onClick={loadDashboardData}
            style={{
              display: 'flex', alignItems: 'center', gap: 6,
              background: '#DC2626', color: '#fff', border: 'none', borderRadius: 7,
              padding: '7px 14px', fontSize: 12, fontWeight: 600, cursor: 'pointer'
            }}
          >
            <RefreshCw size={12} /> Retry
          </button>
        </div>
      )}

      {/* Active Charging Session */}
      <div style={{ marginBottom: 28 }}>
        <h2 className="section-title">
          <BatteryCharging size={20} color="#2563EB" /> Active Charging Session
        </h2>

        {loading ? (
          <div className="glass-card" style={{ textAlign: 'center', padding: 40, color: '#A0AEC0' }}>
            <RefreshCw size={22} className="spin" style={{ marginBottom: 10 }} />
            <div>Loading session data...</div>
          </div>
        ) : activeSession ? (
          <div className="glass-card" style={{ border: '1.5px solid #BFDBFE', background: '#EFF6FF' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 24, alignItems: 'center' }}>
              <div>
                <div style={{ fontSize: 11, color: '#64748B', textTransform: 'uppercase', fontWeight: 600, marginBottom: 4 }}>Station</div>
                <div style={{ fontSize: 16, fontWeight: 700, color: '#1A202C' }}>
                  {sessionStation ? sessionStation.name : `Station #${activeSession.stationId}`}
                </div>
                <div style={{ fontSize: 13, color: '#2563EB', display: 'flex', alignItems: 'center', gap: 4, marginTop: 4 }}>
                  <MapPin size={13} /> {sessionStation ? sessionStation.location : 'Vijayawada'}
                </div>
              </div>

              <div>
                <div style={{ fontSize: 11, color: '#64748B', textTransform: 'uppercase', fontWeight: 600, marginBottom: 4 }}>Energy Consumed</div>
                <div style={{ fontSize: 22, fontWeight: 800, color: '#16A34A' }}>
                  {activeSession.energyConsumedKwh} <span style={{ fontSize: 13, fontWeight: 600 }}>kWh</span>
                </div>
                <div style={{ fontSize: 12, color: '#718096', marginTop: 2 }}>Port #{activeSession.portId}</div>
              </div>

              <div>
                <div style={{ fontSize: 11, color: '#64748B', textTransform: 'uppercase', fontWeight: 600, marginBottom: 4 }}>Estimated Cost</div>
                <div style={{ fontSize: 22, fontWeight: 800, color: '#D97706' }}>
                  ₹{activeSession.totalCost}
                </div>
                <div style={{ fontSize: 12, color: '#718096', marginTop: 2 }}>
                  ₹{sessionStation ? sessionStation.pricePerKwh : 14.50} / kWh
                </div>
              </div>

              <div>
                <div style={{ marginBottom: 8 }}>
                  <span className="badge badge-green"><span className="pulse-dot"></span> CHARGING ACTIVE</span>
                </div>
                <button onClick={handleStopSession} className="btn btn-danger" style={{ width: '100%', padding: '10px' }}>
                  Stop Charging
                </button>
                <Link to="/active-session" style={{
                  display: 'block', textAlign: 'center', marginTop: 8,
                  fontSize: 12, color: '#2563EB', fontWeight: 600, textDecoration: 'none'
                }}>
                  View Live Telemetry →
                </Link>
              </div>
            </div>
          </div>
        ) : (
          <div className="glass-card" style={{ textAlign: 'center', padding: '40px 24px' }}>
            <BatteryCharging size={44} color="#CBD5E0" style={{ marginBottom: 12 }} />
            <h3 style={{ fontSize: 17, fontWeight: 700, color: '#4A5568', marginBottom: 8 }}>No Active Charging Session</h3>
            <p style={{ color: '#A0AEC0', fontSize: 14, maxWidth: 420, margin: '0 auto 20px' }}>
              Your EV is currently unplugged. Use the SOA Smart Allocator to find the station with lowest grid load.
            </p>
            <Link to="/smart-charging" className="btn btn-primary">
              Find &amp; Reserve Optimal Station <ArrowRight size={16} />
            </Link>
          </div>
        )}
      </div>

      {/* Feature Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 20, marginBottom: 28 }}>
        <Link to="/stations" className="glass-card" style={{ textDecoration: 'none', cursor: 'pointer' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
            <div style={{ width: 42, height: 42, borderRadius: 10, background: '#EFF6FF', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <MapPin size={20} color="#2563EB" />
            </div>
            <div>
              <div style={{ fontSize: 15, fontWeight: 700, color: '#1A202C' }}>Explore Charging Stations</div>
              <div style={{ fontSize: 12, color: '#A0AEC0' }}>View live port availability</div>
            </div>
          </div>
          <p style={{ fontSize: 13, color: '#718096', lineHeight: 1.6 }}>
            Browse stations across Vijayawada with real-time port status and pricing.
          </p>
          <div style={{ marginTop: 12, color: '#2563EB', fontSize: 13, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4 }}>
            View Stations <ArrowRight size={14} />
          </div>
        </Link>

        <Link to="/smart-charging" className="glass-card" style={{ textDecoration: 'none', cursor: 'pointer' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
            <div style={{ width: 42, height: 42, borderRadius: 10, background: '#F0FDF4', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Zap size={20} color="#16A34A" />
            </div>
            <div>
              <div style={{ fontSize: 15, fontWeight: 700, color: '#1A202C' }}>SOA Smart Load Balancing</div>
              <div style={{ fontSize: 12, color: '#A0AEC0' }}>Automated grid load scoring</div>
            </div>
          </div>
          <p style={{ fontSize: 13, color: '#718096', lineHeight: 1.6 }}>
            Calculates <code style={{ color: '#2563EB', background: '#EFF6FF', padding: '1px 5px', borderRadius: 4, fontSize: 12 }}>score = currentLoad / maxLoad</code> to allocate ports without overloading.
          </p>
          <div style={{ marginTop: 12, color: '#16A34A', fontSize: 13, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4 }}>
            Start Allocator <ArrowRight size={14} />
          </div>
        </Link>

        <Link to="/history" className="glass-card" style={{ textDecoration: 'none', cursor: 'pointer' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
            <div style={{ width: 42, height: 42, borderRadius: 10, background: '#FFF7ED', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <span style={{ fontSize: 20 }}>📋</span>
            </div>
            <div>
              <div style={{ fontSize: 15, fontWeight: 700, color: '#1A202C' }}>Charging History</div>
              <div style={{ fontSize: 12, color: '#A0AEC0' }}>All past sessions &amp; bills</div>
            </div>
          </div>
          <p style={{ fontSize: 13, color: '#718096', lineHeight: 1.6 }}>
            View complete ledger of past sessions, energy consumed, and total billing history.
          </p>
          <div style={{ marginTop: 12, color: '#D97706', fontSize: 13, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4 }}>
            View History <ArrowRight size={14} />
          </div>
        </Link>
      </div>

      {/* Notifications */}
      <div className="glass-card">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <h3 className="section-title" style={{ marginBottom: 0 }}>
            <Bell size={18} color="#D97706" /> System Notifications
            {unreadCount > 0 && (
              <span style={{
                marginLeft: 8, background: '#DC2626', color: '#fff',
                fontSize: 11, fontWeight: 700, padding: '2px 7px',
                borderRadius: 10, verticalAlign: 'middle'
              }}>{unreadCount}</span>
            )}
          </h3>
          {unreadCount > 0 && (
            <span style={{ fontSize: 12, color: '#A0AEC0' }}>Click a notification to mark as read</span>
          )}
        </div>

        {loading ? (
          <div style={{ color: '#A0AEC0', fontSize: 14, textAlign: 'center', padding: '20px 0' }}>
            <RefreshCw size={16} className="spin" style={{ marginRight: 6 }} />
            Loading notifications...
          </div>
        ) : notifications.length > 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {notifications.slice(0, 8).map(n => (
              <div
                key={n.id}
                onClick={() => !n.isRead && handleMarkRead(n.id)}
                style={{
                  padding: '12px 16px',
                  borderRadius: 10,
                  background: n.isRead ? '#F8F9FA' : '#EFF6FF',
                  border: `1px solid ${n.isRead ? '#E2E8F0' : '#BFDBFE'}`,
                  display: 'flex',
                  alignItems: 'flex-start',
                  justifyContent: 'space-between',
                  gap: 12,
                  cursor: n.isRead ? 'default' : 'pointer',
                  transition: 'background 0.15s, border-color 0.15s',
                  opacity: markingRead === n.id ? 0.6 : 1,
                }}
              >
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                  {markingRead === n.id ? (
                    <RefreshCw size={16} color="#2563EB" className="spin" style={{ marginTop: 1, flexShrink: 0 }} />
                  ) : n.isRead ? (
                    <CheckCircle size={16} color="#A0AEC0" style={{ marginTop: 1, flexShrink: 0 }} />
                  ) : (
                    <CheckCircle size={16} color="#2563EB" style={{ marginTop: 1, flexShrink: 0 }} />
                  )}
                  <div>
                    <div style={{ fontSize: 13, fontWeight: n.isRead ? 500 : 700, color: '#1A202C' }}>{n.title}</div>
                    <div style={{ fontSize: 12, color: '#718096', marginTop: 2 }}>{n.message}</div>
                  </div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4, flexShrink: 0 }}>
                  <div style={{ fontSize: 11, color: '#A0AEC0', whiteSpace: 'nowrap' }}>
                    {new Date(n.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                  {!n.isRead && (
                    <span style={{
                      fontSize: 9, fontWeight: 700, background: '#2563EB', color: '#fff',
                      padding: '1px 5px', borderRadius: 4
                    }}>NEW</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div style={{ color: '#A0AEC0', fontSize: 14, textAlign: 'center', padding: '20px 0' }}>
            No recent notifications.
          </div>
        )}
      </div>
    </div>
  );
}
