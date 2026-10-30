import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { userService } from '../services/api';
import { ArrowRight, Eye, EyeOff } from 'lucide-react';
import ChargeSphereLogo from '../components/ChargeSphereLogo';

export default function LoginRegister({ onLoginSuccess }) {
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({
    username: '', email: '', password: '', fullName: '', role: 'ROLE_USER'
  });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);
    try {
      let res;
      if (isLogin) {
        res = await userService.login({ username: formData.username, password: formData.password });
        onLoginSuccess(res);
        navigate(res.role === 'ROLE_ADMIN' ? '/admin' : '/');
      } else {
        // Public sign-up always creates ROLE_USER accounts
        res = await userService.register({ ...formData, role: 'ROLE_USER' });
        onLoginSuccess(res);
        navigate('/');
      }
    } catch (err) {
      const errMsg =
        err.response?.data?.message ||
        err.response?.data?.error ||
        (typeof err.response?.data === 'string' ? err.response?.data : null);
      setError(errMsg || 'Unable to connect. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const switchTab = (toLogin) => {
    setIsLogin(toLogin);
    setError('');
    setSuccess('');
    setFormData({ username: '', email: '', password: '', fullName: '', role: 'ROLE_USER' });
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #0a0f1e 0%, #0d1b2a 50%, #0a0f1e 100%)',
      display: 'flex',
      fontFamily: 'Inter, system-ui, sans-serif',
    }}>
      {/* Left panel — branding */}
      <div style={{
        flex: 1,
        display: 'none',
        flexDirection: 'column',
        justifyContent: 'center',
        padding: '60px 64px',
        background: 'linear-gradient(160deg, rgba(34,197,94,0.08) 0%, rgba(16,185,129,0.04) 100%)',
        borderRight: '1px solid rgba(255,255,255,0.05)',
      }} className="left-panel">
        <div style={{ maxWidth: 440 }}>
          <ChargeSphereLogo layout="vertical" size="xl" showTagline={false} />
          <p style={{
            marginTop: 28, fontSize: 17, lineHeight: 1.7,
            color: 'rgba(255,255,255,0.55)', fontWeight: 400
          }}>
            Intelligent EV charging infrastructure powered by real-time grid analytics and dynamic load balancing.
          </p>

          <div style={{ marginTop: 48, display: 'flex', flexDirection: 'column', gap: 20 }}>
            {[
              { icon: '⚡', title: 'Smart Station Allocation', desc: 'Automatically selects the optimal charging station based on live grid load.' },
              { icon: '🔋', title: 'Real-Time Grid Monitoring', desc: 'Monitor zone capacity across all 5 Vijayawada grid zones.' },
              { icon: '🔒', title: 'Secure Access', desc: 'JWT-based authentication with role-based access control.' },
            ].map(f => (
              <div key={f.title} style={{ display: 'flex', gap: 16, alignItems: 'flex-start' }}>
                <div style={{
                  width: 40, height: 40, borderRadius: 10, flexShrink: 0,
                  background: 'rgba(34,197,94,0.12)', border: '1px solid rgba(34,197,94,0.2)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18
                }}>{f.icon}</div>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: '#e5e7eb', marginBottom: 4 }}>{f.title}</div>
                  <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)', lineHeight: 1.5 }}>{f.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right panel — form */}
      <div style={{
        width: '100%',
        maxWidth: 480,
        margin: '0 auto',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        padding: '48px 40px',
      }}>

        {/* Mobile logo */}
        <div style={{ marginBottom: 32, display: 'flex', justifyContent: 'center' }}>
          <ChargeSphereLogo layout="vertical" size="lg" showTagline={true} />
        </div>

        {/* Card */}
        <div style={{
          background: 'rgba(255,255,255,0.03)',
          border: '1px solid rgba(255,255,255,0.07)',
          borderRadius: 16,
          padding: 32,
          boxShadow: '0 32px 80px rgba(0,0,0,0.5)',
        }}>

          {/* Heading */}
          <div style={{ marginBottom: 24 }}>
            <h1 style={{ margin: 0, fontSize: 22, fontWeight: 700, color: '#f9fafb' }}>
              {isLogin ? 'Welcome back' : 'Create your account'}
            </h1>
            <p style={{ margin: '6px 0 0', fontSize: 13, color: '#6b7280' }}>
              {isLogin
                ? 'Sign in to access the ChargeSphere platform'
                : 'Join the ChargeSphere network'}
            </p>
          </div>

          {/* Tab toggle */}
          <div style={{
            display: 'grid', gridTemplateColumns: '1fr 1fr',
            background: 'rgba(0,0,0,0.35)', borderRadius: 10, padding: 4, marginBottom: 24
          }}>
            {[{ label: 'Sign In', login: true }, { label: 'Sign Up', login: false }].map(t => {
              const active = t.login === isLogin;
              return (
                <button key={t.label} onClick={() => switchTab(t.login)} style={{
                  padding: '9px 0', borderRadius: 7, border: 'none', cursor: 'pointer',
                  fontWeight: 600, fontSize: 13, fontFamily: 'inherit',
                  background: active ? '#22c55e' : 'transparent',
                  color: active ? '#fff' : '#6b7280',
                  transition: 'all 0.2s',
                }}>
                  {t.label}
                </button>
              );
            })}
          </div>

          {/* Error */}
          {error && (
            <div style={{
              background: 'rgba(239,68,68,0.08)',
              border: '1px solid rgba(239,68,68,0.2)',
              borderRadius: 8, padding: '11px 14px', marginBottom: 20,
              color: '#fca5a5', fontSize: 13, display: 'flex', gap: 8, alignItems: 'flex-start'
            }}>
              <span style={{ marginTop: 1 }}>⚠</span>
              <span>{error}</span>
            </div>
          )}

          {/* Success */}
          {success && (
            <div style={{
              background: 'rgba(34,197,94,0.08)',
              border: '1px solid rgba(34,197,94,0.2)',
              borderRadius: 8, padding: '11px 14px', marginBottom: 20,
              color: '#86efac', fontSize: 13, display: 'flex', gap: 8, alignItems: 'flex-start'
            }}>
              <span>✓</span>
              <span>{success}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

            {!isLogin && (
              <div>
                <label style={labelStyle}>Full Name</label>
                <input
                  type="text" name="fullName" value={formData.fullName}
                  onChange={handleChange} style={inputStyle}
                  placeholder="Your full name" required
                />
              </div>
            )}

            <div>
              <label style={labelStyle}>Username</label>
              <input
                type="text" name="username" value={formData.username}
                onChange={handleChange} style={inputStyle}
                placeholder="Enter your username"
                autoComplete="username" required
              />
            </div>

            {!isLogin && (
              <div>
                <label style={labelStyle}>Email Address</label>
                <input
                  type="email" name="email" value={formData.email}
                  onChange={handleChange} style={inputStyle}
                  placeholder="you@example.com" required
                />
              </div>
            )}

            <div>
              <label style={labelStyle}>Password</label>
              <div style={{ position: 'relative' }}>
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="password" value={formData.password}
                  onChange={handleChange}
                  style={{ ...inputStyle, paddingRight: 44 }}
                  placeholder="••••••••"
                  autoComplete={isLogin ? 'current-password' : 'new-password'}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(p => !p)}
                  style={{
                    position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)',
                    background: 'none', border: 'none', cursor: 'pointer',
                    color: '#6b7280', display: 'flex', alignItems: 'center', padding: 0
                  }}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {!isLogin && (
                <p style={{ margin: '5px 0 0', fontSize: 11, color: '#4b5563' }}>
                  Minimum 6 characters
                </p>
              )}
            </div>

            {/* Account type is always EV User for public sign-up.
                Admins are created via the register-users.ps1 script only. */}

            <button
              type="submit" disabled={loading}
              style={{
                marginTop: 8, padding: '13px 0', borderRadius: 10, border: 'none',
                background: loading
                  ? 'rgba(22,163,74,0.4)'
                  : 'linear-gradient(135deg, #16a34a 0%, #22c55e 100%)',
                color: '#fff', fontWeight: 700, fontSize: 15,
                cursor: loading ? 'not-allowed' : 'pointer',
                fontFamily: 'inherit',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                boxShadow: loading ? 'none' : '0 4px 20px rgba(34,197,94,0.25)',
                transition: 'all 0.2s',
                letterSpacing: '0.2px',
              }}
            >
              {loading
                ? <><LoadingSpinner /> {isLogin ? 'Signing in...' : 'Creating account...'}</>
                : <>{isLogin ? 'Sign In' : 'Create Account'} <ArrowRight size={17} /></>
              }
            </button>
          </form>

          {/* Switch mode link */}
          <p style={{ marginTop: 20, textAlign: 'center', fontSize: 13, color: '#6b7280' }}>
            {isLogin ? "Don't have an account? " : 'Already have an account? '}
            <button
              type="button"
              onClick={() => switchTab(!isLogin)}
              style={{
                background: 'none', border: 'none', cursor: 'pointer',
                color: '#22c55e', fontWeight: 600, fontSize: 13,
                fontFamily: 'inherit', padding: 0
              }}
            >
              {isLogin ? 'Sign up' : 'Sign in'}
            </button>
          </p>
        </div>

        {/* Footer */}
        <p style={{
          marginTop: 28, textAlign: 'center', fontSize: 12,
          color: 'rgba(255,255,255,0.18)', lineHeight: 1.6
        }}>
          © 2026 ChargeSphere · Clean Mobility · Smarter Grids
        </p>
      </div>

      <style>{`
        @media (min-width: 900px) {
          .left-panel { display: flex !important; }
        }
        input::placeholder { color: #4b5563; }
        select option { background: #1a2236; color: #f9fafb; }
        input:focus, select:focus {
          outline: none;
          border-color: rgba(34,197,94,0.5) !important;
          box-shadow: 0 0 0 3px rgba(34,197,94,0.08);
        }
      `}</style>
    </div>
  );
}

function LoadingSpinner() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
      style={{ animation: 'spin 0.8s linear infinite' }}>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
    </svg>
  );
}

const labelStyle = {
  display: 'block', fontSize: 12, fontWeight: 600,
  color: '#9ca3af', marginBottom: 6, letterSpacing: '0.3px'
};

const inputStyle = {
  width: '100%', padding: '11px 14px',
  background: 'rgba(0,0,0,0.3)',
  border: '1px solid rgba(255,255,255,0.09)',
  borderRadius: 8, color: '#f9fafb', fontSize: 14,
  fontFamily: 'inherit', outline: 'none',
  transition: 'border-color 0.15s, box-shadow 0.15s',
  boxSizing: 'border-box',
};
