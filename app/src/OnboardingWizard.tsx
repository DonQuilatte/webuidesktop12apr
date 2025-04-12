import { useState, useEffect } from 'react';
import { invoke } from '@tauri-apps/api/core';

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
  const [diskInfo, setDiskInfo] = useState<{ free: number; total: number } | null>(null);
  const [memInfo, setMemInfo] = useState<{ free: number; total: number } | null>(null);
  const [sysLoading, setSysLoading] = useState(false);
  const [sysError, setSysError] = useState<string | null>(null);
  // Preferences state
  const [preferences, setPreferences] = useState<{ telemetry: boolean; theme: "light" | "dark" }>({
    telemetry: false,
    theme: "light",
  });

  // Network status state
  const [isOnline, setIsOnline] = useState<boolean | null>(null);
  const [netLoading, setNetLoading] = useState(false);
  const [netError, setNetError] = useState<string | null>(null);

  useEffect(() => {
    if (step === 1) {
      setSysLoading(true);
      setSysError(null);
      Promise.all([
        invoke<string>('get_os_info'),
        invoke<[number, number]>('get_disk_space'),
        invoke<[number, number]>('get_memory_info'),
      ])
        .then(([os, [freeDisk, totalDisk], [freeMem, totalMem]]) => {
          setOsInfo(os);
          setDiskInfo({ free: freeDisk, total: totalDisk });
          setMemInfo({ free: freeMem, total: totalMem });
          setSysLoading(false);
        })
        .catch(() => {
          setSysError('Failed to fetch system info');
          setSysLoading(false);
        });
    }
    if (step === 2) {
      setNetLoading(true);
      setNetError(null);
      setIsOnline(null);
      invoke<boolean>('check_network_status')
        .then((online: boolean) => {
          setIsOnline(online);
          setNetLoading(false);
        })
        .catch(() => {
          setNetError('Failed to check network status');
          setNetLoading(false);
        });
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
  }, [step]);

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
            {sysLoading ? (
              <p>Loading system info...</p>
            ) : sysError ? (
              <p className="text-red-600">{sysError}</p>
            ) : (
              <>
                <p>{osInfo}</p>
                <p className="mt-4 mb-2 font-semibold">Disk Space:</p>
                {diskInfo ? (
                  <p>
                    {(diskInfo.free / (1024 ** 3)).toFixed(2)} GB free / {(diskInfo.total / (1024 ** 3)).toFixed(2)} GB total
                  </p>
                ) : (
                  <p>Error loading disk info.</p>
                )}
                <p className="mt-4 mb-2 font-semibold">Memory:</p>
                {memInfo ? (
                  <p>
                    {(memInfo.free / (1024 ** 2)).toFixed(2)} MB free / {(memInfo.total / (1024 ** 2)).toFixed(2)} MB total
                  </p>
                ) : (
                  <p>Error loading memory info.</p>
                )}
              </>
            )}
          </div>
        )}
        {step === 2 && (
          <div>
            <p className="mb-2 font-semibold">Network Status:</p>
            {netLoading ? (
              <p>Checking network status...</p>
            ) : netError ? (
              <p className="text-red-600">{netError}</p>
            ) : isOnline === true ? (
              <p className="text-green-600">✅ Online</p>
            ) : isOnline === false ? (
              <div>
                <p className="text-red-600">❌ Offline</p>
                <p className="mt-2 text-sm text-gray-600">
                  An internet connection is required to download backend components.
                </p>
              </div>
            ) : null}
          </div>
        )}
        {step === 3 && (
          <BackendDownloadStep />
        )}
        {step === 4 && (
          <div>
            <h3 className="text-lg font-semibold mb-2">Preferences & Telemetry</h3>
            <div className="mb-4">
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  className="form-checkbox"
                  checked={!!preferences.telemetry}
                  onChange={() =>
                    setPreferences((p) => ({ ...p, telemetry: !p.telemetry }))
                  }
                />
                <span>Allow anonymous telemetry to improve the app</span>
              </label>
            </div>
            <div className="mb-4">
              <label className="flex items-center space-x-2">
                <span>Theme:</span>
                <select
                  className="form-select"
                  value={preferences.theme}
                  onChange={(e) =>
                    setPreferences((p) => ({ ...p, theme: e.target.value as "light" | "dark" }))
                  }
                >
                  <option value="light">Light</option>
                  <option value="dark">Dark</option>
                </select>
              </label>
            </div>
            <p className="text-sm text-gray-600">
              You can change these preferences later in the app settings.
            </p>
          </div>
        )}
        {step === 5 && (
          <div>
            <h3 className="text-lg font-semibold mb-2">Setup Complete!</h3>
            <p className="mb-4">
              Your preferences have been saved. You are ready to use the app.
            </p>
            <ul className="mb-4 list-disc list-inside">
              <li>Theme: <strong>{preferences.theme === "dark" ? "Dark" : "Light"}</strong></li>
              <li>Telemetry: <strong>{preferences.telemetry ? "Enabled" : "Disabled"}</strong></li>
            </ul>
            <p className="mb-4">
              Take a quick guided tour to learn about the main features, or click Finish to get started.
            </p>
            <button
              className="px-4 py-2 rounded bg-blue-500 text-white mr-2"
              onClick={() => alert("Guided tour coming soon!")}
            >
              Start Guided Tour
            </button>
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
            onClick={async () => {
              try {
                await fetch('http://127.0.0.1:5002/onboarding', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify(preferences),
                });
                alert('Setup Complete!');
              } catch (e) {
                alert('Failed to save preferences to backend.');
              }
            }}
            className="px-4 py-2 rounded bg-green-600 text-white"
          >
            Finish
          </button>
        )}
      </div>
    </div>
  );
}

function BackendDownloadStep() {
  const [progress, setProgress] = useState(0);
  const [downloading, setDownloading] = useState(false);

  const startDownload = () => {
    setDownloading(true);
    setProgress(0);
    const interval = setInterval(() => {
      setProgress((p) => {
        if (p >= 100) {
          clearInterval(interval);
          setDownloading(false);
          return 100;
        }
        return p + 5;
      });
    }, 300);
  };

  return (
    <div>
      <p className="mb-4">Downloading backend components...</p>
      <div className="w-full bg-gray-300 rounded h-4 mb-4">
        <div
          className="bg-blue-600 h-4 rounded"
          style={{ width: `${progress}%` }}
        ></div>
      </div>
      <p className="mb-4">{progress}%</p>
      {!downloading && progress < 100 && (
        <button
          onClick={startDownload}
          className="px-4 py-2 rounded bg-blue-600 text-white"
        >
          Start Download
        </button>
      )}
      {progress === 100 && <p className="text-green-600">Download complete!</p>}
    </div>
  );
}
