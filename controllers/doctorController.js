import doctorModel from '../models/doctorModel.js'
import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'
import appointmentModel from '../models/appointmentModel.js'

const DEFAULT_AVATAR_PREFIX = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAPAAAADwCAYAAAA+VemS'

// Fetch only fields used by DoctorAppointments & DoctorDashboard, and strip the repeated ~4 KB
// default Base64 avatar inside MongoDB while preserving real uploaded Cloudinary URLs.
const DOCTOR_APPOINTMENT_PROJECTION = {
  slotDate: 1,
  slotTime: 1,
  amount: 1,
  payment: 1,
  cancelled: 1,
  isCompleted: 1,
  date: 1,
  userData: {
    name: '$userData.name',
    dob: '$userData.dob',
    image: {
      $cond: [
        {
          $eq: [
            { $substrCP: [{ $ifNull: ['$userData.image', ''] }, 0, DEFAULT_AVATAR_PREFIX.length] },
            DEFAULT_AVATAR_PREFIX
          ]
        },
        '',
        { $ifNull: ['$userData.image', ''] }
      ]
    }
  }
}

const changeAvailablity = async (req, res) => {
  try {
    const { docId } = req.body
    if (!docId || typeof docId !== 'string') {
      return res.json({ success: false, message: 'Valid Doctor ID is required' })
    }
    const docData = await doctorModel.findById(docId).select('available').lean()
    if (!docData) {
      return res.json({ success: false, message: 'Doctor not found' })
    }
    await doctorModel.findByIdAndUpdate(docId, { available: !docData.available })
    res.json({ success: true, message: 'Availability Changed' })
  } catch (error) {
    console.error('Doctor availability error:', error.message)
    res.json({ success: false, message: 'Unable to change availability' })
  }
}

const doctorList = async (req, res) => {
  try {
    const doctors = await doctorModel.find({}).select(['-password', '-email']).lean()
    res.json({ success: true, doctors })
  } catch (error) {
    console.error('Doctor list error:', error.message)
    res.json({ success: false, message: 'Unable to retrieve doctor list' })
  }
}

//api for the doctor login
const loginDoctor = async (req, res) => {
  try {
    const { email, password } = req.body

    if (typeof email !== 'string' || typeof password !== 'string' || !email.trim() || !password) {
      return res.json({ success: false, message: 'Invalid credentials' })
    }

    const normalizedEmail = email.trim().toLowerCase()
    const doctor = await doctorModel.findOne({ email: normalizedEmail }).lean() || await doctorModel.findOne({ email: email.trim() }).lean()

    if (!doctor) {
      return res.json({ success: false, message: 'Invalid credentials' })
    }

    const isMatch = await bcrypt.compare(password, doctor.password)

    if (isMatch) {
      const token = jwt.sign({ id: doctor._id }, process.env.JWT_SECRET)
      res.json({ success: true, token })
    } else {
      res.json({ success: false, message: 'Invalid credentials' })
    }
  } catch (error) {
    console.error('Doctor login error:', error.message)
    res.json({ success: false, message: 'Login failed. Please try again.' })
  }
}

//api to get the doctor appointments to panel
const appointmentsDoctor = async (req, res) => {
  try {
    const docId = req.docId;
    const appointments = await appointmentModel
      .find({ docId }, DOCTOR_APPOINTMENT_PROJECTION)
      .sort({ date: -1 })
      .lean()

    res.json({ success: true, appointments })

  } catch (error) {
    console.error('Doctor appointments error:', error.message)
    res.json({ success: false, message: 'Unable to retrieve appointments' })
  }
}

//api to mark the appointment completed
const appointmentComplete = async (req, res) => {
  try {
    const { appointmentId } = req.body
    const docId = req.docId;

    if (!appointmentId || typeof appointmentId !== 'string') {
      return res.json({ success: false, message: 'Valid Appointment ID is required' })
    }

    const updated = await appointmentModel.findOneAndUpdate(
      { _id: appointmentId, docId },
      { $set: { isCompleted: true } },
      { new: true, projection: { _id: 1 } }
    )

    if (updated) {
      return res.json({ success: true, message: 'Appointment Completed' })
    } else {
      return res.json({ success: false, message: 'Mark Failed' })
    }
  } catch (error) {
    console.error('Doctor appointmentComplete error:', error.message)
    res.json({ success: false, message: 'Unable to complete appointment' })
  }
}

