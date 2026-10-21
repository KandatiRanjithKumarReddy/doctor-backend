import express from 'express'
import { bookAppointment, getProfile, loginUser, registerUser ,updateProfile,listAppointment,cancelAppointment,paymentRazorpay, verifyRazorpay} from '../controllers/userController.js'
import authUser from '../middlewares/authUser.js'
import upload from '../middlewares/multer.js'
import { authLimiter, bookingLimiter } from '../middlewares/rateLimiter.js'

const userRouter = express.Router() 

userRouter.post('/register', authLimiter, registerUser)
userRouter.post('/login', authLimiter, loginUser)
userRouter.get('/get-profile', authUser, getProfile)
userRouter.post('/update-profile', authUser, upload.single('image'), updateProfile)
userRouter.post('/book-appointment', authUser, bookingLimiter, bookAppointment)
userRouter.get('/appointments', authUser, listAppointment)
userRouter.post('/cancel-appointment', authUser, bookingLimiter, cancelAppointment)
userRouter.post('/payment-razorpay', authUser, paymentRazorpay)
userRouter.post('/verifyRazorpay', authUser, verifyRazorpay)


export default userRouter