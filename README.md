# Backend - MeetOurDoctor Healthcare Appointment API

## ✨ Overview

The **Backend** is an Express 5 REST API handling user and doctor authentication, doctor directory listings, appointment booking and slot tracking, Razorpay payment orders and HMAC signature verification, Cloudinary image uploads, and admin operations.

## ⚙️ Environment Variables

Create a `.env` file in the `backend` directory with the following configuration:

```env
PORT=4000
MONGODB_URI=mongodb+srv://<username>:<password>@cluster0.mongodb.net
CLOUDINARY_NAME=your_cloudinary_name
CLOUDINARY_API_KEY=your_cloudinary_key
CLOUDINARY_SECRET_KEY=your_cloudinary_secret
ADMIN_EMAIL=admin@meetourdoctor.com
ADMIN_PASSWORD=your_admin_password
JWT_SECRET=your_jwt_secret_key
RAZORPAY_KEY_ID=your_razorpay_key_id
RAZORPAY_KEY_SECRET=your_razorpay_key_secret
CURRENCY=INR
```

## 🚀 Getting Started

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Run in development mode (with Nodemon):**
   ```bash
   npm run server
   ```

3. **Run in production mode:**
   ```bash
   npm start
   ```

4. **Seed Gastroenterologist Doctors (Optional):**
   ```bash
   node seedGastro.js
   ```

## 🛣 API Routes

### 1. Patient Routes (`/api/user`)
* `POST /api/user/register` - Register a new patient account (rate-limited)
* `POST /api/user/login` - Patient login & JWT generation (rate-limited)
* `GET /api/user/get-profile` - Fetch authenticated user profile
* `POST /api/user/update-profile` - Update profile data & photo
* `POST /api/user/book-appointment` - Reserve appointment slot (rate-limited)
* `GET /api/user/appointments` - List authenticated user's appointments
* `POST /api/user/cancel-appointment` - Cancel booking and release slot (rate-limited)
* `POST /api/user/payment-razorpay` - Create Razorpay order
* `POST /api/user/verifyRazorpay` - Verify payment signature and mark appointment paid

### 2. Doctor Routes (`/api/doctor`)
* `GET /api/doctor/list` - Public doctor directory (rate-limited)
* `POST /api/doctor/login` - Doctor login & JWT generation (rate-limited)
* `GET /api/doctor/appointments` - View assigned doctor appointments
* `POST /api/doctor/complete-appointment` - Mark consultation completed
* `POST /api/doctor/cancel-appointment` - Doctor cancellation
* `GET /api/doctor/dashboard` - Doctor metrics and earnings
* `GET /api/doctor/profile` - Doctor bio, fees, and address
* `POST /api/doctor/update-profile` - Update doctor fees, address, and availability

### 3. Admin Routes (`/api/admin`)
* `POST /api/admin/login` - Administrator login (rate-limited)
* `POST /api/admin/add-doctor` - Add new doctor with Cloudinary photo upload
* `POST /api/admin/all-doctors` - List all doctors for admin management
* `POST /api/admin/change-availability` - Toggle doctor availability
* `GET /api/admin/appointments` - Platform-wide appointment list
* `POST /api/admin/cancel-appointment` - Admin appointment cancellation
* `GET /api/admin/dashboard` - Aggregated platform statistics

## 🛡 Security & Optimization Features
* **Zero-dependency Rate Limiting:** Sliding-window protection on authentication (10 req/15 min) and booking routes.
* **Cryptographic Payment Verification:** HMAC-SHA256 signature verification matching Razorpay security guidelines.
* **Database Indexing:** Compound indexes on `userId`, `docId`, and `speciality`.
* **Optimized Counts:** Uses `countDocuments()` instead of fetching full document arrays into memory.

## 📄 License

MIT License
