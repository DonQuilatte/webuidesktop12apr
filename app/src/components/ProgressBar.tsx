import React from 'react';

interface ProgressBarProps {
  /** The current progress value (percentage, 0-100). */
  value: number;
  /** The maximum value (default is 100). */
  max?: number;
  /** Optional additional CSS classes for the container div. */
  className?: string;
}

const ProgressBar: React.FC<ProgressBarProps> = ({
  value,
  max = 100,
  className = '',
}) => {
  // Ensure value is within bounds
  const clampedValue = Math.min(Math.max(value, 0), max);
  const percentage = max === 0 ? 0 : (clampedValue / max) * 100;

  return (
    <div
      className={`w-full bg-gray-300 rounded h-4 ${className}`}
      role="progressbar"
      aria-valuenow={clampedValue}
      aria-valuemin={0}
      aria-valuemax={max}
      aria-label="Progress indicator" // Added a generic label
      style={{ '--progress-width': `${percentage}%` } as React.CSSProperties} // Use CSS variable
    >
      <div
        className="bg-blue-600 h-4 rounded w-[var(--progress-width)] transition-width duration-150 ease-in-out" // Added transition
      ></div>
    </div>
  );
};

export default ProgressBar;