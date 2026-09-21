import React, { useState, useEffect } from 'react';
import { userService } from '../services/api';
import { User, Shield, Mail, Car, Plus, RefreshCw, Key, CheckCircle, BatteryCharging } from 'lucide-react';

export default function Profile({ currentUser }) {
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newVehicle, setNewVehicle] = useState({
    model: '',
    make: '',
    batteryCapacityKwh: 50,
    currentSoc: 30,
    licensePlate: '',
    maxChargingRateKw: 50
  });
  const [msg, setMsg] = useState(null);

  const fetchVehicles = async () => {
    if (!currentUser?.id) return;
    setLoading(true);
    try {
      const data = await userService.getUserVehicles(currentUser.id);
      setVehicles(Array.isArray(data) ? data : []);
    } catch (err) {
      console.warn('Could not fetch user vehicles:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVehicles();
  }, [currentUser]);

  const handleAddVehicle = async (e) => {
    e.preventDefault();
    try {
      await userService.addVehicle(currentUser.id, newVehicle);
      setMsg({ type: 'success', text: `Vehicle ${newVehicle.make} ${newVehicle.model} added successfully!` });
      setShowAddModal(false);
      setNewVehicle({ model: '', make: '', batteryCapacityKwh: 50, currentSoc: 30, licensePlate: '', maxChargingRateKw: 50 });
      fetchVehicles();
    } catch (err) {
      setMsg({ type: 'error', text: 'Failed to add vehicle: ' + (err.message || 'API error') });
    }
  };

  const initials = currentUser?.fullName
    ? currentUser.fullName.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()
    : 'U';

  return (
    <div className="container">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 800, color: '#111827', display: 'flex', alignItems: 'center', gap: 10 }}>
            <User size={26} color="#22c55e" />
            User Profile & EV Fleet
          </h1>
          <p style={{ color: '#6b7280', fontSize: 13, marginTop: 4 }}>
            Manage your personal credentials, security tokens, and registered electric vehicles connected to User Service (:8081).
          </p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="btn btn-primary"
          style={{ display: 'flex', alignItems: 'center', gap: 6 }}
        >
          <Plus size={16} />
          Add Vehicle
        </button>
      </div>

      {msg && (
        <div className={`alert alert-${msg.type}`} style={{ marginBottom: 20 }}>
          {msg.text}
        </div>
      )}

      {/* Identity Card */}
      <div className="card" style={{ padding: 24, marginBottom: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 20, flexWrap: 'wrap' }}>
          <div style={{
            width: 72, height: 72, borderRadius: '50%',
            background: currentUser?.role === 'ROLE_ADMIN' ? 'linear-gradient(135deg, #3b82f6, #6366f1)' : 'linear-gradient(135deg, #10b981, #059669)',
            color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 28, fontWeight: 800, boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
          }}>
            {initials}
          </div>

          <div style={{ flex: 1, minWidth: 220 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
              <h2 style={{ fontSize: 20, fontWeight: 800, color: '#111827', margin: 0 }}>{currentUser?.fullName}</h2>
              <span style={{
                fontSize: 11, fontWeight: 700, padding: '2px 10px', borderRadius: 12,
                background: currentUser?.role === 'ROLE_ADMIN' ? '#dbeafe' : '#dcfce7',
                color: currentUser?.role === 'ROLE_ADMIN' ? '#1e40af' : '#15803d',
                textTransform: 'uppercase'
              }}>
                {currentUser?.role === 'ROLE_ADMIN' ? 'Platform Administrator' : 'EV Driver'}
              </span>
            </div>
            <div style={{ fontSize: 13, color: '#6b7280', marginTop: 4 }}>
              @{currentUser?.username} · {currentUser?.email || `${currentUser?.username}@evcharging.com`}
            </div>
            <div style={{ fontSize: 12, color: '#9ca3af', marginTop: 6, display: 'flex', gap: 16 }}>
              <span>User ID: #{currentUser?.id}</span>
              <span>Authentication: JJWT Bearer Token (24h)</span>
            </div>
          </div>
        </div>
      </div>

      {/* Vehicles Card */}
      <div className="card" style={{ overflow: 'hidden' }}>
        <div style={{ padding: '18px 24px', borderBottom: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <div style={{ fontWeight: 800, fontSize: 16, color: '#111827' }}>Registered Electric Vehicles</div>
            <div style={{ fontSize: 12, color: '#6b7280' }}>Vehicles assigned to your account for smart charging allocation</div>
          </div>
          <button
            onClick={fetchVehicles}
            className="btn btn-secondary"
            style={{ padding: '4px 8px', fontSize: 12 }}
          >
            <RefreshCw size={12} className={loading ? 'spin' : ''} />
          </button>
        </div>

        <div style={{ padding: 20 }}>
          {vehicles.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '32px 16px', color: '#9ca3af' }}>
              <Car size={36} color="#9ca3af" style={{ margin: '0 auto 8px', opacity: 0.5 }} />
              <div style={{ fontWeight: 600, color: '#374151' }}>No vehicles registered yet</div>
              <div style={{ fontSize: 13, marginTop: 4 }}>Click "Add Vehicle" to register your electric car.</div>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 16 }}>
              {vehicles.map(v => (
                <div key={v.id} style={{
                  border: '1px solid var(--border-color)', borderRadius: 12, padding: 16,
                  background: '#f8fafc', display: 'flex', flexDirection: 'column', gap: 10
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div style={{ width: 32, height: 32, borderRadius: 8, background: '#dcfce7', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Car size={16} color="#15803d" />
                      </div>
                      <div>
                        <div style={{ fontWeight: 700, fontSize: 14, color: '#111827' }}>{v.make} {v.model}</div>
                        <div style={{ fontSize: 11, color: '#6b7280' }}>Plate: <strong>{v.licensePlate}</strong></div>
                      </div>
                    </div>
                    <span style={{ fontSize: 11, fontWeight: 700, color: '#16a34a', background: '#f0fdf4', padding: '2px 8px', borderRadius: 8 }}>
                      Verified
                    </span>
                  </div>

                  <div style={{ borderTop: '1px solid #e2e8f0', paddingTop: 10, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, fontSize: 12 }}>
                    <div>
                      <span style={{ color: '#6b7280' }}>Battery Pack: </span>
                      <strong>{v.batteryCapacityKwh} kWh</strong>
                    </div>
                    <div>
                      <span style={{ color: '#6b7280' }}>Current SoC: </span>
                      <strong style={{ color: '#2563eb' }}>{v.currentSoc}%</strong>
                    </div>
                    <div>
                      <span style={{ color: '#6b7280' }}>Max Charge Rate: </span>
                      <strong>{v.maxChargingRateKw} kW</strong>
                    </div>
                    <div>
                      <span style={{ color: '#6b7280' }}>Connector: </span>
                      <strong>CCS2 Type 2</strong>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Modal: Add Vehicle */}
      {showAddModal && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000
        }}>
          <div className="card" style={{ width: 440, maxWidth: '90vw', padding: 24 }}>
            <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 16 }}>Register Your Electric Vehicle</h3>
            <form onSubmit={handleAddVehicle}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 12 }}>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 4 }}>Manufacturer</label>
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
                <label style={{ fontSize: 12, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 4 }}>Registration / License Plate</label>
                <input
                  type="text"
                  placeholder="e.g. AP16-EV-7890"
                  value={newVehicle.licensePlate}
                  onChange={(e) => setNewVehicle({ ...newVehicle, licensePlate: e.target.value })}
                  required
                  style={{ width: '100%', padding: '8px 12px', borderRadius: 6, border: '1px solid #d1d5db' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 18 }}>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 4 }}>Battery Pack (kWh)</label>
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
                  onClick={() => setShowAddModal(false)}
                  className="btn btn-secondary"
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Register Vehicle
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
