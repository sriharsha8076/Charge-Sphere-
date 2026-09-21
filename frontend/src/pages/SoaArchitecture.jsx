import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Cpu, Server, Network, ArrowRight, CheckCircle, XCircle, RefreshCw, Play, Layers } from 'lucide-react';

export default function SoaArchitecture() {
  const [serviceStatuses, setServiceStatuses] = useState({
    gateway:      { name: 'API Gateway',                         port: 8080, status: 'UNKNOWN', path: '/actuator/health' },
    user:         { name: 'User Service',                        port: 8081, status: 'UNKNOWN', path: '/users/count' },
    station:      { name: 'Station Service',                     port: 8082, status: 'UNKNOWN', path: '/stations' },
    charging:     { name: 'Charging Session Service',            port: 8083, status: 'UNKNOWN', path: '/sessions/stats' },
    grid:         { name: 'Grid Monitoring Service',             port: 8084, status: 'UNKNOWN', path: '/grid/status' },
    loadBalancer: { name: 'Load Balancing Service (Orchestrator)', port: 8085, status: 'UNKNOWN', path: '/load-balancer/recommendations' },
    notification: { name: 'Notification Service',               port: 8086, status: 'UNKNOWN', path: '/notifications/all' }
  });

  const [simulating, setSimulating] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [pinging, setPinging] = useState(false);

  useEffect(() => { checkServiceHealth(); }, []);

  const checkServiceHealth = async () => {
    setPinging(true);
    const updated = { ...serviceStatuses };
    for (const key of Object.keys(updated)) {
      const s = updated[key];
      try {
        await axios.get(`http://localhost:${s.port}${s.path}`, { timeout: 1500 });
        updated[key] = { ...s, status: 'UP' };
      } catch (err) {
        updated[key] = { ...s, status: err.response ? 'UP' : 'DOWN' };
      }
    }
    setServiceStatuses({ ...updated });
    setPinging(false);
  };

  const sequenceSteps = [
    { step: 1, title: 'User Request Dispatch',     from: 'React Frontend',           to: 'API Gateway :8080',            path: 'POST /load-balancer/select-station', desc: 'User requests smart charging allocation for 25 kWh EV charging.' },
    { step: 2, title: 'Orchestrator Routing',       from: 'API Gateway',              to: 'Load Balancing Service :8085', path: 'lb://load-balancer-service',         desc: 'Gateway resolves service instance via Eureka Service Registry.' },
    { step: 3, title: 'Fetch Available Stations',   from: 'Load Balancing Service',  to: 'Station Service :8082',        path: 'GET /stations',                      desc: 'Retrieves all 5 Vijayawada EV stations and charging ports.' },
    { step: 4, title: 'Fetch Grid Zone Loads',      from: 'Load Balancing Service',  to: 'Grid Monitoring Service :8084',path: 'GET /grid/zones',                    desc: 'Retrieves live kW load and capacity for all 5 grid zones.' },
    { step: 5, title: 'Load Scoring & Selection',   from: 'Load Balancing Service',  to: 'Internal Algorithm',           path: 'Score = GridLoad / MaxCapacity',     desc: 'Calculates score, avoids >90% overloaded zones, selects optimal station.' },
    { step: 6, title: 'Port Reservation',           from: 'Load Balancing Service',  to: 'Station Service :8082',        path: 'POST /stations/5/ports/21/occupy',   desc: 'Reserves port and updates available port count.' },
    { step: 7, title: 'Start Charging Session',     from: 'Load Balancing Service',  to: 'Charging Session Service :8083', path: 'POST /sessions/start',             desc: 'Creates active charging session entry in database.' },
    { step: 8, title: 'Update Grid Zone Load',      from: 'Load Balancing Service',  to: 'Grid Monitoring Service :8084',path: 'POST /grid/zones/5/add-load',        desc: 'Adds +50 kW charger load to the grid zone ledger.' },
    { step: 9, title: 'User Notification',          from: 'Charging Session Service',to: 'Notification Service :8086',   path: 'POST /notifications/send',           desc: 'Dispatches session start confirmation alert to user dashboard.' }
  ];

  const runSequenceSimulation = () => {
    setSimulating(true);
    setCurrentStep(1);
    let idx = 1;
    const interval = setInterval(() => {
      idx++;
      if (idx > sequenceSteps.length) {
        clearInterval(interval);
        setSimulating(false);
      } else {
        setCurrentStep(idx);
      }
    }, 1100);
  };

  const soaPrinciples = [
    { name: '1. Loose Coupling',      color: '#2563EB', desc: 'Each Spring Boot service operates independently with its own data models and JPA configurations.' },
    { name: '2. Service Contract',    color: '#16A34A', desc: 'All services communicate via defined REST API JSON contracts with standard HTTP status codes.' },
    { name: '3. Composability',       color: '#7C3AED', desc: 'The Load Balancing Service orchestrates Station, Grid, Charging, and Notification services.' },
    { name: '4. Discoverability',     color: '#0891B2', desc: 'Services auto-register with Eureka Service Registry at port 8761 for dynamic lookup.' },
    { name: '5. Stateless Services',  color: '#D97706', desc: 'REST endpoints process requests independently without server-side session state. JWT for auth.' },
    { name: '6. Reusability',         color: '#DC2626', desc: 'Grid and Station services expose standalone APIs consumable by mobile, web, or utility providers.' },
    { name: '7. Interoperability',    color: '#059669', desc: 'HTTP/JSON messaging guarantees language-agnostic integration across platforms.' }
  ];

  const upCount = Object.values(serviceStatuses).filter(s => s.status === 'UP').length;

  return (
    <div className="container">
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 28 }}>
        <div style={{
          width: 48, height: 48, borderRadius: 12,
          background: 'linear-gradient(135deg, #7C3AED 0%, #2563EB 100%)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
        }}>
          <Cpu size={26} color="#fff" />
        </div>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: '#1A202C' }}>
            SOA Architecture Blueprint
          </h1>
          <p style={{ color: '#718096', fontSize: 13, marginTop: 2 }}>
            Interactive microservice map, live health monitor, and REST sequence simulator.
          </p>
        </div>
      </div>

      {/* Live Health Monitor */}
      <div className="glass-card" style={{ marginBottom: 24 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, flexWrap: 'wrap', gap: 12 }}>
          <div>
            <h2 className="section-title" style={{ marginBottom: 2 }}>
              <Server size={18} color="#7C3AED" /> Live Service Health Monitor
            </h2>
            <p style={{ fontSize: 13, color: '#718096' }}>
              {upCount} / {Object.keys(serviceStatuses).length} microservices online
            </p>
          </div>
          <button onClick={checkServiceHealth} className="btn btn-secondary" style={{ fontSize: 13 }} disabled={pinging}>
            <RefreshCw size={13} className={pinging ? 'spin' : ''} /> Ping All Services
          </button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))', gap: 12 }}>
          {Object.keys(serviceStatuses).map(key => {
            const s = serviceStatuses[key];
            const isUp = s.status === 'UP';
            const isDown = s.status === 'DOWN';
            return (
              <div key={key} style={{
                padding: 14, borderRadius: 10,
                background: isUp ? '#F0FDF4' : isDown ? '#FEF2F2' : '#F8F9FA',
                border: `1px solid ${isUp ? '#BBF7D0' : isDown ? '#FECACA' : '#E2E8F0'}`,
                display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10
              }}>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 13, color: '#1A202C' }}>{s.name}</div>
                  <div style={{ fontSize: 11, color: '#A0AEC0', fontFamily: 'monospace', marginTop: 1 }}>
                    localhost:{s.port}
                  </div>
                </div>
                {isUp ? (
                  <span className="badge badge-green"><CheckCircle size={11} /> UP</span>
                ) : isDown ? (
                  <span className="badge badge-red"><XCircle size={11} /> DOWN</span>
                ) : (
                  <span className="badge badge-yellow">CHECKING...</span>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Sequence Simulator */}
      <div className="glass-card" style={{ marginBottom: 24 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18, flexWrap: 'wrap', gap: 12 }}>
          <div>
            <h2 className="section-title" style={{ marginBottom: 2 }}>
              <Network size={18} color="#2563EB" /> REST Communication Sequence Simulator
            </h2>
            <p style={{ fontSize: 13, color: '#718096' }}>
              Trace step-by-step REST calls across microservices during Smart Allocation.
            </p>
          </div>
          <button
            onClick={runSequenceSimulation}
            className="btn btn-primary"
            disabled={simulating}
            style={{ fontSize: 13 }}
          >
            <Play size={14} /> {simulating ? 'Tracing...' : 'Simulate REST Flow'}
          </button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {sequenceSteps.map(step => {
            const isActive = currentStep === step.step;
            const isCompleted = currentStep > step.step;

            return (
              <div key={step.step} style={{
                padding: '14px 16px',
                borderRadius: 10,
                background: isActive ? '#EFF6FF' : isCompleted ? '#F0FDF4' : '#F8F9FA',
                border: `1px solid ${isActive ? '#BFDBFE' : isCompleted ? '#BBF7D0' : '#E2E8F0'}`,
                transition: 'all 0.3s ease',
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                flexWrap: 'wrap', gap: 12
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{
                    width: 30, height: 30, borderRadius: '50%',
                    background: isActive ? '#2563EB' : isCompleted ? '#16A34A' : '#E2E8F0',
                    color: isActive || isCompleted ? '#fff' : '#A0AEC0',
                    fontWeight: 800, fontSize: 13,
                    display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
                  }}>
                    {isCompleted ? <CheckCircle size={15} /> : step.step}
                  </div>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 700, color: '#1A202C' }}>{step.title}</div>
                    <div style={{ fontSize: 12, color: '#718096', marginTop: 1 }}>{step.desc}</div>
                  </div>
                </div>

                <div style={{ textAlign: 'right', flexShrink: 0 }}>
                  <div style={{ fontSize: 12, color: '#2563EB', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4, justifyContent: 'flex-end' }}>
                    {step.from} <ArrowRight size={11} /> {step.to}
                  </div>
                  <div style={{ fontSize: 11, fontFamily: 'monospace', color: '#D97706', marginTop: 2 }}>
                    {step.path}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* SOA Principles */}
      <div className="glass-card">
        <h2 className="section-title">
          <Layers size={18} color="#16A34A" /> 7 Core SOA Principles Demonstrated
        </h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 14 }}>
          {soaPrinciples.map((p, idx) => (
            <div key={idx} style={{
              padding: 16, borderRadius: 10,
              background: '#F8F9FA', border: '1px solid #E2E8F0',
              borderLeft: `4px solid ${p.color}`
            }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: p.color, marginBottom: 6 }}>{p.name}</div>
              <p style={{ fontSize: 13, color: '#718096', lineHeight: 1.6, margin: 0 }}>{p.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
