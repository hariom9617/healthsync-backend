/* eslint-disable import/no-unresolved */
import http from 'k6/http'
import { check, sleep, group } from 'k6'
import { Rate } from 'k6/metrics'

/* eslint-disable no-undef */
const BASE_URL = __ENV.BASE_URL || 'http://localhost:5000'
const AUTH_TOKEN = __ENV.AUTH_TOKEN || ''

const errorRate = new Rate('error_rate')

export const options = {
  stages: [
    { duration: '30s', target: 100 }, // ramp up
    { duration: '120s', target: 100 }, // hold 100 VUs for 2 min
    { duration: '30s', target: 0 }, // ramp down
  ],
  thresholds: {
    http_req_duration: ['p(95)<800', 'p(99)<2000'],
    error_rate: ['rate<0.02'],
  },
}

const authHeaders = {
  headers: {
    Authorization: `Bearer ${AUTH_TOKEN}`,
    'Content-Type': 'application/json',
  },
}

export default function () {
  const today = new Date().toISOString().split('T')[0]

  group('daily summary', () => {
    const res = http.get(`${BASE_URL}/api/nutrition/daily-summary?date=${today}`, authHeaders)
    const ok = check(res, {
      'daily-summary status 200': (r) => r.status === 200,
      'daily-summary has data': (r) => {
        try {
          return JSON.parse(r.body).success === true
        } catch {
          return false
        }
      },
    })
    errorRate.add(!ok)
  })

  group('meals list', () => {
    const res = http.get(`${BASE_URL}/api/nutrition/meals?date=${today}`, authHeaders)
    const ok = check(res, {
      'meals status 200 or 404': (r) => r.status === 200 || r.status === 404,
    })
    errorRate.add(!ok)
  })

  sleep(0.5)
}
