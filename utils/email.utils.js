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

export const verificationEmail = (name, otp) => {
  const subject = 'Your HealthSync Verification Code'

  const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Verify Your Email</title>
</head>
<body style="margin:0;padding:0;background-color:#EFF5F3;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  
  <!-- Outer wrapper -->
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#EFF5F3;padding:40px 20px;">
    <tr>
      <td align="center">
        
        <!-- Card -->
        <table width="480" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:24px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">
          
          <!-- Header Banner -->
          <tr>
            <td style="background:linear-gradient(135deg,#1B5E3B 0%,#2D7A52 100%);padding:40px 40px 32px;text-align:center;">
              <div style="width:56px;height:56px;background:rgba(255,255,255,0.2);border-radius:50%;margin:0 auto 16px;display:inline-flex;align-items:center;justify-content:center;">
                <!-- Shield icon using text -->
                <span style="font-size:28px;">🛡</span>
              </div>
              <h1 style="color:#ffffff;font-size:24px;font-weight:700;margin:0 0 8px;">HealthSync</h1>
              <p style="color:rgba(255,255,255,0.8);font-size:14px;margin:0;">Your Personal Health Companion</p>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:40px;">
              
              <h2 style="color:#0D1A12;font-size:22px;font-weight:700;margin:0 0 8px;">Verify Your Email</h2>
              <p style="color:#6B7280;font-size:15px;line-height:1.6;margin:0 0 32px;">
                Hi ${name}, please use verification code below to complete your registration.
                This code expires in <strong style="color:#1B5E3B;">10 minutes</strong>.
              </p>

              <!-- OTP Box -->
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center" style="padding:0 0 32px;">
                    <div style="background:#EFF5F3;border:2px solid #C8F0DC;border-radius:16px;padding:24px 40px;display:inline-block;">
                      <p style="color:#6B7280;font-size:12px;font-weight:600;letter-spacing:2px;text-transform:uppercase;margin:0 0 8px;">Your Verification Code</p>
                      <p style="color:#1B5E3B;font-size:42px;font-weight:900;letter-spacing:12px;margin:0;font-family:'Courier New',monospace;">${otp}</p>
                    </div>
                  </td>
                </tr>
              </table>

              <!-- Security note -->
              <div style="background:#EFF5F3;border-radius:12px;padding:16px;margin-bottom:32px;">
                <table cellpadding="0" cellspacing="0">
                  <tr>
                    <td style="width:32px;vertical-align:top;padding-top:2px;">🔒</td>
                    <td>
                      <p style="color:#6B7280;font-size:13px;line-height:1.5;margin:0;">
                        <strong style="color:#0D1A12;">Security Notice:</strong> Never share this code with anyone. 
                        HealthSync will never ask for your OTP via phone or chat.
                        Your health data is protected with 256-bit AES encryption.
                      </p>
                    </td>
                  </tr>
                </table>
              </div>

              <p style="color:#9CA3AF;font-size:13px;line-height:1.6;margin:0;">
                Didn't create a HealthSync account? You can safely ignore this email.
              </p>

            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background:#F9FAFB;border-top:1px solid #E5E7EB;padding:24px 40px;text-align:center;">
              <p style="color:#6B7280;font-size:12px;margin:0 0 8px;">
                © 2025 HealthSync. All clinical data is encrypted.
              </p>
              <p style="margin:0;">
                <a href="#" style="color:#1B5E3B;font-size:12px;text-decoration:none;margin:0 8px;">Privacy Policy</a>
                <span style="color:#E5E7EB;">|</span>
                <a href="#" style="color:#1B5E3B;font-size:12px;text-decoration:none;margin:0 8px;">Security</a>
                <span style="color:#E5E7EB;">|</span>
                <a href="#" style="color:#1B5E3B;font-size:12px;text-decoration:none;margin:0 8px;">HIPAA Compliance</a>
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>

</body>
</html>`

  return { subject, html }
}

export const passwordResetEmail = (name, otp) => {
  const subject = 'Reset Your HealthSync Password'

  const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Reset Your Password</title>
</head>
<body style="margin:0;padding:0;background-color:#EFF5F3;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  
  <!-- Outer wrapper -->
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#EFF5F3;padding:40px 20px;">
    <tr>
      <td align="center">
        
        <!-- Card -->
        <table width="480" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:24px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">
          
          <!-- Header Banner -->
          <tr>
            <td style="background:linear-gradient(135deg,#1B5E3B 0%,#2D7A52 100%);padding:40px 40px 32px;text-align:center;">
              <div style="width:56px;height:56px;background:rgba(255,255,255,0.2);border-radius:50%;margin:0 auto 16px;display:inline-flex;align-items:center;justify-content:center;">
                <!-- Key icon using text -->
                <span style="font-size:28px;">🔑</span>
              </div>
              <h1 style="color:#ffffff;font-size:24px;font-weight:700;margin:0 0 8px;">HealthSync</h1>
              <p style="color:rgba(255,255,255,0.8);font-size:14px;margin:0;">Your Personal Health Companion</p>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:40px;">
              
              <h2 style="color:#0D1A12;font-size:22px;font-weight:700;margin:0 0 8px;">Reset Your Password</h2>
              <p style="color:#6B7280;font-size:15px;line-height:1.6;margin:0 0 32px;">
                Hi ${name}, use the code below to reset your HealthSync password. This code expires in 10 minutes.
              </p>

              <!-- OTP Box -->
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center" style="padding:0 0 32px;">
                    <div style="background:#EFF5F3;border:2px solid #C8F0DC;border-radius:16px;padding:24px 40px;display:inline-block;">
                      <p style="color:#6B7280;font-size:12px;font-weight:600;letter-spacing:2px;text-transform:uppercase;margin:0 0 8px;">Password Reset Code</p>
                      <p style="color:#1B5E3B;font-size:42px;font-weight:900;letter-spacing:12px;margin:0;font-family:'Courier New',monospace;">${otp}</p>
                    </div>
                  </td>
                </tr>
              </table>

              <!-- Security note -->
              <div style="background:#EFF5F3;border-radius:12px;padding:16px;margin-bottom:32px;">
                <table cellpadding="0" cellspacing="0">
                  <tr>
                    <td style="width:32px;vertical-align:top;padding-top:2px;">🔒</td>
                    <td>
                      <p style="color:#6B7280;font-size:13px;line-height:1.5;margin:0;">
                        <strong style="color:#0D1A12;">Security Notice:</strong> If you didn't request a password reset, please contact support immediately.
                        Your health data is protected with 256-bit AES encryption.
                      </p>
                    </td>
                  </tr>
                </table>
              </div>

              <p style="color:#9CA3AF;font-size:13px;line-height:1.6;margin:0;">
                Didn't request a password reset? You can safely ignore this email.
              </p>

            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background:#F9FAFB;border-top:1px solid #E5E7EB;padding:24px 40px;text-align:center;">
              <p style="color:#6B7280;font-size:12px;margin:0 0 8px;">
                © 2025 HealthSync. All clinical data is encrypted.
              </p>
              <p style="margin:0;">
                <a href="#" style="color:#1B5E3B;font-size:12px;text-decoration:none;margin:0 8px;">Privacy Policy</a>
                <span style="color:#E5E7EB;">|</span>
                <a href="#" style="color:#1B5E3B;font-size:12px;text-decoration:none;margin:0 8px;">Security</a>
                <span style="color:#E5E7EB;">|</span>
                <a href="#" style="color:#1B5E3B;font-size:12px;text-decoration:none;margin:0 8px;">HIPAA Compliance</a>
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>

</body>
</html>`

  return { subject, html }
}

