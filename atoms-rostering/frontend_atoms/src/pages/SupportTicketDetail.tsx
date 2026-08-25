import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import {
  ArrowLeft,
  Bug,
  Lightbulb,
  Clock,
  CheckCircle,
  AlertCircle,
  FileText,
  Download,
  Loader2,
  Send,
  User,
} from 'lucide-react';
import { PageHeader } from '../components';
import Button from '../components/ui/Button';
import { useAuth } from '../modules/auth/core/AuthContext';
import { supportTicketService } from '../modules/support/repository/supportTicketService';
import type { SupportTicket } from '../types';
import { format } from 'date-fns';

const SupportTicketDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [ticket, setTicket] = useState<SupportTicket | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const isAdminOrManager =
    user?.role === 'Admin' || user?.role === 'Manager Teknik' || user?.role === 'General Manager';

  useEffect(() => {
    loadTicket();
  }, [id]);

  const loadTicket = async () => {
    if (!id) return;
    setIsLoading(true);
    try {
      const data = await supportTicketService.getTicket(Number(id));
      setTicket(data);
    } catch (error) {
      toast.error('Failed to load ticket');
      navigate('/support');
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const badges: Record<string, { bg: string; text: string; icon: React.ReactNode }> = {
      open: { bg: 'bg-blue-100', text: 'text-blue-700', icon: <AlertCircle className="h-4 w-4" /> },
      in_progress: { bg: 'bg-yellow-100', text: 'text-yellow-700', icon: <Clock className="h-4 w-4" /> },
      resolved: { bg: 'bg-green-100', text: 'text-green-700', icon: <CheckCircle className="h-4 w-4" /> },
      closed: { bg: 'bg-gray-100', text: 'text-gray-700', icon: <AlertCircle className="h-4 w-4" /> },
    };
    const badge = badges[status] || badges.open;
    return (
      <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium ${badge.bg} ${badge.text}`}>
        {badge.icon}
        {status.replace('_', ' ').replace(/\b\w/g, (l) => l.toUpperCase())}
      </span>
    );
  };

  const getCategoryBadge = (cat: string) => {
    if (cat === 'bug_report') {
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium bg-red-100 text-red-700">
          <Bug className="h-4 w-4" />
          Bug Report
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium bg-purple-100 text-purple-700">
        <Lightbulb className="h-4 w-4" />
        Feature Request
      </span>
    );
  };

  if (isLoading) {
    return (
      <PageHeader
        title="Ticket Detail"
        breadcrumbs={[{ label: 'Home', href: '/home' }, { label: 'Support Center', href: '/support' }, { label: 'Detail' }]}
      >
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 text-navy-600 animate-spin" />
        </div>
      </PageHeader>
    );
  }

  if (!ticket) return null;

  return (
    <PageHeader
      title={`Ticket #${ticket.id}`}
      subtitle={ticket.title}
      breadcrumbs={[{ label: 'Home', href: '/home' }, { label: 'Support Center', href: '/support' }, { label: `#${ticket.id}` }]}
    >
      {/* Back Button */}
      <button
        onClick={() => navigate('/support')}
        className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6 transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        <span className="text-sm font-medium">Back to Support Center</span>
      </button>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Ticket Info */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="flex items-center gap-3 mb-4">
              {getCategoryBadge(ticket.category)}
              {getStatusBadge(ticket.status)}
            </div>

            <h2 className="text-xl font-bold text-gray-900 mb-4">{ticket.title}</h2>

            <div className="prose prose-sm max-w-none text-gray-700">
              <p className="whitespace-pre-wrap">{ticket.description}</p>
            </div>

            {/* Attachment */}
            {ticket.attachment_path && (
              <div className="mt-6 p-4 bg-gray-50 rounded-xl border border-gray-200">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-white rounded-lg border border-gray-200">
                    <FileText className="h-5 w-5 text-gray-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-700 truncate">
                      {ticket.attachment_original_name}
                    </p>
                    <p className="text-xs text-gray-500">Attachment</p>
                  </div>
                  <a
                    href={ticket.attachment_url || '#'}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    <Download className="h-4 w-4" />
                    Download
                  </a>
                </div>
              </div>
            )}
          </div>

          {/* Admin Response */}
          {ticket.admin_response && (
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <div className="p-1.5 bg-green-100 rounded-lg">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                </div>
                Response from Support Team
              </h3>
              <div className="bg-green-50 rounded-xl p-4 border border-green-100">
                <p className="text-sm text-gray-700 whitespace-pre-wrap">{ticket.admin_response}</p>
              </div>
              {ticket.responder && (
                <div className="mt-3 flex items-center gap-2 text-xs text-gray-500">
                  <User className="h-3.5 w-3.5" />
                  <span>By {ticket.responder.name}</span>
                  {ticket.responded_at && (
                    <>
                      <span>-</span>
                      <span>{format(new Date(ticket.responded_at), 'dd MMM yyyy, HH:mm')}</span>
                    </>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Details Card */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h3 className="font-semibold text-gray-900 mb-4">Details</h3>
            <dl className="space-y-4">
              <div>
                <dt className="text-xs font-medium text-gray-500 uppercase tracking-wide">Status</dt>
                <dd className="mt-1">{getStatusBadge(ticket.status)}</dd>
              </div>
              <div>
                <dt className="text-xs font-medium text-gray-500 uppercase tracking-wide">Category</dt>
                <dd className="mt-1">{getCategoryBadge(ticket.category)}</dd>
              </div>
              <div>
                <dt className="text-xs font-medium text-gray-500 uppercase tracking-wide">Submitted By</dt>
                <dd className="mt-1 text-sm text-gray-700">{ticket.user?.name || 'Unknown'}</dd>
              </div>
              <div>
                <dt className="text-xs font-medium text-gray-500 uppercase tracking-wide">Created</dt>
                <dd className="mt-1 text-sm text-gray-700">
                  {format(new Date(ticket.created_at), 'dd MMMM yyyy, HH:mm')}
                </dd>
              </div>
              {ticket.responded_at && (
                <div>
                  <dt className="text-xs font-medium text-gray-500 uppercase tracking-wide">Last Response</dt>
                  <dd className="mt-1 text-sm text-gray-700">
                    {format(new Date(ticket.responded_at), 'dd MMMM yyyy, HH:mm')}
                  </dd>
                </div>
              )}
            </dl>
          </div>

          {/* Actions (Admin/Manager) */}
          {isAdminOrManager && (
            <AdminActions ticket={ticket} onUpdate={loadTicket} />
          )}
        </div>
      </div>
    </PageHeader>
  );
};

// Admin Actions Component
const AdminActions: React.FC<{ ticket: SupportTicket; onUpdate: () => void }> = ({
  ticket,
  onUpdate,
}) => {
  const [status, setStatus] = useState(ticket.status);
  const [response, setResponse] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);
  const [isResponding, setIsResponding] = useState(false);

  const handleStatusUpdate = async () => {
    if (status === ticket.status) return;
    setIsUpdating(true);
    try {
      await supportTicketService.updateStatus(ticket.id, status);
      toast.success('Status updated successfully');
      onUpdate();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to update status');
      setStatus(ticket.status);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleRespond = async () => {
    if (!response.trim()) {
      toast.error('Please enter a response');
      return;
    }
    setIsResponding(true);
    try {
      await supportTicketService.respondToTicket(ticket.id, response.trim());
      toast.success('Response submitted successfully');
      setResponse('');
      onUpdate();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to submit response');
    } finally {
      setIsResponding(false);
    }
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6">
      <h3 className="font-semibold text-gray-900 mb-4">Admin Actions</h3>

      {/* Status Update */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">Update Status</label>
        <div className="flex gap-2">
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value as any)}
            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-navy-600 focus:border-transparent outline-none text-sm"
          >
            <option value="open">Open</option>
            <option value="in_progress">In Progress</option>
            <option value="resolved">Resolved</option>
            <option value="closed">Closed</option>
          </select>
          <Button
            variant="primary"
            size="sm"
            isLoading={isUpdating}
            onClick={handleStatusUpdate}
            disabled={status === ticket.status}
          >
            Update
          </Button>
        </div>
      </div>

      {/* Response */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Response</label>
        <textarea
          value={response}
          onChange={(e) => setResponse(e.target.value)}
          placeholder="Type your response to the user..."
          rows={4}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-navy-600 focus:border-transparent outline-none resize-none text-sm"
          maxLength={5000}
        />
        <div className="mt-2 flex justify-end">
          <Button
            variant="primary"
            size="sm"
            isLoading={isResponding}
            onClick={handleRespond}
            leftIcon={<Send className="h-4 w-4" />}
          >
            Send Response
          </Button>
        </div>
      </div>
    </div>
  );
};

export default SupportTicketDetail;
