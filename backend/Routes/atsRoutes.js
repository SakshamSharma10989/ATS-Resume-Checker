const express = require('express');
const router = express.Router();
const Analysis = require('../models/Analysis');
const Job = require('../models/Job');
const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');
const fs = require('fs').promises;
const path = require('path');
const pdfParse = require('pdf-parse');
const { analyzeWithClaude, truncateText } = require('./apiAnalysis');
const { analyzeWithKeywords } = require('./keywordAnalysis');

// Debug log to verify imports
console.log('Imported from apiAnalysis:', { analyzeWithClaude, truncateText });

const checkMongoConnection = async (req, res, next) => {
  if (mongoose.connection.readyState !== 1) {
    return res.status(500).json({ message: 'Database connection error' });
  }
  next();
};

const parseResumeFile = async (filePath) => {
  const fileExtension = path.extname(filePath).toLowerCase();
  if (fileExtension === '.pdf') {
    const dataBuffer = await fs.readFile(filePath);
    const data = await pdfParse(dataBuffer);
    console.log('Parsed Resume Text:', data.text.substring(0, 200) + '...');
    return data.text;
  } else {
    throw new Error('Unsupported file format. Only PDF is supported.');
  }
};

// Helper function to generate analysis (using API or keyword-based as fallback)
const generateAnalysis = async (resumeText, jobDescription) => {
  let analysis;
  let useApi = true;

  try {
    analysis = await analyzeWithClaude(resumeText, jobDescription);
  } catch (err) {
    console.warn('API analysis failed, falling back to keyword-based analysis:', err.message);
    useApi = false;
  }

  if (!useApi) {
    analysis = await analyzeWithKeywords(resumeText, jobDescription);
  }

  const { scores, strengths, weaknesses } = analysis;

  const analysisOutput = `
Skills Match: ${scores.skillsMatch}%
Experience Match: ${scores.experienceMatch}%
Education Match: ${scores.educationMatch}%
Overall Score: ${scores.overall}%

Strengths:
${[...strengths.skills, ...strengths.experience, ...strengths.education, ...strengths.overall]
  .map(s => `- ${s}`)
  .join('\n') || '- General experience in the field'}

Weaknesses:
${[...weaknesses.skills, ...weaknesses.experience, ...weaknesses.education, ...weaknesses.overall]
  .map(w => `- ${w}`)
  .join('\n') || '- Could improve on meeting specific job requirements'}
`;

  return {
    analysisOutput,
    skillsMatch: scores.skillsMatch,
    experienceMatch: scores.experienceMatch,
    educationMatch: scores.educationMatch,
    overall: scores.overall,
    strengths,
    weaknesses,
  };
};

