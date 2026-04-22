import express from 'express'
import { verifyToken } from '../../../middleware/auth.middleware.js'
import {
  getChallenges,
  joinChallenge,
  getChallengeLeaderboard,
  createChallenge,
  updateChallengeProgress,
  getUserChallenges,
} from './challenges.controller.js'

const router = express.Router()

router.get('/', verifyToken, getChallenges)
router.get('/my', verifyToken, getUserChallenges)
router.post('/', verifyToken, createChallenge)
router.post('/join/:id', verifyToken, joinChallenge)
router.get('/leaderboard/:id', verifyToken, getChallengeLeaderboard)
router.patch('/progress/:id', verifyToken, updateChallengeProgress)

export default router
