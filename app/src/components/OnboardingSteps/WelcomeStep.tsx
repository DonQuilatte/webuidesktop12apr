import React from 'react';

interface WelcomeStepProps {
  telemetryConsent: boolean;
  onTelemetryConsentChange: (checked: boolean) => void;
  privacyPolicyConsent: boolean; // Assuming this state will be managed in the parent
  onPrivacyPolicyConsentChange: (checked: boolean) => void; // Assuming this handler will be managed in the parent
}

const WelcomeStep: React.FC<WelcomeStepProps> = ({ 
  telemetryConsent, 
  onTelemetryConsentChange,
  privacyPolicyConsent,
  onPrivacyPolicyConsentChange
}) => {
  return (
    <div className="space-y-6 animate-fade-in">
      <p className="mb-4 text-neutral-700 dark:text-neutral-300">
        Welcome to the app! Before getting started, please review our privacy policy and provide your consent.
      </p>
      <div className="mb-4">
        <label className="custom-checkbox">
          <input 
            type="checkbox" 
            className="form-checkbox"
            checked={privacyPolicyConsent}
            onChange={(e) => onPrivacyPolicyConsentChange(e.target.checked)}
          />
          <span className="checkmark"></span>
          <span className="text-neutral-800 dark:text-neutral-200">I agree to the Privacy Policy</span>
        </label>
      </div>
      <div className="mb-4">
        <label className="custom-checkbox">
          <input 
            type="checkbox" 
            className="form-checkbox"
            checked={telemetryConsent}
            onChange={(e) => onTelemetryConsentChange(e.target.checked)}
          />
          <span className="checkmark"></span>
          <span className="text-neutral-800 dark:text-neutral-200">I consent to data collection for improving the app</span>
        </label>
      </div>
    </div>
  );
};

export default WelcomeStep;
