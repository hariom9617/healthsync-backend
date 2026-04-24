import { SocialPost } from '../../models/SocialPost.model.js'
import { successResponse, errorResponse } from '../../../utils/response.utils.js'
import * as socialService from './social.service.js'

export const getFeed = async (req, res) => {
  try {
    const feed = await socialService.getFeed(req.user._id)
    return successResponse(res, 200, 'Feed fetched', feed)
  } catch (error) {
    return errorResponse(res, error.statusCode || 500, error.message)
  }
}

export const giveKudos = async (req, res) => {
  try {
    const { postId } = req.params
    const result = await socialService.giveKudos(req.user._id, postId)
    return successResponse(res, 200, 'Kudos updated', result)
  } catch (error) {
    return errorResponse(res, error.statusCode || 500, error.message)
  }
}

export const getWeeklyStepsLeaderboard = async (req, res) => {
  try {
    const leaderboard = await socialService.getWeeklyStepsLeaderboard()
    return successResponse(res, 200, 'Leaderboard fetched', leaderboard)
  } catch (error) {
    return errorResponse(res, error.statusCode || 500, error.message)
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
