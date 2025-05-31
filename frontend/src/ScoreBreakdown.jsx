import React from 'react';

function ScoreBreakdown({ scores }) {
  // Default to 0 if scores are undefined
  const skillsMatch = scores?.skillsMatch || 0;
  const experienceMatch = scores?.experienceMatch || 0;
  const educationMatch = scores?.educationMatch || 0;

  return (
    <div className="bg-gray-800 p-4 rounded-lg border border-gray-700">
      <ul className="space-y-2">
        <li className="flex justify-between">
          <span className="text-gray-300">Skills Match</span>
          <span className="text-blue-400">{skillsMatch}%</span>
        </li>
        <li className="flex justify-between">
          <span className="text-gray-300">Experience Match</span>
          <span className="text-blue-400">{experienceMatch}%</span>
        </li>
        <li className="flex justify-between">
          <span className="text-gray-300">Education Match</span>
          <span className="text-blue-400">{educationMatch}%</span>
        </li>
      </ul>
    </div>
  );
}

export default ScoreBreakdown;