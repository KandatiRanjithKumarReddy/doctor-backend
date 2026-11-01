import validator from 'validator'
import bcrypt from 'bcrypt'
import userModel from '../models/userModel.js'
import jwt from 'jsonwebtoken'
import { v2 as cloudinary } from 'cloudinary'
import doctorModel from '../models/doctorModel.js'
import appointmentModel from '../models/appointmentModel.js'
import feedbackModel from '../models/feedbackModel.js'
import razorpay from 'razorpay'
import crypto from 'crypto'
import fs from 'fs'
import { OAuth2Client } from 'google-auth-library'

const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID)

const DEFAULT_AVATAR_PREFIX = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAPAAAADwCAYAAAA+VemS'

const VALID_SPECIALTIES = [
  'General physician',
  'Gynecologist',
  'Dermatologist',
  'Pediatricians',
  'Neurologist',
  'Gastroenterologist',
]

// API to register user
const registerUser = async (req, res) => {

  try {

    const { name, email, password } = req.body

    if (
      typeof name !== 'string' || !name.trim() ||
      typeof email !== 'string' || !email.trim() ||
      typeof password !== 'string' || !password
    ) {
      return res.json({ success: false, message: 'Missing required details. Please fill in all fields.' })
    }

    const normalizedEmail = email.trim().toLowerCase()

    // validating email format
    if (!validator.isEmail(normalizedEmail)) {
      return res.json({ success: false, message: 'Please enter a valid email address.' })
    }

    // validating strong password
    if (password.length < 8) {
      return res.json({ success: false, message: 'Password must be at least 8 characters long.' })
    }

    // check if email already exists before hashing password
    const existingUser = await userModel.findOne({ email: normalizedEmail }).select('_id').lean()
    if (existingUser) {
      return res.json({ success: false, message: 'An account with this email already exists. Please log in.' })
    }

    // hashing user password
    const salt = await bcrypt.genSalt(10)
    const hashedPassword = await bcrypt.hash(password, salt)

    const userData = {
      name: name.trim(),
      email: normalizedEmail,
      password: hashedPassword,
      authProvider: 'local'
    }

    const newUser = new userModel(userData)
    const user = await newUser.save()

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET)
    res.json({ success: true, token })

  } catch (error) {
    console.error('Registration error:', error.message)
    if (error.code === 11000) {
      return res.json({ success: false, message: 'An account with this email already exists. Please log in.' })
    }
    res.json({ success: false, message: 'Registration failed. Please try again.' })
  }

}


// API for user login
const loginUser = async (req, res) => {

  try {

    const { email, password } = req.body

    if (
      typeof email !== 'string' || !email.trim() ||
      typeof password !== 'string' || !password
    ) {
      return res.json({ success: false, message: 'Please enter both email and password.' })
    }

    const normalizedEmail = email.trim().toLowerCase()
    const user = await userModel.findOne({ email: normalizedEmail }) || await userModel.findOne({ email: email.trim() })

    if (!user) {
      return res.json({ success: false, message: 'No account found with this email.' })
    }

    const isMatch = await bcrypt.compare(password, user.password)

    if (isMatch) {
      const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET)
      res.json({ success: true, token })
    } else if (user.authProvider === 'google') {
      res.json({
        success: false,
        message: 'This account uses Google Sign-In. Please continue with Google below.',
      })
    } else {
      res.json({ success: false, message: 'Incorrect password. Please try again.' })
    }

  } catch (error) {
    console.log(error)
    res.json({ success: false, message: 'Login failed. Please try again.' })
  }

}


