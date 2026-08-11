import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Wrench, Settings, AlertCircle, CheckCircle, Clock, Bell, User } from 'lucide-react';
import { Breadcrumbs } from '../components';
import { useAuth } from '../modules/auth/core/AuthContext';

const MaintenancePage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const maintenanceTasks = [
    { id: 1, title: 'Scheduled Maintenance', count: 0, icon: Clock, color: 'text-navy-600' },
    { id: 2, title: 'In Progress', count: 0, icon: Settings, color: 'text-navy-600' },
    { id: 3, title: 'Completed', count: 0, icon: CheckCircle, color: 'text-navy-600' },
    { id: 4, title: 'Urgent Issues', count: 0, icon: AlertCircle, color: 'text-navy-600' },
  ];

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-navy-600 to-navy-800 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between mb-4">
            <Breadcrumbs items={[{ label: 'Maintenance & Operation' }]} />
            
            <div className="flex items-center space-x-3">
              <button 
                onClick={() => navigate('/notifications')}
                className="p-2 hover:bg-white/10 rounded-lg transition-colors"
              >
                <Bell className="h-5 w-5" />
              </button>
              <button 
                onClick={() => navigate('/home')}
                className="flex items-center space-x-2 hover:bg-white/10 px-3 py-2 rounded-lg transition-colors"
              >
                <User className="h-5 w-5" />
                <span className="text-sm hidden sm:inline">{user?.name}</span>
              </button>
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            <div className="bg-white/20 backdrop-blur-sm p-3 rounded-xl">
              <Wrench className="h-8 w-8 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">Maintenance & Operation</h1>
              <p className="text-sm opacity-90">Manage equipment maintenance and operations</p>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {maintenanceTasks.map((task) => {
            const Icon = task.icon;
            return (
              <div key={task.id} className="bg-white rounded-xl shadow-sm p-6">
                <div className="flex items-center justify-between mb-4">
                  <Icon className={`h-8 w-8 ${task.color}`} />
                  <span className={`text-3xl font-bold ${task.color}`}>{task.count}</span>
                </div>
                <h3 className="text-gray-900 font-semibold">{task.title}</h3>
              </div>
            );
          })}
        </div>

        {/* Coming Soon Notice */}
        <div className="bg-white rounded-xl shadow-sm p-12 text-center">
          <div className="max-w-md mx-auto">
            <div className="bg-navy-100 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
              <Wrench className="h-10 w-10 text-navy-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Coming Soon</h2>
            <p className="text-gray-600 mb-6">
              The Maintenance & Operation feature is under development and will be available soon.
            </p>
            <button
              onClick={() => navigate('/home')}
              className="bg-navy-700 hover:bg-navy-800 text-white px-6 py-3 rounded-xl font-semibold transition-colors shadow-md hover:shadow-lg"
            >
              Back to Home
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MaintenancePage;
