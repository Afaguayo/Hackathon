import React from 'react';
import logo from '../../assets/reed/logo.png';

interface BrandLogoProps {
  size?: 'sm' | 'md' | 'lg';
  showTagline?: boolean;
}

const heights = {
  sm: 'h-7',
  md: 'h-9',
  lg: 'h-14',
};

export const BrandLogo: React.FC<BrandLogoProps> = ({ size = 'md', showTagline = false }) => {
  return (
    <div className="flex flex-col">
      <img
        src={logo}
        alt="Reed"
        className={`${heights[size]} w-auto select-none`}
      />
      {showTagline && (
        <span className="text-xs text-ink-muted mt-0.5 font-sans">
          El amigo curioso que ya leyó el libro y te lo cuenta con calma.
        </span>
      )}
    </div>
  );
};
