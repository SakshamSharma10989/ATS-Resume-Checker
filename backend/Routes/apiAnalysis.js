const axios = require('axios');
require('dotenv').config();

// In-memory store for tracking daily API requests (for free tier limit)
const dailyRequests = {
  date: new Date().toDateString(),
  count: 0,
};

const truncateText = (text, maxLength = 1000) => {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength) + '... [truncated]';
};

// Helper function to check daily API request limit for free tier
const checkDailyRequestLimit = () => {
  const currentDate = new Date().toDateString();
  if (dailyRequests.date !== currentDate) {
    dailyRequests.date = currentDate;
    dailyRequests.count = 0;
  }

  dailyRequests.count += 1;
  console.log(`Daily API Requests: ${dailyRequests.count}/5`);

  if (dailyRequests.count > 5) {
    throw new Error('Exceeded OpenRouter free tier limit of 5 queries per day. Switching to keyword-based analysis.');
  }
};

// Helper function to analyze resume and job description using OpenRouter API with Claude
const analyzeWithClaude = async (resumeText, jobDescription) => {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    throw new Error('OpenRouter API key not configured in environment variables');
  }

  // Check daily request limit for free tier
  checkDailyRequestLimit();

  // Truncate texts to reduce token usage
  const truncatedResumeText = truncateText(resumeText);
  const truncatedJobDescription = truncateText(jobDescription);

  const prompt = `
You are an expert in resume analysis for ATS systems. I will provide a resume and a job description. Your task is to analyze the resume against the job description and provide:

1. A percentage match score (0-100%) for each of the following categories:
   - Skills Match
   - Experience Match
   - Education Match
2. An overall match score (average of the above).
3. A list of strengths (what the resume does well in matching the job description).
4. A list of weaknesses (what the resume lacks or could improve to better match the job description).

**Job Description:**
${truncatedJobDescription}

**Resume:**
${truncatedResumeText}

Please respond in the following JSON format:
{
  "scores": {
    "skillsMatch": number,
    "experienceMatch": number,
    "educationMatch": number,
    "overall": number
  },
  "strengths": {
    "skills": string[],
    "experience": string[],
    "education": string[],
    "overall": string[]
  },
  "weaknesses": {
    "skills": string[],
    "experience": string[],
    "education": string[],
    "overall": string[]
  }
}
`;

  try {
    const response = await axios.post(
      'https://openrouter.ai/api/v1/chat/completions',
      {
        model: 'anthropic/claude-3.5-sonnet',
        messages: [
          {
            role: 'user',
            content: prompt,
          },
        ],
        max_tokens: 1500,
      },
      {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': 'http://localhost:3000',
          'X-Title': 'ATS Resume Checker',
        },
        timeout: 30000,
      }
    );

    console.log('OpenRouter API Response:', JSON.stringify(response.data, null, 2));
    const analysis = JSON.parse(response.data.choices[0].message.content);
    return analysis;
  } catch (err) {
    console.error('OpenRouter API Error:', err.response?.data || err.message);
    throw new Error('Failed to analyze with OpenRouter API: ' + (err.response?.data?.error?.message || err.message));
  }
};

// Debug log to confirm module loading and exports
console.log('apiAnalysis.js loaded, exporting:', { analyzeWithClaude, truncateText });

module.exports = { analyzeWithClaude, truncateText };