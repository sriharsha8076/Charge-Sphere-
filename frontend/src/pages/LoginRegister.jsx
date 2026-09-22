import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { userService } from '../services/api';
import { Zap, Shield, User, ArrowRight } from 'lucide-react';
import ChargeSphereLogo from '../components/ChargeSphereLogo';

export default function LoginRegister({ onLoginSuccess }) {
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({
    username: '', email: '', password: '', fullName: '', role: 'ROLE_USER'
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [backendOffline, setBackendOffline] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleOfflineLogin = (role) => {
    const isAdmin = role === 'admin' || formData.role === 'ROLE_ADMIN' || formData.username.toLowerCase() === 'admin';
    const mockUser = {
      id: isAdmin ? 2 : 1,
      username: isAdmin ? 'admin' : 'user',
      email: isAdmin ? 'admin@evcharging.com' : 'user@evcharging.com',
      fullName: isAdmin ? 'Grid Administrator' : 'Ravi Kumar',
      role: isAdmin ? 'ROLE_ADMIN' : 'ROLE_USER',
      token: 'demo-offline-jwt-token'
    };
    onLoginSuccess(mockUser);
    navigate(isAdmin ? '/admin' : '/');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setBackendOffline(false);
    setLoading(true);
    try {
      let res;
      if (isLogin) {
        res = await userService.login({ username: formData.username, password: formData.password });
      } else {
        res = await userService.register(formData);
      }
      onLoginSuccess(res);
      navigate(res.role === 'ROLE_ADMIN' ? '/admin' : '/');
    } catch (err) {
      const errMsg = err.response?.data?.message || err.response?.data?.error || (typeof err.response?.data === 'string' ? err.response?.data : null);
      if (errMsg) {
        setError(errMsg);
      } else {
        setBackendOffline(true);
        setError('Backend services are offline. Start them with start-all.bat, or continue in Demo Mode below.');
      }
    } finally {
      setLoading(false);
    }
  };

  const fillQuickDemo = (role) => {
    if (role === 'admin') {
      setFormData({ username: 'admin', password: 'password123', email: '', fullName: '', role: 'ROLE_ADMIN' });
    } else {
      setFormData({ username: 'user', password: 'password123', email: '', fullName: '', role: 'ROLE_USER' });
    }
    setIsLogin(true);
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #0f1117 0%, #1a2236 50%, #0f1117 100%)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 24,
      fontFamily: 'Inter, system-ui, sans-serif',
    }}>
      {/* Decorative blobs */}
      <div style={{
        position: 'fixed', top: -100, right: -100,
        width: 400, height: 400, borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(34,197,94,0.12) 0%, transparent 70%)',
        pointerEvents: 'none'
      }} />
      <div style={{
        position: 'fixed', bottom: -120, left: -80,
        width: 350, height: 350, borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(59,130,246,0.1) 0%, transparent 70%)',
        pointerEvents: 'none'
      }} />

      <div style={{ width: '100%', maxWidth: 420, position: 'relative', zIndex: 1 }}>
        {/* Brand */}
        <div style={{ textAlign: 'center', marginBottom: 28, display: 'flex', justifyContent: 'center' }}>
          <ChargeSphereLogo layout="vertical" size="lg" showTagline={true} />
        </div>

        {/* Card */}
        <div style={{
          background: 'rgba(255,255,255,0.04)',
          backdropFilter: 'blur(20px)',
          border: '1px solid rgba(255,255,255,0.08)',
          borderRadius: 20,
          padding: 32,
          boxShadow: '0 24px 64px rgba(0,0,0,0.4)',
        }}>
          {/* Tab toggle */}
          <div style={{
            display: 'grid', gridTemplateColumns: '1fr 1fr',
            background: 'rgba(0,0,0,0.3)', borderRadius: 10, padding: 4, marginBottom: 24
          }}>
            {['Sign In', 'Sign Up'].map((label, i) => {
              const active = i === 0 ? isLogin : !isLogin;
              return (
                <button key={label} onClick={() => { setIsLogin(i === 0); setError(''); }} style={{
                  padding: '8px 0', borderRadius: 8, border: 'none', cursor: 'pointer',
                  fontWeight: 700, fontSize: 13, fontFamily: 'inherit',
                  background: active ? '#22c55e' : 'transparent',
                  color: active ? '#fff' : '#6b7280',
                  transition: 'all 0.2s',
                }}>
                  {label}
                </button>
              );
            })}
          </div>

          {error && (
            <div style={{
              background: backendOffline ? 'rgba(245,158,11,0.1)' : 'rgba(239,68,68,0.1)',
              border: `1px solid ${backendOffline ? 'rgba(245,158,11,0.35)' : 'rgba(239,68,68,0.25)'}`,
              borderRadius: 10, padding: '12px 14px', marginBottom: 20,
              color: backendOffline ? '#fde68a' : '#fca5a5', fontSize: 13,
              display: 'flex', flexDirection: 'column', gap: 10
            }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
                <span style={{ fontSize: 16 }}>{backendOffline ? '🔌' : '⚠️'}</span>
                <span style={{ flex: 1, lineHeight: '1.4' }}>{error}</span>
              </div>

              {backendOffline && (
                <button
                  type="button"
                  onClick={() => handleOfflineLogin(formData.role === 'ROLE_ADMIN' || formData.username.toLowerCase() === 'admin' ? 'admin' : 'user')}
                  style={{
                    padding: '9px 14px',
                    borderRadius: 8,
                    border: 'none',
                    background: 'linear-gradient(135deg, #f59e0b, #d97706)',
                    color: '#000',
                    fontWeight: 700,
                    fontSize: 12,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 6,
                    boxShadow: '0 2px 10px rgba(245,158,11,0.3)',
                    fontFamily: 'inherit'
                  }}
                >
                  ⚡ Enter in Offline Demo Mode ({formData.role === 'ROLE_ADMIN' || formData.username.toLowerCase() === 'admin' ? 'Admin' : 'EV User'})
                </button>
              )}
            </div>
          )}

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {!isLogin && (
              <div>
                <label style={labelStyle}>Full Name</label>
                <input type="text" name="fullName" value={formData.fullName} onChange={handleChange}
                  style={inputStyle} placeholder="e.g. Ravi Kumar" required />
              </div>
            )}

            <div>
              <label style={labelStyle}>Username</label>
              <input type="text" name="username" value={formData.username} onChange={handleChange}
                style={inputStyle} placeholder="Enter username" required />
            </div>

            {!isLogin && (
              <div>
                <label style={labelStyle}>Email Address</label>
                <input type="email" name="email" value={formData.email} onChange={handleChange}
                  style={inputStyle} placeholder="user@example.com" required />
              </div>
            )}

            <div>
              <label style={labelStyle}>Password</label>
              <input type="password" name="password" value={formData.password} onChange={handleChange}
                style={inputStyle} placeholder="••••••••" required />
            </div>

            {!isLogin && (
              <div>
                <label style={labelStyle}>Account Role</label>
                <select name="role" value={formData.role} onChange={handleChange} style={inputStyle}>
                  <option value="ROLE_USER">EV User</option>
                  <option value="ROLE_ADMIN">Grid Administrator</option>
                </select>
              </div>
            )}

            <button type="submit" disabled={loading} style={{
              marginTop: 4, padding: '13px 0', borderRadius: 10, border: 'none',
              background: loading ? '#16a34a88' : 'linear-gradient(135deg, #16a34a, #22c55e)',
              color: '#fff', fontWeight: 700, fontSize: 15, cursor: loading ? 'not-allowed' : 'pointer',
              fontFamily: 'inherit', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              boxShadow: '0 4px 16px rgba(34,197,94,0.3)',
              transition: 'all 0.2s',
            }}>
              {loading ? 'Authenticating...' : (isLogin ? 'Sign In to ChargeSphere' : 'Create Account')}
              {!loading && <ArrowRight size={18} />}
            </button>
          </form>

          {/* Quick Demo */}
          <div style={{ marginTop: 24, paddingTop: 20, borderTop: '1px solid rgba(255,255,255,0.07)' }}>
            <div style={{ fontSize: 10, color: '#4b5563', fontWeight: 700, textAlign: 'center', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: 12 }}>
              ⚡ Quick Instant Demo (No Backend Required)
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              <button type="button" onClick={() => { fillQuickDemo('user'); handleOfflineLogin('user'); }} style={{
                padding: '9px 0', borderRadius: 8, border: '1px solid rgba(59,130,246,0.25)',
                background: 'rgba(59,130,246,0.08)', color: '#93c5fd',
                fontWeight: 600, fontSize: 12, cursor: 'pointer', fontFamily: 'inherit',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5
              }}>
                <User size={13} /> Demo EV User
              </button>
              <button type="button" onClick={() => { fillQuickDemo('admin'); handleOfflineLogin('admin'); }} style={{
                padding: '9px 0', borderRadius: 8, border: '1px solid rgba(139,92,246,0.25)',
                background: 'rgba(139,92,246,0.08)', color: '#c4b5fd',
                fontWeight: 600, fontSize: 12, cursor: 'pointer', fontFamily: 'inherit',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5
              }}>
                <Shield size={13} /> Demo Admin
              </button>
            </div>
            <div style={{
              marginTop: 10, padding: '9px 12px',
              background: 'rgba(0,0,0,0.2)', borderRadius: 8,
              fontSize: 12, color: '#6b7280', textAlign: 'center',
              border: '1px solid rgba(255,255,255,0.05)'
            }}>
              Spring Boot Credentials: <strong style={{ color: '#9ca3af' }}>admin / password123</strong>
            </div>
          </div>
        </div>

        <div style={{ textAlign: 'center', marginTop: 20, fontSize: 12, color: '#4b5563' }}>
          Clean Mobility · Smarter Grids · Brighter Tomorrow with ChargeSphere™
        </div>
      </div>
    </div>
  );
}

const labelStyle = {
  display: 'block', fontSize: 12, fontWeight: 600,
  color: '#9ca3af', marginBottom: 6, letterSpacing: '0.2px'
};

const inputStyle = {
  width: '100%', padding: '10px 14px',
  background: 'rgba(0,0,0,0.25)',
  border: '1px solid rgba(255,255,255,0.1)',
  borderRadius: 8, color: '#f9fafb', fontSize: 13,
  fontFamily: 'inherit', outline: 'none',
  transition: 'border-color 0.15s',
};
