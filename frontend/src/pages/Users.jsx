import React, { useState, useEffect } from 'react';
import { userService } from '../services/api';
import { Users as UsersIcon, Shield, Car, RefreshCw, CheckCircle, Plus, Search, Mail, Calendar } from 'lucide-react';

export default function Users({ currentUser }) {
  const [userCount, setUserCount] = useState(null);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showAddVehicle, setShowAddVehicle] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState(1);
  const [newVehicle, setNewVehicle] = useState({
    model: '',
    make: '',
    batteryCapacityKwh: 50,
    currentSoc: 20,
    licensePlate: '',
    maxChargingRateKw: 50
  });
  const [statusMsg, setStatusMsg] = useState(null);

  const fetchUserData = async () => {
    setLoading(true);
    try {
      // 1. Get user count
      const countRes = await userService.getUserCount();
      setUserCount(countRes?.count ?? 2);

      // 2. Fetch known system users and their real vehicles
      const u1 = await userService.getProfile(1).catch(() => ({ id: 1, username: 'user', fullName: 'EV Driver', email: 'user@evcharging.com', role: 'ROLE_USER' }));
      const u2 = await userService.getProfile(2).catch(() => ({ id: 2, username: 'admin', fullName: 'Grid Administrator', email: 'admin@evcharging.com', role: 'ROLE_ADMIN' }));

      const v1 = await userService.getUserVehicles(1).catch(() => []);
      const v2 = await userService.getUserVehicles(2).catch(() => []);

      setUsers([
        { ...u1, vehicles: v1 },
        { ...u2, vehicles: v2 }
      ]);
    } catch (err) {
      console.error('Failed to load user management data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUserData();
  }, []);

  const handleAddVehicle = async (e) => {
    e.preventDefault();
    if (!newVehicle.model || !newVehicle.licensePlate) return;
    try {
      await userService.addVehicle(selectedUserId, newVehicle);
      setStatusMsg({ type: 'success', text: `Vehicle ${newVehicle.model} added successfully!` });
      setShowAddVehicle(false);
      setNewVehicle({ model: '', make: '', batteryCapacityKwh: 50, currentSoc: 20, licensePlate: '', maxChargingRateKw: 50 });
      fetchUserData();
    } catch (err) {
      setStatusMsg({ type: 'error', text: 'Failed to add vehicle: ' + (err.message || 'API error') });
    }
  };

  const filteredUsers = users.filter(u =>
    u.fullName?.toLowerCase().includes(search.toLowerCase()) ||
    u.username?.toLowerCase().includes(search.toLowerCase()) ||
    u.email?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="container">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 800, color: '#111827', display: 'flex', alignItems: 'center', gap: 10 }}>
            <UsersIcon size={26} color="#22c55e" />
            User & Vehicle Management
          </h1>
          <p style={{ color: '#6b7280', fontSize: 13, marginTop: 4 }}>
            System accounts, security roles, and registered electric vehicles connected to User Service (:8081).
          </p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button
            onClick={fetchUserData}
            className="btn btn-secondary"
            style={{ display: 'flex', alignItems: 'center', gap: 6 }}
          >
            <RefreshCw size={14} className={loading ? 'spin' : ''} />
            Refresh
          </button>
          <button
            onClick={() => setShowAddVehicle(true)}
            className="btn btn-primary"
            style={{ display: 'flex', alignItems: 'center', gap: 6 }}
          >
            <Plus size={16} />
            Register Vehicle
          </button>
        </div>
      </div>

      {statusMsg && (
        <div className={`alert alert-${statusMsg.type}`} style={{ marginBottom: 20 }}>
          {statusMsg.text}
        </div>
      )}

      {/* KPI row */}
      <div className="kpi-grid" style={{ marginBottom: 24 }}>
        <div className="kpi-card">
          <div className="kpi-top">
            <span className="kpi-title">Total Registered Users</span>
            <div className="kpi-icon-box green"><UsersIcon size={18} /></div>
          </div>
          <div className="kpi-value">{loading ? '...' : (userCount ?? users.length)}</div>
          <div className="kpi-sub">Verified platform accounts</div>
        </div>

        <div className="kpi-card">
          <div className="kpi-top">
            <span className="kpi-title">Fleet / EVs Registered</span>
            <div className="kpi-icon-box blue"><Car size={18} /></div>
          </div>
          <div className="kpi-value">
            {loading ? '...' : users.reduce((acc, u) => acc + (u.vehicles?.length || 0), 0)}
          </div>
          <div className="kpi-sub">Vehicles ready for smart charging</div>
        </div>

        <div className="kpi-card">
          <div className="kpi-top">
            <span className="kpi-title">Administrator Accounts</span>
            <div className="kpi-icon-box orange"><Shield size={18} /></div>
          </div>
          <div className="kpi-value">
            {loading ? '...' : users.filter(u => u.role === 'ROLE_ADMIN').length}
          </div>
          <div className="kpi-sub">Privileged grid operators</div>
        </div>
      </div>

      {/* Search Bar */}
      <div className="card" style={{ padding: 16, marginBottom: 24, display: 'flex', alignItems: 'center', gap: 12 }}>
        <Search size={18} color="#9ca3af" />
        <input
          type="text"
          placeholder="Search by name, username, or email..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{
            border: 'none',
            outline: 'none',
            width: '100%',
            fontSize: 14,
            background: 'transparent'
          }}
        />
      </div>

      {/* Users Table */}
      <div className="card" style={{ overflow: 'hidden' }}>
        <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border-color)', fontWeight: 700, fontSize: 15 }}>
          Registered Platform Accounts
        </div>
        <div className="table-responsive">
          <table className="table">
            <thead>
              <tr>
                <th>User</th>
                <th>Role</th>
                <th>Email</th>
                <th>Registered Vehicles</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map((u) => (
                <tr key={u.id}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div style={{
                        width: 34, height: 34, borderRadius: '50%',
                        background: u.role === 'ROLE_ADMIN' ? 'linear-gradient(135deg, #3b82f6, #6366f1)' : 'linear-gradient(135deg, #10b981, #059669)',
                        color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 13
                      }}>
                        {u.fullName?.split(' ').map(n => n[0]).join('').slice(0, 2) || 'U'}
                      </div>
                      <div>
                        <div style={{ fontWeight: 700, color: '#111827' }}>{u.fullName}</div>
                        <div style={{ fontSize: 12, color: '#6b7280' }}>@{u.username}</div>
                      </div>
                    </div>
                  </td>
                  <td>
                    <span style={{
                      display: 'inline-flex', alignItems: 'center', gap: 4,
                      fontSize: 11, fontWeight: 700, padding: '3px 8px', borderRadius: 12,
                      background: u.role === 'ROLE_ADMIN' ? '#dbeafe' : '#dcfce7',
                      color: u.role === 'ROLE_ADMIN' ? '#1e40af' : '#15803d'
                    }}>
                      {u.role === 'ROLE_ADMIN' ? <Shield size={12} /> : <CheckCircle size={12} />}
                      {u.role === 'ROLE_ADMIN' ? 'Administrator' : 'EV User'}
                    </span>
                  </td>
                  <td style={{ color: '#4b5563', fontSize: 13 }}>{u.email}</td>
                  <td>
                    {u.vehicles && u.vehicles.length > 0 ? (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                        {u.vehicles.map(v => (
                          <div key={v.id} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12 }}>
                            <Car size={13} color="#22c55e" />
                            <span style={{ fontWeight: 600, color: '#1f2937' }}>{v.make} {v.model}</span>
                            <span style={{ color: '#6b7280', fontSize: 11, background: '#f3f4f6', padding: '1px 5px', borderRadius: 4 }}>
                              {v.licensePlate}
                            </span>
                            <span style={{ color: '#2563eb', fontSize: 11 }}>
                              {v.batteryCapacityKwh} kWh ({v.currentSoc}%)
                            </span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <span style={{ color: '#9ca3af', fontSize: 12 }}>No vehicles registered</span>
                    )}
                  </td>
                  <td>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 12, color: '#16a34a', fontWeight: 600 }}>
                      <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#22c55e' }} />
                      Active
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Vehicle Modal */}
      {showAddVehicle && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000
        }}>
          <div className="card" style={{ width: 440, maxWidth: '90vw', padding: 24 }}>
            <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 16 }}>Register New Vehicle</h3>
            <form onSubmit={handleAddVehicle}>
              <div style={{ marginBottom: 12 }}>
                <label style={{ fontSize: 12, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 4 }}>
                  Assign to User
                </label>
                <select
                  value={selectedUserId}
                  onChange={(e) => setSelectedUserId(Number(e.target.value))}
                  style={{ width: '100%', padding: '8px 12px', borderRadius: 6, border: '1px solid #d1d5db' }}
                >
                  {users.map(u => (
                    <option key={u.id} value={u.id}>{u.fullName} (@{u.username})</option>
                  ))}
                </select>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 12 }}>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 4 }}>Make</label>
                  <input
                    type="text"
                    placeholder="e.g. Tata, MG, Tesla"
                    value={newVehicle.make}
                    onChange={(e) => setNewVehicle({ ...newVehicle, make: e.target.value })}
                    required
                    style={{ width: '100%', padding: '8px 12px', borderRadius: 6, border: '1px solid #d1d5db' }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 4 }}>Model</label>
                  <input
                    type="text"
                    placeholder="e.g. Nexon EV, ZS EV"
                    value={newVehicle.model}
                    onChange={(e) => setNewVehicle({ ...newVehicle, model: e.target.value })}
                    required
                    style={{ width: '100%', padding: '8px 12px', borderRadius: 6, border: '1px solid #d1d5db' }}
                  />
                </div>
              </div>

              <div style={{ marginBottom: 12 }}>
                <label style={{ fontSize: 12, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 4 }}>License Plate</label>
                <input
                  type="text"
                  placeholder="e.g. AP16-EV-9999"
                  value={newVehicle.licensePlate}
                  onChange={(e) => setNewVehicle({ ...newVehicle, licensePlate: e.target.value })}
                  required
                  style={{ width: '100%', padding: '8px 12px', borderRadius: 6, border: '1px solid #d1d5db' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 18 }}>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 4 }}>Battery (kWh)</label>
                  <input
                    type="number"
                    value={newVehicle.batteryCapacityKwh}
                    onChange={(e) => setNewVehicle({ ...newVehicle, batteryCapacityKwh: Number(e.target.value) })}
                    required
                    style={{ width: '100%', padding: '8px 12px', borderRadius: 6, border: '1px solid #d1d5db' }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 4 }}>Current SoC (%)</label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={newVehicle.currentSoc}
                    onChange={(e) => setNewVehicle({ ...newVehicle, currentSoc: Number(e.target.value) })}
                    required
                    style={{ width: '100%', padding: '8px 12px', borderRadius: 6, border: '1px solid #d1d5db' }}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
                <button
                  type="button"
                  onClick={() => setShowAddVehicle(false)}
                  className="btn btn-secondary"
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Save Vehicle
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
