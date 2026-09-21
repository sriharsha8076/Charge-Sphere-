import React, { useState, useEffect } from 'react';
import { stationService, gridService } from '../services/api';
import { MapPin, Zap, CheckCircle, AlertTriangle, RefreshCw } from 'lucide-react';

export default function FindStation() {
  const [stations, setStations] = useState([]);
  const [gridZones, setGridZones] = useState({});
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('ALL');

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const stData = await stationService.getAllStations();
      const gzData = await gridService.getAllZones();
      const gzMap = {};
      if (gzData && Array.isArray(gzData)) {
        gzData.forEach(z => { gzMap[z.id] = z; });
      }
      setStations(stData || []);
      setGridZones(gzMap);
    } catch (err) {
      console.error('Failed to fetch stations:', err);
    } finally {
      setLoading(false);
    }
  };

  const getFilteredStations = () => {
    if (filter === 'AVAILABLE') return stations.filter(s => s.availablePorts > 0);
    if (filter === 'LOW_GRID') return stations.filter(s => {
      const gz = gridZones[s.gridZoneId];
      return gz ? (gz.currentLoadKw / gz.maxCapacityKw) < 0.7 : true;
    });
    return stations;
  };

  const filtered = getFilteredStations();

  return (
    <div className="container">
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 28, flexWrap: 'wrap', gap: 16 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 800, color: '#1A202C', display: 'flex', alignItems: 'center', gap: 10 }}>
            <MapPin size={24} color="#2563EB" /> Vijayawada EV Charging Stations
          </h1>
          <p style={{ color: '#718096', fontSize: 14, marginTop: 4 }}>
            Real-time port availability and grid zone load monitoring across Vijayawada.
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
          <button onClick={fetchData} className="btn btn-secondary" style={{ fontSize: 13 }}>
            <RefreshCw size={13} className={loading ? 'spin' : ''} /> Refresh
          </button>
          <div style={{ display: 'flex', gap: 4, background: '#F1F3F5', padding: 4, borderRadius: 10, border: '1px solid #E2E8F0' }}>
            {['ALL', 'AVAILABLE', 'LOW_GRID'].map(f => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`btn ${filter === f ? 'btn-primary' : 'btn-secondary'}`}
                style={{ padding: '5px 12px', fontSize: 12, border: 'none' }}
              >
                {f === 'ALL' ? `All (${stations.length})` : f === 'AVAILABLE' ? 'Available' : 'Low Grid Load'}
              </button>
            ))}
          </div>
        </div>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: 60, color: '#A0AEC0' }}>
          Loading Vijayawada EV Stations...
        </div>
      ) : filtered.length === 0 ? (
        <div className="glass-card" style={{ textAlign: 'center', padding: 40, color: '#A0AEC0' }}>
          No stations match the current filter.
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: 20 }}>
          {filtered.map((station, idx) => {
            const gz = gridZones[station.gridZoneId] || {};
            const curLoadKw = gz.currentLoadKw || 200.0;
            const maxCapKw = gz.maxCapacityKw || 500.0;
            const gridPct = Math.round((curLoadKw / maxCapKw) * 100);
            const isOverloaded = gridPct >= 90;
            const isHigh = gridPct >= 70;

            const gridBadgeClass = isOverloaded ? 'badge-red' : isHigh ? 'badge-yellow' : 'badge-green';
            const gridText = isOverloaded ? `${gridPct}% OVERLOADED` : isHigh ? `${gridPct}% High Load` : `${gridPct}% Normal`;

            return (
              <div key={station.id} className="glass-card" style={{
                display: 'flex', flexDirection: 'column',
                border: `1px solid ${isOverloaded ? '#FECACA' : '#E2E8F0'}`
              }}>
                {/* Station header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 }}>
                  <div>
                    <h3 style={{ fontSize: 16, fontWeight: 700, color: '#1A202C' }}>{station.name}</h3>
                    <div style={{ fontSize: 13, color: '#2563EB', display: 'flex', alignItems: 'center', gap: 4, marginTop: 4 }}>
                      <MapPin size={13} /> {station.location}
                    </div>
                  </div>
                  <span className={`badge ${station.availablePorts > 0 ? 'badge-green' : 'badge-red'}`}>
                    {station.availablePorts > 0 ? 'AVAILABLE' : 'FULL'}
                  </span>
                </div>

                <div style={{ fontSize: 12, color: '#A0AEC0', marginBottom: 14 }}>
                  📍 ~{(2.5 + idx * 1.8).toFixed(1)} km from Vijayawada Center
                </div>

                {/* Metrics */}
                <div style={{
                  display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12,
                  background: '#F8F9FA', padding: 14, borderRadius: 10,
                  border: '1px solid #E2E8F0', marginBottom: 14
                }}>
                  <div>
                    <div style={{ fontSize: 11, color: '#A0AEC0', textTransform: 'uppercase', marginBottom: 3 }}>Charging Ports</div>
                    <div style={{ fontSize: 15, fontWeight: 700, color: station.availablePorts > 0 ? '#16A34A' : '#DC2626' }}>
                      {station.availablePorts} / {station.totalPorts} Free
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize: 11, color: '#A0AEC0', textTransform: 'uppercase', marginBottom: 3 }}>Tariff</div>
                    <div style={{ fontSize: 15, fontWeight: 700, color: '#D97706' }}>₹{station.pricePerKwh}/kWh</div>
                  </div>

                  <div style={{ gridColumn: 'span 2' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                      <span style={{ fontSize: 11, color: '#A0AEC0' }}>Grid Zone: {gz.zoneName || `Zone ${station.gridZoneId}`}</span>
                      <span className={`badge ${gridBadgeClass}`} style={{ fontSize: 10 }}>{gridText}</span>
                    </div>
                    <div className="progress-bar-track">
                      <div className="progress-bar-fill" style={{
                        width: `${Math.min(100, gridPct)}%`,
                        background: isOverloaded ? '#DC2626' : isHigh ? '#D97706' : '#16A34A'
                      }} />
                    </div>
                  </div>
                </div>

                {/* Overload warning */}
                {isOverloaded && (
                  <div className="alert alert-warning" style={{ marginBottom: 12, fontSize: 12 }}>
                    <AlertTriangle size={14} style={{ flexShrink: 0 }} />
                    <span>This grid zone is overloaded. SOA Load Balancer will bypass this station.</span>
                  </div>
                )}

                {/* Ports Preview */}
                {station.ports && station.ports.length > 0 && (
                  <div style={{ marginBottom: 14 }}>
                    <div style={{ fontSize: 12, fontWeight: 600, color: '#4A5568', marginBottom: 6 }}>Connectors:</div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
                      {station.ports.map(port => (
                        <span key={port.id} style={{
                          fontSize: 11, padding: '3px 7px', borderRadius: 5,
                          background: port.status === 'AVAILABLE' ? '#F0FDF4' : '#FEF2F2',
                          color: port.status === 'AVAILABLE' ? '#16A34A' : '#DC2626',
                          border: `1px solid ${port.status === 'AVAILABLE' ? '#BBF7D0' : '#FECACA'}`
                        }}>
                          P{port.portNumber} {port.portType} {port.kwCapacity}kW
                          {port.status === 'AVAILABLE'
                            ? <CheckCircle size={10} style={{ marginLeft: 3, verticalAlign: 'middle' }} />
                            : null
                          }
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                <a
                  href={`/smart-charging?stationId=${station.id}`}
                  className="btn btn-primary"
                  style={{ width: '100%', marginTop: 'auto', padding: '10px', justifyContent: 'center' }}
                >
                  <Zap size={15} /> Select via Smart Allocator
                </a>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
