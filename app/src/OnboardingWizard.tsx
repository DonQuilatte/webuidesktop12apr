import { useState } from 'react'; // Removed useEffect again

// Removed commented out Tauri API import

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

  // Initialize with dummy static values
  const [osInfo] = useState('macOS aarch64 (Dummy)'); // Removed unused setOsInfo
  const [diskInfo] = useState<{ free: number; total: number } | null>({ free: 100 * 1024 * 1024 * 1024, total: 500 * 1024 * 1024 * 1024 }); // Removed unused setDiskInfo
  const [memInfo] = useState<{ free: number; total: number } | null>({ free: 8 * 1024 * 1024, total: 16 * 1024 * 1024 }); // Removed unused setMemInfo
  const [isOnline] = useState<boolean>(true); // State for network status, default to true (dummy), removed setIsOnline

  // useEffect(() => {
    // Fetch system info for step 1 (dummy data for now)
    // if (step === 1) {
    //   // invoke<string>('get_os_info').then(setOsInfo);
  //     // invoke<[number, number]>('get_disk_space').then(
  //     //   ([free, total]) => setDiskInfo({ free, total })
  //     // );
  //     // invoke<[number, number]>('get_memory_info').then(
  //     //   ([free, total]) => setMemInfo({ free, total })
  //     // );
  //   }

    // Fetch network status for step 2 (Commented out)
    // if (step === 2) {
    //   setIsOnline(null); // Reset status while checking
    //   invoke<boolean>('check_network_status').then(setIsOnline);
    // }
  // }, [step]); // Keep useEffect commented out

  const next = () => setStep((s) => Math.min(s + 1, steps.length - 1));
  const back = () => setStep((s) => Math.max(s - 1, 0));

  return (
    <div className="max-w-2xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-4">Setup Wizard</h1>
      <h2 className="text-xl font-semibold mb-2">{steps[step]}</h2>
      <div className="border rounded p-4 mb-4 min-h-[150px] bg-gray-50 dark:bg-gray-800">
        {step === 0 && (
          <div>
            <p className="mb-4">Welcome to the app! Before getting started, please review our privacy policy and provide your consent.</p>
            <div className="mb-4">
              <label className="flex items-center space-x-2">
                <input type="checkbox" className="form-checkbox" />
                <span>I agree to the Privacy Policy</span>
              </label>
            </div>
            <div className="mb-4">
              <label className="flex items-center space-x-2">
                <input type="checkbox" className="form-checkbox" />
                <span>I consent to data collection for improving the app</span>
              </label>
            </div>
          </div>
        )}
        {step === 1 && (
          <div>
            <p className="mb-2 font-semibold">Operating System:</p>
            <p>{osInfo}</p>
            <p className="mt-4 mb-2 font-semibold">Disk Space:</p>
            {diskInfo ? (
              <p>{(diskInfo.free / (1024**3)).toFixed(2)} GB free / {(diskInfo.total / (1024**3)).toFixed(2)} GB total (Dummy)</p>
            ) : (
              <p>Error loading disk info.</p> // Should not happen with static data
            )}
            <p className="mt-4 mb-2 font-semibold">Memory:</p>
            {memInfo ? (
              <p>{(memInfo.free / (1024**2)).toFixed(2)} MB free / {(memInfo.total / (1024**2)).toFixed(2)} MB total (Dummy)</p>
            ) : (
              <p>Error loading memory info.</p> // Should not happen with static data
            )}
          </div>
        )}
        {step === 2 && (
          <div>
            <p className="mb-2 font-semibold">Network Status:</p>
            {/* {isOnline === null && <p>Checking...</p>} */}
            {isOnline === true && <p className="text-green-600">✅ Online (Dummy)</p>}
            {isOnline === false && ( // This case won't happen with dummy true
              <div>
                <p className="text-red-600">❌ Offline (Dummy)</p>
                <p className="mt-2 text-sm text-gray-600">An internet connection is required to download backend components.</p>
              </div>
            )}
          </div>
        )}
        {step > 2 && ( // Adjusted condition for placeholder
          <div>
            <p>Placeholder content for: <strong>{steps[step]}</strong></p>
            {/* TODO: Replace with actual UI for each step */}
          </div>
        )}
      </div>
      <div className="flex justify-between">
        <button
          onClick={back}
          disabled={step === 0}
          className="px-4 py-2 rounded bg-gray-300 dark:bg-gray-700 disabled:opacity-50"
        >
          Back
        </button>
        {step < steps.length - 1 ? (
          <button
            onClick={next}
            className="px-4 py-2 rounded bg-blue-600 text-white"
          >
            Next
          </button>
        ) : (
          <button
            onClick={() => alert('Setup Complete!')}
            className="px-4 py-2 rounded bg-green-600 text-white"
          >
            Finish
          </button>
        )}
      </div>
    </div>
  );
}
