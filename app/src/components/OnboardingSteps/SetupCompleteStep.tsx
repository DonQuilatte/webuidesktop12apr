import React from 'react';
import { Preferences } from '../../services/api'; // Import the Preferences type

interface SetupCompleteStepProps {
  preferences: Preferences;
  onStartGuidedTour: () => void;
}

const SetupCompleteStep: React.FC<SetupCompleteStepProps> = ({ 
  preferences, 
  onStartGuidedTour 
}) => {
  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex justify-center mb-6">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center dark:bg-green-900/30">
          <svg className="w-8 h-8 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
      </div>
      <h3 className="text-xl font-semibold mb-4 text-center text-neutral-800 dark:text-neutral-200">Setup Complete!</h3>
      <p className="mb-6 text-center text-neutral-700 dark:text-neutral-300">
        Your preferences have been saved. You are ready to use the app.
      </p>
      
      <div className="bg-neutral-50 p-4 rounded-lg mb-6 dark:bg-neutral-800/50">
        <h4 className="text-sm font-medium text-neutral-500 mb-2 dark:text-neutral-400">Your Preferences</h4>
        <ul className="space-y-2">
          <li className="flex justify-between">
            <span className="text-neutral-600 dark:text-neutral-400">Theme</span>
            <span className="font-medium text-neutral-900 dark:text-neutral-200">
              {preferences.theme === 'dark' ? 'Dark' : 'Light'}
            </span>
          </li>
          <li className="flex justify-between">
            <span className="text-neutral-600 dark:text-neutral-400">Telemetry</span>
            <span className="font-medium text-neutral-900 dark:text-neutral-200">
              {preferences.telemetry ? 'Enabled' : 'Disabled'}
            </span>
          </li>
        </ul>
      </div>
      
      <p className="mb-6 text-center text-neutral-700 dark:text-neutral-300">
        Take a quick guided tour to learn about the main features, or click Finish to get started.
      </p>
      
      <div className="flex justify-center">
        <button
          className="btn btn-primary"
          onClick={onStartGuidedTour} // Use the passed handler
        >
          <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
          </svg>
          Start Guided Tour
        </button>
      </div>
    </div>
  );
};

export default SetupCompleteStep;
