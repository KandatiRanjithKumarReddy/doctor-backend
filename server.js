import express from 'express'
import cors from 'cors'
import 'dotenv/config'
import connectDB from './config/mongodb.js';
import connectCloudinary from './config/cloudinary.js';
import adminRouter from './routes/adminRouter.js';
import doctorRouter from './routes/doctorRouter.js';
import userRouter from './routes/userRoute.js';


const app = express();

const port = process.env.PORT || 4000
connectDB()
connectCloudinary()


// Allow CORS for all origins, HTTP methods, and headers
app.use(cors({
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS', 'HEAD'],
    allowedHeaders: ['Content-Type', 'Authorization', 'token', 'dtoken', 'atoken', 'currency', 'X-Requested-With', 'Accept', '*'],
    exposedHeaders: ['token', 'dtoken', 'atoken'],
    optionsSuccessStatus: 204
}))

app.use(express.json())

//apis
app.use('/api', async (req, res, next) => {
    try {
        await connectDB();
        next();
    } catch (error) {
        console.error('Database connection failed:', error);
        res.status(500).json({ success: false, message: 'Database connection unavailable. Please try again.' });
    }
});

app.use('/api/admin', adminRouter)
app.use('/api/doctor', doctorRouter)
app.use('/api/user', userRouter)

app.get('/', (req, res) => {
    res.send("api is working Perfectly!")
})

// Global 404 handler for undefined API routes
app.use((req, res) => {
    res.status(404).json({ success: false, message: 'API route not found' })
})

// Global express error handler to hide stack traces and sensitive internal error details
app.use((err, req, res, next) => {
    console.error('Unhandled server error:', err.message)
    const statusCode = err.status || err.statusCode || 500
    res.status(statusCode).json({
        success: false,
        message: statusCode === 500 ? 'Internal server error. Please try again later.' : (err.message || 'An unexpected error occurred.')
    })
})

app.listen(port, () => {
    console.log("server started", port)
})
