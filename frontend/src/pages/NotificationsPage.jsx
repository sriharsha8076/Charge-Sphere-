import React, { useState, useEffect } from 'react';
import { notificationService } from '../services/api';
import { Bell, CheckCircle, AlertCircle, Info, RefreshCw, CheckCheck, Filter } from 'lucide-react';

export default function NotificationsPage({ currentUser }) {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('ALL'); // ALL, UNREAD, ALERTS
  const [feedback, setFeedback] = useState(null);

  const fetchNotifs = async () => {
    setLoading(true);
    try {
      let data = [];
      if (currentUser?.role === 'ROLE_ADMIN') {
        data = await notificationService.getAllNotifications();
      } else if (currentUser?.id) {
        data = await notificationService.getUserNotifications(currentUser.id);
      }
      setNotifications(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Failed to load notifications:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifs();
  }, [currentUser]);

  const handleMarkRead = async (id) => {
    try {
      await notificationService.markAsRead(id);
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
    } catch (err) {
      console.error('Error marking as read:', err);
    }
  };

  const handleMarkAllRead = async () => {
    const unread = notifications.filter(n => !n.read);
    for (const n of unread) {
      try {
        await notificationService.markAsRead(n.id);
      } catch (err) {}
    }
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    setFeedback('All notifications marked as read.');
    setTimeout(() => setFeedback(null), 3000);
  };

  const filteredNotifs = notifications.filter(n => {
    if (filter === 'UNREAD') return !n.read;
    if (filter === 'ALERTS') return n.type === 'ALERT' || n.type === 'OVERLOAD';
    return true;
  });

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <div className="container">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 800, color: '#111827', display: 'flex', alignItems: 'center', gap: 10 }}>
            <Bell size={26} color="#22c55e" />
            Platform Notifications & Alerts
          </h1>
          <p style={{ color: '#6b7280', fontSize: 13, marginTop: 4 }}>
            System alerts, grid load warnings, and session milestone confirmations from Notification Service (:8086).
          </p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button
            onClick={fetchNotifs}
            className="btn btn-secondary"
            style={{ display: 'flex', alignItems: 'center', gap: 6 }}
          >
            <RefreshCw size={14} className={loading ? 'spin' : ''} />
            Refresh
          </button>
          {unreadCount > 0 && (
            <button
              onClick={handleMarkAllRead}
              className="btn btn-primary"
              style={{ display: 'flex', alignItems: 'center', gap: 6 }}
            >
              <CheckCheck size={16} />
              Mark All Read
            </button>
          )}
        </div>
      </div>

      {feedback && (
        <div className="alert alert-success" style={{ marginBottom: 20 }}>
          {feedback}
        </div>
      )}

      {/* Filter Tabs */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 20 }}>
        <button
          onClick={() => setFilter('ALL')}
          className={`btn ${filter === 'ALL' ? 'btn-primary' : 'btn-secondary'}`}
          style={{ fontSize: 13 }}
        >
          All ({notifications.length})
        </button>
        <button
          onClick={() => setFilter('UNREAD')}
          className={`btn ${filter === 'UNREAD' ? 'btn-primary' : 'btn-secondary'}`}
          style={{ fontSize: 13 }}
        >
          Unread ({unreadCount})
        </button>
        <button
          onClick={() => setFilter('ALERTS')}
          className={`btn ${filter === 'ALERTS' ? 'btn-primary' : 'btn-secondary'}`}
          style={{ fontSize: 13 }}
        >
          Grid Warnings & Alerts
        </button>
      </div>

      {/* Notifications List Card */}
      <div className="card" style={{ overflow: 'hidden' }}>
        {filteredNotifs.length === 0 ? (
          <div style={{ padding: '48px 24px', textAlign: 'center', color: '#9ca3af' }}>
            <CheckCircle size={40} color="#22c55e" style={{ margin: '0 auto 12px', opacity: 0.6 }} />
            <div style={{ fontSize: 16, fontWeight: 700, color: '#374151' }}>No notifications to display</div>
            <div style={{ fontSize: 13, marginTop: 4 }}>You are completely caught up with all grid and charging alerts.</div>
          </div>
        ) : (
          <div>
            {filteredNotifs.map((n) => {
              const isAlert = n.type === 'ALERT' || n.type === 'OVERLOAD';
              const isSuccess = n.type === 'SUCCESS';
              const iconColor = isAlert ? '#ef4444' : isSuccess ? '#22c55e' : '#3b82f6';
              const IconComp = isAlert ? AlertCircle : isSuccess ? CheckCircle : Info;

              return (
                <div
                  key={n.id}
                  onClick={() => !n.read && handleMarkRead(n.id)}
                  style={{
                    padding: '16px 20px',
                    borderBottom: '1px solid var(--border-color)',
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: 16,
                    background: !n.read ? '#f0fdf4' : 'transparent',
                    cursor: !n.read ? 'pointer' : 'default',
                    transition: 'background 0.15s'
                  }}
                >
                  <div style={{
                    width: 36, height: 36, borderRadius: '50%',
                    background: isAlert ? '#fee2e2' : isSuccess ? '#dcfce7' : '#dbeafe',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 2
                  }}>
                    <IconComp size={18} color={iconColor} />
                  </div>

                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{ fontWeight: 700, fontSize: 14, color: '#111827' }}>
                          {n.title || n.type || 'Platform Notification'}
                        </span>
                        {!n.read && (
                          <span style={{
                            fontSize: 10, fontWeight: 700, background: '#22c55e', color: 'white',
                            padding: '1px 6px', borderRadius: 8
                          }}>
                            NEW
                          </span>
                        )}
                      </div>
                      {n.createdAt && (
                        <span style={{ fontSize: 12, color: '#9ca3af', whiteSpace: 'nowrap' }}>
                          {new Date(n.createdAt).toLocaleString('en-IN', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                        </span>
                      )}
                    </div>

                    <div style={{ color: '#4b5563', fontSize: 13, marginTop: 4, lineHeight: 1.45 }}>
                      {n.message}
                    </div>
                  </div>

                  {!n.read && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleMarkRead(n.id);
                      }}
                      style={{
                        background: 'none', border: '1px solid #bbf7d0', color: '#15803d',
                        padding: '4px 10px', borderRadius: 6, fontSize: 11, fontWeight: 600,
                        cursor: 'pointer', flexShrink: 0
                      }}
                    >
                      Mark read
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