// API for Google login / signup (patients/users ONLY)
const googleLogin = async (req, res) => {
  try {
    const { credential } = req.body

    if (!credential) {
      return res.json({ success: false, message: 'Google sign-in credential is missing.' })
    }

    if (!process.env.GOOGLE_CLIENT_ID) {
      return res.status(500).json({ success: false, message: 'Google Sign-In is not configured on the server.' })
    }

    const ticket = await googleClient.verifyIdToken({
      idToken: credential,
      audience: process.env.GOOGLE_CLIENT_ID,
    })

    const payload = ticket.getPayload()
    if (!payload || !payload.email || !payload.email_verified) {
      return res.json({ success: false, message: 'Unable to verify Google email address.' })
    }

    const normalizedEmail = payload.email.trim().toLowerCase()
    let user =
      (await userModel.findOne({ email: normalizedEmail })) ||
      (await userModel.findOne({ email: payload.email.trim() }))

    let isNewUser = false

    if (!user) {
      // Automatically create a new patient account when Google user does not exist yet
      const randomSecret = crypto.randomBytes(32).toString('hex')
      const salt = await bcrypt.genSalt(10)
      const hashedPassword = await bcrypt.hash(randomSecret, salt)

      const newUserData = {
        name: (payload.name || normalizedEmail.split('@')[0]).trim(),
        email: normalizedEmail,
        password: hashedPassword,
        authProvider: 'google',
        googleId: payload.sub || '',
      }

      if (payload.picture) {
        newUserData.image = payload.picture
      }

      const newUser = new userModel(newUserData)
      user = await newUser.save()
      isNewUser = true
    } else {
      // Allow existing user to log in seamlessly; fill missing googleId / default avatar if helpful
      const updates = {}
      if (!user.googleId && payload.sub) {
        updates.googleId = payload.sub
      }
      if (payload.picture && (!user.image || user.image.startsWith(DEFAULT_AVATAR_PREFIX))) {
        updates.image = payload.picture
      }
      if (Object.keys(updates).length > 0) {
        await userModel.findByIdAndUpdate(user._id, { $set: updates })
      }
    }

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET)
    return res.json({ success: true, token, isNewUser })
  } catch (error) {
    console.error('Google login error:', error.message)
    return res.json({
      success: false,
      message: 'Google authentication failed. Please try again.',
    })
  }
}


// API to submit patient feedback (associates logged-in user when token is present)
const submitFeedback = async (req, res) => {
  try {
    const { category, message, page } = req.body
    const allowedCategories = ['Idea', 'Problem', 'Other']

    if (!allowedCategories.includes(category)) {
      return res.json({ success: false, message: 'Please select Idea, Problem, or Other.' })
    }

    const trimmedMessage = typeof message === 'string' ? message.trim() : ''
    if (trimmedMessage.length < 3) {
      return res.json({ success: false, message: 'Please enter a short description before submitting.' })
    }
    if (trimmedMessage.length > 1000) {
      return res.json({ success: false, message: 'Feedback must be under 1,000 characters.' })
    }

    let userId = null
    let userName = 'Guest'
    let userEmail = ''

    const { token } = req.headers
    if (token) {
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET)
        if (decoded?.id) {
          const user = await userModel.findById(decoded.id).select('name email').lean()
          if (user) {
            userId = user._id.toString()
            userName = user.name || 'User'
            userEmail = user.email || ''
          }
        }
      } catch {
        // Optional auth: if token is expired/absent, still save feedback cleanly as Guest
      }
    }

    await feedbackModel.create({
      userId,
      userName,
      userEmail,
      category,
      message: trimmedMessage,
      page: typeof page === 'string' ? page.slice(0, 120) : '',
    })

    return res.json({
      success: true,
      message: 'Thank you! Your feedback has been submitted.',
    })
  } catch (error) {
    console.error('Feedback error:', error.message)
    return res.json({
      success: false,
      message: 'Unable to submit feedback right now. Please try again.',
    })
  }
}


