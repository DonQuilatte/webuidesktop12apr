import React from 'react';

interface DiskInfo {
  free: number;
  total: number;
}

interface MemoryInfo {
  free: number;
  total: number;
}

interface SystemCheckStepProps {
  sysLoading: boolean;
  sysError: string | null;
  osInfo: string | null;
  diskInfo: DiskInfo | null;
  memInfo: MemoryInfo | null;
}

type StatusType = 'good' | 'warning' | 'critical' | 'unknown';

const SystemCheckStep: React.FC<SystemCheckStepProps> = ({ 
  sysLoading, 
  sysError, 
  osInfo, 
  diskInfo, 
  memInfo 
}) => {
  // Helper to format bytes
  const formatBytes = (bytes: number, decimals = 2) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
  };

  // Helper to format MB/GB based on total size
  const formatMemory = (free: number, total: number) => {
    const totalGB = total / (1024 ** 2);
    if (totalGB > 1000) { // If total > 1GB, show in GB
        return `${(free / (1024 ** 2)).toFixed(2)} GB free / ${totalGB.toFixed(2)} GB total`;
    } else { // Otherwise show in MB
        return `${(free / 1024).toFixed(2)} MB free / ${(total / 1024).toFixed(2)} MB total`;
    }
  };

  const formatDisk = (free: number, total: number) => {
    return `${formatBytes(free)} free / ${formatBytes(total)} total`;
  }

  // Calculate status for each component
  const getDiskStatus = (): StatusType => {
    if (!diskInfo || diskInfo.total === 0) return 'unknown';
    const percentFree = (diskInfo.free / diskInfo.total) * 100;
    if (percentFree < 10) return 'critical';
    if (percentFree < 20) return 'warning';
    return 'good';
  };

  const getMemoryStatus = (): StatusType => {
    if (!memInfo || memInfo.total === 0) return 'unknown';
    const percentFree = (memInfo.free / memInfo.total) * 100;
    if (percentFree < 15) return 'critical';
    if (percentFree < 30) return 'warning';
    return 'good';
  };

  const getStatusIcon = (status: StatusType) => {
    switch (status) {
      case 'good':
        return (
          <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center dark:bg-green-900/30">
            <svg className="w-4 h-4 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
        );
      case 'warning':
        return (
          <div className="w-6 h-6 bg-yellow-100 rounded-full flex items-center justify-center dark:bg-yellow-900/30">
            <svg className="w-4 h-4 text-yellow-600 dark:text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
        );
      case 'critical':
        return (
          <div className="w-6 h-6 bg-red-100 rounded-full flex items-center justify-center dark:bg-red-900/30">
            <svg className="w-4 h-4 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
        );
      default:
        return (
          <div className="w-6 h-6 bg-neutral-100 rounded-full flex items-center justify-center dark:bg-neutral-800">
            <svg className="w-4 h-4 text-neutral-600 dark:text-neutral-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
        );
    }
  };

  const getProgressBarColor = (status: StatusType): string => {
    switch (status) {
      case 'critical':
        return 'bg-gradient-to-r from-red-500 to-red-600';
      case 'warning':
        return 'bg-gradient-to-r from-yellow-400 to-yellow-500';
      case 'good':
        return 'bg-gradient-to-r from-green-400 to-green-500';
      default:
        return 'bg-gradient-to-r from-neutral-400 to-neutral-500';
    }
  };

  const diskStatus = getDiskStatus();
  const memoryStatus = getMemoryStatus();

  const renderResourceCard = (
    title: string, 
    status: StatusType, 
    infoText: string, 
    usedValue: number, 
    freeValue: number,
    total: number
  ) => (
    <div className="p-4 bg-neutral-50 rounded-lg border border-neutral-200 dark:bg-neutral-800/50 dark:border-neutral-700">
      <div className="flex items-center mb-2">
        {getStatusIcon(status)}
        <h3 className="font-medium text-neutral-800 ml-3 dark:text-neutral-200">{title}</h3>
      </div>
      <div className="ml-9">
        <p className="text-neutral-700 mb-3 dark:text-neutral-300">{infoText}</p>
        {total > 0 && (
          <div>
            <div className="h-2 bg-neutral-200 rounded-full overflow-hidden dark:bg-neutral-700">
              <div 
                className={`h-full rounded-full ${getProgressBarColor(status)}`}
                style={{ width: `${Math.max(0, Math.min(100, 100 - (freeValue / total) * 100))}%` }}
              ></div>
            </div>
            <div className="flex justify-between mt-1 text-xs text-neutral-500 dark:text-neutral-400">
              <span>Used: {formatBytes(usedValue)}</span>
              <span>Free: {formatBytes(freeValue)}</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className="space-y-6 animate-fade-in">
      {sysLoading ? (
        <div className="flex flex-col items-center justify-center py-8">
          <div className="w-12 h-12 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin mb-4 dark:border-primary-800 dark:border-t-primary-400"></div>
          <p className="text-neutral-600 dark:text-neutral-400">Loading system information...</p>
        </div>
      ) : sysError ? (
        <div className="p-4 bg-red-50 text-red-600 border border-red-200 rounded-lg flex items-center justify-center dark:bg-red-900/20 dark:border-red-800 dark:text-red-400">
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span>{sysError}</span>
        </div>
      ) : (
        <>
          <div className="p-4 bg-neutral-50 rounded-lg border border-neutral-200 dark:bg-neutral-800/50 dark:border-neutral-700">
            <div className="flex items-center mb-2">
              <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center mr-3 dark:bg-blue-900/30">
                <svg className="w-4 h-4 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
              <h3 className="font-medium text-neutral-800 dark:text-neutral-200">Operating System</h3>
            </div>
            <div className="ml-9">
              <p className="text-neutral-700 dark:text-neutral-300">{osInfo || 'Unknown'}</p>
            </div>
          </div>
          
          {diskInfo && renderResourceCard(
            'Disk Space',
            diskStatus,
            diskInfo ? formatDisk(diskInfo.free, diskInfo.total) : 'Unknown',
            diskInfo.total - diskInfo.free,
            diskInfo.free,
            diskInfo.total
          )}
          
          {memInfo && renderResourceCard(
            'Memory',
            memoryStatus,
            memInfo ? formatMemory(memInfo.free, memInfo.total) : 'Unknown',
            memInfo.total - memInfo.free,
            memInfo.free,
            memInfo.total
          )}

          <div className="p-4 bg-blue-50 rounded-lg border border-blue-200 dark:bg-blue-900/20 dark:border-blue-800">
            <div className="flex items-start">
              <svg className="w-5 h-5 text-blue-600 mr-2 mt-0.5 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div className="text-sm text-blue-700 dark:text-blue-300">
                <p>System requirements:</p>
                <ul className="list-disc ml-5 mt-1">
                  <li>Minimum 4GB RAM</li>
                  <li>At least 10GB free disk space</li>
                  <li>64-bit operating system</li>
                </ul>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default SystemCheckStep;
