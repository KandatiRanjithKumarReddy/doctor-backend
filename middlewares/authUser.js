import jwt from 'jsonwebtoken'

// User authentication middleware
const authUser = async (req, res, next) => {
  try {
    const { token } = req.headers

    if (!token) {
      return res.status(401).json({ success: false, message: 'Not Authorized, Login Again' })
    }

    const token_decode = jwt.verify(token, process.env.JWT_SECRET)
    if (!token_decode?.id) {
      return res.status(401).json({ success: false, message: 'Not Authorized, Login Again' })
    }

    req.userId = token_decode.id
    next()
  } catch (error) {
    res.status(401).json({ success: false, message: 'Session expired or invalid. Please log in again.' })
  }
}

export default authUser
