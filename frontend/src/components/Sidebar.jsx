import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  LayoutDashboard, MapPin, Zap, BatteryCharging, History,
  Shield, BarChart2, Activity, Bell, User, Settings, LogOut, Layers
} from 'lucide-react';
import ChargeSphereLogo from './ChargeSphereLogo';

export default function Sidebar({ currentUser, onLogout }) {
  const location = useLocation();
  const isActive = (path) => location.pathname === path;

  const navItem = (to, icon, label, exact = false) => {
    const active = exact ? location.pathname === to : location.pathname.startsWith(to);
    return (
      <Link
        to={to}
        className={`sidebar-link${active ? ' active' : ''}`}
        title={label}
      >
        <span className="link-icon">{icon}</span>
        {label}
      </Link>
    );
  };

  const initials = currentUser?.fullName
    ? currentUser.fullName.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()
    : 'U';

  return (
    <aside className="sidebar">
      {/* Brand */}
      <div className="sidebar-brand">
        <Link to="/" style={{ textDecoration: 'none' }}>
          <ChargeSphereLogo layout="horizontal" size="sm" showTagline={true} />
        </Link>
      </div>


      {/* Navigation */}
      <nav className="sidebar-nav">
        <div className="sidebar-section-label">Main</div>

        {currentUser && navItem('/', <LayoutDashboard size={16} />, 'Dashboard', true)}
        {navItem('/stations', <MapPin size={16} />, 'Charging Stations')}

        {currentUser && (
          <>
            {navItem('/active-session', <BatteryCharging size={16} />, 'Live Sessions')}
            {navItem('/history', <History size={16} />, 'Billing & Payments')}
          </>
        )}

        <div className="sidebar-section-label" style={{ marginTop: 8 }}>Management</div>

        {currentUser && navItem('/smart-charging', <Zap size={16} />, 'Smart Charging')}
        {navItem('/users', <User size={16} />, 'Users')}
        {navItem('/analytics', <BarChart2 size={16} />, 'Analytics')}
        {navItem('/grid-load', <Activity size={16} />, 'Grid Load')}
        {navItem('/notifications', <Bell size={16} />, 'Notifications')}
        {navItem('/soa-architecture', <Layers size={16} />, 'SOA Architecture')}

        <div className="sidebar-section-label" style={{ marginTop: 8 }}>Account</div>
        {navItem('/profile', <User size={16} />, 'Profile')}
        {navItem('/settings', <Settings size={16} />, 'Settings')}

        {currentUser?.role === 'ROLE_ADMIN' && (
          <>
            <div className="sidebar-section-label" style={{ marginTop: 8 }}>Admin</div>
            {navItem('/admin', <Shield size={16} />, 'Admin Center')}
          </>
        )}
      </nav>

      {/* Footer */}
      <div className="sidebar-footer">
        {currentUser && (
          <div className="sidebar-user-card">
            <div className="sidebar-avatar">{initials}</div>
            <div className="sidebar-user-info">
              <div className="user-name">{currentUser.fullName}</div>
              <div className="user-role">{currentUser.role === 'ROLE_ADMIN' ? 'Admin' : 'EV User'}</div>
            </div>
          </div>
        )}

        {currentUser ? (
          <button
            onClick={onLogout}
            style={{
              width: '100%',
              background: 'rgba(239,68,68,0.1)',
              border: '1px solid rgba(239,68,68,0.2)',
              color: '#f87171',
              borderRadius: 8,
              padding: '8px 12px',
              fontSize: 12,
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 7,
              justifyContent: 'center',
              fontFamily: 'inherit',
              transition: 'all 0.15s',
            }}
          >
            <LogOut size={13} /> Sign Out
          </button>
        ) : (
          <Link to="/login" style={{
            display: 'flex', alignItems: 'center', gap: 7, justifyContent: 'center',
            background: 'linear-gradient(135deg, #16a34a, #22c55e)',
            color: 'white', borderRadius: 8, padding: '8px 12px',
            fontSize: 12, fontWeight: 700, textDecoration: 'none'
          }}>
            <User size={13} /> Sign In
          </Link>
        )}

        <div className="sidebar-tagline">
          Clean Mobility<br />Smarter Tomorrow<br />with ChargeSphere™
        </div>
      </div>
    </aside>
  );
}
