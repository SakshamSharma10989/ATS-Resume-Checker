// src/Body.jsx
import React, { useRef, useState, useCallback } from 'react';
import ResumeUpload from './ResumeUpload';

const Body = () => {
  const [isDragging, setIsDragging] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [resumeData, setResumeData] = useState(null);
  const fileInputRef = useRef(null);
  const isSettingFile = useRef(false);

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
    console.log(`[${new Date().toISOString()}] Body: handleDragOver`);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
    console.log(`[${new Date().toISOString()}] Body: handleDragLeave`);
  };

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    setIsDragging(false);
    if (isSettingFile.current) return;
    isSettingFile.current = true;

    const file = e.dataTransfer.files[0];
    if (file) {
      setSelectedFile(file);
      setResumeData(null);
      console.log(`[${new Date().toISOString()}] Body: handleDrop, file: ${file.name}`);
    }
    setTimeout(() => {
      isSettingFile.current = false;
    }, 100);
  }, []);

  const handleFileChange = useCallback((e) => {
    if (isSettingFile.current) return;
    isSettingFile.current = true;

    const file = e.target.files[0];
    if (file) {
      setSelectedFile(file);
      setResumeData(null);
      console.log(`[${new Date().toISOString()}] Body: handleFileChange, file: ${file.name}`);
    }
    setTimeout(() => {
      isSettingFile.current = false;
    }, 100);
  }, []);

  const handleClick = () => {
    fileInputRef.current.click();
    console.log(`[${new Date().toISOString()}] Body: handleClick`);
  };

  const handleUploadSuccess = (data) => {
    console.log(`[${new Date().toISOString()}] Body: handleUploadSuccess, data:`, data);
    setResumeData(data);
    setSelectedFile(null);
    console.log(`[${new Date().toISOString()}] Body: selectedFile cleared, resumeData set`);
    console.log(`[${new Date().toISOString()}] Body: handleUploadSuccess completed`);
  };

  console.log(`[${new Date().toISOString()}] Body: Rendering, selectedFile: ${!!selectedFile}, resumeData: ${!!resumeData}`);

  return (
    <div className="pt-12 flex flex-col items-center min-h-screen bg-[#0f172a] px-4">
      <div className="text-[#f1f5f9] text-3xl font-bold mb-6 tracking-tight">
        Drop Your Resume Here
      </div>

      <div className="w-full max-w-md h-48">
        {resumeData ? (
          <div className="w-full h-full flex items-center justify-center animate-fade-in">
            <div className="bg-[#1e293b] rounded-lg p-4 shadow-md flex items-center space-x-3">
              <a
                href={resumeData.fileUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center space-x-2 text-blue-400 hover:text-blue-300 transition-colors"
              >
                <span className="text-3xl">📄</span>
                <span className="text-lg font-medium">{resumeData.fileName}</span>
              </a>
            </div>
          </div>
        ) : (
          <>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              style={{ display: 'none' }}
              accept=".pdf,.doc,.docx"
            />

            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={handleClick}
              className={`relative w-full h-full border-2 border-dashed rounded-2xl cursor-pointer transition-all duration-300 
                flex items-center justify-center px-6 text-center shadow-lg
                ${
                  isDragging
                    ? 'border-[#38bdf8] bg-gradient-to-br from-[#1e40af] to-[#0f172a] scale-105'
                    : 'border-[#64748b] bg-[#1e293b] hover:border-[#38bdf8] hover:shadow-xl'
                } 
                text-[#94a3b8] hover:text-[#f1f5f9]`}
            >
              <span className="text-lg font-medium">
                {isDragging
                  ? 'Release to upload your resume'
                  : selectedFile
                  ? `Selected: ${selectedFile.name}`
                  : 'Click or drag & drop your resume here'}
              </span>
            </div>
          </>
        )}
      </div>

      <div className="mt-10 w-full max-w-3xl">
        <ResumeUpload
          selectedFile={selectedFile}
          onUploadSuccess={handleUploadSuccess}
        />
      </div>
    </div>
  );
};

export default Body;