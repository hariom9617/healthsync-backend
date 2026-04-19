import { Server } from 'socket.io'
import jwt from 'jsonwebtoken'
import { config } from '../../config/env.js'
import { buildUserHealthContext } from '../features/ai/context.builder.js'

let io

export const initializeSocket = (server) => {
  io = new Server(server, {
    cors: {
      origin: [
        config.clientUrl,
        /\.ngrok-free\.app$/,
        /\.ngrok-free\.dev$/,
        /\.ngrok\.io$/,
        /^http:\/\/localhost/,
        /^http:\/\/10\./,
        /^http:\/\/192\.168\./,
      ],
      credentials: true,
    },
  })

  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token
      if (!token) {
        return next(new Error('Authentication token required'))
      }

      const decoded = jwt.verify(token, config.jwtSecret)
      socket.userId = decoded.userId
      socket.userRole = decoded.role
      next()
    } catch (error) {
      next(new Error('Invalid authentication token'))
    }
  })

  io.on('connection', (socket) => {
    // eslint-disable-next-line no-console
    console.log(`User ${socket.userId} connected to socket`)

    socket.on('ai:chat', async ({ message, conversationHistory = [] }) => {
      try {
        const userContext = await buildUserHealthContext(socket.userId)

        const response = await fetch(
          `${process.env.AI_SERVICE_URL || 'http://localhost:8000'}/ai/chat/stream`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              message,
              user_context: userContext,
              conversation_history: conversationHistory,
            }),
          }
        )

        if (!response.body) {
          socket.emit('ai:error', { message: 'AI service unavailable' })
          return
        }

        const reader = response.body.getReader()
        const decoder = new TextDecoder()

        let done = false
        while (!done) {
          const { done: isDone, value } = await reader.read()
          done = isDone
          if (done) break

          const text = decoder.decode(value)
          const lines = text.split('\n').filter((line) => line.startsWith('data:'))

          for (const line of lines) {
            try {
              const data = JSON.parse(line.replace('data: ', ''))
              if (data.delta) {
                socket.emit('ai:chunk', { delta: data.delta })
              }
              if (data.done) {
                socket.emit('ai:done', {})
              }
            } catch (parseError) {
              // eslint-disable-next-line no-console
              console.error('Error parsing SSE data:', parseError)
            }
          }
        }
      } catch (error) {
        // eslint-disable-next-line no-console
        console.error('AI Chat Socket Error:', error)
        socket.emit('ai:error', { message: 'AI service error' })
      }
    })

    socket.on('ai:insights', async ({ weeklyStats }) => {
      try {
        const userContext = await buildUserHealthContext(socket.userId)

        const response = await fetch(
          `${process.env.AI_SERVICE_URL || 'http://localhost:8000'}/ai/insights`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              weekly_stats: weeklyStats,
              user_context: userContext,
            }),
          }
        )

        const data = await response.json()
        socket.emit('ai:insights', data)
      } catch (error) {
        // eslint-disable-next-line no-console
        console.error('AI Insights Socket Error:', error)
        socket.emit('ai:error', { message: 'Insights generation failed' })
      }
    })

    socket.on('disconnect', () => {
      // eslint-disable-next-line no-console
      console.log(`User ${socket.userId} disconnected from socket`)
    })

    socket.on('error', (error) => {
      // eslint-disable-next-line no-console
      console.error(`Socket error for user ${socket.userId}:`, error)
    })
  })

  return io
}

export const getSocketIO = () => {
  if (!io) {
    throw new Error('Socket.io not initialized')
  }
  return io
}
