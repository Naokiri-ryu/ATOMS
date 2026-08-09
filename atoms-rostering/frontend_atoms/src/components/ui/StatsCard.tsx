import React from 'react';
import Card from '../ui/Card';

interface StatsCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  description?: string;
  trend?: {
    value: string;
    isPositive: boolean;
  };
  isLoading?: boolean;
}

const StatsCard: React.FC<StatsCardProps> = ({
  title,
  value,
  icon,
  description,
  trend,
  isLoading = false
}) => {
  if (isLoading) {
    return (
      <Card variant="glass" padding="md">
        <div className="animate-pulse">
          <div className="flex items-center justify-between mb-2">
            <div className="h-4 bg-navy-100 rounded w-1/2"></div>
            <div className="h-6 w-6 bg-navy-100 rounded"></div>
          </div>
          <div className="h-8 bg-navy-100 rounded w-3/4 mb-2"></div>
          <div className="h-3 bg-navy-100 rounded w-full"></div>
        </div>
      </Card>
    );
  }

  return (
    <Card variant="glass" padding="md">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-sm font-medium text-slate-600">{title}</h3>
        <div className="text-navy-700">{icon}</div>
      </div>
      
      <div className="flex items-baseline gap-2 mb-1">
        <p className="text-2xl font-bold tracking-tight text-navy-900">{value}</p>
        {trend && (
          <span className={`text-xs font-semibold ${trend.isPositive ? 'text-green-600' : 'text-red-600'}`}>
            {trend.isPositive ? '+' : ''}{trend.value}
          </span>
        )}
      </div>
      
      {description && (
        <p className="text-xs text-slate-500">{description}</p>
      )}
    </Card>
  );
};

export default StatsCard;