router.post('/analyze-resume', checkMongoConnection, async (req, res) => {
  console.log('POST /analyze-resume headers:', req.headers);
  const startTime = Date.now();
  try {
    const { resume, jobDescription } = req.body;
    if (!resume || !resume.filePath || !jobDescription) {
      console.log(`Validation failed: ${JSON.stringify({ resume, jobDescription })}`);
      return res.status(400).json({ message: 'resume (with filePath) and jobDescription are required' });
    }

    if (jobDescription.length > 5000) {
      console.log('Job description exceeds 5000 character limit');
      return res.status(400).json({ message: 'Job description exceeds 5000 character limit' });
    }

    const safePath = path.resolve(__dirname, '../Uploads', path.basename(resume.filePath));
    if (!safePath.startsWith(path.resolve(__dirname, '../Uploads'))) {
      console.log('Invalid file path:', safePath);
      return res.status(400).json({ message: 'Invalid file path' });
    }

    console.log(`Checking file existence: ${safePath} (${Date.now() - startTime}ms)`);
    const fileExists = await fs.access(safePath).then(() => true).catch(() => false);
    if (!fileExists) {
      console.log('Resume file does not exist:', safePath);
      return res.status(400).json({ message: 'Resume file does not exist' });
    }

    console.log(`Parsing resume file: ${safePath} (${Date.now() - startTime}ms)`);
    let resumeText;
    try {
      resumeText = await parseResumeFile(safePath);
    } catch (err) {
      console.log('Failed to parse resume file:', err.message);
      return res.status(400).json({ message: err.message });
    }

    console.log(`Checking cache: ${Date.now() - startTime}ms`);
    const cacheKey = `${safePath}:${jobDescription}`;
    const cachedAnalysis = await Analysis.findOne({ cacheKey }).lean();
    if (cachedAnalysis) {
      console.log('Returning cached analysis:', cachedAnalysis.result);
      return res.json({ analysis: cachedAnalysis.result });
    }

    // Temporary fallback to prevent crashes if truncateText is undefined
    const truncatedResumeText = typeof truncateText === 'function' ? truncateText(resumeText, 500) : resumeText;
    const truncatedJobDescription = typeof truncateText === 'function' ? truncateText(jobDescription, 500) : jobDescription;

    console.log(`Creating job: ${Date.now() - startTime}ms`);
    const jobId = uuidv4();
    const job = new Job({ jobId, status: 'pending' });
    await job.save();

    console.log(`Returning pending response: ${Date.now() - startTime}ms`);
    res.json({ jobId, status: 'pending' });

    console.log('Starting asynchronous analysis task');
    (async () => {
      try {
        const analysisStartTime = Date.now();

        // Perform analysis (API or keyword-based)
        const { analysisOutput, skillsMatch, experienceMatch, educationMatch, overall, strengths, weaknesses } = await generateAnalysis(resumeText, jobDescription);

        console.log('Generated Analysis:\n', analysisOutput);
        const analysis = analysisOutput;

        console.log(`Analysis generated: ${Date.now() - analysisStartTime}ms`);
        console.log('=== Analysis Output ===\n', analysis, '\n=== End of Output ===');

        const matchScore = overall;

        const result = {
          raw: analysis,
          scores: {
            skillsMatch,
            experienceMatch,
            educationMatch,
            overall,
            matchScore,
          },
          strengths,
          weaknesses,
        };

        console.log('Final result object before saving:', JSON.stringify(result, null, 2));
        console.log('Type of result.strengths:', typeof result.strengths);
        console.log('Type of result.weaknesses:', typeof result.weaknesses);

        try {
          const analysisDoc = new Analysis({ cacheKey, result });
          console.log('Analysis document before saving:', JSON.stringify(analysisDoc, null, 2));
          await analysisDoc.save();
          console.log('Saved result to Analysis collection');
        } catch (saveErr) {
          console.error('Failed to save Analysis:', saveErr.message);
          throw new Error(`Failed to save analysis result: ${saveErr.message}`);
        }

        try {
          const jobUpdate = await Job.updateOne({ jobId }, { status: 'completed', result });
          console.log('Job update result:', JSON.stringify(jobUpdate, null, 2));
          console.log('Updated Job with result:', JSON.stringify(result, null, 2));
        } catch (updateErr) {
          console.error('Failed to update Job:', updateErr.message);
          throw new Error(`Failed to update job: ${updateErr.message}`);
        }

        const savedJob = await Job.findOne({ jobId }).lean();
        console.log('Retrieved Job after saving:', JSON.stringify(savedJob, null, 2));

        try {
          await fs.unlink(safePath);
          console.log(`Successfully deleted resume file: ${safePath}`);
        } catch (err) {
          console.warn(`Failed to delete resume file ${safePath}:`, err.message);
        }
      } catch (err) {
        console.error('Analysis error:', err.message);
        await Job.updateOne({ jobId }, { status: 'failed', error: err.message });
      }
    })();
  } catch (err) {
    console.error('Analyze resume error:', err);
    return res.status(500).json({ message: 'Failed to initiate analysis', error: err.message });
  }
});

router.get('/job/:jobId', checkMongoConnection, async (req, res) => {
  console.log('GET /job/:jobId headers:', req.headers);
  const { jobId } = req.params;

  try {
    const job = await Job.findOne({ jobId }).lean();
    if (!job) {
      return res.status(404).json({ message: 'Job not found' });
    }

    if (job.status === 'completed') {
      console.log('Returning completed job result:', JSON.stringify(job.result, null, 2));
      await Job.deleteOne({ jobId });
      return res.json({ status: 'completed', analysis: job.result });
    } else if (job.status === 'failed') {
      console.log('Job failed with error:', job.error);
      await Job.deleteOne({ jobId });
      return res.status(500).json({ status: 'failed', message: 'Analysis failed', error: job.error });
    }

    console.log('Job still pending:', jobId);
    return res.json({ status: 'pending' });
  } catch (err) {
    console.error('Error in /job/:jobId:', err);
    return res.status(500).json({ message: 'Failed to retrieve job status', error: err.message });
  }
});

module.exports = router;