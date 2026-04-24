import { Challenge } from '../../models/Challenge.model.js'
import { successResponse, errorResponse } from '../../../utils/response.utils.js'

export const getChallenges = async (req, res) => {
  try {
    const { category, difficulty, page = 1, limit = 20 } = req.query
    const skip = (page - 1) * limit

    const filter = { isActive: true, isPublic: true }
    if (category) filter.category = category
    if (difficulty) filter.difficulty = difficulty

    const challenges = await Challenge.find(filter)
      .populate('createdBy', 'firstName lastName')
      .populate('participants.userId', 'firstName lastName profileImage')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))

    // Format challenges to match frontend expectations
    const formattedChallenges = challenges.map((challenge) => {
      const userParticipant = challenge.participants.find(
        (p) => p.userId.toString() === req.user._id.toString()
      )

      return {
        id: challenge._id,
        title: challenge.name,
        description: challenge.description,
        type: challenge.category || 'fitness',
        difficulty: challenge.difficulty || 'intermediate',
        duration: challenge.durationDays || 30,
        participants: challenge.participants?.length || 0,
        reward: {
          type: 'badge',
          name: challenge.reward_xp ? 'XP Master' : 'Challenge Champion',
          icon: '🏆',
        },
        requirements: {
          daily: challenge.goal || 'Complete daily activities',
          completion: `Reach ${challenge.targetValue} ${challenge.unit}`,
        },
        userJoined: !!userParticipant,
        userProgress: userParticipant?.progress || 0,
        userCompleted: !!userParticipant?.completedAt,
      }
    })

    return successResponse(res, 200, 'Challenges fetched', formattedChallenges)
  } catch (error) {
    return errorResponse(res, error.statusCode || 500, error.message)
  }
}

export const joinChallenge = async (req, res) => {
  try {
    const { id } = req.params
    const userId = req.user._id

    const challenge = await Challenge.findById(id)
    if (!challenge) {
      return errorResponse(res, 404, 'Challenge not found')
    }

    // Check if user already joined
    const alreadyJoined = challenge.participants.some(
      (p) => p.userId.toString() === userId.toString()
    )
    if (alreadyJoined) {
      return errorResponse(res, 400, 'Already joined this challenge')
    }

    // Check if challenge is still active
    if (new Date() > challenge.endDate) {
      return errorResponse(res, 400, 'Challenge has ended')
    }

    // Add user to participants
    challenge.participants.push({
      userId,
      progress: 0,
      joinedAt: new Date(),
    })

    await challenge.save()

    return successResponse(res, 200, 'Joined challenge successfully', {
      challengeId: challenge._id,
      userId: userId,
      joinedAt: new Date(),
      status: 'active',
    })
  } catch (error) {
    return errorResponse(res, error.statusCode || 500, error.message)
  }
}

export const getChallengeLeaderboard = async (req, res) => {
  try {
    const { id } = req.params

    const challenge = await Challenge.findById(id).populate(
      'participants.userId',
      'firstName lastName profileImage'
    )

    if (!challenge) {
      return errorResponse(res, 404, 'Challenge not found')
    }

    // Sort participants by progress
    const sortedParticipants = challenge.participants
      .sort((a, b) => b.progress - a.progress)
      .map((participant, index) => ({
        rank: index + 1,
        userId: participant.userId._id,
        userName: `${participant.userId.firstName} ${participant.userId.lastName}`,
        progress: Math.round((participant.progress / challenge.targetValue) * 100),
        completedDays: Math.floor(
          participant.progress / (challenge.targetValue / (challenge.durationDays || 30))
        ),
        trend: '+5%', // Simplified - would need previous data
        isCurrentUser: participant.userId._id.toString() === req.user._id.toString(),
      }))

    return successResponse(res, 200, 'Leaderboard fetched', sortedParticipants)
  } catch (error) {
    return errorResponse(res, error.statusCode || 500, error.message)
  }
}