// API for Vaidya — Groq-powered AI Specialty & Doctor Finder (patients only, non-diagnostic)
const vaidyaRecommend = async (req, res) => {
  try {
    const { concern, maxFee } = req.body
    const trimmedConcern = typeof concern === 'string' ? concern.trim() : ''

    if (trimmedConcern.length < 3) {
      return res.json({
        success: false,
        message: 'Please describe your health concern or reason for visiting in a few words.',
      })
    }

    if (trimmedConcern.length > 500) {
      return res.json({
        success: false,
        message: 'Please keep your description concise (under 500 characters).',
      })
    }

    if (!process.env.GROQ_API_KEY) {
      return res.status(500).json({
        success: false,
        message: 'Vaidya AI service is not configured on the server.',
      })
    }

    const systemPrompt = `You are Vaidya, the patient-facing AI Specialist & Doctor Routing Assistant for Prescripto, an Indian healthcare appointment booking platform.

STRICT MEDICAL SAFETY RULES:
1. NEVER diagnose any disease or condition.
2. NEVER recommend, prescribe, or name medications, dosages, or home treatments.
3. Your ONLY job is to help the patient choose which type of specialist doctor to book from Prescripto's exact 6 available specialties:
   - "General physician"
   - "Gynecologist"
   - "Dermatologist"
   - "Pediatricians"
   - "Neurologist"
   - "Gastroenterologist"
4. If the patient describes life-threatening or emergency warning signs (such as severe chest pain, difficulty breathing, sudden weakness/numbness on one side, stroke signs, uncontrolled bleeding, loss of consciousness, severe allergic swelling, or self-harm), set "isEmergency": true and provide a calm "emergencyNote" advising immediate emergency hospital care or calling 112 / 108 in India.
5. If the user's message is completely unrelated to health, wellness, symptoms, or doctor consultations (for example, coding, math, jokes, or random gibberish), set "isValidHealthQuery": false.

Respond ONLY with a valid JSON object matching this exact structure:
{
  "isValidHealthQuery": true,
  "isEmergency": false,
  "emergencyNote": "",
  "recommendedSpecialty": "One exact string from the 6 specialties above",
  "secondarySpecialty": "Optional second exact string from the 6 specialties above, or empty string",
  "reason": "2 clear, friendly, non-diagnostic sentences explaining why this type of specialist is appropriate for evaluating the patient's concern.",
  "visitTip": "1 short, practical tip on what information to note down for the consultation (such as when symptoms started or any triggers)."
}`

    const callGroqModel = async (modelName) => {
      const controller = new AbortController()
      const timeout = setTimeout(() => controller.abort(), 12000)

      try {
        const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
          },
          body: JSON.stringify({
            model: modelName,
            temperature: 0.2,
            max_completion_tokens: 900,
            response_format: { type: 'json_object' },
            messages: [
              { role: 'system', content: systemPrompt },
              { role: 'user', content: `Patient concern: ${trimmedConcern}` },
            ],
          }),
          signal: controller.signal,
        })

        return response
      } finally {
        clearTimeout(timeout)
      }
    }

    const candidateModels = [
      process.env.GROQ_MODEL,
      'openai/gpt-oss-120b',
      'openai/gpt-oss-20b',
      'qwen/qwen3.8-27b',
    ].filter((m, idx, arr) => Boolean(m) && arr.indexOf(m) === idx)

    let groqJson = null
    let lastErrorStatus = 0
    let lastErrorText = ''

    for (const modelName of candidateModels) {
      try {
        const groqRes = await callGroqModel(modelName)
        if (groqRes && groqRes.ok) {
          const body = await groqRes.json()
          if (body?.choices?.[0]?.message?.content) {
            groqJson = body
            break
          }
        } else if (groqRes) {
          lastErrorStatus = groqRes.status
          lastErrorText = await groqRes.text().catch(() => '')
        }
      } catch (err) {
        lastErrorText = err.message
      }
    }

    if (!groqJson) {
      console.error('Groq API error:', lastErrorStatus, lastErrorText)
      return res.json({
        success: false,
        message: 'Vaidya is temporarily busy. Please try again in a moment.',
      })
    }

    const rawContent = String(groqJson?.choices?.[0]?.message?.content || '{}')
      .replace(/^```(?:json)?\s*/i, '')
      .replace(/\s*```$/i, '')
      .trim()
    let parsed
    try {
      parsed = JSON.parse(rawContent)
    } catch {
      return res.json({
        success: false,
        message: 'Could not interpret recommendation. Please rephrase your concern briefly.',
      })
    }

    if (parsed.isValidHealthQuery === false) {
      return res.json({
        success: false,
        message:
          'Please describe a health symptom, checkup need, or consultation reason so Vaidya can suggest the right specialist.',
      })
    }

    const matchedPrimary = VALID_SPECIALTIES.find(
      (s) => s.toLowerCase() === String(parsed.recommendedSpecialty || '').trim().toLowerCase()
    ) || 'General physician'

    const matchedSecondary = VALID_SPECIALTIES.find(
      (s) =>
        s.toLowerCase() === String(parsed.secondarySpecialty || '').trim().toLowerCase() &&
        s !== matchedPrimary
    ) || ''

    const parsedMaxFee = Number(maxFee)
    const allInSpecialty = await doctorModel
      .find({ speciality: matchedPrimary })
      .select('-password -email')
      .lean()

    // Sort available doctors first, then by consultation fee ascending
    allInSpecialty.sort((a, b) => {
      if (Boolean(b.available) !== Boolean(a.available)) {
        return b.available ? 1 : -1
      }
      return (a.fees || 0) - (b.fees || 0)
    })

    let matchedDoctors = allInSpecialty
    let budgetRelaxed = false

    if (parsedMaxFee > 0) {
      const withinBudget = allInSpecialty.filter((doc) => Number(doc.fees || 0) <= parsedMaxFee)
      if (withinBudget.length > 0) {
        matchedDoctors = withinBudget
      } else {
        budgetRelaxed = true
      }
    }

    return res.json({
      success: true,
      guidance: {
        recommendedSpecialty: matchedPrimary,
        secondarySpecialty: matchedSecondary,
        isEmergency: Boolean(parsed.isEmergency),
        emergencyNote:
          typeof parsed.emergencyNote === 'string' && parsed.emergencyNote.trim()
            ? parsed.emergencyNote.trim()
            : 'If you are experiencing severe or sudden emergency symptoms, please visit the nearest hospital emergency department or call 112 / 108 immediately.',
        reason:
          typeof parsed.reason === 'string' && parsed.reason.trim()
            ? parsed.reason.trim()
            : `A ${matchedPrimary} is well-suited to evaluate your concern and guide your next steps during a consultation.`,
        visitTip:
          typeof parsed.visitTip === 'string' && parsed.visitTip.trim()
            ? parsed.visitTip.trim()
            : 'Note down when your symptoms began, any triggers you noticed, and a list of current medicines to share during your visit.',
      },
      doctors: matchedDoctors.slice(0, 4),
      budgetRelaxed,
    })
  } catch (error) {
    console.error('Vaidya AI error:', error.message)
    return res.json({
      success: false,
      message: 'Vaidya could not process your request right now. Please try again.',
    })
  }
}


