import { v2 as cloudinary } from 'cloudinary';
import path from 'path';
import { fileURLToPath } from 'url';
import 'dotenv/config';
import connectDB from './config/mongodb.js';
import doctorModel from './models/doctorModel.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const uploadAndUpdate = async () => {
  try {
    cloudinary.config({
      cloud_name: process.env.CLOUDINARY_NAME,
      api_key: process.env.CLOUDINARY_API_KEY,
      api_secret: process.env.CLOUDINARY_SECRET_KEY,
    });

    console.log('Connecting to database...');
    await connectDB();
    console.log('Database connected.');

    const doc16Path = path.resolve(__dirname, '../frontend/src/assets/doc16.png');
    const doc17Path = path.resolve(__dirname, '../frontend/src/assets/doc17.png');
    const doc18Path = path.resolve(__dirname, '../frontend/src/assets/doc18.png');

    console.log('Uploading doc16.png to Cloudinary...');
    const res16 = await cloudinary.uploader.upload(doc16Path, { resource_type: 'image' });
    console.log('doc16 uploaded:', res16.secure_url);

    console.log('Uploading doc17.png to Cloudinary...');
    const res17 = await cloudinary.uploader.upload(doc17Path, { resource_type: 'image' });
    console.log('doc17 uploaded:', res17.secure_url);

    console.log('Uploading doc18.png to Cloudinary...');
    const res18 = await cloudinary.uploader.upload(doc18Path, { resource_type: 'image' });
    console.log('doc18 uploaded:', res18.secure_url);

    // Update Dr. Arthur Conners
    await doctorModel.findOneAndUpdate(
      { name: 'Dr. Arthur Conners' },
      {
        image: res16.secure_url,
        fees: 900,
        address: {
          line1: '14, 80 Feet Road, Koramangala 4th Block',
          line2: 'Bengaluru, Karnataka - 560034',
        },
      }
    );
    console.log('Updated Dr. Arthur Conners in MongoDB');

    // Update Dr. Elena Vance
    await doctorModel.findOneAndUpdate(
      { name: 'Dr. Elena Vance' },
      {
        image: res17.secure_url,
        fees: 1000,
        address: {
          line1: '7th Phase, KPHB Colony, Kukatpally',
          line2: 'Hyderabad, Telangana - 500072',
        },
      }
    );
    console.log('Updated Dr. Elena Vance in MongoDB');

    // Update Dr. Marcus Brody
    await doctorModel.findOneAndUpdate(
      { name: 'Dr. Marcus Brody' },
      {
        image: res18.secure_url,
        fees: 1200,
        address: {
          line1: '52, SV Road, Andheri West',
          line2: 'Mumbai, Maharashtra - 400058',
        },
      }
    );
    console.log('Updated Dr. Marcus Brody in MongoDB');

    console.log('All Gastroenterologists successfully updated!');
    process.exit(0);
  } catch (error) {
    console.error('Error uploading/updating:', error);
    process.exit(1);
  }
};

uploadAndUpdate();
