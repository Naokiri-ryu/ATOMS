import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import {
  Bug,
  Lightbulb,
  Upload,
  X,
  FileText,
  Clock,
  CheckCircle,
  AlertCircle,
  Inbox,
  Search,
  ChevronRight,
  Loader2,
  Send,
} from 'lucide-react';
import { PageHeader } from '../components';
import Button from '../components/ui/Button';
import { supportTicketService } from '../modules/support/repository/supportTicketService';
import type { SupportTicket } from '../types';
import { format } from 'date-fns';

const SupportCenter: React.FC = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'submit' | 'my-tickets'>('submit');
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [lastPage, setLastPage] = useState(1);
  const [totalTickets, setTotalTickets] = useState(0);

  // Submit form state
  const [category, setCategory] = useState<'bug_report' | 'feature_request'>('bug_report');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [attachment, setAttachment] = useState<File | null>(null);
  const [dragActive, setDragActive] = useState(false);

  // Filter state
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');

  const loadMyTickets = useCallback(async (page = 1) => {
    setIsLoading(true);
    try {
      const params: Record<string, string | number> = {
        page,
        per_page: 10,
      };
      if (statusFilter) params.status = statusFilter;

      const response = await supportTicketService.getMyTickets(params as any);
      setTickets(response.data);
      setCurrentPage(response.current_page);
      setLastPage(response.last_page);
      setTotalTickets(response.total);
    } catch (error) {
      toast.error('Failed to load tickets');
    } finally {
      setIsLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => {
    if (activeTab === 'my-tickets') {
      loadMyTickets(1);
    }
  }, [activeTab, loadMyTickets]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim() || !description.trim()) {
      toast.error('Please fill in all required fields');
      return;
    }

    setIsSubmitting(true);
    try {
      await supportTicketService.createTicket(
        {
          category,
          title: title.trim(),
          description: description.trim(),
        },
        attachment || undefined
      );

      toast.success('Support ticket created successfully!');
      setTitle('');
      setDescription('');
      setAttachment(null);
      setCategory('bug_report');
      setActiveTab('my-tickets');
    } catch (error: any) {
      const message = error.response?.data?.message || 'Failed to create ticket';
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('Are you sure you want to delete this ticket?')) return;

    try {
      await supportTicketService.deleteTicket(id);
      toast.success('Ticket deleted successfully');
      loadMyTickets(currentPage);
    } catch (error: any) {
      const message = error.response?.data?.message || 'Failed to delete ticket';
      toast.error(message);
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      if (file.size > 5 * 1024 * 1024) {
        toast.error('File size must be less than 5MB');
        return;
      }
      setAttachment(file);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (file.size > 5 * 1024 * 1024) {
        toast.error('File size must be less than 5MB');
        return;
      }
      setAttachment(file);
    }
  };

  const getStatusBadge = (status: string) => {
    const badges: Record<string, { bg: string; text: string; icon: React.ReactNode }> = {
      open: { bg: 'bg-blue-100', text: 'text-blue-700', icon: <AlertCircle className="h-3.5 w-3.5" /> },
      in_progress: { bg: 'bg-yellow-100', text: 'text-yellow-700', icon: <Clock className="h-3.5 w-3.5" /> },
      resolved: { bg: 'bg-green-100', text: 'text-green-700', icon: <CheckCircle className="h-3.5 w-3.5" /> },
      closed: { bg: 'bg-gray-100', text: 'text-gray-700', icon: <X className="h-3.5 w-3.5" /> },
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
          Bug Report
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-700">
        <Lightbulb className="h-3.5 w-3.5" />
        Feature Request
      </span>
    );
  };

  return (
    <PageHeader
      title="Support Center"
      subtitle="Submit bug reports, feature requests, and track your submissions"
      breadcrumbs={[{ label: 'Home', href: '/home' }, { label: 'Support Center' }]}
    >
      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('submit')}
            className={`py-3 px-1 border-b-2 font-medium text-sm transition-colors ${
              activeTab === 'submit'
                ? 'border-navy-600 text-navy-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <span className="flex items-center gap-2">
              <Send className="h-4 w-4" />
              Submit Ticket
            </span>
          </button>
          <button
            onClick={() => setActiveTab('my-tickets')}
            className={`py-3 px-1 border-b-2 font-medium text-sm transition-colors ${
              activeTab === 'my-tickets'
                ? 'border-navy-600 text-navy-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <span className="flex items-center gap-2">
              <Inbox className="h-4 w-4" />
              My Tickets
              {totalTickets > 0 && (
                <span className="bg-navy-700 text-white text-xs px-2 py-0.5 rounded-full">
                  {totalTickets}
                </span>
              )}
            </span>
          </button>
        </nav>
      </div>

      {/* Submit Ticket Tab */}
      {activeTab === 'submit' && (
        <div className="max-w-2xl">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Category Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Category <span className="text-red-500">*</span>
              </label>
              <div className="grid grid-cols-2 gap-4">
                <button
                  type="button"
                  onClick={() => setCategory('bug_report')}
                  className={`p-4 rounded-xl border-2 transition-all ${
                    category === 'bug_report'
                      ? 'border-red-500 bg-red-50 shadow-md'
                      : 'border-gray-200 hover:border-gray-300 bg-white'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`p-2 rounded-lg ${
                        category === 'bug_report' ? 'bg-red-100' : 'bg-gray-100'
                      }`}
                    >
                      <Bug
                        className={`h-5 w-5 ${
                          category === 'bug_report' ? 'text-red-600' : 'text-gray-500'
                        }`}
                      />
                    </div>
                    <div className="text-left">
                      <p
                        className={`font-medium ${
                          category === 'bug_report' ? 'text-red-700' : 'text-gray-700'
                        }`}
                      >
                        Bug Report
                      </p>
                      <p className="text-xs text-gray-500">Something isn't working</p>
                    </div>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setCategory('feature_request')}
                  className={`p-4 rounded-xl border-2 transition-all ${
                    category === 'feature_request'
                      ? 'border-purple-500 bg-purple-50 shadow-md'
                      : 'border-gray-200 hover:border-gray-300 bg-white'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`p-2 rounded-lg ${
                        category === 'feature_request' ? 'bg-purple-100' : 'bg-gray-100'
                      }`}
                    >
                      <Lightbulb
                        className={`h-5 w-5 ${
                          category === 'feature_request' ? 'text-purple-600' : 'text-gray-500'
                        }`}
                      />
                    </div>
                    <div className="text-left">
                      <p
                        className={`font-medium ${
                          category === 'feature_request' ? 'text-purple-700' : 'text-gray-700'
                        }`}
                      >
                        Feature Request
                      </p>
                      <p className="text-xs text-gray-500">Suggest an improvement</p>
                    </div>
                  </div>
                </button>
              </div>
            </div>

            {/* Title */}
            <div>
              <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
                Title <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Brief summary of your issue or request"
                className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-navy-600 focus:border-transparent outline-none transition-all"
                maxLength={255}
              />
            </div>

            {/* Description */}
            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
                Description <span className="text-red-500">*</span>
              </label>
              <textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Provide detailed information about your bug report or feature request..."
                rows={6}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-navy-600 focus:border-transparent outline-none transition-all resize-none"
                maxLength={5000}
              />
              <p className="mt-1 text-xs text-gray-500 text-right">{description.length}/5000</p>
            </div>

            {/* File Attachment */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Attachment <span className="text-gray-400">(optional)</span>
              </label>
              <div
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
                className={`border-2 border-dashed rounded-xl p-6 text-center transition-all ${
                  dragActive
                    ? 'border-navy-600 bg-navy-600/5'
                    : attachment
                    ? 'border-green-300 bg-green-50'
                    : 'border-gray-300 hover:border-gray-400'
                }`}
              >
                {attachment ? (
                  <div className="flex items-center justify-center gap-3">
                    <FileText className="h-8 w-8 text-green-600" />
                    <div className="text-left">
                      <p className="text-sm font-medium text-gray-700">{attachment.name}</p>
                      <p className="text-xs text-gray-500">
                        {(attachment.size / 1024).toFixed(1)} KB
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setAttachment(null)}
                      className="ml-2 p-1 hover:bg-gray-200 rounded-lg transition-colors"
                    >
                      <X className="h-4 w-4 text-gray-500" />
                    </button>
                  </div>
                ) : (
                  <div>
                    <Upload className="h-10 w-10 text-gray-400 mx-auto mb-3" />
                    <p className="text-sm text-gray-600">
                      <span className="font-medium text-navy-600">Click to upload</span> or drag
                      and drop
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      JPG, PNG, GIF, PDF, DOC, DOCX (max 5MB)
                    </p>
                    <input
                      type="file"
                      onChange={handleFileChange}
                      accept=".jpg,.jpeg,.png,.gif,.pdf,.doc,.docx"
                      className="hidden"
                      id="file-upload"
                    />
                    <label
                      htmlFor="file-upload"
                      className="mt-3 inline-flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 cursor-pointer transition-colors"
                    >
                      <Upload className="h-4 w-4" />
                      Choose File
                    </label>
                  </div>
                )}
              </div>
            </div>

            {/* Submit Button */}
            <div className="flex justify-end">
              <Button
                type="submit"
                variant="primary"
                size="lg"
                isLoading={isSubmitting}
                leftIcon={<Send className="h-4 w-4" />}
              >
                Submit Ticket
              </Button>
            </div>
          </form>
        </div>
      )}

      {/* My Tickets Tab */}
      {activeTab === 'my-tickets' && (
        <div>
          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search tickets..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-navy-600 focus:border-transparent outline-none"
              />
            </div>
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
          </div>

          {/* Tickets List */}
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 text-navy-600 animate-spin" />
            </div>
          ) : tickets.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-xl border border-gray-200">
              <Inbox className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-700 mb-1">No tickets yet</h3>
              <p className="text-sm text-gray-500 mb-4">
                Submit your first support ticket to get started
              </p>
              <Button
                variant="primary"
                size="sm"
                onClick={() => setActiveTab('submit')}
              >
                Submit Ticket
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {tickets
                .filter(
                  (ticket) =>
                    !searchQuery ||
                    ticket.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                    ticket.description.toLowerCase().includes(searchQuery.toLowerCase())
                )
                .map((ticket) => (
                  <div
                    key={ticket.id}
                    className="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2 flex-wrap">
                          <span className="text-xs text-gray-500 font-mono">#{ticket.id}</span>
                          {getCategoryBadge(ticket.category)}
                          {getStatusBadge(ticket.status)}
                        </div>
                        <h3 className="font-semibold text-gray-900 mb-1 truncate">{ticket.title}</h3>
                        <p className="text-sm text-gray-600 line-clamp-2 mb-3">{ticket.description}</p>
                        <div className="flex items-center gap-4 text-xs text-gray-500">
                          <span className="flex items-center gap-1">
                            <Clock className="h-3.5 w-3.5" />
                            {format(new Date(ticket.created_at), 'dd MMM yyyy, HH:mm')}
                          </span>
                          {ticket.attachment_original_name && (
                            <span className="flex items-center gap-1">
                              <FileText className="h-3.5 w-3.5" />
                              {ticket.attachment_original_name}
                            </span>
                          )}
                          {ticket.admin_response && (
                            <span className="flex items-center gap-1 text-green-600">
                              <CheckCircle className="h-3.5 w-3.5" />
                              Has response
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => navigate(`/support/${ticket.id}`)}
                          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                          title="View details"
                        >
                          <ChevronRight className="h-5 w-5 text-gray-500" />
                        </button>
                        {ticket.status === 'open' && (
                          <button
                            onClick={() => handleDelete(ticket.id)}
                            className="p-2 hover:bg-red-50 rounded-lg transition-colors"
                            title="Delete ticket"
                          >
                            <X className="h-5 w-5 text-red-500" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}

              {/* Pagination */}
              {lastPage > 1 && (
                <div className="flex items-center justify-center gap-2 pt-4">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={currentPage === 1}
                    onClick={() => loadMyTickets(currentPage - 1)}
                  >
                    Previous
                  </Button>
                  <span className="text-sm text-gray-600">
                    Page {currentPage} of {lastPage}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={currentPage === lastPage}
                    onClick={() => loadMyTickets(currentPage + 1)}
                  >
                    Next
                  </Button>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </PageHeader>
  );
};

export default SupportCenter;
