import React, { useState } from 'react';

interface BackendDownloadStepProps {
  onComplete?: () => void; // Make optional or provide default in parent
}

const BackendDownloadStep: React.FC<BackendDownloadStepProps> = ({ onComplete = () => {} }) => {
  const [progress, setProgress] = useState(0);
  const [downloading, setDownloading] = useState(false);
  const [estimatedTime, setEstimatedTime] = useState<number | null>(null);

  // Simulate download progress
  const startDownload = () => {
    setDownloading(true);
    setProgress(0);
    setEstimatedTime(30); // Initial estimate in seconds
    
    // Replace with actual Tauri backend invocation for download if needed
    // For now, simulating with setInterval
    const interval = setInterval(() => {
      setProgress((p) => {
        if (p >= 100) {
          clearInterval(interval);
          setDownloading(false);
          setEstimatedTime(null);
          onComplete(); // Call the completion callback
          return 100;
        }
        
        // Decrease estimated time as progress increases
        setEstimatedTime((time) => {
          if (time === null) return null;
          const newTime = Math.max(0, time - 1.5); // Adjusted time decrease rate
          return newTime <= 0 ? null : newTime;
        });
        
        // Simulate progress increment
        return p + 2; // Adjusted progress increment rate
      });
    }, 300); // Interval duration

    // Cleanup interval on unmount or if download completes early
    return () => clearInterval(interval);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="text-center mb-4">
        <h3 className="text-lg font-semibold mb-2 text-neutral-800 dark:text-neutral-200">Downloading backend components</h3>
        {downloading && (
          <p className="text-sm text-neutral-600 dark:text-neutral-400">
            Please wait while we download the necessary components...
          </p>
        )}
      </div>
      
      <div className="modern-progress-container mb-2">
        <div 
          className="modern-progress-bar" 
          style={{ width: `${progress}%` }}
        ></div>
      </div>
      
      <div className="flex justify-between text-sm text-neutral-600 dark:text-neutral-400 mb-6">
        <span>{progress}% complete</span>
        {estimatedTime !== null && (
          <span>Est. time: {Math.ceil(estimatedTime)}s</span>
        )}
      </div>
      
      {!downloading && progress < 100 && (
        <div className="flex justify-center">
          <button
            onClick={startDownload}
            className="btn btn-primary"
          >
            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            Start Download
          </button>
        </div>
      )}
      
      {progress === 100 && (
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
