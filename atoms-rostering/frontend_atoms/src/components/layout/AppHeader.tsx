import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../modules/auth/core/AuthContext';
import { useDataCache } from '../../contexts/DataCacheContext';
import { 
  User as UserIcon,
  ChevronDown,
  LogOut,
  Bell
} from 'lucide-react';

interface AppHeaderProps {
  onProfileClick?: () => void;
  onLogoutClick?: () => void;
}

const AppHeader: React.FC<AppHeaderProps> = ({ onProfileClick, onLogoutClick }) => {
  const { user } = useAuth();
  const { unreadNotificationCount } = useDataCache();
  const navigate = useNavigate();
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setIsUserMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleProfileClick = () => {
    setIsUserMenuOpen(false);
    if (onProfileClick) {
      onProfileClick();
    }
  };

  const handleLogoutClick = () => {
    setIsUserMenuOpen(false);
    if (onLogoutClick) {
      onLogoutClick();
    }
  };

  return (
    <div className="bg-white shadow-card border-b border-navy-100/60 sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between py-3.5">
          {/* Logo and Welcome */}
          <div className="flex items-center space-x-4">
            <div 
              className="w-12 h-12 bg-navy-50 border border-navy-100 rounded-xl flex items-center justify-center cursor-pointer hover:opacity-80 transition-opacity"
              onClick={() => navigate('/home')}
            >
              <img 
                src="/assets/icon/logoairnav.svg" 
                alt="AirNav Indonesia Logo" 
                className="w-10 h-10 object-contain"
                width={40}
                height={40}
                decoding="async"
                fetchPriority="high"
              />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight text-navy-900">AirNav Indonesia</h1>
              <p className="text-sm text-slate-500">Welcome back, {user?.name || 'User'}</p>
            </div>
          </div>
          
          {/* Header Actions */}
          <div className="flex items-center space-x-3">
            <button 
              onClick={() => navigate('/notifications')}
              className="relative p-2 hover:bg-navy-50 rounded-lg transition-colors"
            >
              <Bell className="h-6 w-6 text-navy-700" />
              {unreadNotificationCount > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-semibold">
                  {unreadNotificationCount}
                </span>
              )}
            </button>
            
            {/* User Menu */}
            <div className="relative" ref={userMenuRef}>
              <button 
                onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                className="flex items-center gap-2 p-2 hover:bg-navy-50 rounded-lg transition-colors"
              >
                <div className="w-8 h-8 bg-navy-700 rounded-full flex items-center justify-center">
                  <UserIcon className="h-4 w-4 text-white" />
                </div>
                <span className="hidden md:block text-sm font-semibold text-navy-800">{user?.role?.toUpperCase()}</span>
                <ChevronDown className={`h-4 w-4 text-slate-400 transition-transform ${isUserMenuOpen ? 'rotate-180' : ''}`} />
              </button>

              {isUserMenuOpen && (
                <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-modal border border-navy-100 py-2 z-50">
                  <div className="px-4 py-3 border-b border-slate-100">
                    <p className="text-sm font-semibold text-navy-900">{user?.name}</p>
                    <p className="text-xs text-slate-500">{user?.email}</p>
                  </div>
                  <button
                    onClick={handleProfileClick}
                    className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-navy-50 flex items-center gap-3 transition-colors"
                  >
                    <UserIcon className="h-4 w-4" />
                    Profile Settings
                  </button>
                  <hr className="my-2" />
                  <div className="px-2 pb-1">
                    <button
                      onClick={handleLogoutClick}
                      className="w-full text-left px-4 py-2.5 text-sm font-semibold text-white bg-red-600 hover:bg-red-700 rounded-lg flex items-center gap-3 transition-colors shadow-md"
                    >
                      <LogOut className="h-4 w-4" />
                      Sign Out
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AppHeader;
