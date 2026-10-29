/**
 * k6 Load Test — EV Charging SOA Platform
 * Target: POST /load-balancer/select-station (Smart Allocate)
 *
 * Scenario:
 *   - Ramp from 0 → 50 VUs over 30 seconds
 *   - Hold at 50 VUs for 60 seconds (100+ concurrent requests)
 *   - Ramp down to 0 over 10 seconds
 *
 * How to run:
 *   1. Install k6: https://k6.io/docs/getting-started/installation/
 *      Windows: choco install k6   OR   winget install k6
 *   2. Start all services (start-all.bat)
 *   3. Login once and get a JWT token:
 *      curl -X POST http://localhost:8080/users/login \
 *           -H "Content-Type: application/json" \
 *           -d "{\"username\":\"user\",\"password\":\"password123\"}"
 *   4. Set the JWT environment variable and run:
 *      k6 run -e JWT=<your_token> load-test.js
 *   5. For HTML report:
 *      k6 run -e JWT=<token> --out json=results.json load-test.js
 *
 * Reading results:
 *   - http_req_duration: p95 < 2000ms = PASS (target response SLA)
 *   - http_req_failed:   < 1% failure rate = PASS
 *   - checks:            100% success expected
 */

import http   from 'k6/http';
import { check, sleep } from 'k6';
import { Counter, Rate, Trend } from 'k6/metrics';

// ── Custom metrics ────────────────────────────────────────────────────────────
const successfulAllocations = new Counter('successful_allocations');
const overloadBypasses       = new Counter('overload_bypasses');
const noStationAvailable     = new Counter('no_station_available');
const allocationDuration     = new Trend('allocation_duration_ms', true);
const errorRate              = new Rate('error_rate');

// ── Test configuration ────────────────────────────────────────────────────────
export const options = {
  stages: [
    { duration: '30s', target: 50 },   // Ramp up to 50 virtual users
    { duration: '60s', target: 50 },   // Hold at 50 VUs — ~100+ req/s across the window
    { duration: '30s', target: 100 },  // Spike to 100 VUs — stress test
    { duration: '30s', target: 50 },   // Come back down
    { duration: '10s', target: 0 },    // Ramp down
  ],
  thresholds: {
    // 95th percentile response time must be under 2 seconds
    'http_req_duration': ['p(95)<2000'],
    // Less than 1% of requests should fail
    'http_req_failed': ['rate<0.01'],
    // At least 99% of custom checks must pass
    'checks': ['rate>0.99'],
    // Custom: allocation endpoint p95 under 3 seconds
    'allocation_duration_ms': ['p(95)<3000'],
  },
};

const BASE_URL = __ENV.BASE_URL || 'http://localhost:8080';
const JWT      = __ENV.JWT      || '';   // Pass via: k6 run -e JWT=<token> load-test.js

// ── Shared request parameters ─────────────────────────────────────────────────
const params = {
  headers: {
    'Content-Type':  'application/json',
    'Authorization': `Bearer ${JWT}`,
  },
  timeout: '10s',
};

// ── Main virtual user scenario ────────────────────────────────────────────────
export default function () {
  const payload = JSON.stringify({
    userId:            1,
    requiredEnergyKwh: 25.0,
  });

  const startTime = Date.now();
  const res = http.post(`${BASE_URL}/load-balancer/select-station`, payload, params);
  const elapsed = Date.now() - startTime;

  allocationDuration.add(elapsed);

  // ── Assertions ────────────────────────────────────────────────────────────
  const ok = check(res, {
    'status is 200':              (r) => r.status === 200,
    'response has status field':  (r) => {
      try { return JSON.parse(r.body).status !== undefined; }
      catch (e) { return false; }
    },
    'response time < 3s':        (r) => r.timings.duration < 3000,
    'no 5xx error':               (r) => r.status < 500,
  });

  if (!ok) {
    errorRate.add(1);
  } else {
    errorRate.add(0);
    // Track allocation outcomes
    try {
      const body = JSON.parse(res.body);
      if (body.status === 'SUCCESS')              successfulAllocations.add(1);
      else if (body.status === 'WARNING_OVERLOAD') overloadBypasses.add(1);
      else if (body.status === 'NO_STATION_AVAILABLE') noStationAvailable.add(1);
    } catch (e) { /* ignore parse errors */ }
  }

  // Small think time — realistic user pacing
  sleep(Math.random() * 0.5 + 0.1); // 100ms–600ms
}

// ── Teardown: print summary ───────────────────────────────────────────────────
export function handleSummary(data) {
  console.log('\n========== EV CHARGING LOAD TEST SUMMARY ==========');
  console.log(`Total Requests:         ${data.metrics.http_reqs.values.count}`);
  console.log(`Failed Requests:        ${data.metrics.http_req_failed.values.passes}`);
  console.log(`Avg Response Time:      ${data.metrics.http_req_duration.values.avg.toFixed(0)} ms`);
  console.log(`p95 Response Time:      ${data.metrics.http_req_duration.values['p(95)'].toFixed(0)} ms`);
  console.log(`p99 Response Time:      ${data.metrics.http_req_duration.values['p(99)'].toFixed(0)} ms`);
  console.log(`Max Response Time:      ${data.metrics.http_req_duration.values.max.toFixed(0)} ms`);
  console.log('====================================================\n');

  // Save JSON results for further analysis
  return {
    'load-test-results.json': JSON.stringify(data, null, 2),
  };
}
