/* eslint-disable import/no-unresolved */
import http from 'k6/http'
import { check, sleep } from 'k6'
import { Rate } from 'k6/metrics'

/* eslint-disable no-undef */
const BASE_URL = __ENV.BASE_URL || 'http://localhost:5000'
const AUTH_TOKEN = __ENV.AUTH_TOKEN || ''

const errorRate = new Rate('error_rate')

export const options = {
  stages: [
    { duration: '20s', target: 20 }, // ramp up to 20 VUs
    { duration: '80s', target: 20 }, // hold
    { duration: '20s', target: 0 }, // ramp down
  ],
  thresholds: {
    http_req_duration: ['p(95)<3000'], // AI latency budget: 3s
    error_rate: ['rate<0.05'], // allow up to 5% errors (AI service may rate-limit)
  },
}

const authHeaders = {
  headers: {
    Authorization: `Bearer ${AUTH_TOKEN}`,
    'Content-Type': 'application/json',
  },
}

const NUTRITION_CONTEXTS = [
  { calories: 1800, protein: 120, carbs: 200, fat: 60, goal: 'weight_loss' },
  { calories: 2500, protein: 180, carbs: 280, fat: 80, goal: 'muscle_gain' },
  { calories: 2000, protein: 150, carbs: 230, fat: 70, goal: 'general_health' },
]

export default function () {
  const ctx = NUTRITION_CONTEXTS[Math.floor(Math.random() * NUTRITION_CONTEXTS.length)]

  const payload = JSON.stringify({
    calories: ctx.calories,
    protein: ctx.protein,
    carbs: ctx.carbs,
    fat: ctx.fat,
    goal: ctx.goal,
  })

  const res = http.post(`${BASE_URL}/api/ai/nutrition-tip`, payload, authHeaders)

  const ok = check(res, {
    'status 200 or 429': (r) => r.status === 200 || r.status === 429,
    'response has success field': (r) => {
      try {
        return Object.prototype.hasOwnProperty.call(JSON.parse(r.body), 'success')
      } catch {
        return false
      }
    },
  })

  errorRate.add(!ok)

  // Think time between iterations — AI is expensive, don't hammer it
  sleep(2)
}
