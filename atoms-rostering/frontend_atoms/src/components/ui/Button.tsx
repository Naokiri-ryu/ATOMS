import React, { type ButtonHTMLAttributes } from 'react';
import { Loader2 } from 'lucide-react';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'success' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  children: React.ReactNode;
  effect3d?: boolean;
  fullWidth?: boolean;
}

const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  isLoading = false,
  leftIcon,
  rightIcon,
  className = '',
  disabled,
  effect3d = true,
  fullWidth = false,
  ...props
}) => {
  // Base classes with 3D effect - removed focus ring for cleaner look
  const baseClasses = `inline-flex items-center justify-center font-semibold rounded-xl transition-all duration-150 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed select-none ${
    effect3d 
      ? 'transform group-hover:translate-y-[2px] group-active:translate-y-[4px]' 
      : 'transition-colors'
  }`;

  const variantClasses = {
    primary: effect3d 
      ? 'bg-navy-700 text-white group-hover:bg-navy-800 border-b-[4px] sm:border-b-[6px] group-hover:border-b-[2px] sm:group-hover:border-b-[3px] group-active:border-b-[1px] border-navy-900'
      : 'bg-navy-700 text-white hover:bg-navy-800 shadow-md hover:shadow-lg',
    secondary: effect3d
      ? 'bg-navy-500 text-white group-hover:bg-navy-600 border-b-[4px] sm:border-b-[6px] group-hover:border-b-[2px] sm:group-hover:border-b-[3px] group-active:border-b-[1px] border-navy-700'
      : 'bg-navy-500 hover:bg-navy-600 text-white',
    danger: effect3d
      ? 'bg-gradient-to-b from-[#EF5350] to-[#E53935] text-white group-hover:from-[#E53935] group-hover:to-[#D32F2F] border-b-[4px] sm:border-b-[6px] group-hover:border-b-[2px] sm:group-hover:border-b-[3px] group-active:border-b-[1px] border-[#D32F2F]'
      : 'bg-red-600 text-white hover:bg-red-700',
    success: effect3d
      ? 'bg-gradient-to-b from-[#66BB6A] to-[#4CAF50] text-white group-hover:from-[#4CAF50] group-hover:to-[#43A047] border-b-[4px] sm:border-b-[6px] group-hover:border-b-[2px] sm:group-hover:border-b-[3px] group-active:border-b-[1px] border-[#43A047]'
      : 'bg-green-600 text-white hover:bg-green-700',
    outline: effect3d
      ? 'border-2 border-b-[4px] sm:border-b-[6px] group-hover:border-b-[2px] sm:group-hover:border-b-[3px] group-active:border-b-[1px] border-navy-500 text-navy-700 group-hover:bg-navy-50 bg-white'
      : 'border-2 border-navy-700 text-navy-700 hover:bg-navy-50',
    ghost: effect3d
      ? 'group-hover:bg-navy-50 text-slate-700 border-b-[4px] sm:border-b-[6px] group-hover:border-b-[2px] sm:group-hover:border-b-[3px] group-active:border-b-[1px] border-transparent group-hover:border-navy-100'
      : 'hover:bg-navy-50 text-slate-700'
  };

  const sizeClasses = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-base',
    lg: 'px-6 py-3 text-lg'
  };

  const wrapperHeightClasses = {
    sm: 'h-[30px] sm:h-[34px]',
    md: 'h-[36px] sm:h-[42px]',
    lg: 'h-[46px] sm:h-[54px]'
  };

  const isDisabled = disabled || isLoading;

  return (
    <div className={`${fullWidth ? 'w-full' : 'inline-flex'} group ${effect3d ? wrapperHeightClasses[size] : ''} items-end`}>
      <button
        className={`${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${fullWidth ? 'w-full' : ''} ${className}`}
        disabled={isDisabled}
        {...props}
      >
        {leftIcon && <span className="mr-2">{leftIcon}</span>}
        {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        {children}
        {rightIcon && <span className="ml-2">{rightIcon}</span>}
      </button>
    </div>
  );
};

export default Button;