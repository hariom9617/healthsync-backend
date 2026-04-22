import { Challenge } from '../../models/Challenge.model.js'
import User from '../../../models/User.model.js'
import HealthMetric from '../../../models/HealthMetric.model.js'
import Workout from '../../../models/Workout.model.js'

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

    // Add user-specific info
    const challengesWithUserStatus = challenges.map((challenge) => {
      const userParticipant = challenge.participants.find(
        (p) => p.userId.toString() === req.user._id.toString()
      )

      return {
        ...challenge.toObject(),
        userJoined: !!userParticipant,
        userProgress: userParticipant?.progress || 0,
        userCompleted: !!userParticipant?.completedAt,
        participantsCount: challenge.participants.length,
      }
    })

    res.json({
      success: true,
      data: challengesWithUserStatus,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: await Challenge.countDocuments(filter),
      },
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch challenges',
    })
  }
}

export const joinChallenge = async (req, res) => {
  try {
    const { id } = req.params
    const userId = req.user._id

    const challenge = await Challenge.findById(id)
    if (!challenge) {
      return res.status(404).json({
        success: false,
        message: 'Challenge not found',
      })
    }

    // Check if user already joined
    const alreadyJoined = challenge.participants.some(
      (p) => p.userId.toString() === userId.toString()
    )
    if (alreadyJoined) {
      return res.status(400).json({
        success: false,
        message: 'Already joined this challenge',
      })
    }

    // Check if challenge is still active
    if (new Date() > challenge.endDate) {
      return res.status(400).json({
        success: false,
        message: 'Challenge has ended',
      })
    }

    // Add user to participants
    challenge.participants.push({
      userId,
      progress: 0,
      joinedAt: new Date(),
    })

    await challenge.save()

    const updatedChallenge = await Challenge.findById(id)
      .populate('createdBy', 'firstName lastName')
      .populate('participants.userId', 'firstName lastName profileImage')

    res.json({
      success: true,
      data: updatedChallenge,
      message: 'Joined challenge successfully',
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to join challenge',
    })
  }
}

export const getChallengeLeaderboard = async (req, res) => {
  try {
    const { id } = req.params

    const challenge = await Challenge.findById(id)
      .populate('participants.userId', 'firstName lastName profileImage')
      .sort({ 'participants.progress': -1 })

    if (!challenge) {
      return res.status(404).json({
        success: false,
        message: 'Challenge not found',
      })
    }

    // Sort participants by progress
    const sortedParticipants = challenge.participants
      .sort((a, b) => b.progress - a.progress)
      .map((participant, index) => ({
        ...participant.toObject(),
        rank: index + 1,
        completionPercentage: Math.round((participant.progress / challenge.targetValue) * 100),
      }))

    res.json({
      success: true,
      data: {
        challenge: {
          _id: challenge._id,
          name: challenge.name,
          targetValue: challenge.targetValue,
          unit: challenge.unit,
          goal: challenge.goal,
        },
        leaderboard: sortedParticipants,
        userRank:
          sortedParticipants.findIndex((p) => p.userId._id.toString() === req.user._id.toString()) +
          1,
      },
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch challenge leaderboard',
    })
  }
}

export const createChallenge = async (req, res) => {
  try {
    const {
      name,
      description,
      goal,
      unit,
      targetValue,
      durationDays,
      reward_xp,
      difficulty = 'Medium',
      category = 'custom',
      tags = [],
    } = req.body

    const challenge = await Challenge.create({
      name,
      description,
      goal,
      unit,
      targetValue,
      durationDays,
      reward_xp,
      difficulty,
      category,
      tags,
      createdBy: req.user._id,
      isPublic: true,
      isActive: true,
    })

    const populatedChallenge = await Challenge.findById(challenge._id).populate(
      'createdBy',
      'firstName lastName'
    )

    res.status(201).json({
      success: true,
      data: populatedChallenge,
      message: 'Challenge created successfully',
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to create challenge',
    })
  }
}

export const updateChallengeProgress = async (req, res) => {
  try {
    const { id } = req.params
    const { progress } = req.body
    const userId = req.user._id

    const challenge = await Challenge.findById(id)
    if (!challenge) {
      return res.status(404).json({
        success: false,
        message: 'Challenge not found',
      })
    }

    // Find user participant
    const participantIndex = challenge.participants.findIndex(
      (p) => p.userId.toString() === userId.toString()
    )
    if (participantIndex === -1) {
      return res.status(400).json({
        success: false,
        message: 'Not participating in this challenge',
      })
    }

    const participant = challenge.participants[participantIndex]
    participant.progress = progress
    participant.lastProgressUpdate = new Date()

    // Check if challenge is completed
    if (progress >= challenge.targetValue && !participant.completedAt) {
      participant.completedAt = new Date()

      // Award XP if not already awarded
      if (!participant.xpAwarded) {
        participant.xpAwarded = true
        // Here you would typically update user's XP in their profile
        // For now, we'll just mark it as awarded
      }
    }

    await challenge.save()

    const updatedChallenge = await Challenge.findById(id).populate(
      'participants.userId',
      'firstName lastName profileImage'
    )

    const updatedParticipant = updatedChallenge.participants[participantIndex]

    res.json({
      success: true,
      data: {
        challenge: updatedChallenge,
        participant: updatedParticipant,
        completed: !!updatedParticipant.completedAt,
      },
      message: 'Progress updated successfully',
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to update challenge progress',
    })
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

    const challengesWithUserProgress = challenges.map((challenge) => {
      const userParticipant = challenge.participants.find(
        (p) => p.userId.toString() === req.user._id.toString()
      )

      return {
        ...challenge.toObject(),
        userProgress: userParticipant?.progress || 0,
        userCompleted: !!userParticipant?.completedAt,
        userJoinedAt: userParticipant?.joinedAt,
        userCompletedAt: userParticipant?.completedAt,
        completionPercentage: Math.round(
          ((userParticipant?.progress || 0) / challenge.targetValue) * 100
        ),
      }
    })

    res.json({
      success: true,
      data: challengesWithUserProgress,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: await Challenge.countDocuments(filter),
      },
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch user challenges',
    })
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
