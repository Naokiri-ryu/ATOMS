import React from 'react';
import { User as UserIcon } from 'lucide-react';

interface AvatarProps {
  size?: 'sm' | 'md' | 'lg';
  variant?: 'primary' | 'secondary' | 'gradient';
  className?: string;
  onClick?: () => void;
}

const Avatar: React.FC<AvatarProps> = ({
  size = 'md',
  variant = 'primary',
  className = '',
  onClick
}) => {
  const sizeClasses = {
    sm: 'w-6 h-6',
    md: 'w-8 h-8',
    lg: 'w-12 h-12'
  };

  const iconSizes = {
    sm: 'h-3 w-3',
    md: 'h-4 w-4', 
    lg: 'h-6 w-6'
  };

  const variantClasses = {
    primary: 'bg-navy-700',
    secondary: 'bg-navy-500',
    gradient: 'bg-gradient-to-r from-navy-500 to-accent-500'
  };

  return (
    <div 
      className={`${sizeClasses[size]} ${variantClasses[variant]} rounded-full flex items-center justify-center cursor-pointer ${className}`}
      onClick={onClick}
    >
      <UserIcon className={`${iconSizes[size]} text-white`} />
    </div>
  );
};

export default Avatar;