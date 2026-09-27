import React from 'react';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'quiet' | 'voice';
  size?: 'sm' | 'md' | 'lg';
  children: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  variant = 'secondary',
  size = 'md',
  className = '',
  disabled,
  children,
  ...props
}) => {
  const baseStyles = 'inline-flex items-center justify-center font-sans font-bold transition-all duration-states select-none rounded-md';

  const sizeStyles = {
    sm: 'text-[13px] leading-[18px] px-3 py-1.5 gap-1.5',
    md: 'text-[15px] leading-[20px] px-4 py-2.5 gap-2',
    lg: 'text-[16px] leading-[24px] px-5 py-3 gap-2.5',
  };

  const variantStyles = {
    // Verde junco: un solo botón verde por vista
    primary: 'bg-reed text-on-reed hover:bg-reed-strong active:scale-[0.99] shadow-sm',
    // Secundario: borde line-strong sobre paper
    secondary: 'bg-clay text-on-clay border border-clay-strong hover:brightness-95 active:scale-[0.99]',
    quiet: 'text-ink hover:bg-clay hover:text-on-clay active:bg-clay',
    // Ámbar: solo para la voz / audio
    voice: 'bg-ambar text-on-ambar hover:brightness-105 active:scale-[0.99] shadow-sm',
  };

  const disabledStyles = 'opacity-60 bg-paper-sunk text-ink-muted border-none cursor-not-allowed active:scale-100 hover:bg-paper-sunk';

  return (
    <button
      disabled={disabled}
      className={`
        ${baseStyles}
        ${sizeStyles[size]}
        ${disabled ? disabledStyles : variantStyles[variant]}
        ${className}
      `}
      {...props}
    >
      {children}
    </button>
  );
};
