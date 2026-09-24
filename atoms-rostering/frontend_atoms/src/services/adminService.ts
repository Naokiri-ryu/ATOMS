import apiClient from '../lib/api';
import { simpleGet, canUseSimpleRequest } from '../utils/simpleRequest';
import { hasStoredToken } from '../modules/auth/core/authStorage';
import type {
  User,
  PaginatedResponse,
  CreateUserRequest,
  UpdateUserRequest,
  GenerateTokenResponse,
  Employee,
  EmployeeProfileUpdateRequest,
} from '../types';

export const adminService = {
  // List Users - optimized to avoid preflight when possible
  async getUsers(params?: { 
    page?: number; 
    search?: string; 
    role?: string;
    employee_type?: string;
    all?: string;
  }): Promise<PaginatedResponse<User>> {
    const hasToken = hasStoredToken();
    
    // Use simple request if no auth token is needed (for public endpoints)
    if (!hasToken && canUseSimpleRequest('GET', false)) {
      const response = await simpleGet(`${import.meta.env.VITE_API_URL || 'http://localhost:8000/api'}/users`, params);
      if (!response.ok) {
        throw new Error('Request failed');
      }
      return response.json();
    }
    
    // Use axios for authenticated requests
    const response = await apiClient.get<PaginatedResponse<User>>('/users', { params });
    return response.data;
  },

  // Create User + Employee
  async createUser(data: CreateUserRequest): Promise<User> {
    const response = await apiClient.post<{ message: string; data: User }>('/admin/users', data);
    return response.data.data; // Extract nested data
  },

  // Update User + Employee
  async updateUser(id: number, data: UpdateUserRequest): Promise<User> {
    const response = await apiClient.patch<{ message: string; data: User }>(`/admin/users/${id}`, data);
    return response.data.data; // Extract nested data
  },

  // Soft Delete User
  async deleteUser(id: number): Promise<{ message: string }> {
    const response = await apiClient.delete(`/admin/users/${id}`);
    return response.data;
  },

  // Restore User
  async restoreUser(id: number): Promise<User> {
    const response = await apiClient.post<User>(`/admin/users/${id}/restore`);
    return response.data;
  },

  // Generate Activation/Reset Token
  // Token yang sama bisa digunakan untuk setup password atau reset password
  async generateToken(id: number): Promise<GenerateTokenResponse> {
    const response = await apiClient.post<GenerateTokenResponse>(`/admin/users/${id}/generate-token`);
    return response.data;
  },

  // Send Activation Code via Email
  async sendActivationCodeEmail(id: number, token: string): Promise<{ message: string }> {
    const response = await apiClient.post<{ message: string }>(`/admin/users/${id}/send-activation-code`, {
      token
    });
    return response.data;
  },

  // Get Employee Profile
  async getEmployeeProfile(id: number): Promise<Employee> {
    const response = await apiClient.get<{ success: boolean; message: string; data: Employee }>(
      `/admin/employees/${id}/profile`
    );
    return response.data.data;
  },

  // Update Employee Profile
  async updateEmployeeProfile(id: number, data: EmployeeProfileUpdateRequest): Promise<Employee> {
    const response = await apiClient.put<{ success: boolean; message: string; data: Employee }>(
      `/admin/employees/${id}/profile`,
      data
    );
    return response.data.data;
  },

  // Get Employee Profile (public for any authenticated user)
  async getPublicProfile(id: number): Promise<Employee> {
    const response = await apiClient.get<{ success: boolean; message: string; data: Employee }>(
      `/employees/${id}/profile`
    );
    return response.data.data;
  },

  // Update Employee Profile (self or admin)
  async updateProfile(id: number, data: EmployeeProfileUpdateRequest): Promise<Employee> {
    const response = await apiClient.put<{ success: boolean; message: string; data: Employee }>(
      `/employees/${id}/profile`,
      data
    );
    return response.data.data;
  },

  // Admin reset user password (set temporary password)
  async resetPassword(id: number, password?: string): Promise<{ message: string; password: string; must_change_password: boolean }> {
    const response = await apiClient.post<{ message: string; password: string; must_change_password: boolean }>(
      `/admin/users/${id}/reset-password`,
      password ? { password } : {}
    );
    return response.data;
  },
};
