import React from 'react';

interface ProgressBarProps {
  /** The current progress value (percentage, 0-100). */
  value: number;
  /** The maximum value (default is 100). */
  max?: number;
  /** Optional additional CSS classes for the container div. */
  className?: string;
  /** Optional color theme (primary or secondary). */
  theme?: 'primary' | 'secondary';
}

const ProgressBar: React.FC<ProgressBarProps> = ({
  value,
  max = 100,
  className = '',
  theme = 'primary',
}) => {
  // Ensure value is within bounds
  const clampedValue = Math.min(Math.max(value, 0), max);
  const percentage = max === 0 ? 0 : (clampedValue / max) * 100;

  // Determine gradient based on theme
  const gradientClass = theme === 'primary' 
    ? 'bg-gradient-to-r from-primary-500 to-primary-600' 
    : 'bg-gradient-to-r from-secondary-500 to-secondary-600';

  return (
    <div
      className={`w-full bg-neutral-200 dark:bg-neutral-700 rounded-full h-2.5 overflow-hidden ${className}`}
      role="progressbar"
      aria-valuenow={clampedValue}
      aria-valuemin={0}
      aria-valuemax={max}
      aria-label="Progress indicator"
    >
      <div
        className={`h-full rounded-full transition-all duration-300 ease-in-out ${gradientClass}`}
        style={{ width: `${percentage}%` }}
      ></div>
    </div>
  );
};

export default ProgressBar;