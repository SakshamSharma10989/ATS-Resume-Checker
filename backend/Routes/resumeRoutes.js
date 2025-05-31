// Routes/resumeRoutes.js
const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs').promises;

router.post('/upload', async (req, res) => {
  try {
    console.log('Received upload request');
    console.log('req.files:', req.files);
    if (!req.files || !req.files.resume) {
      console.log('No resume file found in request');
      return res.status(400).json({ error: 'No resume file uploaded.' });
    }

    const resume = req.files.resume;
    console.log('Resume file:', resume.name);
    const uploadDir = path.join(__dirname, '..', 'Uploads');

    console.log('Upload directory:', uploadDir);
    try {
      await fs.access(uploadDir);
    } catch (err) {
      console.log('Creating upload directory:', uploadDir, 'Error:', err.message);
      await fs.mkdir(uploadDir, { recursive: true });
    }

    const fileName = `${Date.now()}-${resume.name}`;
    const filePath = path.join(uploadDir, fileName);
    console.log('Saving file to:', filePath);

    await new Promise((resolve, reject) => {
      resume.mv(filePath, (err) => {
        if (err) return reject(err);
        console.log('File saved successfully');
        resolve();
      });
    });

    res.json({
      fileName: resume.name,
      fileUrl: `/uploads/${fileName}`,
      filePath: filePath,
    });
  } catch (err) {
    console.error('Upload error:', err);
    res.status(500).json({ error: 'Failed to upload resume.', details: err.message });
  }
});

module.exports = router;