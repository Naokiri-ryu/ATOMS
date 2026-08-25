import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import {
  Bug,
  Lightbulb,
  Clock,
  CheckCircle,
  AlertCircle,
  Inbox,
  Search,
  Loader2,
  Eye,
} from 'lucide-react';
import { PageHeader } from '../components';
import Button from '../components/ui/Button';
import { supportTicketService } from '../modules/support/repository/supportTicketService';
import type { SupportTicket, SupportTicketStats } from '../types';
import { format } from 'date-fns';

const SupportTicketsAdminPage: React.FC = () => {
  const navigate = useNavigate();
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [stats, setStats] = useState<SupportTicketStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [lastPage, setLastPage] = useState(1);
  const [totalTickets, setTotalTickets] = useState(0);

  // Filter state
  const [statusFilter, setStatusFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  const loadTickets = useCallback(async (page = 1) => {
    setIsLoading(true);
    try {
      const params: Record<string, string | number> = {
        page,
        per_page: 15,
      };
      if (statusFilter) params.status = statusFilter;
      if (categoryFilter) params.category = categoryFilter;
      if (searchQuery) params.search = searchQuery;

      const response = await supportTicketService.getAllTickets(params as any);
      setTickets(response.data);
      setCurrentPage(response.current_page);
      setLastPage(response.last_page);
      setTotalTickets(response.total);
    } catch (error) {
      toast.error('Failed to load tickets');
    } finally {
      setIsLoading(false);
    }
  }, [statusFilter, categoryFilter, searchQuery]);

  const loadStats = async () => {
    try {
      const data = await supportTicketService.getStatistics();
      setStats(data);
    } catch (error) {
      // Stats are optional, don't show error
    }
  };

  useEffect(() => {
    loadTickets(1);
    loadStats();
  }, [loadTickets]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    loadTickets(1);
  };

  const getStatusBadge = (status: string) => {
    const badges: Record<string, { bg: string; text: string; icon: React.ReactNode }> = {
      open: { bg: 'bg-blue-100', text: 'text-blue-700', icon: <AlertCircle className="h-3.5 w-3.5" /> },
      in_progress: { bg: 'bg-yellow-100', text: 'text-yellow-700', icon: <Clock className="h-3.5 w-3.5" /> },
      resolved: { bg: 'bg-green-100', text: 'text-green-700', icon: <CheckCircle className="h-3.5 w-3.5" /> },
      closed: { bg: 'bg-gray-100', text: 'text-gray-700', icon: <AlertCircle className="h-3.5 w-3.5" /> },
    };
    const badge = badges[status] || badges.open;
    return (
      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${badge.bg} ${badge.text}`}>
        {badge.icon}
        {status.replace('_', ' ').replace(/\b\w/g, (l) => l.toUpperCase())}
      </span>
    );
  };

  const getCategoryBadge = (cat: string) => {
    if (cat === 'bug_report') {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-red-100 text-red-700">
          <Bug className="h-3.5 w-3.5" />
          Bug
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-700">
        <Lightbulb className="h-3.5 w-3.5" />
        Feature
      </span>
    );
  };

  return (
    <PageHeader
      title="Support Tickets"
      subtitle="Manage and respond to support tickets"
      breadcrumbs={[{ label: 'Home', href: '/home' }, { label: 'Support Tickets' }]}
    >
      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Inbox className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
                <p className="text-xs text-gray-500">Total</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <AlertCircle className="h-5 w-5 text-yellow-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{stats.open}</p>
                <p className="text-xs text-gray-500">Open</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-orange-100 rounded-lg">
                <Clock className="h-5 w-5 text-orange-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{stats.in_progress}</p>
                <p className="text-xs text-gray-500">In Progress</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <CheckCircle className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{stats.resolved + stats.closed}</p>
                <p className="text-xs text-gray-500">Resolved</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <form onSubmit={handleSearch} className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search tickets..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-navy-600 focus:border-transparent outline-none"
          />
        </form>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-navy-600 focus:border-transparent outline-none bg-white"
        >
          <option value="">All Status</option>
          <option value="open">Open</option>
          <option value="in_progress">In Progress</option>
          <option value="resolved">Resolved</option>
          <option value="closed">Closed</option>
        </select>
        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-navy-600 focus:border-transparent outline-none bg-white"
        >
          <option value="">All Categories</option>
          <option value="bug_report">Bug Report</option>
          <option value="feature_request">Feature Request</option>
        </select>
      </div>

      {/* Tickets Table */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 text-navy-600 animate-spin" />
        </div>
      ) : tickets.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-xl border border-gray-200">
          <Inbox className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-700 mb-1">No tickets found</h3>
          <p className="text-sm text-gray-500">
            {searchQuery || statusFilter || categoryFilter
              ? 'Try adjusting your filters'
              : 'No support tickets have been submitted yet'}
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50">
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                    ID
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Category
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Title
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Submitted By
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="text-right px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {tickets.map((ticket) => (
                  <tr key={ticket.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3">
                      <span className="text-sm font-mono text-gray-500">#{ticket.id}</span>
                    </td>
                    <td className="px-4 py-3">{getCategoryBadge(ticket.category)}</td>
                    <td className="px-4 py-3">
                      <p className="text-sm font-medium text-gray-900 truncate max-w-xs">
                        {ticket.title}
                      </p>
                    </td>
                    <td className="px-4 py-3">{getStatusBadge(ticket.status)}</td>
                    <td className="px-4 py-3">
                      <span className="text-sm text-gray-700">{ticket.user?.name || 'Unknown'}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-sm text-gray-500">
                        {format(new Date(ticket.created_at), 'dd MMM yyyy')}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => navigate(`/support/${ticket.id}`)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-navy-600 hover:bg-navy-700/5 rounded-lg transition-colors"
                      >
                        <Eye className="h-4 w-4" />
                        View
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {lastPage > 1 && (
            <div className="flex items-center justify-between px-4 py-3 border-t border-gray-200 bg-gray-50">
              <p className="text-sm text-gray-600">
                Showing page {currentPage} of {lastPage} ({totalTickets} total)
              </p>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={currentPage === 1}
                  onClick={() => loadTickets(currentPage - 1)}
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={currentPage === lastPage}
                  onClick={() => loadTickets(currentPage + 1)}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </div>
      )}
    </PageHeader>
  );
};

export default SupportTicketsAdminPage;
