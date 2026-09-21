import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { loadBalancerService } from '../services/api';
import { Zap, AlertTriangle, ArrowRight, CheckCircle, Cpu, MapPin, Layers, RefreshCw } from 'lucide-react';

export default function SmartCharging({ currentUser }) {
  const [searchParams] = useSearchParams();
  const preselectedStationId = searchParams.get('stationId');

  const [vehicleModel, setVehicleModel] = useState('Tata Nexon EV Max');
  const [requiredEnergy, setRequiredEnergy] = useState(25.0);
  const [preferredTime, setPreferredTime] = useState('Immediate');

  const [loading, setLoading] = useState(false);
  const [allocationResult, setAllocationResult] = useState(null);
  const [confirming, setConfirming] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => { handleRequestRecommendation(); }, []);

  const handleRequestRecommendation = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await loadBalancerService.selectStation({
        userId: currentUser?.id || 1,
        vehicleModel,
        requiredEnergyKwh: parseFloat(requiredEnergy),
        preferredTime,
        preferredStationId: preselectedStationId ? parseInt(preselectedStationId) : null
      });
      setAllocationResult(res);
    } catch (err) {
      console.error('Smart allocation error:', err);
      setError('Unable to fetch recommendations. Please ensure all backend services are running.');
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmAllocation = async (station, portId) => {
    setConfirming(true);
    try {
      const pId = portId || station.selectedPortId || 1;
      const res = await loadBalancerService.allocateStation({
        userId: currentUser?.id || 1,
        stationId: station.id,
        portId: pId,
        requiredEnergyKwh: parseFloat(requiredEnergy)
      });
      if (res.status === 'SUCCESS') {
        navigate('/active-session');
      } else {
        alert(res.message || 'Allocation failed');
      }
    } catch (err) {
      alert('Failed to confirm charging session');
    } finally {
      setConfirming(false);
    }
  };

  const recStation = allocationResult?.recommendedStation;
  const altStations = allocationResult?.alternativeStations || [];

  return (
    <div className="container" style={{ maxWidth: 1060 }}>
      {/* Title */}
      <div style={{ marginBottom: 28 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
          <div style={{
            width: 40, height: 40, borderRadius: 10,
            background: 'linear-gradient(135deg, #16A34A 0%, #0891B2 100%)',
            display: 'flex', alignItems: 'center', justifyContent: 'center'
          }}>
            <Zap size={22} color="#fff" />
          </div>
          <div>
            <h1 style={{ fontSize: 22, fontWeight: 800, color: '#1A202C' }}>
              SOA Smart Charging &amp; Grid Load Balancer
            </h1>
            <p style={{ color: '#718096', fontSize: 13, marginTop: 2 }}>
              Dynamic orchestrator evaluating grid capacity, port availability, and tariff scoring to prevent overload.
            </p>
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 24 }}>
        {/* Step 1: Input Form */}
        <div className="glass-card">
          <h2 className="section-title">
            <Layers size={18} color="#2563EB" /> Step 1: EV Charging Requirements
          </h2>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 6 }}>
                EV Vehicle Model
              </label>
              <select value={vehicleModel} onChange={(e) => setVehicleModel(e.target.value)} className="form-input">
                <option value="Tata Nexon EV Max">Tata Nexon EV Max (40.5 kWh)</option>
                <option value="MG ZS EV">MG ZS EV (50.3 kWh)</option>
                <option value="Hyundai Kona Electric">Hyundai Kona Electric (39.2 kWh)</option>
                <option value="Mahindra XUV400 EV">Mahindra XUV400 EV (39.4 kWh)</option>
                <option value="BYD Atto 3">BYD Atto 3 (60.48 kWh)</option>
              </select>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 6 }}>
                Required Energy: <span style={{ color: '#2563EB', fontWeight: 800 }}>{requiredEnergy} kWh</span>
              </label>
              <input
                type="range" min="5" max="60" step="5" value={requiredEnergy}
                onChange={(e) => setRequiredEnergy(e.target.value)}
                style={{ width: '100%', accentColor: '#2563EB' }}
              />
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: '#A0AEC0', marginTop: 4 }}>
                <span>5 kWh</span><span>30 kWh</span><span>60 kWh</span>
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 6 }}>
                Preferred Charging Time
              </label>
              <select value={preferredTime} onChange={(e) => setPreferredTime(e.target.value)} className="form-input">
                <option value="Immediate">Immediate Start (Fast Charger)</option>
                <option value="Within 30 Mins">Within 30 Minutes</option>
                <option value="Off-Peak Hours">Off-Peak Night Tariff</option>
              </select>
            </div>

            <button
              onClick={handleRequestRecommendation}
              className="btn btn-primary"
              style={{ padding: 12, marginTop: 4 }}
              disabled={loading}
            >
              {loading
                ? <><RefreshCw size={16} className="spin" /> Evaluating SOA Load Score...</>
                : <>Calculate Optimal Station <ArrowRight size={16} /></>
              }
            </button>
          </div>
        </div>

        {/* Step 2: Result */}
        <div className="glass-card" style={{
          borderColor: allocationResult?.status === 'WARNING_OVERLOAD' ? '#FDE68A' : '#BBF7D0',
          background: allocationResult?.status === 'WARNING_OVERLOAD' ? '#FFFBEB' : '#F0FDF4'
        }}>
          <h2 className="section-title">
            <Cpu size={18} color="#16A34A" /> Step 2: Recommended Station
          </h2>

          {error && (
            <div className="alert alert-error" style={{ marginBottom: 16 }}>
              <AlertTriangle size={15} style={{ flexShrink: 0 }} />
              <span>{error}</span>
            </div>
          )}

          {loading ? (
            <div style={{ textAlign: 'center', padding: 40, color: '#A0AEC0' }}>
              <RefreshCw size={28} className="spin" style={{ marginBottom: 12 }} />
              <div>Querying Station, Grid &amp; computing scores...</div>
            </div>
          ) : recStation ? (
            <div>
              {allocationResult.status === 'WARNING_OVERLOAD' && (
                <div className="alert alert-warning" style={{ marginBottom: 16 }}>
                  <AlertTriangle size={15} style={{ flexShrink: 0, marginTop: 1 }} />
                  <div>
                    <strong>Grid Overload Detected:</strong> Primary stations (&gt;90% load) were automatically bypassed to protect grid integrity.
                  </div>
                </div>
              )}

              {/* Station Card */}
              <div style={{
                background: '#fff', padding: 18, borderRadius: 12,
                border: '1px solid #E2E8F0', marginBottom: 16,
                boxShadow: '0 1px 4px rgba(0,0,0,0.06)'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8, marginBottom: 12 }}>
                  <div>
                    <h3 style={{ fontSize: 18, fontWeight: 800, color: '#1A202C' }}>{recStation.name}</h3>
                    <div style={{ fontSize: 13, color: '#2563EB', display: 'flex', alignItems: 'center', gap: 4, marginTop: 4 }}>
                      <MapPin size={13} /> {recStation.location}
                    </div>
                  </div>
                  <span className="badge badge-green">✓ RECOMMENDED</span>
                </div>

                <div style={{ borderTop: '1px solid #F1F3F5', paddingTop: 12 }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                    <div>
                      <div style={{ fontSize: 11, color: '#A0AEC0', marginBottom: 2 }}>Available Port</div>
                      <div style={{ fontSize: 14, fontWeight: 700, color: '#16A34A' }}>
                        Port #{recStation.selectedPortNumber || 1} (CCS2 60kW)
                      </div>
                    </div>
                    <div>
                      <div style={{ fontSize: 11, color: '#A0AEC0', marginBottom: 2 }}>Grid Zone Load</div>
                      <div style={{ fontSize: 14, fontWeight: 700, color: recStation.gridLoadPercentage >= 70 ? '#D97706' : '#16A34A' }}>
                        {recStation.gridLoadPercentage}% ({recStation.gridZoneName})
                      </div>
                    </div>
                    <div>
                      <div style={{ fontSize: 11, color: '#A0AEC0', marginBottom: 2 }}>Load Score</div>
                      <div style={{ fontSize: 14, fontWeight: 700, color: '#2563EB' }}>
                        {recStation.loadScore} (Lowest)
                      </div>
                    </div>
                    <div>
                      <div style={{ fontSize: 11, color: '#A0AEC0', marginBottom: 2 }}>Estimated Cost</div>
                      <div style={{ fontSize: 16, fontWeight: 800, color: '#D97706' }}>
                        ₹{recStation.estimatedCost}
                        <span style={{ fontSize: 11, fontWeight: 400, color: '#A0AEC0', marginLeft: 4 }}>
                          (₹{recStation.pricePerKwh}/kWh)
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <button
                onClick={() => handleConfirmAllocation(recStation)}
                className="btn btn-success"
                style={{ width: '100%', padding: '13px', fontSize: 15 }}
                disabled={confirming}
              >
                {confirming
                  ? <><RefreshCw size={16} className="spin" /> Reserving Port &amp; Session...</>
                  : <>Confirm Charging <CheckCircle size={18} /></>
                }
              </button>
            </div>
          ) : !error ? (
            <div style={{ textAlign: 'center', padding: '30px 0', color: '#A0AEC0' }}>
              No recommendations yet. Click "Calculate Optimal Station".
            </div>
          ) : null}
        </div>
      </div>

      {/* Alternative Stations Table */}
      {altStations.length > 0 && (
        <div className="glass-card" style={{ marginTop: 24 }}>
          <h3 className="section-title">
            All Evaluated Stations — Ranked by Grid Load Score
          </h3>
          <div style={{ overflowX: 'auto' }}>
            <table className="custom-table">
              <thead>
                <tr>
                  <th>Station Name</th>
                  <th>Location</th>
                  <th>Ports Avail.</th>
                  <th>Grid Load</th>
                  <th>Load Score</th>
                  <th>Cost ({requiredEnergy} kWh)</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {altStations.map(st => (
                  <tr key={st.id} style={{ opacity: st.isOverloadedZone ? 0.55 : 1 }}>
                    <td style={{ fontWeight: 700 }}>
                      {st.name}
                      {st.isOverloadedZone && <span className="badge badge-red" style={{ fontSize: 9, marginLeft: 6 }}>OVERLOADED</span>}
                    </td>
                    <td style={{ color: '#718096', fontSize: 13 }}>{st.location}</td>
                    <td style={{ fontWeight: 600, color: st.availablePorts > 0 ? '#16A34A' : '#DC2626' }}>
                      {st.availablePorts} / {st.totalPorts}
                    </td>
                    <td>
                      <span className={`badge ${st.gridLoadPercentage >= 90 ? 'badge-red' : st.gridLoadPercentage >= 70 ? 'badge-yellow' : 'badge-green'}`}>
                        {st.gridLoadPercentage}%
                      </span>
                    </td>
                    <td style={{ fontFamily: 'monospace', color: '#2563EB', fontWeight: 600 }}>{st.loadScore}</td>
                    <td style={{ fontWeight: 700, color: '#D97706' }}>₹{st.estimatedCost}</td>
                    <td>
                      <button
                        onClick={() => handleConfirmAllocation(st)}
                        className="btn btn-secondary"
                        style={{ padding: '5px 10px', fontSize: 12 }}
                        disabled={st.availablePorts === 0}
                      >
                        Select
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
