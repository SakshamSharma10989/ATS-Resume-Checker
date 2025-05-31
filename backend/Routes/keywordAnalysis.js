const extractKeywords = (text) => {
  const commonWords = new Set(['the', 'is', 'are', 'and', 'or', 'in', 'on', 'at', 'to', 'for', 'with', 'a', 'an']);
  return text
    .toLowerCase()
    .replace(/[^\w\s]/g, '') // Remove punctuation
    .split(/\s+/) // Split by whitespace
    .filter(word => word.length > 2 && !commonWords.has(word)) // Remove short and common words
    .reduce((acc, word) => {
      acc[word] = (acc[word] || 0) + 1;
      return acc;
    }, {});
};

const calculateSimilarity = (word1, word2) => {
  const minLength = Math.min(word1.length, word2.length);
  let matches = 0;
  for (let i = 0; i < minLength; i++) {
    if (word1[i] === word2[i]) matches++;
  }
  return matches / Math.max(word1.length, word2.length);
};

const analyzeKeywords = (jdKeywords, resumeKeywords) => {
  const skillsKeywords = ['javascript', 'react', 'node.js', 'nodejs', 'mongodb', 'python', 'java', 'sql', 'html', 'css', 'typescript', 'aws', 'docker', 'git', 'communication', 'problem-solving', 'teamwork'];
  const experienceKeywords = ['experience', 'worked', 'developed', 'built', 'led', 'managed', 'implemented', 'designed', 'years'];
  const educationKeywords = ['bachelor', 'master', 'degree', 'phd', 'certification', 'course', 'university', 'college'];

  const jdCategorized = { skills: [], experience: [], education: [] };
  const resumeCategorized = { skills: [], experience: [], education: [] };

  Object.keys(jdKeywords).forEach(keyword => {
    if (skillsKeywords.includes(keyword)) {
      jdCategorized.skills.push({ keyword, count: jdKeywords[keyword] });
    } else if (experienceKeywords.includes(keyword)) {
      jdCategorized.experience.push({ keyword, count: jdKeywords[keyword] });
    } else if (educationKeywords.includes(keyword)) {
      jdCategorized.education.push({ keyword, count: jdKeywords[keyword] });
    }
  });

  Object.keys(resumeKeywords).forEach(keyword => {
    if (skillsKeywords.includes(keyword)) {
      resumeCategorized.skills.push({ keyword, count: resumeKeywords[keyword] });
    } else if (experienceKeywords.includes(keyword)) {
      resumeCategorized.experience.push({ keyword, count: resumeKeywords[keyword] });
    } else if (educationKeywords.includes(keyword)) {
      resumeCategorized.education.push({ keyword, count: resumeKeywords[keyword] });
    }
  });

  const calculateCategoryScore = (jdCategory, resumeCategory) => {
    if (jdCategory.length === 0) return { score: 0, strengths: [], weaknesses: [] };

    let totalScore = 0;
    const strengths = [];
    const weaknesses = [];

    jdCategory.forEach(jdItem => {
      const resumeItem = resumeCategory.find(r => r.keyword === jdItem.keyword);
      if (resumeItem) {
        const matchScore = Math.min(resumeItem.count / jdItem.count, 1) * 100;
        totalScore += matchScore;
        strengths.push(`Proficiency in ${jdItem.keyword}`);
      } else {
        let bestSimilarity = 0;
        let closestMatch = null;
        resumeCategory.forEach(r => {
          const similarity = calculateSimilarity(jdItem.keyword, r.keyword);
          if (similarity > bestSimilarity && similarity > 0.5) {
            bestSimilarity = similarity;
            closestMatch = r.keyword;
          }
        });

        if (closestMatch) {
          totalScore += 50 * bestSimilarity;
          strengths.push(`Partial proficiency in ${jdItem.keyword} (related to ${closestMatch})`);
        } else {
          weaknesses.push(`Lacks proficiency in ${jdItem.keyword}`);
        }
      }
    });

    if (strengths.length === 0 && resumeCategory.length > 0) {
      strengths.push(`General proficiency in ${resumeCategory[0].keyword}`);
    }

    if (weaknesses.length === 0 && jdCategory.length > 0) {
      weaknesses.push(`Could improve on ${jdCategory[0].keyword}`);
    }

    const score = jdCategory.length > 0 ? Math.round(totalScore / jdCategory.length) : 0;
    return { score, strengths, weaknesses };
  };

  const skillsAnalysis = calculateCategoryScore(jdCategorized.skills, resumeCategorized.skills);
  const experienceAnalysis = calculateCategoryScore(jdCategorized.experience, resumeCategorized.experience);
  const educationAnalysis = calculateCategoryScore(jdCategorized.education, resumeCategorized.education);

  return {
    scores: {
      skillsMatch: skillsAnalysis.score,
      experienceMatch: experienceAnalysis.score,
      educationMatch: educationAnalysis.score,
      overall: Math.round((skillsAnalysis.score + experienceAnalysis.score + educationAnalysis.score) / 3),
    },
    strengths: {
      skills: skillsAnalysis.strengths,
      experience: experienceAnalysis.strengths,
      education: educationAnalysis.strengths,
      overall: [],
    },
    weaknesses: {
      skills: skillsAnalysis.weaknesses,
      experience: experienceAnalysis.weaknesses,
      education: educationAnalysis.weaknesses,
      overall: [],
    },
  };
};

const analyzeWithKeywords = (resumeText, jobDescription) => {
  const jdKeywords = extractKeywords(jobDescription);
  const resumeKeywords = extractKeywords(resumeText);
  return analyzeKeywords(jdKeywords, resumeKeywords);
};

module.exports = { analyzeWithKeywords };