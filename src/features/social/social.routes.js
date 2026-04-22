import express from 'express'
import { verifyToken } from '../../../middleware/auth.middleware.js'
import {
  getFeed,
  giveKudos,
  getWeeklyStepsLeaderboard,
  createPost,
  deletePost,
  getUserPosts,
} from './social.controller.js'

const router = express.Router()

router.get('/feed', verifyToken, getFeed)
router.post('/posts', verifyToken, createPost)
router.get('/posts/my', verifyToken, getUserPosts)
router.delete('/posts/:id', verifyToken, deletePost)
router.post('/kudos/:postId', verifyToken, giveKudos)
router.get('/leaderboard/weekly-steps', verifyToken, getWeeklyStepsLeaderboard)

export default router
