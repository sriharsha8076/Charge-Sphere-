import React, { useState, useEffect, useRef } from 'react';
import { Menu, Bell, ChevronDown, User, Settings, Layers, LogOut, CheckCircle, AlertCircle, Info, ExternalLink } from 'lucide-react';
import { useLocation, Link, useNavigate } from 'react-router-dom';
import { notificationService } from '../services/api';

const PAGE_TITLES = {
  '/': 'Distributed EV Charging Station & Grid Load Balancing Platform',
  '/stations': 'Charging Stations',
  '/smart-charging': 'Smart Load Balancing',
  '/active-session': 'Live Charging Sessions',
  '/history': 'Billing & Payments',
  '/admin': 'Admin Control Center',
  '/users': 'User Management & Accounts',
  '/analytics': 'Energy & Revenue Analytics',
  '/grid-load': 'Vijayawada Grid Zones & Load Monitor',
  '/notifications': 'Notifications & Alerts Inbox',
  '/profile': 'User Profile & Vehicle Registry',
  '/settings': 'Platform & System Settings',
  '/soa-architecture': 'SOA System Architecture & Flow',
};

export default function TopBar({ currentUser, onLogout }) {
  const location = useLocation();
  const navigate = useNavigate();
  const title = PAGE_TITLES[location.pathname] || 'ChargeSphere™ EV Charging Platform';

  const [notifOpen, setNotifOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [loadingNotifs, setLoadingNotifs] = useState(false);

  const notifRef = useRef(null);
  const profileRef = useRef(null);

  const initials = currentUser?.fullName
    ? currentUser.fullName.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()
    : 'U';

  // Load real notifications from backend
  const fetchNotifications = async () => {
    if (!currentUser) return;
    setLoadingNotifs(true);
    try {
      let data = [];
      if (currentUser.role === 'ROLE_ADMIN') {
        data = await notificationService.getAllNotifications();
      } else {
        data = await notificationService.getUserNotifications(currentUser.id);
      }
      setNotifications(Array.isArray(data) ? data : []);
    } catch (err) {
      console.warn('Could not load notifications for TopBar:', err);
    } finally {
      setLoadingNotifs(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 15000);
    return () => clearInterval(interval);
  }, [currentUser]);

  // Handle outside clicks to close dropdowns
  useEffect(() => {
    function handleClickOutside(event) {
      if (notifRef.current && !notifRef.current.contains(event.target)) {
        setNotifOpen(false);
      }
      if (profileRef.current && !profileRef.current.contains(event.target)) {
        setProfileOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleMarkAsRead = async (id, e) => {
    if (e) e.stopPropagation();
    try {
      await notificationService.markAsRead(id);
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
    } catch (err) {
      console.error('Failed to mark notification as read:', err);
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
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <header className="topbar">
      <div className="topbar-left">
        <button className="topbar-menu-btn" title="Toggle menu">
          <Menu size={20} />
        </button>
        <span className="topbar-title">{title}</span>
      </div>

      <div className="topbar-right">
        {/* Notifications Dropdown */}
        <div className="topbar-relative" ref={notifRef}>
          <button
            className="topbar-notif-btn"
            title="Notifications"
            onClick={() => {
              setNotifOpen(!notifOpen);
              setProfileOpen(false);
            }}
          >
            <Bell size={19} />
            {unreadCount > 0 ? (
              <span
                style={{
                  position: 'absolute',
                  top: 2,
                  right: 2,
                  background: '#ef4444',
                  color: 'white',
                  borderRadius: '10px',
                  padding: '1px 5px',
                  fontSize: '10px',
                  fontWeight: 700,
                  lineHeight: '12px'
                }}
              >
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            ) : (
              <span className="notif-badge" style={{ display: 'none' }} />
            )}
          </button>

          {notifOpen && (
            <div className="topbar-dropdown notif-dropdown">
              <div className="notif-dropdown-header">
                <div className="notif-dropdown-title">
                  <Bell size={16} color="#22c55e" />
                  <span>Notifications</span>
                  {unreadCount > 0 && (
                    <span style={{ fontSize: 11, background: '#fee2e2', color: '#b91c1c', padding: '1px 6px', borderRadius: 12, fontWeight: 700 }}>
                      {unreadCount} new
                    </span>
                  )}
                </div>
                {unreadCount > 0 && (
                  <button
                    onClick={handleMarkAllRead}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: '#2563eb',
                      fontSize: 12,
                      fontWeight: 600,
                      cursor: 'pointer'
                    }}
                  >
                    Mark all read
                  </button>
                )}
              </div>

              <div className="notif-dropdown-body">
                {notifications.length === 0 ? (
                  <div style={{ padding: '24px 16px', textAlign: 'center', color: '#9ca3af', fontSize: 13 }}>
                    No notifications at this time.
                  </div>
                ) : (
                  notifications.slice(0, 6).map((n) => (
                    <div
                      key={n.id}
                      className={`notif-dropdown-item ${!n.read ? 'unread' : ''}`}
                      onClick={() => !n.read && handleMarkAsRead(n.id)}
                    >
                      <div style={{ paddingTop: 2 }}>
                        {n.type === 'ALERT' || n.type === 'OVERLOAD' ? (
                          <AlertCircle size={16} color="#ef4444" />
                        ) : n.type === 'SUCCESS' ? (
                          <CheckCircle size={16} color="#22c55e" />
                        ) : (
                          <Info size={16} color="#3b82f6" />
                        )}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 6 }}>
                          <div style={{ fontSize: 12, fontWeight: 700, color: '#1f2937' }}>
                            {n.title || n.type || 'Platform Alert'}
                          </div>
                          {!n.read && (
                            <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#22c55e', flexShrink: 0 }} />
                          )}
                        </div>
                        <div style={{ fontSize: 12, color: '#4b5563', marginTop: 2, lineHeight: 1.35 }}>
                          {n.message}
                        </div>
                        {n.createdAt && (
                          <div style={{ fontSize: 10, color: '#9ca3af', marginTop: 4 }}>
                            {new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </div>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>

              <div className="notif-dropdown-footer">
                <Link
                  to="/notifications"
                  onClick={() => setNotifOpen(false)}
                  style={{ color: '#15803d', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 4 }}
                >
                  View All Notifications <ExternalLink size={12} />
                </Link>
              </div>
            </div>
          )}
        </div>

        {/* User Profile Dropdown */}
        {currentUser && (
          <div className="topbar-relative" ref={profileRef}>
            <div
              className="topbar-user"
              onClick={() => {
                setProfileOpen(!profileOpen);
                setNotifOpen(false);
              }}
            >
              <div className="topbar-avatar">{initials}</div>
              <div className="topbar-user-info">
                <div className="u-name">{currentUser.fullName}</div>
                <div className="u-role">{currentUser.role === 'ROLE_ADMIN' ? 'Admin' : 'EV User'}</div>
              </div>
              <ChevronDown size={14} style={{ color: '#6b7280', marginLeft: 2 }} />
            </div>

            {profileOpen && (
              <div className="topbar-dropdown profile-dropdown">
                <div className="profile-dropdown-header">
                  <div style={{ fontWeight: 700, fontSize: 14, color: '#111827' }}>
                    {currentUser.fullName}
                  </div>
                  <div style={{ fontSize: 12, color: '#6b7280', marginTop: 2 }}>
                    {currentUser.email || `${currentUser.username}@evcharging.com`}
                  </div>
                  <div style={{ marginTop: 6 }}>
                    <span style={{
                      fontSize: 10,
                      fontWeight: 700,
                      background: currentUser.role === 'ROLE_ADMIN' ? '#dbeafe' : '#dcfce7',
                      color: currentUser.role === 'ROLE_ADMIN' ? '#1e40af' : '#15803d',
                      padding: '2px 8px',
                      borderRadius: 10,
                      textTransform: 'uppercase'
                    }}>
                      {currentUser.role === 'ROLE_ADMIN' ? 'Administrator' : 'EV Driver'}
                    </span>
                  </div>
                </div>

                <div style={{ padding: '6px 0' }}>
                  <Link
                    to="/profile"
                    className="profile-dropdown-item"
                    onClick={() => setProfileOpen(false)}
                  >
                    <User size={15} />
                    <span>My Profile</span>
                  </Link>

                  <Link
                    to="/settings"
                    className="profile-dropdown-item"
                    onClick={() => setProfileOpen(false)}
                  >
                    <Settings size={15} />
                    <span>Platform Settings</span>
                  </Link>

                  <Link
                    to="/soa-architecture"
                    className="profile-dropdown-item"
                    onClick={() => setProfileOpen(false)}
                  >
                    <Layers size={15} />
                    <span>SOA Architecture Flow</span>
                  </Link>

                  <div style={{ height: 1, background: '#e5e7eb', margin: '4px 0' }} />

                  <button
                    className="profile-dropdown-item danger"
                    onClick={() => {
                      setProfileOpen(false);
                      if (onLogout) onLogout();
                      else {
                        localStorage.removeItem('ev_user');
                        window.location.href = '/login';
                      }
                    }}
                  >
                    <LogOut size={15} />
                    <span>Sign Out</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </header>
  );
}
