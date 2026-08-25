import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../auth/core/AuthContext';
import { useDataCache } from '../../../contexts/DataCacheContext';
import { PageHeader } from '../../../components';
import StatsCard from '../../../components/ui/StatsCard';
import { redirectToMaintenance } from '../../../utils/redirectMaintenance';
import {
  ArrowLeft,
  Users,
  Calendar,
  RefreshCw,
  Bell,
  Wrench,
  FileText,
  Clock,
  ChevronRight,
  Activity,
} from 'lucide-react';
import { format } from 'date-fns';

const DashboardPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const {
    systemStats,
    recentActivities,
    rosters,
    notifications,
    loadingStates,
  } = useDataCache();

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  const greetingTime = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  const stats = [
    {
      title: 'Total Users',
      value: systemStats.totalUsers,
      icon: <Users className="h-5 w-5" />,
      description: `${systemStats.activeUsers} active`,
      isLoading: loadingStates.users,
    },
    {
      title: 'Roster Periods',
      value: systemStats.totalRosters,
      icon: <Calendar className="h-5 w-5" />,
      description: `${rosters.filter((r) => r.status === 'published').length} published`,
      isLoading: loadingStates.rosters,
    },
    {
      title: 'Unread Notifications',
      value: unreadCount,
      icon: <Bell className="h-5 w-5" />,
      description: unreadCount > 0 ? 'You have unread messages' : 'All caught up',
      isLoading: loadingStates.notifications,
    },
    {
      title: 'System Activity',
      value: recentActivities.length,
      icon: <Activity className="h-5 w-5" />,
      description: 'Recent actions',
      isLoading: loadingStates.activities,
    },
  ];

  const quickActions: {
    label: string;
    icon: React.ElementType;
    color: string;
    onClick: () => void;
  }[] = [];

  if (user?.role === 'Admin') {
    quickActions.push({
      label: 'Manage Users',
      icon: Users,
      color: 'bg-blue-500',
      onClick: () => navigate('/personnel'),
    });
  }

  if (user?.role === 'Admin' || user?.role === 'Manager Teknik' || user?.role === 'General Manager') {
    quickActions.push({
      label: 'View Rosters',
      icon: Calendar,
      color: 'bg-green-500',
      onClick: () => navigate('/rosters'),
    });
  }

  quickActions.push(
    {
      label: 'Shift Requests',
      icon: RefreshCw,
      color: 'bg-yellow-500',
      onClick: () => navigate('/shift-requests'),
    },
    {
      label: 'Leave Requests',
      icon: FileText,
      color: 'bg-orange-500',
      onClick: () => navigate('/leave-requests'),
    },
    {
      label: 'Maintenance',
      icon: Wrench,
      color: 'bg-purple-500',
      onClick: redirectToMaintenance,
    },
    {
      label: 'Notifications',
      icon: Bell,
      color: 'bg-red-500',
      onClick: () => navigate('/notifications'),
    }
  );

  return (
    <PageHeader
      title={`${greetingTime()}, ${user?.name?.split(' ')[0]}!`}
      subtitle="Here's your overview of the AIRNAV Rostering System"
    >
      {/* Back Button */}
      <div className="mb-6">
        <button
          onClick={() => navigate('/home')}
          className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Home
        </button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <StatsCard
            key={stat.title}
            title={stat.title}
            value={stat.value}
            icon={stat.icon}
            description={stat.description}
            isLoading={stat.isLoading}
          />
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Activity */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
            <h3 className="font-semibold text-gray-900 flex items-center gap-2">
              <Clock className="h-4 w-4 text-gray-500" />
              Recent Activity
            </h3>
            <button
              onClick={() => navigate('/activity-log')}
              className="text-sm text-navy-600 hover:text-navy-700 font-medium flex items-center gap-1 transition-colors"
            >
              View all
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
          <div className="divide-y divide-gray-100">
            {loadingStates.activities ? (
              <div className="p-6 space-y-3">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="animate-pulse flex gap-3">
                    <div className="h-8 w-8 bg-gray-200 rounded-full" />
                    <div className="flex-1 space-y-2">
                      <div className="h-3 bg-gray-200 rounded w-3/4" />
                      <div className="h-2 bg-gray-200 rounded w-1/4" />
                    </div>
                  </div>
                ))}
              </div>
            ) : recentActivities.length === 0 ? (
              <div className="p-6 text-center text-gray-500 text-sm">
                No recent activity
              </div>
            ) : (
              recentActivities.slice(0, 8).map((activity) => (
                <div key={activity.id} className="px-6 py-3 hover:bg-gray-50 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-full bg-navy-100 flex items-center justify-center flex-shrink-0">
                      <Activity className="h-3.5 w-3.5 text-navy-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-gray-700 truncate">
                        <span className="font-medium">{activity.user?.name || 'System'}</span>
                        {' '}{activity.description}
                      </p>
                      <p className="text-xs text-gray-400">
                        {format(new Date(activity.created_at), 'dd MMM yyyy, HH:mm')}
                      </p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Quick Actions + Profile */}
        <div className="space-y-6">
          {/* Quick Actions */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h3 className="font-semibold text-gray-900 mb-4">Quick Actions</h3>
            <div className="space-y-2">
              {quickActions.map((action) => {
                const Icon = action.icon;
                return (
                  <button
                    key={action.label}
                    onClick={action.onClick}
                    className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 transition-colors text-left group"
                  >
                    <div className={`${action.color} p-2 rounded-lg`}>
                      <Icon className="h-4 w-4 text-white" />
                    </div>
                    <span className="text-sm font-medium text-gray-700 group-hover:text-gray-900 transition-colors">
                      {action.label}
                    </span>
                    <ChevronRight className="h-4 w-4 text-gray-400 ml-auto group-hover:text-gray-600 transition-colors" />
                  </button>
                );
              })}
            </div>
          </div>

          {/* Profile Summary */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h3 className="font-semibold text-gray-900 mb-4">Profile</h3>
            <div className="space-y-3">
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wide">Name</p>
                <p className="text-sm font-medium text-gray-900">{user?.name}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wide">Email</p>
                <p className="text-sm font-medium text-gray-900">{user?.email}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wide">Role</p>
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-navy-100 text-navy-700">
                  {user?.role}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </PageHeader>
  );
};

export default DashboardPage;
