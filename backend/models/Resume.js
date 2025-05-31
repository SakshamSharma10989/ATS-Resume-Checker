// models/Resume.js
const mongoose = require('mongoose');

const resumeSchema = new mongoose.Schema({
  name: String,
  email: String,
  phone: String,
  text: String,
  fileUrl: String,
  filename: String,
  uploadedAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Resume', resumeSchema);
