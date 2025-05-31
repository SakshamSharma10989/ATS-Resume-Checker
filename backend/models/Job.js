const mongoose = require('mongoose');

// Reuse the same schema for strengths and weaknesses
const StrengthsWeaknessesSchema = new mongoose.Schema({
  skills: { type: [String], default: [] },
  experience: { type: [String], default: [] },
  education: { type: [String], default: [] },
  overall: { type: [String], default: [] },
});

const JobSchema = new mongoose.Schema({
  jobId: {
    type: String,
    required: true,
    unique: true,
  },
  status: {
    type: String,
    enum: ['pending', 'completed', 'failed'],
    default: 'pending',
  },
  result: {
    raw: {
      type: String,
      default: '',
    },
    scores: {
      skillsMatch: { type: Number, default: 0 },
      experienceMatch: { type: Number, default: 0 },
      educationMatch: { type: Number, default: 0 },
      overall: { type: Number, default: 0 },
      matchScore: { type: Number, default: 0 },
    },
    strengths: {
      type: StrengthsWeaknessesSchema,
      default: () => ({
        skills: [],
        experience: [],
        education: [],
        overall: [],
      }),
    },
    weaknesses: {
      type: StrengthsWeaknessesSchema,
      default: () => ({
        skills: [],
        experience: [],
        education: [],
        overall: [],
      }),
    },
  },
  error: String,
  createdAt: {
    type: Date,
    default: Date.now,
    expires: '1h', // Optional: expire after 1 hour
  },
});

// Clear any existing model to force schema reload
delete mongoose.models['Job'];
mongoose.model('Job', JobSchema);

module.exports = mongoose.model('Job', JobSchema);