//to get the user profile
const getProfile = async (req, res) => {
  try {
    const { userId } = req
    const userData = await userModel.findById(userId).select('-password')

    res.json({ success: true, userData })
  } catch (error) {
    console.error('getProfile error:', error.message)
    res.json({ success: false, message: 'Unable to retrieve profile' })
  }
}

//api to update that profile
const updateProfile = async (req, res) => {
  const imageFile = req.file;
  try {
    const { userId } = req;
    const { name, phone, address, dob, gender } = req.body;

    if (!name || !phone || !dob || !gender) {
      return res.json({ success: false, message: 'Missing required profile data.' });
    }

    const trimmedPhone = String(phone).trim();
    const phoneRegex = /^[0-9+\s-]{8,15}$/;
    if (!phoneRegex.test(trimmedPhone)) {
      return res.json({ success: false, message: 'Please enter a valid phone number (8-15 digits).' });
    }

    let parsedAddress;
    try {
      parsedAddress = typeof address === 'string' ? JSON.parse(address) : address;
    } catch {
      parsedAddress = address || {};
    }

    let updatedUser = await userModel.findByIdAndUpdate(
      userId,
      { name: String(name).trim(), phone: trimmedPhone, address: parsedAddress, dob, gender },
      { new: true }
    );

    if (!updatedUser) {
      return res.json({ success: false, message: 'User not found or ID is invalid.' });
    }

    if (imageFile) {
      const imageUpload = await cloudinary.uploader.upload(imageFile.path, { resource_type: 'image' });
      const imageURL = imageUpload.secure_url;

      updatedUser = await userModel.findByIdAndUpdate(
        userId,
        { image: imageURL },
        { new: true }
      );
    }

    res.json({ success: true, message: 'Profile Updated successfully.', userData: updatedUser });

  } catch (error) {
    console.error("Error updating profile:", error.message);
    res.json({ success: false, message: 'An unexpected error occurred during profile update. Please try again.' });
  } finally {
    if (imageFile?.path && fs.existsSync(imageFile.path)) {
      try {
        fs.unlinkSync(imageFile.path);
      } catch (unlinkErr) {
        console.error('Failed to unlink profile image temp file:', unlinkErr.message);
      }
    }
  }
}

