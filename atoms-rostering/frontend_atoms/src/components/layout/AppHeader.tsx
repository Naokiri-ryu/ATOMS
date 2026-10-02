import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
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

  const handleViewProfileClick = () => {
    setIsUserMenuOpen(false);
    const id = user?.employee?.id ?? user?.id;
    if (id) {
      navigate(`/personnel/${id}`);
    }
  };

  return (
    <div className="bg-white shadow-card border-b border-navy-100/60 sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between py-3.5">
          {/* Logo and Welcome */}
          <div className="flex items-center space-x-4">
            <div 
              className="group w-12 h-12 bg-navy-50 border border-navy-100 rounded-xl flex items-center justify-center cursor-pointer hover:-translate-y-0.5 hover:border-navy-200 hover:bg-navy-100/70 hover:shadow-[0_8px_16px_-6px_rgba(34,46,106,0.35)] transition-all duration-300 ease-out"
              onClick={() => navigate('/home')}
            >
              <img 
                src="/assets/icon/logoairnav.svg" 
                alt="AirNav Indonesia Logo" 
                className="w-10 h-10 object-contain transition-transform duration-300 ease-out group-hover:scale-105"
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
              className="group relative p-2 rounded-lg hover:bg-navy-50 hover:-translate-y-0.5 hover:shadow-[0_8px_16px_-6px_rgba(34,46,106,0.35)] transition-all duration-300 ease-out"
            >
              <Bell className="h-6 w-6 text-navy-700 transition-transform duration-300 ease-out group-hover:rotate-12 group-hover:scale-110" />
              {unreadNotificationCount > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-semibold ring-2 ring-white">
                  <span className="absolute inset-0 rounded-full bg-red-400 animate-ping" />
                  <span className="relative">{unreadNotificationCount}</span>
                </span>
              )}
            </button>
            
            {/* User Menu */}
            <div className="relative" ref={userMenuRef}>
              <button 
                onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                className="group flex items-center gap-2 p-2 rounded-lg hover:bg-navy-50 hover:-translate-y-0.5 hover:shadow-[0_8px_16px_-6px_rgba(34,46,106,0.35)] transition-all duration-300 ease-out"
              >
                <div className="w-8 h-8 bg-navy-700 rounded-full flex items-center justify-center transition-transform duration-300 ease-out group-hover:scale-110">
                  <UserIcon className="h-4 w-4 text-white" />
                </div>
                <span className="hidden md:block text-sm font-semibold text-navy-800 transition-colors duration-300 ease-out group-hover:text-navy-900">{user?.role?.toUpperCase()}</span>
                <ChevronDown className={`h-4 w-4 text-slate-400 transition-transform duration-300 ease-out ${isUserMenuOpen ? 'rotate-180' : 'group-hover:translate-y-0.5'}`} />
              </button>

              <AnimatePresence>
                {isUserMenuOpen && (
                  <motion.div
                    key="user-menu"
                    initial={{ opacity: 0, y: -8, scale: 0.96 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -8, scale: 0.96 }}
                    transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
                    style={{ transformOrigin: 'top right' }}
                    className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-modal border border-navy-100 py-2 z-50"
                  >
                    <motion.div
                      initial={{ opacity: 0, y: -6 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -6 }}
                      transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1], delay: 0.04 }}
                      className="px-4 py-3 border-b border-slate-100"
                    >
                      <p className="text-sm font-semibold text-navy-900">{user?.name}</p>
                      <p className="text-xs text-slate-500">{user?.email}</p>
                    </motion.div>
                    <motion.button
                      onClick={() => handleViewProfileClick()}
                      initial={{ opacity: 0, x: -8 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.16, ease: [0.16, 1, 0.3, 1], delay: 0.07 }}
                      className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-navy-50 hover:translate-x-0.5 flex items-center gap-3 transition-all duration-200 ease-out"
                    >
                      <UserIcon className="h-4 w-4" />
                      Lihat Profil Saya
                    </motion.button>
                    <motion.button
                      onClick={handleProfileClick}
                      initial={{ opacity: 0, x: -8 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.16, ease: [0.16, 1, 0.3, 1], delay: 0.11 }}
                      className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-navy-50 hover:translate-x-0.5 flex items-center gap-3 transition-all duration-200 ease-out"
                    >
                      <UserIcon className="h-4 w-4" />
                      Profile Settings
                    </motion.button>
                    <hr className="my-2" />
                    <div className="px-2 pb-1">
                      <motion.button
                        onClick={handleLogoutClick}
                        initial={{ opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.16, ease: [0.16, 1, 0.3, 1], delay: 0.15 }}
                        className="w-full text-left px-4 py-2.5 text-sm font-semibold text-white bg-red-600 hover:bg-red-700 hover:-translate-y-0.5 hover:shadow-[0_8px_16px_-6px_rgba(220,38,38,0.5)] rounded-lg flex items-center gap-3 transition-all duration-300 ease-out shadow-md"
                      >
                        <LogOut className="h-4 w-4" />
                        Sign Out
                      </motion.button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AppHeader;
