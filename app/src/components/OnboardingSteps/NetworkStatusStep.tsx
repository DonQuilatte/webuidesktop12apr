import React from 'react';

interface NetworkStatusStepProps {
  netLoading: boolean;
  netError: string | null;
  isOnline: boolean | null;
  onRetry: () => void;
}

const NetworkStatusStep: React.FC<NetworkStatusStepProps> = ({ 
  netLoading, 
  netError, 
  isOnline, 
  onRetry 
}) => {
  return (
    <div className="flex flex-col items-center py-4 animate-fade-in">
      <p className="mb-6 font-semibold text-neutral-800 dark:text-neutral-200">Network Status:</p>
      {netLoading ? (
        <div className="flex flex-col items-center justify-center py-4">
          <div className="w-12 h-12 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin mb-4"></div>
          <p className="text-neutral-600 dark:text-neutral-400">Checking network status...</p>
        </div>
      ) : netError ? (
        // Wrap error and button for layout
        <div className="flex flex-col items-center space-y-4">
          <div className="status-indicator status-error w-full justify-center">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>{netError}</span>
          </div>
          {/* Add the missing retry button for the error state */}
          <button 
            className="btn btn-secondary mt-2" // Use secondary style to differentiate from offline retry
            onClick={onRetry} 
          >
            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Retry Network Check
          </button>
        </div>
      ) : isOnline === true ? (
        <div className="status-indicator status-success">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
          <span>Online</span>
        </div>
      ) : isOnline === false ? (
        <div className="space-y-4">
          <div className="status-indicator status-error">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
            <span>Offline</span>
          </div>
          <p className="mt-4 text-sm text-neutral-600 dark:text-neutral-400 text-center">
            An internet connection is required to download backend components.
          </p>
          <button 
            className="btn btn-primary mt-2"
            onClick={onRetry} // Use the passed handler
          >
            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Retry Connection
          </button>
        </div>
      ) : null}
    </div>
  );
};

export default NetworkStatusStep;
