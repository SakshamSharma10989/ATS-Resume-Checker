const mongoose = require('mongoose');

// Define the schema for strengths and weaknesses as objects with subfields
const StrengthsWeaknessesSchema = new mongoose.Schema({
  skills: { type: [String], default: [] },
  experience: { type: [String], default: [] },
  education: { type: [String], default: [] },
  overall: { type: [String], default: [] },
});

const AnalysisSchema = new mongoose.Schema({
  cacheKey: {
    type: String,
    required: true,
    unique: true,
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
  createdAt: {
    type: Date,
    default: Date.now,
    expires: '7d', // Optional: expire after 7 days
  },
});

// Clear any existing model to force schema reload
delete mongoose.models['Analysis'];
mongoose.model('Analysis', AnalysisSchema);

module.exports = mongoose.model('Analysis', AnalysisSchema);