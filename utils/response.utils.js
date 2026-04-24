export const successResponse = (res, statusCode, message, data = null) => {
  const response = {
    success: true,
    data,
  }

  return res.status(statusCode).json(response)
}

export const errorResponse = (res, statusCode, message) => {
  const response = {
    success: false,
    message,
  }

  return res.status(statusCode).json(response)
}
