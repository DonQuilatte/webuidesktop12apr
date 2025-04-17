import { useState, useEffect, useRef, useCallback } from 'react';
import { invoke } from '@tauri-apps/api/core';
import './styles/modern.css';
import { 
  fetchPreferences, 
  savePreferences, 
  saveOnboardingData,
  submitTelemetry,
  Preferences as PreferencesType,
} from './services/api';
import WelcomeStep from './components/OnboardingSteps/WelcomeStep';
import SystemCheckStep from './components/OnboardingSteps/SystemCheckStep';
import NetworkStatusStep from './components/OnboardingSteps/NetworkStatusStep';
import BackendDownloadStep from './components/OnboardingSteps/BackendDownloadStep';
import PreferencesStep from './components/OnboardingSteps/PreferencesStep';
import SetupCompleteStep from './components/OnboardingSteps/SetupCompleteStep';

const steps = [
  'Welcome & Privacy Overview',
  'System Compatibility Check',
  'Network Status',
  'Backend Download',
  'Preferences & Telemetry',
  'Completion & Guided Tour',
];

export default function OnboardingWizard() {
  const [step, setStep] = useState(0);

  // System info state
  const [osInfo, setOsInfo] = useState<string | null>(null);
  const [diskInfo, setDiskInfo] = useState<any | null>(null);
  const [memInfo, setMemInfo] = useState<any | null>(null);
  const [sysLoading, setSysLoading] = useState(false);
  const [sysError, setSysError] = useState<string | null>(null);
  
  // Preferences state
  const [preferences, setPreferences] = useState<PreferencesType>({
    telemetry: false,
    theme: "light",
  });
  const [prefsLoading, setPrefsLoading] = useState(false);
  const [prefsSaving, setPrefsSaving] = useState(false);

  // Network status state
  const [isOnline, setIsOnline] = useState<boolean | null>(null);
  const [netLoading, setNetLoading] = useState(false);
  const [netError, setNetError] = useState<string | null>(null);

  // User-facing error state
  const [userError, setUserError] = useState<string | null>(null);

  // State for Step 0
  const [privacyPolicyConsent, setPrivacyPolicyConsent] = useState(false);

  // Ref to track initial render
  const initialRender = useRef(true);

  // Apply theme based on preferences
  useEffect(() => {
    if (preferences.theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [preferences.theme]);

  // Fetch initial preferences on mount
  useEffect(() => {
    const getPreferences = async () => {
      setPrefsLoading(true);
      try {
        const data = await fetchPreferences();
        setPreferences(data);
        // Log successful preferences retrieval if telemetry is enabled
        if (data.telemetry) {
          await submitTelemetry('preferences_loaded', { success: true });
        }
      } catch (error) {
        console.error("Error fetching initial preferences:", error);
        setUserError("Failed to fetch your preferences from the server. Default preferences will be used.");
        // Don't attempt to log telemetry here as we don't know if it's enabled
      } finally {
        setPrefsLoading(false);
      }
    };

    getPreferences();
  }, []); // Empty dependency array ensures this runs only once on mount

  // Save preferences when they change (debounced)
  useEffect(() => {
    // Skip initial render
    if (initialRender.current) {
      initialRender.current = false;
      return;
    }

    // Debounce preferences saving
    const saveTimeout = setTimeout(async () => {
      setPrefsSaving(true);
      try {
        await savePreferences(preferences);
        // Log successful preferences save if telemetry is enabled
        if (preferences.telemetry) {
          await submitTelemetry('preferences_saved', { success: true });
        }
      } catch (error) {
        console.error("Error saving preferences:", error);
        setUserError("Failed to save your preferences. Your changes will be applied locally but may not persist.");
      } finally {
        setPrefsSaving(false);
      }
    }, 500); // 500ms debounce

    // Cleanup timeout on unmount or when preferences change again
    return () => clearTimeout(saveTimeout);
  }, [preferences]); // Run when preferences change

  useEffect(() => {
    if (step === 1) {
      setUserError(null); // Clear previous user errors when entering step 1
      setSysLoading(true);
      setSysError(null);
      Promise.all([
        invoke<string>('get_os_info').catch(() => 'Unknown OS'),
        invoke<[number, number]>('get_disk_space').catch(() => [0, 0]),
        invoke<[number, number]>('get_memory_info').catch(() => [0, 0]),
      ])
        .then((results) => {
          try {
            // Safely destructure with fallbacks
            const os = typeof results[0] === 'string' ? results[0] : 'Unknown OS';
            const [freeDisk, totalDisk] = Array.isArray(results[1]) ? results[1] : [0, 0];
            const [freeMem, totalMem] = Array.isArray(results[2]) ? results[2] : [0, 0];
            
            setOsInfo(os);
            setDiskInfo({ free: freeDisk, total: totalDisk });
            setMemInfo({ free: freeMem, total: totalMem });
            
            // Log system info if telemetry is enabled
            if (preferences.telemetry) {
              submitTelemetry('system_info_checked', { 
                os, 
                disk_free_gb: (freeDisk / (1024 ** 3)).toFixed(2),
                disk_total_gb: (totalDisk / (1024 ** 3)).toFixed(2),
                mem_free_mb: (freeMem / (1024 ** 2)).toFixed(2),
                mem_total_mb: (totalMem / (1024 ** 2)).toFixed(2)
              }).catch(console.error);
            }
          } catch (error) {
            console.error('Error parsing system info:', error);
            // Set default values
            setOsInfo('Unknown OS');
            setDiskInfo({ free: 0, total: 0 });
            setMemInfo({ free: 0, total: 0 });
          }
          setSysLoading(false);
        })
        .catch((error) => {
          setSysError('Failed to fetch system info');
          setSysLoading(false);
          console.error("Error fetching system info:", error);
        });
    }
    if (step === 2) {
      setUserError(null); // Clear previous user errors when entering step 2
      setNetLoading(true);
      setNetError(null);
      setIsOnline(null);
      invoke<boolean>('check_network_status')
        .then((online: boolean) => {
          setIsOnline(online);
          setNetLoading(false);
          
          // Log network status if telemetry is enabled
          if (preferences.telemetry) {
            submitTelemetry('network_status_checked', { online }).catch(console.error);
          }
        })
        .catch((error) => {
          setNetError('Failed to check network status');
          setNetLoading(false);
          console.error("Error checking network status:", error);
        });
    }
    if (step === 3) { // Backend Download
      setUserError(null); // Clear errors when entering download step
    }
    if (step === 4) { // Preferences
      setUserError(null); // Clear errors when entering preferences step
    }
    if (step === 5) { // Completion
      setUserError(null); // Clear errors when entering completion step
    }
    // Reset info when leaving steps
    if (step !== 1) {
      setSysError(null);
      setSysLoading(false);
    }
    if (step !== 2) {
      setNetError(null);
      setNetLoading(false);
    }
    
    // Log step change if telemetry is enabled
    if (preferences.telemetry) {
      submitTelemetry('step_changed', { step, step_name: steps[step] }).catch(console.error);
    }
  }, [step, preferences.telemetry]);

  const next = async () => {
    setStep((s) => Math.min(s + 1, steps.length - 1));
  };
  
  const back = () => setStep((s) => Math.max(s - 1, 0));

  // Helper function to update preferences
  const updatePreferences = (updates: Partial<PreferencesType>) => {
    setPreferences(prev => ({ ...prev, ...updates }));
  };

  // Helper function to submit telemetry events
  const handleTelemetryEvent = useCallback(async (event: string, details: Record<string, unknown> = {}) => {
    if (!preferences.telemetry) return; // Only send if telemetry is enabled

    try {
      await submitTelemetry(event, details);
    } catch (error) {
      console.error('Failed to submit telemetry event:', error);
      // Don't show error to user for telemetry failures to avoid disrupting the experience
    }
  }, [preferences.telemetry]);

  // Handler for privacy policy consent change
  const handlePrivacyConsentChange = (checked: boolean) => {
    setPrivacyPolicyConsent(checked);
    // Optionally submit a telemetry event if needed
    // handleTelemetryEvent('privacy_policy_consent_changed', { agreed: checked });
  };

  // Function to complete the onboarding process
  const completeOnboarding = async () => {
    try {
      // Save final preferences
      await savePreferences(preferences);
      
      // Notify backend onboarding is complete
      await saveOnboardingData(preferences);
      
      // Submit telemetry event for onboarding completion
      if (preferences.telemetry) {
        await submitTelemetry('onboarding_completed', { final_preferences: preferences });
      }
      
      alert('Setup Complete!');
    } catch (error) {
      console.error('Failed to complete onboarding:', error);
      alert('Failed to save preferences or onboarding to backend.');
    }
  };

  // Function to handle network status check and retry
  const checkNetwork = useCallback(async (isRetry = false) => {
    setNetLoading(true);
    setNetError(null); // Clear previous error
    try {
      const online = await invoke<boolean>('check_network_status');
      setIsOnline(online);
      if (isRetry) {
        handleTelemetryEvent('network_retry', { success: online });
      }
    } catch (error) { 
      const errMsg = 'Failed to check network status';
      setNetError(errMsg);
      setIsOnline(false);
      console.error(errMsg, error);
      if (isRetry) {
        handleTelemetryEvent('network_retry', { success: false, error: errMsg });
      }
    } finally {
      setNetLoading(false);
    }
  }, [handleTelemetryEvent]); // Added handleTelemetryEvent dependency

  // Handler for the retry button click
  const handleNetworkRetry = () => {
    checkNetwork(true); // Call checkNetwork indicating it's a retry
  };

  // Handler for starting the guided tour
  const handleStartGuidedTour = () => {
    console.log('[Test Debug] handleStartGuidedTour called. Telemetry enabled:', preferences.telemetry);
    handleTelemetryEvent('guided_tour_started');
    alert("Guided tour coming soon!"); // Placeholder for tour functionality
  };

  return (
    <div className="max-w-2xl mx-auto p-6 min-h-screen flex flex-col">
      <div className="flex-grow flex flex-col items-center justify-center animate-fade-in">
        <h1 className="text-3xl font-bold mb-4 text-neutral-900 dark:text-neutral-50">Setup Wizard</h1>
        <h2 className="text-xl font-semibold mb-6 text-neutral-700 dark:text-neutral-200">{steps[step]}</h2>
        
        {/* Step indicator */}
        <div className="step-indicator mb-8">
          {steps.map((_, index) => (
            <div 
              key={index} 
              className={`step-dot ${index === step ? 'active' : ''} ${index < step ? 'completed' : ''}`}
            />
          ))}
        </div>

        {/* Loading indicator for preferences */}
        {prefsLoading && (
          <div className="mb-6 p-3 bg-primary-50 text-primary-600 border border-primary-200 rounded-lg flex items-center w-full max-w-lg animate-fade-in dark:bg-primary-900/20 dark:border-primary-800 dark:text-primary-400">
            <div className="w-5 h-5 border-2 border-primary-200 border-t-primary-600 rounded-full animate-spin mr-2"></div>
            <span>Loading your preferences...</span>
          </div>
        )}

        {/* Saving indicator for preferences */}
        {prefsSaving && (
          <div className="mb-6 p-3 bg-primary-50 text-primary-600 border border-primary-200 rounded-lg flex items-center w-full max-w-lg animate-fade-in dark:bg-primary-900/20 dark:border-primary-800 dark:text-primary-400">
            <div className="w-5 h-5 border-2 border-primary-200 border-t-primary-600 rounded-full animate-spin mr-2"></div>
            <span>Saving your preferences...</span>
          </div>
        )}

        {userError && (
          <div className="mb-6 p-3 bg-red-50 text-red-600 border border-red-200 rounded-lg flex items-center justify-between w-full max-w-lg animate-fade-in dark:bg-red-900/20 dark:border-red-800 dark:text-red-400">
            <div className="flex items-center">
              <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              {userError}
            </div>
            <button
              className="text-xs font-medium hover:underline focus:outline-none"
              onClick={() => setUserError(null)}
              aria-label="Dismiss error"
            >
              Dismiss
            </button>
          </div>
        )}

        <div className="modern-card p-6 mb-8 w-full max-w-lg animate-slide-up">
          {step === 0 && (
            <WelcomeStep 
              telemetryConsent={preferences.telemetry}
              onTelemetryConsentChange={(checked) => updatePreferences({ telemetry: checked })}
              privacyPolicyConsent={privacyPolicyConsent}
              onPrivacyPolicyConsentChange={handlePrivacyConsentChange}
            />
          )}

          {step === 1 && (
            <SystemCheckStep 
              sysLoading={sysLoading}
              sysError={sysError}
              osInfo={osInfo}
              diskInfo={diskInfo}
              memInfo={memInfo}
            />
          )}

          {step === 2 && (
            <NetworkStatusStep 
              netLoading={netLoading}
              netError={netError}
              isOnline={isOnline}
              onRetry={handleNetworkRetry} // Pass the new handler
            />
          )}

          {step === 3 && (
            <BackendDownloadStep onComplete={() => handleTelemetryEvent('backend_download_completed')} />
          )}

          {step === 4 && (
            <PreferencesStep 
              preferences={preferences}
              onPreferenceChange={updatePreferences} 
              onTelemetryEvent={handleTelemetryEvent} 
            />
          )}

          {step === 5 && (
            <SetupCompleteStep 
              preferences={preferences}
              onStartGuidedTour={handleStartGuidedTour} // Pass the new handler
            />
          )}
        </div>

        <div className="flex justify-between w-full max-w-lg">
          <button
            onClick={back}
            disabled={step === 0}
            className="btn btn-secondary"
          >
            Back
          </button>
          {step < steps.length - 1 ? (
            <button
              onClick={next}
              className="btn btn-primary"
            >
              Next
            </button>
          ) : (
            <button
              onClick={completeOnboarding}
              className="btn btn-success"
            >
              Finish
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
