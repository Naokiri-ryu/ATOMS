import apiClient from '../../../lib/api';
import type { SupportTicket, SupportTicketStats, PaginatedResponse } from '../../../types';

interface CreateTicketData {
  category: 'bug_report' | 'feature_request';
  title: string;
  description: string;
}

interface GetTicketsParams {
  status?: string;
  category?: string;
  search?: string;
  page?: number;
  per_page?: number;
}

export const supportTicketService = {
  async createTicket(data: CreateTicketData, attachment?: File): Promise<SupportTicket> {
    const formData = new FormData();
    formData.append('category', data.category);
    formData.append('title', data.title);
    formData.append('description', data.description);

    if (attachment) {
      formData.append('attachment', attachment);
    }

    const response = await apiClient.post<{ message: string; data: SupportTicket }>('/support-tickets', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data.data;
  },

  async getMyTickets(params: GetTicketsParams = {}): Promise<PaginatedResponse<SupportTicket>> {
    const response = await apiClient.get<{data: PaginatedResponse<SupportTicket>}>('/support-tickets/my-tickets', { params });
    return response.data.data;
  },

  async getTicket(id: number): Promise<SupportTicket> {
    const response = await apiClient.get<{ message: string; data: SupportTicket }>(`/support-tickets/${id}`);
    return response.data.data;
  },

  async getAllTickets(params: GetTicketsParams = {}): Promise<PaginatedResponse<SupportTicket>> {
    const response = await apiClient.get<{data: PaginatedResponse<SupportTicket>}>('/support-tickets', { params });
    return response.data.data;
  },

  async updateStatus(id: number, status: string): Promise<SupportTicket> {
    const response = await apiClient.patch<{ message: string; data: SupportTicket }>(`/support-tickets/${id}/status`, { status });
    return response.data.data;
  },

  async respondToTicket(id: number, response_text: string): Promise<SupportTicket> {
    const response = await apiClient.post<{ message: string; data: SupportTicket }>(`/support-tickets/${id}/respond`, { response: response_text });
    return response.data.data;
  },

  async deleteTicket(id: number): Promise<{ message: string }> {
    const response = await apiClient.delete<{ message: string }>(`/support-tickets/${id}`);
    return response.data;
  },

  async getStatistics(): Promise<SupportTicketStats> {
    const response = await apiClient.get<{ message: string; data: SupportTicketStats }>('/support-tickets/statistics/all');
    return response.data.data;
  },
};
