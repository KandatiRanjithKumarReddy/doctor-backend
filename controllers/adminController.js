import validator from "validator"
import bcrypt from 'bcrypt'
import { v2 as cloudinary } from 'cloudinary'
import doctorModel from "../models/doctorModel.js"
import jwt from 'jsonwebtoken'
import userModel from "../models/userModel.js"
import appointmentModel from "../models/appointmentModel.js"
import fs from 'fs'

// API for adding doctor
const addDoctor = async (req, res) => {
  const imageFile = req.file;
  try {
    const { name, email, password, speciality, degree, experience, about, fees, address } = req.body;

    if (!imageFile) {
      return res.status(400).json({ success: false, message: 'Image file is missing' });
    }

    // check for all required data and safe types
    if (
      typeof name !== 'string' || !name.trim() ||
      typeof email !== 'string' || !email.trim() ||
      typeof password !== 'string' || !password ||
      typeof speciality !== 'string' || !speciality.trim() ||
      typeof degree !== 'string' || !degree.trim() ||
      typeof experience !== 'string' || !experience.trim() ||
      typeof about !== 'string' || !about.trim() ||
      !fees ||
      !address
    ) {
      return res.json({ success: false, message: 'Missing or invalid details' });
    }

    const numFees = Number(fees);
    if (isNaN(numFees) || numFees < 100 || numFees > 50000) {
      return res.json({ success: false, message: 'Doctor consultation fee must be between ₹100 and ₹50,000' });
    }

    let parsedAddress;
    try {
      parsedAddress = typeof address === 'string' ? JSON.parse(address) : address;
    } catch {
      return res.json({ success: false, message: 'Invalid address format' });
    }

    const normalizedEmail = email.trim().toLowerCase();

    // validate email
    if (!validator.isEmail(normalizedEmail)) {
      return res.json({ success: false, message: 'Please enter a valid email' });
    }

    // validate password strength
    if (password.length < 8) {
      return res.json({ success: false, message: 'Please enter a strong password (min 8 characters)' });
    }

    // check if doctor email already exists before hashing/uploading
    const existingDoctor = await doctorModel.findOne({ email: normalizedEmail }).select('_id').lean();
    if (existingDoctor) {
      return res.json({ success: false, message: 'A doctor with this email already exists.' });
    }

    // hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // upload image to cloudinary
    const imageUpload = await cloudinary.uploader.upload(imageFile.path, { resource_type: 'image' });
    const imageUrl = imageUpload.secure_url;

    // prepare doctor data
    const doctorData = {
      name: name.trim(),
      email: normalizedEmail,
      image: imageUrl,
      password: hashedPassword,
      speciality: speciality.trim(),
      degree: degree.trim(),
      experience: experience.trim(),
      about: about.trim(),
      fees: numFees,
      address: parsedAddress,
      date: Date.now(),
    };

    const newDoctor = new doctorModel(doctorData);
    await newDoctor.save();

    return res.json({ success: true, message: 'Doctor Added' });
  } catch (error) {
    console.error('Admin addDoctor error:', error.message);
    if (error.code === 11000) {
      return res.json({ success: false, message: 'A doctor with this email already exists.' });
    }
    return res.json({ success: false, message: error.message || 'Failed to add doctor' });
  } finally {
    if (imageFile?.path && fs.existsSync(imageFile.path)) {
      try {
        fs.unlinkSync(imageFile.path);
      } catch (unlinkErr) {
        console.error('Failed to unlink uploaded file:', unlinkErr.message);
      }
    }
  }
}

const loginAdmin = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (typeof email !== 'string' || typeof password !== 'string') {
      return res.json({ success: false, message: 'Invalid Credentials' });
    }

    if (!process.env.ADMIN_EMAIL || !process.env.ADMIN_PASSWORD) {
      return res.status(500).json({ success: false, message: 'Admin credentials are not configured on the server' });
    }

    if (email === process.env.ADMIN_EMAIL && password === process.env.ADMIN_PASSWORD) {
      const token = jwt.sign(email + password, process.env.JWT_SECRET);
      res.json({ success: true, token });
    } else {
      res.json({ success: false, message: 'Invalid Credentials' });
    }

  } catch (error) {
    console.error('Admin login error:', error.message);
    res.json({ success: false, message: 'Login failed. Please try again.' });
  }
}

// API to get all doctors list for admin panel
const allDoctors = async (req, res) => {
  try {
    const doctors = await doctorModel.find({}).select('-password');
    res.json({ success: true, doctors });
  } catch (error) {
    console.error('Admin allDoctors error:', error.message);
    res.json({ success: false, message: 'Unable to retrieve doctors' });
  }
}

//api to get all appoinments
const appointmentsAdmin = async (req, res) => {
  try {
    const appointments = await appointmentModel.find({});
    res.json({ success: true, appointments });
  } catch (error) {
    console.error('Admin appointments error:', error.message);
    res.json({ success: false, message: 'Unable to retrieve appointments' });
  }
}

// API for appointment cancellation
const appointmentCancel = async (req, res) => {
  try {
    const { appointmentId } = req.body;
    if (!appointmentId) {
      return res.json({ success: false, message: 'Missing appointment ID' });
    }

    const appointmentData = await appointmentModel.findById(appointmentId);
    if (!appointmentData) {
      return res.json({ success: false, message: 'Appointment not found' });
    }

    await appointmentModel.findByIdAndUpdate(appointmentId, { cancelled: true });

    // releasing doctor slot
    const { docId, slotDate, slotTime } = appointmentData;
    const doctorData = await doctorModel.findById(docId);
    if (doctorData && doctorData.slots_booked && doctorData.slots_booked[slotDate]) {
      let slots_booked = doctorData.slots_booked;
      slots_booked[slotDate] = slots_booked[slotDate].filter(e => e !== slotTime);
      await doctorModel.findByIdAndUpdate(docId, { slots_booked });
    }

    res.json({ success: true, message: 'Appointment Cancelled' });
  } catch (error) {
    console.error('Admin appointmentCancel error:', error.message);
    res.json({ success: false, message: 'Unable to cancel appointment' });
  }
}

//api to display the data in the admin pannel
const adminDashboard = async (req, res) => {
  try {
    const [doctorsCount, usersCount, appointmentsCount, latestAppointments] = await Promise.all([
      doctorModel.countDocuments(),
      userModel.countDocuments(),
      appointmentModel.countDocuments(),
      appointmentModel.find({}).sort({ date: -1 }).limit(5)
    ]);

    const dashData = {
      doctors: doctorsCount,
      appointments: appointmentsCount,
      patients: usersCount,
      lastestAppointments: latestAppointments
    };

    res.json({ success: true, dashData });
  } catch (error) {
    console.error('Admin dashboard error:', error.message);
    res.json({ success: false, message: 'Unable to load dashboard data' });
  }
}

export { addDoctor, loginAdmin, allDoctors, appointmentsAdmin, appointmentCancel, adminDashboard }
