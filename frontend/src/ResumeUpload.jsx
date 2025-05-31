// src/ResumeUpload.jsx
import React, { useState, useEffect } from 'react';
import ATSChecker from './ATSChecker';

const ResumeUpload = ({ selectedFile, onUploadSuccess }) => {
  const [resumeData, setResumeData] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    console.log(`[${new Date().toISOString()}] ResumeUpload useEffect, selectedFile:`, selectedFile);
    if (selectedFile && !isUploading) {
      console.log(`[${new Date().toISOString()}] File: ${selectedFile.name}, Type: ${selectedFile.type}`);

      const allowedTypes = [
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      ];
      if (!allowedTypes.includes(selectedFile.type)) {
        console.log(`[${new Date().toISOString()}] Invalid file type`);
        setError('Please upload a PDF, DOC, or DOCX file.');
        setResumeData(null);
        if (onUploadSuccess) {
          console.log(`[${new Date().toISOString()}] Calling onUploadSuccess(null)`);
          onUploadSuccess(null);
        }
        return;
      }

      const controller = new AbortController();
      const signal = controller.signal;

      const uploadFile = async () => {
        setIsUploading(true);
        setLoading(true);
        setError(null);
        console.log(`[${new Date().toISOString()}] Starting upload`);

        const formData = new FormData();
        formData.append('resume', selectedFile);
        console.log(`[${new Date().toISOString()}] formData:`, [...formData.entries()]);

        const startTime = Date.now();
        try {
          const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
          console.log(`[${new Date().toISOString()}] Uploading to ${apiUrl}/api/resumes/upload`);
          const res = await fetch(`${apiUrl}/api/resumes/upload`, {
            method: 'POST',
            body: formData,
            signal,
          });
          console.log(`[${new Date().toISOString()}] Upload status: ${res.status}`);
          console.log(`API request took ${Date.now() - startTime}ms`);
          const responseBody = await res.clone().json().catch(() => ({}));
          console.log(`[${new Date().toISOString()}] Upload response body:`, responseBody);
          if (!res.ok) {
            const errorData = await res.json().catch(() => ({}));
            throw new Error(errorData.error || `Upload failed with status ${res.status}`);
          }
          const data = await res.json();
          console.log(`[${new Date().toISOString()}] Upload success:`, data);
          setResumeData(data);
          if (onUploadSuccess) {
            console.log(`[${new Date().toISOString()}] Calling onUploadSuccess(data)`);
            onUploadSuccess(data);
          }
        } catch (err) {
          if (err.name === 'AbortError') {
            console.log(`[${new Date().toISOString()}] Upload aborted`);
            return;
          }
          console.error(`[${new Date().toISOString()}] Upload error: ${err.message}`);
          setError(`Failed to upload resume: ${err.message}`);
          if (onUploadSuccess) {
            console.log(`[${new Date().toISOString()}] Calling onUploadSuccess(null)`);
            onUploadSuccess(null);
          }
        } finally {
          const elapsedTime = Date.now() - startTime;
          const minLoadingTime = 500;
          if (elapsedTime < minLoadingTime) {
            await new Promise((resolve) => setTimeout(resolve, minLoadingTime - elapsedTime));
          }
          setLoading(false);
          setIsUploading(false);
          console.log(`[${new Date().toISOString()}] Upload done, loading: false`);
        }
      };

      uploadFile();

      return () => {
        controller.abort();
      };
    }
  }, [selectedFile, onUploadSuccess]);

  console.log(`[${new Date().toISOString()}] Rendering ResumeUpload, selectedFile: ${!!selectedFile}, resumeData: ${!!resumeData}`);

  return (
    <div style={{ marginTop: '32px', width: '100%', maxWidth: '768px', border: '4px solid #ff0000' }}>
      {loading && (
        <div className="min-h-[300px] flex items-center justify-center">
          <p style={{ color: '#60a5fa', marginBottom: '16px', textAlign: 'center' }}>
            Uploading resume...
          </p>
        </div>
      )}
      {error && (
        <div className="min-h-[300px] flex items-center justify-center">
          <p style={{ color: '#f87171', marginBottom: '16px', textAlign: 'center' }}>
            {error}
          </p>
        </div>
      )}
      {resumeData && (
        <div style={{ marginTop: '24px', minHeight: '300px' }} className="animate-slide-in">
          <ATSChecker resumeData={resumeData} />
        </div>
      )}
    </div>
  );
};

export default ResumeUpload;