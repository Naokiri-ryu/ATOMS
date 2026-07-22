import React from 'react';
import { useNavigate } from 'react-router-dom';
import { getStoredToken , getStoredUser } from '../../../modules/auth/core/authStorage';


interface MenuGridProps {
  isInitialized?: boolean;
}

const MenuGrid: React.FC<MenuGridProps> = ({ isInitialized = true }) => {
  const navigate = useNavigate();

  const menuItems = [
    {
      title: 'Rostering',
      icon: '/assets/icon/rostering.svg',
      route: '/roster'
    },
    {
      title: 'Employee Management',
      icon: '/assets/icon/employee-management.svg',
      route: '/personnel'
    },
    {
      title: 'Inventory',
      icon: '/assets/icon/inventory.svg',
      route: '/inventory'
    },
    {
      title: 'Maintenance',
      icon: '/assets/icon/maintenance.svg',
      route: '/maintenance'
    },
    {
      title: 'Notifications',
      icon: '/assets/icon/notifications.svg',
      route: '/notifications'
    },
    {
      title: 'Logs & Report',
      icon: '/assets/icon/log-activity.svg',
      route: '/activity-logs'
    }
  ];

  return (
    <div className="mb-12">
      <h2 className="text-3xl font-bold text-[#222E6A] mb-8">
        Menu
      </h2>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-3 gap-8">
        {menuItems.map((item) => (
          <div
            key={item.title}
            onClick={() => {
              if (!isInitialized) return;
              if (item.title === 'Maintenance') {
                // SSO redirect: pass Sanctum token to atoms-maintenance via URL param.
                // atoms-maintenance frontend reads ?token, validates against rostering
                // /api/auth/me, then stores in sessionStorage and enters the dashboard.
                const token = getStoredToken();
		const user = localStorage.getItem('user')
		const userObject = JSON.parse(user);
		const tokenfix = `mock-token-${userObject.id}`;
//              const baseUrl = import.meta.env.VITE_MAINTENANCE_URL || 'http://localhost:5173';
		const currentUrl = window.location.href;
        	let baseUrl;
        
	        if (currentUrl.includes('localhost') || currentUrl.includes('127.0.0.1')) {
        	  // Kalau akses dari localhost → pake VITE_MAINTENANCE_URL
	          baseUrl = import.meta.env.VITE_MAINTENANCE_URL || 'http://localhost:5656';
        	  console.log('🔍 Maintenance: Using localhost URL:', baseUrl);
	        } else {
        	  // Kalau akses dari IP/network → pake VITE_MAINTENANCE_URL_PROD
	          baseUrl = import.meta.env.VITE_MAINTENANCE_URL_PROD || 'http://172.19.38.157:5656';
        	  console.log('🔍 Maintenance: Using network URL:', baseUrl);
	        }
                const url = token
                  ? `${baseUrl}?token=${encodeURIComponent(token)}&tokenfix=${encodeURIComponent(tokenfix)}`
                  : baseUrl;
                window.location.href = url;
              } else {
                navigate(item.route);
              }
            }}
            className={`group flex justify-center ${
              isInitialized ? 'cursor-pointer' : 'cursor-not-allowed opacity-60'
            }`}
          >
            {/* Wrapper for 3D effect */}
            <div className="flex items-end">
              <div className={`transform transition-all duration-200 group-hover:translate-y-[2px] group-active:translate-y-[4px] ${
                isInitialized ? '' : 'pointer-events-none'
              }`}>
                {/* Fixed Size Square Card with Primary Border */}
                <div className="bg-white rounded-xl shadow-sm group-hover:shadow-lg border-2 border-[#222E6A] border-b-[6px] border-b-[#222E6A] group-hover:border-b-[3px] group-active:border-b-[1px] transition-all duration-200 w-[170px]">
                  <div className="flex flex-col items-center justify-center p-5 h-[170px]">
                    <div className="w-24 h-24 flex items-center justify-center mb-3">
                      <img 
                        src={item.icon} 
                        alt={item.title} 
                        className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-200"
                        width={96}
                        height={96}
                        loading="lazy"
                        decoding="async"
                      />
                    </div>
                    <h3 className="text-sm font-semibold text-[#222E6A] text-center leading-tight">
                      {item.title}
                    </h3>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default MenuGrid;
