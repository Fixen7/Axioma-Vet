import type { ButtonHTMLAttributes, ReactNode } from 'react';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  className?: string;
}

export function Button({ 
  children, 
  variant = 'primary', 
  className = '', 
  ...props 
}: ButtonProps) {
  const baseStyles = 'group relative flex items-center justify-center gap-2 md:gap-4 h-16 md:h-24 rounded-full transition-all duration-300 active:scale-[0.98]';
  
  const variants = {
    primary: 'w-full bg-primary-container text-on-primary-container hover:bg-primary hover:text-on-primary primary-glow',
    secondary: 'w-full bg-transparent text-on-surface border-2 border-outline-variant hover:border-outline hover:bg-surface-container-low',
    outline: 'h-12 md:h-[56px] px-6 md:px-8 rounded-[24px] bg-surface text-on-surface font-body-md text-body-md font-semibold hover:bg-surface-variant flex items-center gap-2 border border-outline-variant',
    ghost: 'h-12 md:h-[56px] px-6 md:px-8 rounded-[24px] bg-primary text-on-primary font-body-md text-body-md font-semibold hover:bg-primary/90 flex items-center gap-2 shadow-md shadow-primary/20'
  };

  return (
    <button 
      className={`${baseStyles} ${variants[variant]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