export const createChallenge = async (req, res) => {
  try {
    const { title, description, type = 'fitness', duration = 21, requirements } = req.body

    const challenge = await Challenge.create({
      name: title,
      description,
      category: type,
      durationDays: duration,
      goal: requirements?.daily || 'Complete daily activities',
      targetValue: 100, // Default target
      unit: 'points',
      difficulty: 'intermediate',
      createdBy: req.user._id,
      isPublic: true,
      isActive: true,
    })

    return successResponse(res, 201, 'Challenge created successfully', {
      id: challenge._id,
      title: challenge.name,
      creatorId: req.user._id,
      status: 'active',
      createdAt: challenge.createdAt,
    })
  } catch (error) {
    return errorResponse(res, error.statusCode || 500, error.message)
  }
}

export const updateChallengeProgress = async (req, res) => {
  try {
    const { id } = req.params
    const userId = req.user._id

    const challenge = await Challenge.findById(id)
    if (!challenge) {
      return errorResponse(res, 404, 'Challenge not found')
    }

    // Find user participant
    const participantIndex = challenge.participants.findIndex(
      (p) => p.userId.toString() === userId.toString()
    )
    if (participantIndex === -1) {
      return errorResponse(res, 400, 'Not participating in this challenge')
    }

    const participant = challenge.participants[participantIndex]

    // Auto-update progress based on current value (simplified)
    const currentValue = participant.progress || 0
    const progressPercentage = Math.min(
      100,
      Math.round((currentValue / challenge.targetValue) * 100)
    )

    participant.progress = currentValue
    participant.lastProgressUpdate = new Date()

    // Check if challenge is completed
    if (currentValue >= challenge.targetValue && !participant.completedAt) {
      participant.completedAt = new Date()
      participant.xpAwarded = true
    }

    await challenge.save()

    return successResponse(res, 200, 'Progress updated', {
      progress: progressPercentage,
      completedDays: Math.floor(
        currentValue / (challenge.targetValue / (challenge.durationDays || 30))
      ),
      lastUpdated: new Date(),
    })
  } catch (error) {
    return errorResponse(res, error.statusCode || 500, error.message)
  }
}

export const getUserChallenges = async (req, res) => {
  try {
    const { status = 'active', page = 1, limit = 10 } = req.query
    const skip = (page - 1) * limit

    const filter = {
      'participants.userId': req.user._id,
    }

    if (status === 'active') {
      filter.endDate = { $gte: new Date() }
      filter['participants.completedAt'] = { $exists: false }
    } else if (status === 'completed') {
      filter['participants.completedAt'] = { $exists: true }
    }

    const challenges = await Challenge.find(filter)
      .populate('createdBy', 'firstName lastName')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))

    const formattedChallenges = challenges.map((challenge) => {
      const userParticipant = challenge.participants.find(
        (p) => p.userId.toString() === req.user._id.toString()
      )

      return {
        id: challenge._id,
        title: challenge.name,
        description: challenge.description,
        type: challenge.category || 'fitness',
        difficulty: challenge.difficulty || 'intermediate',
        duration: challenge.durationDays || 30,
        userProgress: Math.round(((userParticipant?.progress || 0) / challenge.targetValue) * 100),
        userCompleted: !!userParticipant?.completedAt,
        userJoinedAt: userParticipant?.joinedAt,
        userCompletedAt: userParticipant?.completedAt,
      }
    })

    return successResponse(res, 200, 'User challenges fetched', formattedChallenges)
  } catch (error) {
    return errorResponse(res, error.statusCode || 500, error.message)
  }
}

export const autoUpdateProgress = async (userId, metricType, value) => {
  try {
    // Find all active challenges the user is participating in
    const challenges = await Challenge.find({
      'participants.userId': userId,
      isActive: true,
      endDate: { $gte: new Date() },
      'participants.completedAt': { $exists: false },
    })

    for (const challenge of challenges) {
      if (challenge.goal === metricType) {
        const participantIndex = challenge.participants.findIndex(
          (p) => p.userId.toString() === userId.toString()
        )

        if (participantIndex !== -1) {
          const participant = challenge.participants[participantIndex]
          participant.progress += value
          participant.lastProgressUpdate = new Date()

          // Check if completed
          if (participant.progress >= challenge.targetValue && !participant.completedAt) {
            participant.completedAt = new Date()
            participant.xpAwarded = true
          }

          await challenge.save()
        }
      }
    }
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Failed to auto-update challenge progress:', error)
  }
}
