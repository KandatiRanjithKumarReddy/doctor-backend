import mongoose from 'mongoose';
import bcrypt from 'bcrypt';
import 'dotenv/config';
import connectDB from './config/mongodb.js';
import doctorModel from './models/doctorModel.js';

const seedGastroenterologists = async () => {
  try {
    await connectDB();

    const existingCount = await doctorModel.countDocuments({ speciality: 'Gastroenterologist' });
    if (existingCount > 0) {
      console.log(`Found ${existingCount} Gastroenterologist(s) already in database. Skipping seed.`);
      process.exit(0);
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash('Password@123', salt);

    const gastroDoctors = [
      {
        name: 'Dr. Arthur Conners',
        email: 'dr.arthur.gastro@meetourdoctor.com',
        password: hashedPassword,
        image: 'https://res.cloudinary.com/dmcszkkqe/image/upload/v1727768595/prescripto/doc1.png',
        speciality: 'Gastroenterologist',
        degree: 'MBBS, MD - Gastroenterology',
        experience: '5 Years',
        about: 'Dr. Arthur Conners specializes in clinical digestive health, endoscopy, and inflammatory bowel diseases, focusing on preventative medicine and modern gastrointestinal care.',
        fees: 900,
        address: {
          line1: '14, 80 Feet Road, Koramangala 4th Block',
          line2: 'Bengaluru, Karnataka - 560034'
        },
        date: Date.now(),
        available: true,
        slots_booked: {}
      },
      {
        name: 'Dr. Elena Vance',
        email: 'dr.elena.gastro@meetourdoctor.com',
        password: hashedPassword,
        image: 'https://res.cloudinary.com/dmcszkkqe/image/upload/v1727768595/prescripto/doc2.png',
        speciality: 'Gastroenterologist',
        degree: 'MBBS, FACG',
        experience: '4 Years',
        about: 'Dr. Elena Vance provides expert care in managing acid reflux, liver wellness, and general gastrointestinal evaluations with modern diagnostic strategies.',
        fees: 1000,
        address: {
          line1: '7th Phase, KPHB Colony, Kukatpally',
          line2: 'Hyderabad, Telangana - 500072'
        },
        date: Date.now(),
        available: true,
        slots_booked: {}
      },
      {
        name: 'Dr. Marcus Brody',
        email: 'dr.marcus.gastro@meetourdoctor.com',
        password: hashedPassword,
        image: 'https://res.cloudinary.com/dmcszkkqe/image/upload/v1727768595/prescripto/doc6.png',
        speciality: 'Gastroenterologist',
        degree: 'MBBS, MRCP',
        experience: '6 Years',
        about: 'Dr. Marcus Brody has extensive experience in digestive system wellness, nutritional therapies, and clinical gastroenterology consultations.',
        fees: 1200,
        address: {
          line1: '52, SV Road, Andheri West',
          line2: 'Mumbai, Maharashtra - 400058'
        },
        date: Date.now(),
        available: true,
        slots_booked: {}
      }
    ];

    await doctorModel.insertMany(gastroDoctors);
    console.log('Successfully seeded 3 Gastroenterologists into the database!');
    process.exit(0);
  } catch (error) {
    console.error('Error seeding gastroenterologists:', error);
    process.exit(1);
  }
};

seedGastroenterologists();
