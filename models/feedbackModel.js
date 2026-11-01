import mongoose from 'mongoose'

const feedbackSchema = new mongoose.Schema({
  userId: { type: String, default: null, index: true },
  userName: { type: String, default: 'Guest' },
  userEmail: { type: String, default: '' },
  category: {
    type: String,
    enum: ['Idea', 'Problem', 'Other'],
    required: true,
  },
  message: {
    type: String,
    required: true,
    trim: true,
    maxlength: 1000,
  },
  page: { type: String, default: '' },
  createdAt: { type: Date, default: Date.now },
})

const feedbackModel = mongoose.models.feedback || mongoose.model('feedback', feedbackSchema)

export default feedbackModel

