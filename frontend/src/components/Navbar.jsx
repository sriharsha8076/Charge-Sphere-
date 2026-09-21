import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Zap, Shield, Activity, MapPin, Clock, History, User, LogOut } from 'lucide-react';
import ChargeSphereLogo from './ChargeSphereLogo';

export default function Navbar({ currentUser, onLogout }) {
  const location = useLocation();
  const isActive = (path) => location.pathname === path;

  const navLinkStyle = (path) => ({
    display: 'inline-flex',
    alignItems: 'center',
    gap: 6,
    padding: '7px 13px',
    borderRadius: 8,
    fontSize: 13,
    fontWeight: 500,
    color: isActive(path) ? '#2563EB' : '#4A5568',
    background: isActive(path) ? '#EFF6FF' : 'transparent',
    border: isActive(path) ? '1px solid #BFDBFE' : '1px solid transparent',
    transition: 'all 0.15s ease',
    cursor: 'pointer',
    textDecoration: 'none',
  });

  return (
    <header style={{
      background: '#FFFFFF',
      borderBottom: '1px solid #E2E8F0',
      position: 'sticky',
      top: 0,
      zIndex: 100,
      boxShadow: '0 1px 3px rgba(0,0,0,0.06)'
    }}>
      <div style={{
        maxWidth: 1380,
        margin: '0 auto',
        padding: '0 24px',
        height: 64,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 16
      }}>
        {/* Brand */}
        <Link to="/" style={{ display: 'flex', alignItems: 'center', textDecoration: 'none', flexShrink: 0 }}>
          <ChargeSphereLogo layout="horizontal" size="sm" showTagline={false} />
        </Link>

        {/* Navigation Links */}
        <nav style={{ display: 'flex', alignItems: 'center', gap: 4, flexWrap: 'wrap' }}>
          {currentUser && (
            <>
              <Link to="/" style={navLinkStyle('/')}>
                <Activity size={15} /> Dashboard
              </Link>
            </>
          )}

          <Link to="/stations" style={navLinkStyle('/stations')}>
            <MapPin size={15} /> Stations
          </Link>

          {currentUser && (
            <>
              <Link to="/smart-charging" style={navLinkStyle('/smart-charging')}>
                <Zap size={15} /> Smart Allocator
              </Link>
              <Link to="/active-session" style={navLinkStyle('/active-session')}>
                <Clock size={15} /> Active Session
              </Link>
              <Link to="/history" style={navLinkStyle('/history')}>
                <History size={15} /> History
              </Link>
            </>
          )}

          {currentUser?.role === 'ROLE_ADMIN' && (
            <Link to="/admin" style={{
              ...navLinkStyle('/admin'),
              color: isActive('/admin') ? '#7C3AED' : '#5B21B6',
              background: isActive('/admin') ? '#F5F3FF' : 'transparent',
              border: isActive('/admin') ? '1px solid #DDD6FE' : '1px solid transparent',
            }}>
              <Shield size={15} /> Admin Center
            </Link>
          )}


        </nav>

        {/* User Info / Auth */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
          {currentUser ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                padding: '6px 12px',
                background: '#F8F9FA',
                border: '1px solid #E2E8F0',
                borderRadius: 8
              }}>
                <div style={{
                  width: 28,
                  height: 28,
                  borderRadius: '50%',
                  background: currentUser.role === 'ROLE_ADMIN' ? '#7C3AED' : '#2563EB',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <User size={14} color="#fff" />
                </div>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: '#1A202C' }}>{currentUser.fullName}</div>
                  <div style={{ fontSize: 10, color: '#A0AEC0' }}>
                    {currentUser.role === 'ROLE_ADMIN' ? 'Administrator' : 'EV User'}
                  </div>
                </div>
              </div>
              <button
                onClick={onLogout}
                className="btn btn-secondary"
                title="Logout"
                style={{ padding: '7px 10px', gap: 5 }}
              >
                <LogOut size={14} /> Logout
              </button>
            </div>
          ) : (
            <Link to="/login" className="btn btn-primary" style={{ fontSize: 13 }}>
              <User size={14} /> Login
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
