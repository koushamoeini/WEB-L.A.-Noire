import axios from 'axios';
import type { LoginRequest, LoginResponse, RegisterRequest, RegisterResponse, User } from '../types/auth';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
});

// Add JWT token to requests if available
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const authAPI = {
  register: async (data: RegisterRequest): Promise<RegisterResponse> => {
    const response = await api.post<RegisterResponse>('/auth/register/', data);
    return response.data;
  },

  login: async (data: LoginRequest): Promise<LoginResponse> => {
    const response = await api.post<LoginResponse>('/auth/login/', data);
    return response.data;
  },

  getMe: async (): Promise<User> => {
    const response = await api.get<User>('/auth/me/');
    return response.data;
  },

  listUsers: async (): Promise<User[]> => {
    const response = await api.get<User[]>('/users/');
    return response.data;
  },

  getSystemStats: async (): Promise<{ total_cases: number; solved_cases: number; active_cases: number; total_users: number }> => {
    const response = await api.get('/system-stats/');
    return response.data;
  },

  getNotifications: async (): Promise<any[]> => {
    const response = await api.get('/notifications/');
    return response.data;
  },

  markNotificationRead: async (id: number): Promise<void> => {
    await api.post(`/notifications/${id}/mark_as_read/`);
  },

  markAllNotificationsRead: async (): Promise<void> => {
    await api.post('/notifications/mark_all_as_read/');
  },

  clearAllNotifications: async (): Promise<void> => {
    await api.delete('/notifications/clear_all/');
  },
};

export default api;