export const welcomeEmail = (name) => {
  const subject = 'Welcome to HealthSync!'

  const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Welcome to HealthSync</title>
</head>
<body style="margin:0;padding:0;background-color:#EFF5F3;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  
  <!-- Outer wrapper -->
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#EFF5F3;padding:40px 20px;">
    <tr>
      <td align="center">
        
        <!-- Card -->
        <table width="480" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:24px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">
          
          <!-- Header Banner -->
          <tr>
            <td style="background:linear-gradient(135deg,#1B5E3B 0%,#2D7A52 100%);padding:40px 40px 32px;text-align:center;">
              <div style="width:56px;height:56px;background:rgba(255,255,255,0.2);border-radius:50%;margin:0 auto 16px;display:inline-flex;align-items:center;justify-content:center;">
                <!-- Celebration icon using text -->
                <span style="font-size:28px;">🎉</span>
              </div>
              <h1 style="color:#ffffff;font-size:24px;font-weight:700;margin:0 0 8px;">HealthSync</h1>
              <p style="color:rgba(255,255,255,0.8);font-size:14px;margin:0;">Your Personal Health Companion</p>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:40px;">
              
              <h2 style="color:#0D1A12;font-size:22px;font-weight:700;margin:0 0 8px;">Welcome to HealthSync, ${name}!</h2>
              <p style="color:#6B7280;font-size:15px;line-height:1.6;margin:0 0 32px;">
                Your journey to better health starts now. Here's what you can do:
              </p>

              <!-- Features -->
              <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:32px;">
                <tr>
                  <td style="padding:0 0 16px;">
                    <table cellpadding="0" cellspacing="0">
                      <tr>
                        <td style="width:40px;vertical-align:top;">
                          <div style="width:40px;height:40px;background:#10B981;border-radius:50%;display:flex;align-items:center;justify-content:center;">
                            <span style="color:#ffffff;font-size:20px;">🤖</span>
                          </div>
                        </td>
                        <td style="padding-left:16px;">
                          <p style="color:#0D1A12;font-size:15px;font-weight:600;margin:0 0 4px;">AI Health Coaching</p>
                          <p style="color:#6B7280;font-size:13px;line-height:1.5;margin:0;">Personalized insights powered by GPT-4</p>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
                <tr>
                  <td style="padding:0 0 16px;">
                    <table cellpadding="0" cellspacing="0">
                      <tr>
                        <td style="width:40px;vertical-align:top;">
                          <div style="width:40px;height:40px;background:#10B981;border-radius:50%;display:flex;align-items:center;justify-content:center;">
                            <span style="color:#ffffff;font-size:20px;">📊</span>
                          </div>
                        </td>
                        <td style="padding-left:16px;">
                          <p style="color:#0D1A12;font-size:15px;font-weight:600;margin:0 0 4px;">Smart Tracking</p>
                          <p style="color:#6B7280;font-size:13px;line-height:1.5;margin:0;">Steps, sleep, heart rate & more</p>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
                <tr>
                  <td style="padding:0;">
                    <table cellpadding="0" cellspacing="0">
                      <tr>
                        <td style="width:40px;vertical-align:top;">
                          <div style="width:40px;height:40px;background:#10B981;border-radius:50%;display:flex;align-items:center;justify-content:center;">
                            <span style="color:#ffffff;font-size:20px;">🎯</span>
                          </div>
                        </td>
                        <td style="padding-left:16px;">
                          <p style="color:#0D1A12;font-size:15px;font-weight:600;margin:0 0 4px;">Goal Setting</p>
                          <p style="color:#6B7280;font-size:13px;line-height:1.5;margin:0;">Daily targets with social challenges</p>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>

              <!-- CTA Button -->
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center" style="padding:0 0 32px;">
                    <a href="${config.clientUrl}" style="display:inline-block;background:#1B5E3B;color:#ffffff;text-decoration:none;font-size:16px;font-weight:600;padding:14px 40px;border-radius:50px;">
                      Open HealthSync
                    </a>
                  </td>
                </tr>
              </table>

              <p style="color:#9CA3AF;font-size:13px;line-height:1.6;margin:0;">
                We're excited to be part of your health journey!
              </p>

            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background:#F9FAFB;border-top:1px solid #E5E7EB;padding:24px 40px;text-align:center;">
              <p style="color:#6B7280;font-size:12px;margin:0 0 8px;">
                © 2025 HealthSync. All clinical data is encrypted.
              </p>
              <p style="margin:0;">
                <a href="#" style="color:#1B5E3B;font-size:12px;text-decoration:none;margin:0 8px;">Privacy Policy</a>
                <span style="color:#E5E7EB;">|</span>
                <a href="#" style="color:#1B5E3B;font-size:12px;text-decoration:none;margin:0 8px;">Security</a>
                <span style="color:#E5E7EB;">|</span>
                <a href="#" style="color:#1B5E3B;font-size:12px;text-decoration:none;margin:0 8px;">HIPAA Compliance</a>
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>

</body>
</html>`

  return { subject, html }
}
