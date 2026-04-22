import { SocialPost } from '../../models/SocialPost.model.js'
import HealthMetric from '../../../models/HealthMetric.model.js'
import User from '../../../models/User.model.js'

export const getFeed = async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query
    const skip = (page - 1) * limit

    const posts = await SocialPost.find({ visibility: 'public' })
      .populate('userId', 'firstName lastName profileImage')
      .populate('kudos.userId', 'firstName lastName')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))

    res.json({
      success: true,
      data: posts,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: await SocialPost.countDocuments({ visibility: 'public' }),
      },
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch social feed',
    })
  }
}

export const giveKudos = async (req, res) => {
  try {
    const { postId } = req.params
    const userId = req.user._id

    const post = await SocialPost.findById(postId)
    if (!post) {
      return res.status(404).json({
        success: false,
        message: 'Post not found',
      })
    }

    // Check if user already gave kudos
    const alreadyGave = post.kudos.some((kudo) => kudo.userId.toString() === userId.toString())
    if (alreadyGave) {
      return res.status(400).json({
        success: false,
        message: 'You already gave kudos to this post',
      })
    }

    // Add kudos
    post.kudos.push({ userId })
    post.kudosCount += 1
    await post.save()

    const updatedPost = await SocialPost.findById(postId)
      .populate('userId', 'firstName lastName profileImage')
      .populate('kudos.userId', 'firstName lastName')

    res.json({
      success: true,
      data: updatedPost,
      message: 'Kudos given successfully',
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to give kudos',
    })
  }
}

export const getWeeklyStepsLeaderboard = async (req, res) => {
  try {
    // Get current week start (Monday)
    const now = new Date()
    const weekStart = new Date(now)
    weekStart.setDate(now.getDate() - now.getDay() + 1) // Monday
    weekStart.setUTCHours(0, 0, 0, 0)

    // Aggregate steps for each user this week
    const weeklySteps = await HealthMetric.aggregate([
      {
        $match: {
          type: 'steps',
          recordedAt: { $gte: weekStart },
        },
      },
      {
        $group: {
          _id: '$userId',
          totalSteps: { $sum: '$value' },
          daysActive: { $addToSet: { $dateToString: { format: '%Y-%m-%d', date: '$recordedAt' } } },
        },
      },
      {
        $addFields: {
          daysCount: { $size: '$daysActive' },
        },
      },
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'user',
        },
      },
      {
        $unwind: '$user',
      },
      {
        $project: {
          userId: '$_id',
          totalSteps: 1,
          daysCount: 1,
          firstName: '$user.firstName',
          lastName: '$user.lastName',
          profileImage: '$user.profileImage',
        },
      },
      {
        $sort: { totalSteps: -1 },
      },
      {
        $limit: 10,
      },
    ])

    res.json({
      success: true,
      data: weeklySteps,
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch weekly steps leaderboard',
    })
  }
}

export const createPost = async (req, res) => {
  try {
    const { type, title, description, metadata, imageUrl } = req.body

    const post = await SocialPost.create({
      userId: req.user._id,
      type,
      title,
      description,
      metadata,
      imageUrl,
    })

    const populatedPost = await SocialPost.findById(post._id).populate(
      'userId',
      'firstName lastName profileImage'
    )

    res.status(201).json({
      success: true,
      data: populatedPost,
      message: 'Post created successfully',
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to create post',
    })
  }
}

export const deletePost = async (req, res) => {
  try {
    const post = await SocialPost.findOneAndDelete({
      _id: req.params.id,
      userId: req.user._id,
    })

    if (!post) {
      return res.status(404).json({
        success: false,
        message: 'Post not found',
      })
    }

    res.json({
      success: true,
      message: 'Post deleted successfully',
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to delete post',
    })
  }
}

export const getUserPosts = async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query
    const skip = (page - 1) * limit

    const posts = await SocialPost.find({ userId: req.user._id })
      .populate('kudos.userId', 'firstName lastName')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))

    res.json({
      success: true,
      data: posts,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: await SocialPost.countDocuments({ userId: req.user._id }),
      },
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch user posts',
    })
  }
}
