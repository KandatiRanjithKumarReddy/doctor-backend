import express from 'express'
import {
  bookAppointment,
  getProfile,
  loginUser,
  googleLogin,
  registerUser,
  submitFeedback,
  vaidyaRecommend,
  updateProfile,
  listAppointment,
  cancelAppointment,
  paymentRazorpay,
  verifyRazorpay,
  razorpayWebhook
} from '../controllers/userController.js'
import authUser from '../middlewares/authUser.js'
import upload from '../middlewares/multer.js'
import { authLimiter, bookingLimiter, feedbackLimiter, aiLimiter, paymentLimiter } from '../middlewares/rateLimiter.js'

const userRouter = express.Router()

userRouter.post('/register', authLimiter, registerUser)
userRouter.post('/login', authLimiter, loginUser)
userRouter.post('/google-login', authLimiter, googleLogin)
userRouter.post('/feedback', feedbackLimiter, submitFeedback)
userRouter.post('/vaidya-recommend', aiLimiter, vaidyaRecommend)
userRouter.get('/get-profile', authUser, getProfile)
userRouter.post('/update-profile', authUser, upload.single('image'), updateProfile)
userRouter.post('/book-appointment', authUser, bookingLimiter, bookAppointment)
userRouter.get('/appointments', authUser, listAppointment)
userRouter.post('/cancel-appointment', authUser, bookingLimiter, cancelAppointment)
userRouter.post('/payment-razorpay', authUser, paymentLimiter, paymentRazorpay)
userRouter.post('/verifyRazorpay', authUser, paymentLimiter, verifyRazorpay)
userRouter.post('/razorpay-webhook', paymentLimiter, razorpayWebhook)

export default userRouter