//api for the book appointment
const bookAppointment = async (req, res) => {
  try {
    const { userId } = req;
    const { docId, slotDate, slotTime } = req.body;

    if (!docId || !slotDate || !slotTime) {
      return res.json({
        success: false,
        message: 'Slot required. Please select a date and time before booking.'
      });
    }

    // 1. Fetch doctor & user in parallel with lean projection
    const [docData, userData] = await Promise.all([
      doctorModel.findById(docId).select('-password').lean(),
      userModel.findById(userId).select('name email phone address dob gender image').lean()
    ]);

    if (!docData) {
      return res.json({ success: false, message: 'Doctor not found' });
    }

    if (!docData.available) {
      return res.json({ success: false, message: 'Doctor not available' });
    }

    if (!userData) {
      return res.json({ success: false, message: 'User not found' });
    }

    // Fast in-memory check
    if (docData.slots_booked?.[slotDate]?.includes(slotTime)) {
      return res.json({ success: false, message: 'Slot not available' });
    }

    // 2. Atomic slot reservation (guarantees no double booking & eliminates race conditions)
    const reservedDoctor = await doctorModel.findOneAndUpdate(
      {
        _id: docId,
        available: true,
        [`slots_booked.${slotDate}`]: { $ne: slotTime }
      },
      {
        $push: { [`slots_booked.${slotDate}`]: slotTime }
      },
      { new: true, projection: { _id: 1 } }
    );

    if (!reservedDoctor) {
      return res.json({ success: false, message: 'Slot not available' });
    }

    // 3. Save appointment record
    try {
      const sanitizedDocData = { ...docData };
      delete sanitizedDocData.slots_booked;

      const appointmentData = {
        userId,
        docId,
        userData,
        docData: sanitizedDocData,
        amount: docData.fees,
        slotTime,
        slotDate,
        date: Date.now(),
      };

      const newAppointment = new appointmentModel(appointmentData);
      await newAppointment.save();

      return res.json({ success: true, message: 'Appointment Booked' });
    } catch (saveError) {
      // Roll back slot reservation if appointment save failed
      await doctorModel.updateOne(
        { _id: docId },
        { $pull: { [`slots_booked.${slotDate}`]: slotTime } }
      );
      throw saveError;
    }

  } catch (error) {
    console.error('bookAppointment error:', error.message);
    res.json({ success: false, message: 'Unable to book appointment. Please try again.' });
  }
};


//api to get the user booked appointents in frontend 
const listAppointment = async (req, res) => {

  try {

    const userId = req.userId
    const appointments = await appointmentModel.find({ userId })

    res.json({ success: true, appointments })

  } catch (error) {
    console.error('listAppointment error:', error.message)
    res.json({ success: false, message: 'Unable to retrieve appointments' })
  }

}

