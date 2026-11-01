# ⚙️ Prescripto – Smart AI Healthcare Platform (Backend)

> **Central REST API server handling authentication, doctor scheduling, atomic bookings, payments, and the Vaidya AI doctor finder.**

- **Live API Endpoint:** [https://doctor-backend-sigma.vercel.app](https://doctor-backend-sigma.vercel.app)
- **Deployment Platform:** Vercel (Node.js Serverless)

---

## 📖 What This Folder Does

The `backend` folder contains the central server application for **Prescripto – Smart AI Healthcare Platform**. It acts as the brain of the ecosystem:
1. It connects directly to the **MongoDB Atlas** database to store doctors, appointments, users, and feedback.
2. It handles business logic, security permissions, and API rate limits.
3. It communicates with external cloud services: **Groq** for AI specialist recommendations, **Razorpay** for payment orders and signature verification, **Cloudinary** for doctor photo storage, and **Google** for verifying Google sign-in tokens.

---

## ✨ Main Features

* **User & Admin Authentication:**
  * JWT-based secure authentication for patients, doctors, and administrators.
  * Google OAuth ID token verification using Google's official auth library.
  * Passwords hashed using `bcrypt` with salt rounds.

* **Atomic Appointment Booking & Anti-Double-Booking:**
  * High-performance booking response times (< 200 ms).
  * Uses MongoDB atomic operators (`$push` and `$ne`) to reserve slots, mathematically preventing two users from double-booking the exact same slot.

* **🤖 Vaidya AI — Specialist & Doctor Recommendation Engine:**
  * Powered by **Groq** high-speed LLM inference.
  * Uses open-source medical routing models (`openai/gpt-oss-120b`, `openai/gpt-oss-20b`, `qwen/qwen3.8-27b`).
  * **Automatic Fallback Cascade:** If the primary model is busy or rate-limited, the server automatically fails over to secondary models to ensure 100% uptime.
  * **Strict Safety Guardrails:** Programmed never to diagnose conditions or prescribe medications; maps user concerns into one of 6 platform specialties.
  * **Emergency Detection:** Detects life-threatening symptoms and responds with immediate hospital/emergency contact advice (112 / 108 in India).
  * **Database Integration:** Filters and sorts matching doctors from MongoDB within the patient's budget.

* **Online Payments & Webhook:**
  * Razorpay order creation for appointment fees in Indian Rupees (INR ₹).
  * Cryptographic HMAC-SHA256 signature verification in constant time (`crypto.timingSafeEqual`).
  * Dedicated webhook route (`/api/user/razorpay-webhook`) to capture asynchronous payment confirmations.

* **Secure File Uploads:**
  * Multer middleware configured with a 5MB size limit and image-only MIME whitelist (`image/jpeg`, `image/png`, `image/webp`).
  * Cryptographically random filenames to prevent path traversal attacks.
  * Automatic temporary file cleanup using `fs.unlinkSync` in `finally` blocks after Cloudinary upload.

* **Production Security & Error Sanitization:**
  * Strict primitive type validation (`typeof === 'string'`) to block NoSQL query injection.
  * Endpoint rate limiters for auth, booking, feedback, payments, and AI requests.
  * Global Express 404 and 500 error handlers that suppress raw internal error stacks.
  * Universal CORS policy enabled across all HTTP methods.

---

## 🛠 Technologies Actually Used

* **Runtime:** Node.js (ES Modules)
* **Web Framework:** Express.js 5
* **Database & ODM:** MongoDB & Mongoose 8
* **AI & LLM Inference:** Groq API (via native fetch)
* **Authentication:** JSON Web Tokens (`jsonwebtoken`), `bcrypt`, `google-auth-library`
* **File Uploads & Cloud Media:** `multer`, `cloudinary`
* **Payments:** `razorpay`, native `crypto`
* **Input Validation:** `validator`
* **Security & Utility:** `cors`, `dotenv`

---

## ⚙️ Environment Variables

Create a `.env` file in the `backend` root:

```env
PORT=4000
MONGODB_URI=your_mongodb_connection_string
CLOUDINARY_NAME=your_cloudinary_cloud_name
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_SECRET_KEY=your_cloudinary_api_secret
ADMIN_EMAIL=your_admin_email
ADMIN_PASSWORD=your_admin_password
JWT_SECRET=your_jwt_secret_key
RAZORPAY_KEY_ID=your_razorpay_key_id
RAZORPAY_KEY_SECRET=your_razorpay_key_secret
CURRENCY=INR
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
GROQ_API_KEY=your_groq_api_key
```

---

## 🚀 Local Development

1. **Install dependencies:**
   ```bash
   npm install
   ```
2. **Start the server:**
   ```bash
   npm start
   ```
   *The server runs by default at `http://localhost:4000`.*

