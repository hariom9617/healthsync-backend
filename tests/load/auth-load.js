/* eslint-disable import/no-unresolved */
import http from 'k6/http'
import { check, sleep } from 'k6'
import { Rate, Trend } from 'k6/metrics'

/* eslint-disable no-undef */
const BASE_URL = __ENV.BASE_URL || 'http://localhost:5000'

const errorRate = new Rate('error_rate')
const loginDuration = new Trend('login_duration')

export const options = {
  stages: [
    { duration: '30s', target: 50 }, // ramp up 0 → 50 VUs
    { duration: '60s', target: 50 }, // hold at 50 VUs
    { duration: '30s', target: 0 }, // ramp down
  ],
  thresholds: {
    http_req_duration: ['p(95)<500'], // p95 must be under 500ms
    error_rate: ['rate<0.01'], // error rate must be under 1%
  },
}

export default function () {
  const payload = JSON.stringify({
    email: `loadtest_${Math.floor(Math.random() * 1000)}@healthsync.test`,
    password: 'LoadTestPass123!',
  })

  const params = {
    headers: { 'Content-Type': 'application/json' },
  }

  const start = Date.now()
  const res = http.post(`${BASE_URL}/api/auth/login`, payload, params)
  loginDuration.add(Date.now() - start)

  const ok = check(res, {
    'status is 200 or 401': (r) => r.status === 200 || r.status === 401,
    'response has success field': (r) => {
      try {
        return Object.prototype.hasOwnProperty.call(JSON.parse(r.body), 'success')
      } catch {
        return false
      }
    },
  })

  errorRate.add(!ok)

  sleep(1)
}