const cancelAppointment = async (req, res) => {
  try {
    const authenticatedUserId = req.userId
    const { appointmentId } = req.body

    if (!appointmentId) {
      return res.json({ success: false, message: 'Missing appointment ID' })
    }

    const appointmentData = await appointmentModel.findById(appointmentId).lean()

    if (!appointmentData) {
      return res.json({ success: false, message: 'Appointment not found' })
    }

    if (appointmentData.userId.toString() !== authenticatedUserId.toString()) {
      return res.json({ success: false, message: 'Unauthorized action: User ID mismatch' })
    }

    if (appointmentData.cancelled) {
      return res.json({ success: false, message: 'Appointment is already cancelled' })
    }

    const { docId, slotDate, slotTime } = appointmentData

    await Promise.all([
      appointmentModel.findByIdAndUpdate(appointmentId, { cancelled: true }),
      doctorModel.updateOne(
        { _id: docId },
        { $pull: { [`slots_booked.${slotDate}`]: slotTime } }
      )
    ])

    res.json({ success: true, message: 'Appointment Cancelled' })
  } catch (error) {
    console.error('cancelAppointment error:', error.message)
    res.json({ success: false, message: 'Could not cancel appointment. Please try again.' })
  }
}

const razorpayInstance = new razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET
})

// Cryptographically bind orderId + appointmentId + userId on the server so verifyRazorpay
// can validate ownership & appointment mapping in <0.2ms without an extra Razorpay API fetch
const createPaymentBindingToken = (orderId, appointmentId, userId) => {
  return crypto
    .createHmac('sha256', process.env.JWT_SECRET)
    .update(`${orderId}|${appointmentId}|${userId}`)
    .digest('hex')
}

const safeCompareHex = (a, b) => {
  if (typeof a !== 'string' || typeof b !== 'string' || a.length !== b.length) return false
  try {
    return crypto.timingSafeEqual(Buffer.from(a, 'utf8'), Buffer.from(b, 'utf8'))
  } catch {
    return false
  }
}

const paymentRazorpay = async (req, res) => {
  try {
    const { appointmentId } = req.body
    if (!appointmentId) {
      return res.json({ success: false, message: 'Missing appointment ID' })
    }

    const appointmentData = await appointmentModel
      .findById(appointmentId)
      .select('_id userId amount cancelled payment isCompleted')
      .lean()

    if (!appointmentData || appointmentData.cancelled) {
      return res.json({ success: false, message: 'Appointment cancelled or not found' })
    }

    if (appointmentData.userId.toString() !== req.userId.toString()) {
      return res.json({ success: false, message: 'Unauthorized payment request' })
    }

    if (appointmentData.payment) {
      return res.json({ success: false, alreadyPaid: true, message: 'Appointment is already paid' })
    }

    if (appointmentData.isCompleted) {
      return res.json({ success: false, message: 'Completed appointment cannot be paid online' })
    }

    // options
    const options = {
      amount: Math.round(appointmentData.amount * 100),
      currency: process.env.CURRENCY || 'INR',
      receipt: appointmentId.toString()
    }

    // order create
    const order = await razorpayInstance.orders.create(options)
    const paymentToken = createPaymentBindingToken(order.id, appointmentId.toString(), req.userId.toString())

    res.json({ success: true, order, paymentToken })
  } catch (error) {
    console.error('paymentRazorpay error:', error.message)
    res.json({ success: false, message: 'Unable to initiate payment order. Please try again.' })
  }
}

