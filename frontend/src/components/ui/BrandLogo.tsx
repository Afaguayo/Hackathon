import React from 'react';

interface BrandLogoProps {
  size?: 'sm' | 'md' | 'lg';
  showTagline?: boolean;
}

export const BrandLogo: React.FC<BrandLogoProps> = ({ size = 'md', showTagline = false }) => {
  const lineHeights = {
    sm: 'h-5 w-[2.5px]',
    md: 'h-7 w-[3px]',
    lg: 'h-10 w-[4px]',
  };

  const textSizes = {
    sm: 'text-xl',
    md: 'text-2xl',
    lg: 'text-4xl',
  };

  return (
    <div className="flex flex-col">
      <div className="flex items-center gap-2 select-none">
        {/* La línea-junco: grosor 2-3px, puntas redondas */}
        <span className={`inline-block ${lineHeights[size]} rounded-full bg-reed flex-shrink-0 transition-colors duration-states`} />
        <span className={`font-serif font-semibold ${textSizes[size]} text-ink tracking-tight transition-colors duration-states`}>
          Reed
        </span>
      </div>
      {showTagline && (
        <span className="text-xs text-ink-muted mt-0.5 font-sans">
          El amigo curioso que ya leyó el libro y te lo cuenta con calma.
        </span>
      )}
    </div>
  );
};
