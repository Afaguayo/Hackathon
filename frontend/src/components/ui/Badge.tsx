import React from 'react';

interface BadgeProps {
  variant?: 'neutral' | 'reed' | 'ambar' | 'danger';
  children: React.ReactNode;
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({
  variant = 'neutral',
  children,
  className = '',
}) => {
  const variantStyles = {
    neutral: 'bg-paper-sunk text-ink-muted',
    reed: 'bg-reed-soft text-ink font-semibold',
    ambar: 'bg-ambar text-on-ambar font-semibold',
    danger: 'border border-danger text-danger bg-transparent',
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-[12px] leading-[16px] rounded-sm transition-colors duration-states font-sans ${variantStyles[variant]} ${className}`}
    >
      {children}
    </span>
  );
};
