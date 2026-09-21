import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import TopBar from './components/TopBar';
import LoginRegister from './pages/LoginRegister';
import UserDashboard from './pages/UserDashboard';
import FindStation from './pages/FindStation';
import SmartCharging from './pages/SmartCharging';
import ChargingSessionPage from './pages/ChargingSessionPage';
import ChargingHistory from './pages/ChargingHistory';
import AdminDashboard from './pages/AdminDashboard';
import Users from './pages/Users';
import Analytics from './pages/Analytics';
import GridLoad from './pages/GridLoad';
import NotificationsPage from './pages/NotificationsPage';
import Profile from './pages/Profile';
import Settings from './pages/Settings';
import SoaArchitecture from './pages/SoaArchitecture';

function ProtectedRoute({ user, children }) {
  if (!user) return <Navigate to="/login" replace />;
  return children;
}

export default function App() {
  const [currentUser, setCurrentUser] = useState(null);
  const [authInitialized, setAuthInitialized] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem('ev_user');
    if (saved) {
      try { setCurrentUser(JSON.parse(saved)); }
      catch (e) { localStorage.removeItem('ev_user'); }
    }
    setAuthInitialized(true);
  }, []);

  const handleLoginSuccess = (userAuthData) => {
    setCurrentUser(userAuthData);
    localStorage.setItem('ev_user', JSON.stringify(userAuthData));
  };

  const handleLogout = () => {
    setCurrentUser(null);
    localStorage.removeItem('ev_user');
  };

  if (!authInitialized) {
    return (
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        height: '100vh', background: '#0f1117', flexDirection: 'column', gap: 16
      }}>
        <div style={{
          width: 48, height: 48, borderRadius: '50%',
          background: 'linear-gradient(135deg, #22c55e, #16a34a)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: '0 0 24px rgba(34,197,94,0.4)'
        }}>
          <span style={{ fontSize: 22, color: 'white' }}>⚡</span>
        </div>
        <div style={{ fontSize: 14, color: '#9ca3af', fontWeight: 600 }}>Loading ChargeSphere™...</div>
      </div>
    );
  }

  return (
    <Router>
      <Routes>
        {/* Login page — standalone, no sidebar */}
        <Route
          path="/login"
          element={
            currentUser
              ? <Navigate to={currentUser.role === 'ROLE_ADMIN' ? '/admin' : '/'} replace />
              : <LoginRegister onLoginSuccess={handleLoginSuccess} />
          }
        />

        {/* All other pages — sidebar layout */}
        <Route
          path="*"
          element={
            <div className="app-shell">
              <Sidebar currentUser={currentUser} onLogout={handleLogout} />
              <div className="main-content">
                <TopBar currentUser={currentUser} onLogout={handleLogout} />
                <div className="page-content">
                  <Routes>
                    <Route
                      path="/"
                      element={
                        <ProtectedRoute user={currentUser}>
                          {currentUser?.role === 'ROLE_ADMIN' ? (
                            <AdminDashboard currentUser={currentUser} />
                          ) : (
                            <UserDashboard currentUser={currentUser} />
                          )}
                        </ProtectedRoute>
                      }
                    />
                    <Route path="/stations" element={<FindStation />} />
                    <Route
                      path="/smart-charging"
                      element={
                        <ProtectedRoute user={currentUser}>
                          <SmartCharging currentUser={currentUser} />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/active-session"
                      element={
                        <ProtectedRoute user={currentUser}>
                          <ChargingSessionPage currentUser={currentUser} />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/history"
                      element={
                        <ProtectedRoute user={currentUser}>
                          <ChargingHistory currentUser={currentUser} />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/admin"
                      element={
                        <ProtectedRoute user={currentUser}>
                          <AdminDashboard currentUser={currentUser} />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/dashboard"
                      element={
                        <ProtectedRoute user={currentUser}>
                          <UserDashboard currentUser={currentUser} />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/users"
                      element={
                        <ProtectedRoute user={currentUser}>
                          <Users currentUser={currentUser} />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/analytics"
                      element={
                        <ProtectedRoute user={currentUser}>
                          <Analytics />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/grid-load"
                      element={
                        <ProtectedRoute user={currentUser}>
                          <GridLoad />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/notifications"
                      element={
                        <ProtectedRoute user={currentUser}>
                          <NotificationsPage currentUser={currentUser} />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/profile"
                      element={
                        <ProtectedRoute user={currentUser}>
                          <Profile currentUser={currentUser} />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/settings"
                      element={
                        <ProtectedRoute user={currentUser}>
                          <Settings currentUser={currentUser} onLogout={handleLogout} />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/soa-architecture"
                      element={
                        <ProtectedRoute user={currentUser}>
                          <SoaArchitecture />
                        </ProtectedRoute>
                      }
                    />
                    <Route path="*" element={<Navigate to={currentUser ? '/' : '/login'} replace />} />
                  </Routes>
                </div>
              </div>
            </div>
          }
        />
      </Routes>
    </Router>
  );
}
