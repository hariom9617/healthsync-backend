import Joi from 'joi'

export const registerSchema = Joi.object({
  name: Joi.string().trim().min(2).max(100).optional(),
  firstName: Joi.string().trim().min(2).max(50).optional(),
  lastName: Joi.string().trim().min(2).max(50).optional(),
  email: Joi.string().email().required(),
  password: Joi.string()
    .min(8)
    .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
    .required(),
  consent: Joi.object({
    dataCollection: Joi.boolean().default(false),
    marketing: Joi.boolean().default(false),
  }).default({ dataCollection: false, marketing: false }),
}).or('name', 'firstName')

export const loginSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().required(),
})

export const forgotPasswordSchema = Joi.object({
  email: Joi.string().email().required(),
})

export const resetPasswordSchema = Joi.object({
  email: Joi.string().email().required(),
  otp: Joi.string().length(6).pattern(/^\d+$/).required(),
  password: Joi.string()
    .min(8)
    .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
    .required(),
})

export const verifyOTPSchema = Joi.object({
  email: Joi.string().email().required(),
  otp: Joi.string().length(6).pattern(/^\d+$/).required(),
})

export const refreshSchema = Joi.object({
  refreshToken: Joi.string().required(),
})

export const googleMobileSchema = Joi.object({
  idToken: Joi.string().required(),
})
