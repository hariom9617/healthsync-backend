import nodemailer from 'nodemailer'
import { config } from '../config/env.js'

const transporter = nodemailer.createTransport({
  host: config.email.host,
  port: config.email.port,
  secure: false,
  auth: {
    user: config.email.user,
    pass: config.email.pass,
  },
})

export const sendEmail = async ({ to, subject, html }) => {
  try {
    const info = await transporter.sendMail({
      from: `"HealthSync" <${config.email.user}>`,
      to,
      subject,
      html,
    })

    return info
  } catch (error) {
    throw Object.assign(new Error('Failed to send email'), { statusCode: 500 })
  }
}

export const verificationEmail = (name, link) => {
  return {
    subject: 'Verify your HealthSync account',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #4CAF50;">Welcome to HealthSync!</h2>
        <p>Hi ${name},</p>
        <p>Thank you for signing up. Please click the button below to verify your email address:</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${link}" style="background-color: #4CAF50; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">Verify Email</a>
        </div>
        <p>If you didn't create an account, you can safely ignore this email.</p>
        <p>Best regards,<br>HealthSync Team</p>
      </div>
    `,
  }
}

export const passwordResetEmail = (name, link) => {
  return {
    subject: 'Reset your HealthSync password',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #f44336;">Password Reset Request</h2>
        <p>Hi ${name},</p>
        <p>We received a request to reset your password. Click the button below to set a new password:</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${link}" style="background-color: #f44336; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">Reset Password</a>
        </div>
        <p>This link will expire in 1 hour. If you didn't request this, you can safely ignore this email.</p>
        <p>Best regards,<br>HealthSync Team</p>
      </div>
    `,
  }
}