// API to verify payment of razorpay
const verifyRazorpay = async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, appointmentId, paymentToken } = req.body

    if (!razorpay_order_id) {
      return res.json({ success: false, message: 'Missing order ID' })
    }

    // Primary fast path: Verify HMAC-SHA256 Razorpay signature in constant time
    if (razorpay_payment_id && razorpay_signature) {
      const sign = `${razorpay_order_id}|${razorpay_payment_id}`
      const expectedSign = crypto
        .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
        .update(sign)
        .digest('hex')

      if (!safeCompareHex(razorpay_signature, expectedSign)) {
        return res.json({ success: false, message: 'Invalid payment signature' })
      }

      let targetAppointmentId = null

      if (appointmentId && paymentToken) {
        const expectedBinding = createPaymentBindingToken(
          razorpay_order_id,
          appointmentId.toString(),
          req.userId.toString()
        )
        if (!safeCompareHex(paymentToken, expectedBinding)) {
          return res.json({ success: false, message: 'Invalid payment verification token' })
        }
        targetAppointmentId = appointmentId.toString()
      } else {
        // Legacy fallback when paymentToken is not sent
        const orderInfo = await razorpayInstance.orders.fetch(razorpay_order_id)
        targetAppointmentId = orderInfo.receipt
      }

      const updatedAppointment = await appointmentModel.findOneAndUpdate(
        { _id: targetAppointmentId, userId: req.userId, cancelled: false },
        { $set: { payment: true } },
        { new: true, projection: { _id: 1, payment: 1 } }
      )

      if (!updatedAppointment) {
        return res.json({ success: false, message: 'Appointment not found or cancelled' })
      }

      return res.json({
        success: true,
        appointmentId: updatedAppointment._id,
        payment: true,
        message: 'Payment successful! Your appointment is confirmed.'
      })
    }

    // Fallback order status check
    const orderInfo = await razorpayInstance.orders.fetch(razorpay_order_id)
    if (orderInfo.status === 'paid') {
      const updatedAppointment = await appointmentModel.findOneAndUpdate(
        { _id: orderInfo.receipt, userId: req.userId, cancelled: false },
        { $set: { payment: true } },
        { new: true, projection: { _id: 1, payment: 1 } }
      )
      if (!updatedAppointment) {
        return res.json({ success: false, message: 'Appointment not found or cancelled' })
      }
      res.json({
        success: true,
        appointmentId: updatedAppointment._id,
        payment: true,
        message: 'Payment successful! Your appointment is confirmed.'
      })
    } else {
      res.json({ success: false, message: 'Payment was not completed.' })
    }
  } catch (error) {
    console.error('verifyRazorpay error:', error.message)
    res.json({
      success: false,
      message: 'Razorpay order verification failed. Please contact support.'
    })
  }
}

// API to handle Razorpay Webhook events (e.g. payment.captured, order.paid)
const razorpayWebhook = async (req, res) => {
  try {
    const signature = req.headers['x-razorpay-signature']
    const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET

    if (webhookSecret) {
      if (!signature) {
        return res.status(400).json({ success: false, message: 'Missing webhook signature' })
      }
      const rawBody = typeof req.body === 'string' ? req.body : JSON.stringify(req.body)
      const expectedSignature = crypto
        .createHmac('sha256', webhookSecret)
        .update(rawBody)
        .digest('hex')

      if (!safeCompareHex(signature, expectedSignature)) {
        return res.status(400).json({ success: false, message: 'Invalid webhook signature' })
      }
    }

    const event = req.body?.event
    const payload = req.body?.payload

    if (event === 'payment.captured' || event === 'order.paid') {
      const paymentEntity = payload?.payment?.entity
      const orderEntity = payload?.order?.entity
      const receipt = orderEntity?.receipt || paymentEntity?.notes?.appointmentId

      if (receipt) {
        await appointmentModel.findOneAndUpdate(
          { _id: receipt, cancelled: false },
          { $set: { payment: true } }
        )
      }
    }

    return res.status(200).json({ status: 'ok' })
  } catch (error) {
    console.error('Razorpay webhook error:', error.message)
    return res.status(500).json({ success: false, message: 'Webhook processing error' })
  }
}

export {
  registerUser,
  loginUser,
  googleLogin,
  submitFeedback,
  vaidyaRecommend,
  getProfile,
  updateProfile,
  bookAppointment,
  listAppointment,
  cancelAppointment,
  paymentRazorpay,
  verifyRazorpay,
  razorpayWebhook
}
