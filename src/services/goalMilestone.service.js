import Goal from '../../models/Goal.model.js'
import { SocialPost } from '../models/SocialPost.model.js'
import { sendPushNotification } from './push.service.js'

export const checkGoalMilestones = async (userId, goalId) => {
  try {
    // 1. Find goal by goalId, verify userId matches
    const goal = await Goal.findOne({ _id: goalId, userId })
    if (!goal) {
      throw new Error('Goal not found or access denied')
    }

    // 2. Calculate progress
    const progress = goal.targetValue > 0 ? (goal.currentValue / goal.targetValue) * 100 : 0

    // 3. milestones = [25, 50, 75, 100]
    const milestones = [25, 50, 75, 100]

    // 4. Check each milestone
    for (const milestone of milestones) {
      if (progress >= milestone && !goal.milestonesReached?.includes(milestone)) {
        // Add milestone to goal
        await Goal.findByIdAndUpdate(goalId, {
          $addToSet: { milestonesReached: milestone },
        })

        // Send notification based on milestone
        let title, body
        if (milestone === 100) {
          title = 'Goal Achieved!'
          body = `Incredible! You've completed: ${goal.title}`
        } else {
          title = `${milestone}% Complete!`
          body = `You're ${milestone}% toward: ${goal.title}`
        }

        await sendPushNotification({
          userId,
          title,
          body,
          type: 'goal_milestone',
          data: {
            goalId: goalId.toString(),
            milestone,
            progress: Math.round(progress),
          },
        })

        // Create social feed post for 100% completion
        if (milestone === 100) {
          await SocialPost.create({
            userId,
            type: 'goal_achieved',
            title: 'Goal Achieved! ',
            description: `Just completed my goal: ${goal.title}! ${progress > 100 ? 'Exceeded target by ' + Math.round(progress - 100) + '%' : 'Hit the target exactly!'}`,
            metadata: {
              goalId: goalId.toString(),
              value: goal.currentValue,
              unit: goal.unit || 'units',
              targetValue: goal.targetValue,
            },
          })
        }

        // Break after first milestone hit (one at a time)
        break
      }
    }
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Error checking goal milestones:', error)
    throw error
  }
}
