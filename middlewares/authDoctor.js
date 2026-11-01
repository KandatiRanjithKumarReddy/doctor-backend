import jwt from 'jsonwebtoken'

// Doctor authentication middleware
const authDoctor = async (req, res, next) => {
  try {
    const { dtoken } = req.headers

    if (!dtoken) {
      return res.status(401).json({ success: false, message: 'Not Authorized, Login Again' })
    }

    const token_decode = jwt.verify(dtoken, process.env.JWT_SECRET)
    if (!token_decode?.id) {
      return res.status(401).json({ success: false, message: 'Not Authorized, Login Again' })
    }

    req.docId = token_decode.id
    next()
  } catch (error) {
    res.status(401).json({ success: false, message: 'Session expired or invalid. Please log in again.' })
  }
}

export default authDoctor
