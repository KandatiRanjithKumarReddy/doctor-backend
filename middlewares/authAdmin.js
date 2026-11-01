import jwt from 'jsonwebtoken'

// Admin authentication middleware
const authAdmin = async (req, res, next) => {
  try {
    const { atoken } = req.headers

    if (!atoken) {
      return res.status(401).json({ success: false, message: 'Not Authorized, Login Again' })
    }

    if (!process.env.ADMIN_EMAIL || !process.env.ADMIN_PASSWORD) {
      return res.status(500).json({ success: false, message: 'Admin authentication is not configured on the server.' })
    }

    const token_decode = jwt.verify(atoken, process.env.JWT_SECRET)
    if (token_decode !== process.env.ADMIN_EMAIL + process.env.ADMIN_PASSWORD) {
      return res.status(401).json({ success: false, message: 'Not Authorized, Login Again' })
    }

    next()
  } catch (error) {
    res.status(401).json({ success: false, message: 'Session expired or invalid. Please log in again.' })
  }
}

export default authAdmin
