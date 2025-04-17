import React, { useState, useEffect, useRef, useCallback } from 'react';
import { invoke } from '@tauri-apps/api/core';

interface BackendDownloadStepProps {
  onComplete?: () => void; // Make optional or provide default in parent
}

const BackendDownloadStep: React.FC<BackendDownloadStepProps> = ({ onComplete = () => {} }) => {
  const [progress, setProgress] = useState(0);
  const [downloading, setDownloading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Function to check progress
  const checkProgress = useCallback(async () => {
    try {
      const currentProgress = await invoke<number>('check_backend_download_progress');
      setProgress(currentProgress);

      if (currentProgress >= 100) {
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
          intervalRef.current = null;
        }
        setDownloading(false);
        setError(null); // Clear any previous error on success
        // Optionally call complete_backend_download if needed
        // await invoke('complete_backend_download'); 
        onComplete();
      }
    } catch (err) {
      console.error("Error checking download progress:", err);
      setError('Failed to check download progress. Please try again.');
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      setDownloading(false);
    }
  }, [onComplete]);

  // Effect to manage polling interval
  useEffect(() => {
    if (downloading) {
      // Clear any existing interval before starting a new one
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      // Start polling immediately and then set interval
      checkProgress(); 
      intervalRef.current = setInterval(checkProgress, 1000); // Poll every 1 second
    }

    // Cleanup function to clear interval when component unmounts or downloading stops
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [downloading, checkProgress]);

  // Function to start the download
  const startDownload = async () => {
    setDownloading(true);
    setProgress(0);
    setError(null);
    try {
      await invoke('start_backend_download');
      // Polling will start via the useEffect hook listening to `downloading` state
    } catch (err) {
      console.error("Error starting backend download:", err);
      setError('Failed to start backend download. Please check your connection and try again.');
      setDownloading(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="text-center mb-4">
        <h3 className="text-lg font-semibold mb-2 text-neutral-800 dark:text-neutral-200">Downloading backend components</h3>
        {downloading && progress < 100 && (
          <p className="text-sm text-neutral-600 dark:text-neutral-400">
            Please wait while we download the necessary components...
          </p>
        )}
      </div>
      
      {/* Progress Bar */}
      <div className="modern-progress-container mb-2">
        <div 
          className="modern-progress-bar" 
          style={{ width: `${progress}%` }}
        ></div>
      </div>
      
      {/* Progress Text */}
      <div className="flex justify-between text-sm text-neutral-600 dark:text-neutral-400 mb-6">
        <span>{progress}% complete</span>
      </div>
      
      {/* Error Message */}
      {error && (
        <div className="status-indicator status-error w-full justify-center">
          <svg className="w-5 h-5 mr-1" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" /></svg>
          <span>{error}</span>
        </div>
      )}
      
      {/* Start Button */}
      {!downloading && progress < 100 && !error && (
        <div className="flex justify-center">
          <button
            onClick={startDownload}
            className="btn btn-primary"
            disabled={downloading} // Disable button while downloading
          >
            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            {progress > 0 ? 'Resume Download' : 'Start Download'}
          </button>
        </div>
      )}
      
      {/* Retry Button on Error */}
      {error && (
        <div className="flex justify-center">
          <button
            onClick={startDownload} // Retry uses the same start function
            className="btn btn-warning"
          >
            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m-15.357-2a8.001 8.001 0 0115.357-2m0 0H15" /></svg>
            Retry Download
          </button>
        </div>
      )}
      
      {/* Completion Message */}
      {progress === 100 && !error && (
        <div className="status-indicator status-success w-full justify-center">
          <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
          <span>Download complete!</span>
        </div>
      )}
    </div>
  );
};

export default BackendDownloadStep;
