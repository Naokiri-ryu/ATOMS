import React from 'react';
import { ChevronRight } from 'lucide-react';
import Card from '../ui/Card';

interface ModuleCardProps {
  title: string;
  description: string;
  icon: React.ReactNode;
  onClick: () => void;
  isDisabled?: boolean;
}

const ModuleCard: React.FC<ModuleCardProps> = ({
  title,
  description,
  icon,
  onClick,
  isDisabled = false
}) => {
  return (
    <Card 
      variant="glass" 
      padding="md"
      className={`group cursor-pointer transform hover:scale-105 ${isDisabled ? 'opacity-50 cursor-not-allowed' : ''}`}
      onClick={isDisabled ? undefined : onClick}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="text-navy-700 group-hover:text-navy-900 transition-colors">
            {icon}
          </div>
          <div>
            <h3 className="font-semibold text-navy-900 group-hover:text-navy-700 transition-colors">
              {title}
            </h3>
            <p className="text-sm text-slate-600">{description}</p>
          </div>
        </div>
        {!isDisabled && (
          <ChevronRight className="h-5 w-5 text-slate-400 group-hover:text-navy-700 transition-colors" />
        )}
      </div>
    </Card>
  );
};

export default ModuleCard;