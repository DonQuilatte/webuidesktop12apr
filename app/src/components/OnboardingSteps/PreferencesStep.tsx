import React from 'react';
import { Preferences } from '../../services/api'; // Import the Preferences type

interface PreferencesStepProps {
  preferences: Preferences;
  onPreferenceChange: (change: Partial<Preferences>) => void;
  onTelemetryEvent: (eventName: string, payload?: Record<string, any>) => void;
}

const PreferencesStep: React.FC<PreferencesStepProps> = ({ 
  preferences, 
  onPreferenceChange, 
  onTelemetryEvent 
}) => {
  return (
    <div className="space-y-6 animate-fade-in">
      <h3 className="text-lg font-semibold mb-4 text-neutral-800 dark:text-neutral-200">Preferences & Telemetry</h3>
      <div className="mb-6">
        <label className="custom-checkbox">
          <input
            type="checkbox"
            checked={!!preferences.telemetry} // Ensure boolean
            onChange={(e) => {
              const newTelemetryValue = e.target.checked;
              onPreferenceChange({ telemetry: newTelemetryValue });
              onTelemetryEvent('telemetry_preference_changed', { enabled: newTelemetryValue });
            }}
          />
          <span className="checkmark"></span>
          <span className="text-neutral-800 dark:text-neutral-200">Allow anonymous telemetry to improve the app</span>
        </label>
      </div>
      <div className="mb-6">
        <div className="flex items-center space-x-4">
          <span className="text-neutral-800 dark:text-neutral-200">Theme:</span>
          <div className="custom-select">
            <select
              value={preferences.theme}
              onChange={(e) => {
                const newTheme = e.target.value as 'light' | 'dark';
                onPreferenceChange({ theme: newTheme });
                onTelemetryEvent('theme_changed', { theme: newTheme });
              }}
            >
              <option value="light">Light</option>
              <option value="dark">Dark</option>
            </select>
          </div>
        </div>
      </div>
      <div className="flex items-center p-3 bg-primary-50 text-primary-700 rounded-lg dark:bg-primary-900/20 dark:text-primary-300">
        <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <p className="text-sm">
          You can change these preferences later in the app settings.
        </p>
      </div>
    </div>
  );
};

export default PreferencesStep;
