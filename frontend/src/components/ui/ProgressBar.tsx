import React from 'react';

interface ProgressBarProps {
  label?: string;
  percent: number;
  className?: string;
  showText?: boolean;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({
  label,
  percent,
  className = '',
  showText = true,
}) => {
  const clampedPercent = Math.min(100, Math.max(0, percent));

  return (
    <div className={`w-full ${className}`}>
      {showText && (
        <div className="flex justify-between items-center text-[13px] leading-[18px] text-ink-muted mb-2 font-sans">
          <span>{label}</span>
          <span className="font-medium">{clampedPercent}%</span>
        </div>
      )}
      <div className="w-full bg-paper-sunk rounded-full h-[6px] overflow-hidden">
        <div
          className="bg-reed h-full rounded-full transition-all duration-states"
          style={{ width: `${clampedPercent}%` }}
        />
      </div>
    </div>
  );
};
