import React, { useState, useEffect } from 'react';

const messages = [
  'Parsing Resume...',
  'Extracting Skills...',
  'Comparing with Job Description...',
  'Generating Results...',
];

const AnimatedLoader = () => {
  const [currentMessageIndex, setCurrentMessageIndex] = useState(0);
  const [dots, setDots] = useState('');

  // Cycle through messages every 3 seconds
  useEffect(() => {
    const messageInterval = setInterval(() => {
      setCurrentMessageIndex((prevIndex) => (prevIndex + 1) % messages.length);
    }, 3000);

    return () => clearInterval(messageInterval);
  }, []);

  // Animate dots every 500ms
  useEffect(() => {
    const dotInterval = setInterval(() => {
      setDots((prevDots) => {
        if (prevDots.length >= 3) return '';
        return prevDots + ' •';
      });
    }, 500);

    return () => clearInterval(dotInterval);
  }, []);

  return (
    <div className="flex flex-col items-center space-y-4">
      {/* Message with fade animation */}
      <div className="text-[#f1f5f9] text-lg font-medium">
        <span
          key={currentMessageIndex}
          className="inline-block animate-fade-in-out"
        >
          {messages[currentMessageIndex]} {dots}
        </span>
      </div>

      {/* Subtle progress bar */}
      <div className="w-48 h-1 bg-[#334155] rounded-full overflow-hidden">
        <div className="h-full bg-[#38bdf8] animate-progress-bar"></div>
      </div>
    </div>
  );
};

export default AnimatedLoader;