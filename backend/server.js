// server.js
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
const fileUpload = require('express-fileupload');
const fs = require('fs');
require('dotenv').config();
const resumeRoutes = require('./Routes/resumeRoutes.js');
const atsRoutes = require('./Routes/atsRoutes');

process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err);
});
process.on('unhandledRejection', (err) => {
  console.error('Unhandled Rejection:', err);
});

const app = express();

console.log('Mongo URL:', process.env.MONGO_URL ? 'Set' : 'Missing');
console.log('OPENROUTER_API_KEY:', process.env.OPENROUTER_API_KEY ? 'Set' : 'Missing');

app.use(
  cors({
    credentials: true,
    origin: ['http://localhost:5173', 'http://localhost:5174'],
  })
);
app.use(express.json());

app.use(
  fileUpload({
    useTempFiles: true,
    tempFileDir: '/tmp/',
  })
);

app.use((req, res, next) => {
  console.log(`Incoming request: ${req.method} ${req.url}`);
  next();
});

app.use('/api/resumes', resumeRoutes);
app.use('/api/ats', atsRoutes);

const uploadDir = path.join(__dirname, 'Uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir);
}
app.use('/uploads', express.static(uploadDir));

mongoose
  .connect(process.env.MONGO_URL, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    retryWrites: true,
  })
  .then(() => console.log('✅ MongoDB Connected'))
  .catch((err) => console.error('❌ MongoDB Connection Error:', err));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server is running on http://localhost:${PORT}`);
});
