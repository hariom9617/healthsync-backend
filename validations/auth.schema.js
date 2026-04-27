import Joi from 'joi'

const passwordRule = Joi.string()
  .min(8)
  .max(128)
  .custom((value, helpers) => {
    const hasLower = /[a-z]/.test(value)
    const hasUpper = /[A-Z]/.test(value)
    const hasDigit = /\d/.test(value)
    const hasSpecial = /[@$!%*?&]/.test(value)
    if (!hasLower || !hasUpper || !hasDigit || !hasSpecial) {
      return helpers.error('password.complexity')
    }
    return value
  })
  .messages({
    'password.complexity':
      'Password must contain uppercase, lowercase, digit, and special character (@$!%*?&)',
  })

export const registerSchema = Joi.object({
  name: Joi.string().trim().min(2).max(100).optional(),
  firstName: Joi.string().trim().min(2).max(50).optional(),
  lastName: Joi.string().trim().min(2).max(50).optional(),
  email: Joi.string()
    .email({ tlds: { allow: false } })
    .lowercase()
    .trim()
    .required(),
  password: passwordRule.required(),
  consent: Joi.object({
    dataCollection: Joi.boolean().default(false),
    marketing: Joi.boolean().default(false),
  }).default({ dataCollection: false, marketing: false }),
}).or('name', 'firstName')

export const loginSchema = Joi.object({
  email: Joi.string()
    .email({ tlds: { allow: false } })
    .lowercase()
    .trim()
    .required(),
  password: Joi.string().max(128).required(),
})

export const forgotPasswordSchema = Joi.object({
  email: Joi.string()
    .email({ tlds: { allow: false } })
    .lowercase()
    .trim()
    .required(),
})

export const resetPasswordSchema = Joi.object({
  email: Joi.string()
    .email({ tlds: { allow: false } })
    .lowercase()
    .trim()
    .required(),
  otp: Joi.string().length(6).pattern(/^\d+$/).required(),
  password: passwordRule.required(),
  confirmPassword: Joi.string().valid(Joi.ref('password')).required().messages({
    'any.only': 'Passwords do not match',
  }),
})

export const verifyOTPSchema = Joi.object({
  email: Joi.string()
    .email({ tlds: { allow: false } })
    .lowercase()
    .trim()
    .required(),
  otp: Joi.string().length(6).pattern(/^\d+$/).required(),
})

export const refreshSchema = Joi.object({
  refreshToken: Joi.string().optional(),
})

export const googleMobileSchema = Joi.object({
  idToken: Joi.string().required(),
})