//api to cancel appointment in doctor pannel
const appointmentCancel = async (req, res) => {
  try {
    const { appointmentId } = req.body
    const docId = req.docId;

    if (!appointmentId || typeof appointmentId !== 'string') {
      return res.json({ success: false, message: 'Valid Appointment ID is required' })
    }

    const appointmentData = await appointmentModel.findById(appointmentId).select('docId slotDate slotTime').lean()

    if (appointmentData && appointmentData.docId === docId) {
      const { slotDate, slotTime } = appointmentData
      const doctorData = await doctorModel.findById(docId).select('slots_booked').lean()
      const updates = [appointmentModel.findByIdAndUpdate(appointmentId, { cancelled: true })]

      // Release doctor slot so patients can rebook it
      if (doctorData && doctorData.slots_booked && doctorData.slots_booked[slotDate]) {
        const slots_booked = {
          ...doctorData.slots_booked,
          [slotDate]: doctorData.slots_booked[slotDate].filter((e) => e !== slotTime)
        }
        updates.push(doctorModel.findByIdAndUpdate(docId, { slots_booked }))
      }

      await Promise.all(updates)

      return res.json({ success: true, message: 'Appointment Cancelled' })
    } else {
      return res.json({ success: false, message: 'Cancellation failed' })
    }
  } catch (error) {
    console.error('Doctor appointmentCancel error:', error.message)
    res.json({ success: false, message: 'Unable to cancel appointment' })
  }
}

//api for dashboard for doctor pannel
const doctorDashboard = async (req, res) => {
  try {
    const docId = req.docId;
    const [appointments, latestAppointments] = await Promise.all([
      appointmentModel.find({ docId }).select('amount isCompleted payment userId').lean(),
      appointmentModel.find({ docId }, DOCTOR_APPOINTMENT_PROJECTION).sort({ date: -1 }).limit(5).lean()
    ]);

    let earnings = 0;
    const patientSet = new Set();

    appointments.forEach((item) => {
      if (item.isCompleted || item.payment) {
        earnings += (item.amount || 0);
      }
      if (item.userId) {
        patientSet.add(item.userId.toString());
      }
    });

    const dashData = {
      earnings,
      appointments: appointments.length,
      patients: patientSet.size,
      latestAppointments
    };

    res.json({ success: true, dashData });
  } catch (error) {
    console.error('Doctor dashboard error:', error.message);
    res.json({ success: false, message: 'Unable to load dashboard' });
  }
}

//api for doctor profile
const doctorProfile = async (req, res) => {
  try {
    const docId = req.docId
    const profileData = await doctorModel.findById(docId).select('-password').lean()

    res.json({ success: true, profileData })
  } catch (error) {
    console.error('Doctor profile error:', error.message)
    res.json({ success: false, message: 'Unable to retrieve profile' })
  }
}

// api for update doctor profile 
const updateDoctorProfile = async (req, res) => {
  try {
    const { docId, fees, address, available } = req.body

    if (!docId || typeof docId !== 'string') {
      return res.json({ success: false, message: 'Doctor ID is required' })
    }

    const updates = {}
    if (fees !== undefined) {
      const numFees = Number(fees)
      if (isNaN(numFees) || numFees < 100 || numFees > 50000) {
        return res.json({ success: false, message: 'Consultation fee must be between ₹100 and ₹50,000' })
      }
      updates.fees = numFees
    }
    if (address !== undefined) {
      updates.address = address
    }
    if (available !== undefined) {
      updates.available = Boolean(available)
    }

    await doctorModel.findByIdAndUpdate(
      docId,
      { $set: updates },
      { new: true }
    )

    res.json({ success: true, message: 'Profile Updated' })
  } catch (error) {
    console.error('Doctor updateProfile error:', error.message)
    res.json({ success: false, message: 'Unable to update profile' })
  }
}


export { changeAvailablity, doctorList, loginDoctor, appointmentsDoctor, appointmentComplete, appointmentCancel, doctorDashboard, updateDoctorProfile, doctorProfile };
