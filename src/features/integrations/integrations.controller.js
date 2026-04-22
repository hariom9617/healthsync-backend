import User from '../../../models/User.model.js'
import HealthMetric from '../../../models/HealthMetric.model.js'

// Mock Health Connect integration functions
const mockHealthConnectService = {
  async checkConnection(userId) {
    // In a real implementation, this would check actual Health Connect status
    // For demo, we'll simulate connection status
    return {
      connected: Math.random() > 0.3, // 70% chance of being connected
      lastSynced: new Date(Date.now() - Math.random() * 24 * 60 * 60 * 1000), // Random time in last 24h
      permissions: ['steps', 'heart_rate', 'sleep', 'weight', 'workouts'],
    }
  },

  async syncData(userId) {
    // Mock sync process - in real implementation, this would call Health Connect APIs
    const mockData = [
      {
        type: 'steps',
        value: Math.floor(Math.random() * 15000) + 5000,
        unit: 'count',
        recordedAt: new Date(Date.now() - Math.random() * 24 * 60 * 60 * 1000),
      },
      {
        type: 'heart_rate',
        value: Math.floor(Math.random() * 40) + 60, // 60-100 bpm
        unit: 'bpm',
        recordedAt: new Date(Date.now() - Math.random() * 12 * 60 * 60 * 1000),
      },
      {
        type: 'sleep',
        value: Math.random() * 3 + 5, // 5-8 hours
        unit: 'hours',
        recordedAt: new Date(Date.now() - Math.random() * 24 * 60 * 60 * 1000),
      },
    ]

    const syncedMetrics = []
    for (const data of mockData) {
      try {
        const metric = await HealthMetric.create({
          userId,
          ...data,
          source: 'health_connect',
        })
        syncedMetrics.push(metric)
      } catch (error) {
        // Skip duplicates
      }
    }

    return {
      synced: syncedMetrics.length,
      metrics: syncedMetrics,
    }
  },

  async revokeConnection(userId) {
    // Mock revocation - in real implementation, this would revoke Health Connect permissions
    return { success: true }
  },
}

export const getIntegrationStatus = async (req, res) => {
  try {
    const user = await User.findById(req.user._id)
    const healthConnectStatus = await mockHealthConnectService.checkConnection(req.user._id)

    const integrationStatus = {
      healthConnect: {
        connected: healthConnectStatus.connected,
        lastSynced: healthConnectStatus.lastSynced,
        permissions: healthConnectStatus.permissions,
        backgroundSync: user.settings?.backgroundSync || false,
        autoImport: user.settings?.autoImport || false,
      },
      devices: {
        connected: healthConnectStatus.connected ? 1 : 0,
        lastSync: healthConnectStatus.lastSynced,
      },
    }

    res.json({
      success: true,
      data: integrationStatus,
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to get integration status',
    })
  }
}

export const triggerSync = async (req, res) => {
  try {
    const { type = 'all' } = req.query

    if (!mockHealthConnectService.checkConnection(req.user._id).connected) {
      return res.status(400).json({
        success: false,
        message: 'Health Connect not connected',
      })
    }

    const syncResult = await mockHealthConnectService.syncData(req.user._id)

    // Update user's last synced time
    await User.findByIdAndUpdate(req.user._id, {
      'settings.lastSynced': new Date(),
    })

    res.json({
      success: true,
      data: {
        synced: syncResult.synced,
        metrics: syncResult.metrics,
        syncedAt: new Date(),
      },
      message: `Synced ${syncResult.synced} metrics successfully`,
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to trigger sync',
    })
  }
}

export const updateIntegrationSettings = async (req, res) => {
  try {
    const { backgroundSync, autoImport, syncFrequency, dataTypes } = req.body

    const updateData = {}
    if (backgroundSync !== undefined) updateData['settings.backgroundSync'] = backgroundSync
    if (autoImport !== undefined) updateData['settings.autoImport'] = autoImport
    if (syncFrequency !== undefined) updateData['settings.syncFrequency'] = syncFrequency
    if (dataTypes !== undefined) updateData['settings.dataTypes'] = dataTypes

    const updatedUser = await User.findByIdAndUpdate(
      req.user._id,
      { $set: updateData },
      { new: true }
    )

    res.json({
      success: true,
      data: {
        backgroundSync: updatedUser.settings?.backgroundSync || false,
        autoImport: updatedUser.settings?.autoImport || false,
        syncFrequency: updatedUser.settings?.syncFrequency || 'daily',
        dataTypes: updatedUser.settings?.dataTypes || ['steps', 'heart_rate'],
      },
      message: 'Integration settings updated',
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to update integration settings',
    })
  }
}

export const connectHealthConnect = async (req, res) => {
  try {
    // In a real implementation, this would initiate the Health Connect OAuth flow
    // For demo, we'll simulate a successful connection

    const mockConnectionResult = {
      connected: true,
      permissions: ['steps', 'heart_rate', 'sleep', 'weight', 'workouts'],
      accessToken: 'mock_access_token_' + Date.now(),
    }

    // Update user's integration status
    await User.findByIdAndUpdate(req.user._id, {
      'settings.healthConnectConnected': true,
      'settings.healthConnectToken': mockConnectionResult.accessToken,
      'settings.lastSynced': new Date(),
    })

    res.json({
      success: true,
      data: mockConnectionResult,
      message: 'Health Connect connected successfully',
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to connect Health Connect',
    })
  }
}

export const disconnectHealthConnect = async (req, res) => {
  try {
    await mockHealthConnectService.revokeConnection(req.user._id)

    // Update user's integration status
    await User.findByIdAndUpdate(req.user._id, {
      'settings.healthConnectConnected': false,
      $unset: {
        'settings.healthConnectToken': 1,
        'settings.lastSynced': 1,
      },
    })

    res.json({
      success: true,
      message: 'Health Connect disconnected successfully',
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to disconnect Health Connect',
    })
  }
}

export const getSyncHistory = async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query
    const skip = (page - 1) * limit

    // Get recent health metrics from Health Connect
    const healthConnectMetrics = await HealthMetric.find({
      userId: req.user._id,
      source: 'health_connect',
    })
      .sort({ recordedAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))

    // Group by sync date
    const syncHistory = healthConnectMetrics.reduce((acc, metric) => {
      const syncDate = metric.recordedAt.toISOString().split('T')[0]
      if (!acc[syncDate]) {
        acc[syncDate] = {
          date: syncDate,
          metrics: [],
          totalSynced: 0,
        }
      }
      acc[syncDate].metrics.push({
        type: metric.type,
        value: metric.value,
        unit: metric.unit,
        recordedAt: metric.recordedAt,
      })
      acc[syncDate].totalSynced++
      return acc
    }, {})

    const historyArray = Object.values(syncHistory).sort(
      (a, b) => new Date(b.date) - new Date(a.date)
    )

    res.json({
      success: true,
      data: historyArray,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: await HealthMetric.countDocuments({
          userId: req.user._id,
          source: 'health_connect',
        }),
      },
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to get sync history',
    })
  }
}
