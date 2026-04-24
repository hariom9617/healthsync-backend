import express from 'express'
import { verifyToken } from '../middleware/auth.middleware.js'
import * as ctrl from '../src/healthMetric/healthMetric.controller.js'

const router = express.Router()

router.post('/', verifyToken, ctrl.logMetric)
router.post('/bulk', verifyToken, ctrl.bulkLogMetrics)
router.get('/', verifyToken, ctrl.getMetrics)
router.get('/list', verifyToken, ctrl.getMetricsList)
router.get('/latest', verifyToken, ctrl.getLatestMetrics)
router.get('/summary', verifyToken, ctrl.getMetricSummary)
router.delete('/:metricId', verifyToken, ctrl.deleteMetric)
router.delete('/:id', verifyToken, ctrl.deleteMetric)

export default router
