import React, { useState, useEffect } from 'react';
import axios from 'axios';
import AnimatedLoader from './AnimatedLoader';
import ScoreBreakdown from './ScoreBreakdown';

const defaultJobDescription = `Looking for a skilled software engineer with experience in React, Node.js, MongoDB, and REST APIs. Strong problem-solving and communication skills required.`;

function ATSChecker({ resumeData }) {
  const [jobDesc, setJobDesc] = useState('');
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [useCustomJD, setUseCustomJD] = useState(false);
  const [jobId, setJobId] = useState(null);
  const [activeTab, setActiveTab] = useState('summary');
  const [expandedSections, setExpandedSections] = useState({});

  useEffect(() => {
    let interval;
    if (jobId && loading) {
      interval = setInterval(async () => {
        try {
          const response = await axios.get(`http://localhost:5000/api/ats/job/${jobId}`);
          console.log('Polling response:', JSON.stringify(response.data, null, 2));
          const { status, analysis, message, error } = response.data;

          if (status === 'completed') {
            console.log('Analysis result:', JSON.stringify(analysis, null, 2));
            setResult(analysis);
            setLoading(false);
            setJobId(null);
            setError(null);
          } else if (status === 'failed') {
            setError(`Analysis failed: ${message || error}`);
            setLoading(false);
            setJobId(null);
          }
        } catch (err) {
          console.error('Polling error:', {
            status: err.response?.status,
            data: err.response?.data,
            message: err.message,
          });
          setError(`Failed to retrieve analysis result: ${err.response?.data?.error || err.message}`);
          setLoading(false);
          setJobId(null);
        }
      }, 2000);

      return () => clearInterval(interval);
    }
  }, [jobId, loading]);

  const handleAnalyze = async () => {
    if (!resumeData) {
      setError('No resume data available. Please upload a resume first.');
      return;
    }

    const jdToUse = useCustomJD ? jobDesc : defaultJobDescription;
    if (!jdToUse.trim()) {
      setError('Please enter a job description or use the default ATS check.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await axios.post(
        'http://localhost:5000/api/ats/analyze-resume',
        { resume: resumeData, jobDescription: jdToUse },
        { timeout: 10000 }
      );
      console.log('Analyze response:', JSON.stringify(response.data, null, 2));

      const { jobId, status, analysis } = response.data;
      if (status === 'pending') {
        setJobId(jobId);
      } else {
        setResult(analysis);
        setLoading(false);
      }
    } catch (err) {
      console.error('Analysis initiation error:', {
        status: err.response?.status,
        data: err.response?.data,
        message: err.message,
      });
      setError(`Failed to initiate analysis: ${err.response?.data?.error || err.message}`);
      setLoading(false);
    }
  };

  const exportJSON = () => {
    const blob = new Blob([JSON.stringify(result, null, 2)], { type: 'application/json' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'ats-analysis.json';
    link.click();
    URL.revokeObjectURL(link.href);
  };

  const scoreColor =
    (result?.scores?.overall || result?.scores?.matchScore) >= 75
      ? 'text-green-500'
      : (result?.scores?.overall || result?.scores?.matchScore) >= 50
      ? 'text-yellow-500'
      : 'text-red-500';

  useEffect(() => {
    if (result) {
      console.log('Result object:', JSON.stringify(result, null, 2));
      console.log('Scores:', JSON.stringify(result.scores, null, 2));
    }
  }, [result]);

  const toggleSection = (section) => {
    setExpandedSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  // Flatten strengths and weaknesses for the Summary tab
  const flattenedStrengths = result
    ? Object.values(result.strengths || {}).flat()
    : [];
  const flattenedWeaknesses = result
    ? Object.values(result.weaknesses || {}).flat()
    : [];

  // Function to get the percentage match for a category
  const getPercentageForCategory = (category) => {
    if (!result || !result.scores) return 0;
    switch (category) {
      case 'Skills Match':
        return result.scores.skillsMatch || 0;
      case 'Experience Match':
        return result.scores.experienceMatch || 0;
      case 'Education Match':
        return result.scores.educationMatch || 0;
      default:
        return 0;
    }
  };

  // Function to get the color for the percentage match
  const getScoreColor = (score) => {
    return score >= 75
      ? 'text-green-500'
      : score >= 50
      ? 'text-yellow-500'
      : 'text-red-500';
  };

  return (
    <div className="p-6 bg-gray-900 text-gray-100 rounded-xl shadow-lg">
      <h3 className="text-2xl font-bold mb-4 text-blue-400">
        {useCustomJD ? '🧠 Custom Job Analysis' : '🔍 ATS Analysis'}
      </h3>

      {!result && !loading && (
        <>
          <div className="mb-4">
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={useCustomJD}
                onChange={() => setUseCustomJD(!useCustomJD)}
                className="form-checkbox h-5 w-5 text-blue-500"
              />
              <span>Use Custom Job Description</span>
            </label>
          </div>
          {useCustomJD ? (
            <textarea
              value={jobDesc}
              onChange={(e) => setJobDesc(e.target.value)}
              rows={6}
              className="w-full p-3 rounded bg-gray-800 text-gray-100 border border-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter job description..."
            />
          ) : (
            <div className="p-3 rounded bg-gray-800 text-gray-300 mb-3">
              <p className="text-sm text-gray-500">Default Job Description:</p>
              <p>{defaultJobDescription}</p>
            </div>
          )}
          <button
            onClick={handleAnalyze}
            disabled={!resumeData}
            className={`w-full py-2 px-4 rounded-lg transition-colors ${
              resumeData ? 'bg-blue-600 hover:bg-blue-700' : 'bg-gray-600 cursor-not-allowed'
            } text-white font-semibold`}
          >
            {useCustomJD ? 'Analyze with Custom JD' : 'Run ATS Check'}
          </button>
        </>
      )}

      {loading && (
        <div className="flex justify-center">
          <AnimatedLoader />
        </div>
      )}

      {error && <p className="mt-4 text-red-500">{error}</p>}

      {result && (
        <div className="mt-6">
          <div className="flex gap-3 mb-4 text-sm font-medium text-blue-400 border-b border-gray-700">
            {['summary', 'details'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`pb-2 px-3 border-b-2 ${
                  activeTab === tab ? 'border-blue-600 text-blue-400' : 'border-transparent text-gray-400'
                }`}
              >
                {tab === 'summary' ? '📊 Summary' : '📜 Details'}
              </button>
            ))}
          </div>

          {activeTab === 'summary' ? (
            <div className="grid md:grid-cols-2 gap-4">
              <div className="bg-gray-800 p-4 rounded-lg border border-gray-700">
                <h4 className="text-lg font-semibold text-blue-400 mb-2">Match Score</h4>
                <div className="flex items-center space-x-3">
                  <svg className="w-16 h-16">
                    <circle
                      className="text-gray-600"
                      strokeWidth="4"
                      stroke="currentColor"
                      fill="none"
                      r="28"
                      cx="32"
                      cy="32"
                    />
                    <circle
                      className="text-blue-500"
                      strokeWidth="4"
                      strokeDasharray="175.93"
                      strokeDashoffset={
                        175.93 - (175.93 * (result.scores?.overall || result.scores?.matchScore || 0)) / 100
                      }
                      stroke="currentColor"
                      fill="none"
                      r="28"
                      cx="32"
                      cy="32"
                    />
                    <text
                      x="32"
                      y="36"
                      textAnchor="middle"
                      fontSize="12"
                      fill="currentColor"
                    >
                      {result.scores?.overall || result.scores?.matchScore || 0}
                    </text>
                  </svg>
                  <p className={`text-lg font-bold ${scoreColor}`}>
                    {(result.scores?.overall || result.scores?.matchScore) &&
                     (result.scores?.overall || result.scores?.matchScore) > 0
                      ? `${result.scores?.overall || result.scores?.matchScore}% Match`
                      : 'Score not available (check server logs for details)'}
                  </p>
                </div>
                {(result.scores?.overall || result.scores?.matchScore) === 0 && (
                  <p className="text-xs text-gray-500 mt-2">
                    Debug: Match score is 0. Check if backend returned valid scores: {JSON.stringify(result.scores, null, 2)}
                  </p>
                )}
              </div>
              <div className="bg-gray-800 p-4 rounded-lg border border-gray-700">
                <h4 className="text-lg font-semibold text-green-400 mb-2">✅ Strengths</h4>
                <div className="flex flex-wrap gap-2">
                  {flattenedStrengths.length ? (
                    flattenedStrengths.map((s, i) => (
                      <span
                        key={i}
                        className="bg-green-600 bg-opacity-30 text-green-300 px-2 py-1 rounded text-xs"
                      >
                        {s}
                      </span>
                    ))
                  ) : (
                    <span className="text-gray-500 text-xs">None identified</span>
                  )}
                </div>
              </div>
              <div className="bg-gray-800 p-4 rounded-lg border border-gray-700 md:col-span-2">
                <h4 className="text-lg font-semibold text-red-400 mb-2">⚠️ Weaknesses</h4>
                <div className="flex flex-wrap gap-2">
                  {flattenedWeaknesses.length ? (
                    flattenedWeaknesses.map((w, i) => (
                      <span
                        key={i}
                        className="bg-red-600 bg-opacity-30 text-red-300 px-2 py-1 rounded text-xs"
                      >
                        {w}
                      </span>
                    ))
                  ) : (
                    <span className="text-gray-500 text-xs">None identified</span>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-gray-800 p-4 rounded-lg border border-gray-700">
              <h4 className="text-lg font-semibold text-blue-400 mb-2">Detailed Analysis</h4>
              {['Skills Match', 'Experience Match', 'Education Match'].map((category) => {
                const categoryKey = category.toLowerCase().replace(' match', '').replace(' score', '');
                const strengths = result.strengths?.[categoryKey] || [];
                const weaknesses = result.weaknesses?.[categoryKey] || [];
                const isExpanded = expandedSections[category];
                const percentage = getPercentageForCategory(category);
                const percentageColor = getScoreColor(percentage);

                return (
                  <div key={category} className="mb-2">
                    <button
                      onClick={() => toggleSection(category)}
                      className="w-full text-left flex items-center justify-between p-2 bg-gray-700 rounded-lg hover:bg-gray-600 transition-colors"
                    >
                      <span className="text-blue-400 font-medium">{category}</span>
                      <div className="flex items-center space-x-2">
                        <span className={`text-sm font-semibold ${percentageColor}`}>
                          {percentage}%
                        </span>
                        <span className="text-gray-400">
                          {isExpanded ? '▼' : '▶'}
                        </span>
                      </div>
                    </button>
                    {isExpanded && (
                      <div className="mt-2 p-3 bg-gray-900 rounded-lg">
                        <div className="mb-3">
                          <h5 className="text-sm font-semibold text-green-400">✅ What's Good</h5>
                          {strengths.length > 0 ? (
                            <ul className="list-disc list-inside text-gray-300 text-sm">
                              {strengths.map((s, i) => (
                                <li key={i}>{s}</li>
                              ))}
                            </ul>
                          ) : (
                            <p className="text-gray-500 text-sm">No specific strengths identified.</p>
                          )}
                        </div>
                        <div>
                          <h5 className="text-sm font-semibold text-red-400">⚠️ What's Bad</h5>
                          {weaknesses.length > 0 ? (
                            <ul className="list-disc list-inside text-gray-300 text-sm">
                              {weaknesses.map((w, i) => (
                                <li key={i}>{w}</li>
                              ))}
                            </ul>
                          ) : (
                            <p className="text-gray-500 text-sm">No specific weaknesses identified.</p>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          <div className="mt-4 flex justify-end">
            <button onClick={exportJSON} className="text-sm text-blue-400 hover:underline">
              ⬇️ Export JSON
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default ATSChecker;