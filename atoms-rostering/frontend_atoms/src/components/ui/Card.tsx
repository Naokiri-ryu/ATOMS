import React from 'react';

interface CardProps {
  children: React.ReactNode;
  variant?: 'default' | 'glass' | 'shadow';
  padding?: 'sm' | 'md' | 'lg';
  className?: string;
  title?: string;
  subtitle?: string;
  footer?: React.ReactNode;
  onClick?: () => void;
}

const Card: React.FC<CardProps> = ({
  children,
  variant = 'default',
  padding = 'md',
  className = '',
  title,
  subtitle,
  footer,
  onClick
}) => {
  const baseClasses = 'rounded-xl transition-all duration-300';

  const variantClasses = {
    default: 'bg-white border border-slate-200 shadow-card hover:shadow-card-hover',
    glass: 'bg-white/90 backdrop-blur-sm border border-navy-100/60 shadow-card hover:shadow-card-hover',
    shadow: 'bg-white shadow-card-hover border border-navy-100/40 hover:shadow-modal border-0'
  };

  const paddingClasses = {
    sm: 'p-4',
    md: 'p-6',
    lg: 'p-8'
  };

  return (
    <div
      className={`${baseClasses} ${variantClasses[variant]} ${onClick ? 'cursor-pointer' : ''} ${className}`}
      onClick={onClick}
    >
      {(title || subtitle) && (
        <div className={`border-b border-slate-100 ${padding === 'sm' ? 'px-4 py-3' : padding === 'md' ? 'px-6 py-4' : 'px-8 py-5'}`}>
          {title && <h3 className="text-lg font-bold text-navy-900">{title}</h3>}
          {subtitle && <p className="mt-1 text-sm text-slate-600">{subtitle}</p>}
        </div>
      )}
      <div className={paddingClasses[padding]}>
        {children}
      </div>
      {footer && (
        <div className={`bg-navy-50/60 border-t border-slate-100 rounded-b-xl ${padding === 'sm' ? 'px-4 py-3' : padding === 'md' ? 'px-6 py-4' : 'px-8 py-5'}`}>
          {footer}
        </div>
      )}
    </div>
  );
};

export default Card;
