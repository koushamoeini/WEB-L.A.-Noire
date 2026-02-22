import api from './api';

export interface AdminUser {
  id: number;
  username: string;
  email: string;
  first_name?: string;
  last_name?: string;
  is_active: boolean;
  is_superuser: boolean;
  date_joined: string;
  phone?: string;
  national_code?: string;
  role_names: Array<{
    id: number;
    code: string;
    name: string;
  }>;
}

export interface AdminUserCreate {
  username: string;
  email: string;
  password: string;
  first_name?: string;
  last_name?: string;
  phone?: string;
  national_code?: string;
  role_ids?: number[];
  is_active?: boolean;
  is_superuser?: boolean;
}

export interface AdminUserUpdate {
  username?: string;
  email?: string;
  password?: string;
  first_name?: string;
  last_name?: string;
  phone?: string;
  national_code?: string;
  role_ids?: number[];
  is_active?: boolean;
  is_superuser?: boolean;
}

export interface AdminStats {
  users: {
    total: number;
    active: number;
    inactive: number;
    superusers: number;
    by_role: Array<{
      role_code: string;
      role_name: string;
      count: number;
    }>;
    recent: Array<{
      id: number;
      username: string;
      email: string;
      date_joined: string;
    }>;
  };
  cases: {
    total: number;
    pending: number;
    active: number;
    solved: number;
    rejected: number;
    recent: Array<{
      id: number;
      title: string;
      created_at: string;
      status: string;
    }>;
  };
  evidence: {
    total: number;
    verified: number;
    pending: number;
    recent: Array<{
      id: number;
      title: string;
      recorded_at: string;
    }>;
  };
  investigation: {
    suspects: number;
    arrests: number;
    verdicts: {
      total: number;
      guilty: number;
      innocent: number;
    };
  };
}

export interface AdminUserListParams {
  search?: string;
  role?: string;
  is_active?: boolean;
  is_superuser?: boolean;
  ordering?: string;
  page?: number;
}

export const adminAPI = {
  // List users with filtering and search
  listUsers: async (params?: AdminUserListParams): Promise<{ results: AdminUser[]; count: number } | AdminUser[]> => {
    const queryParams = new URLSearchParams();
    if (params?.search) queryParams.append('search', params.search);
    if (params?.role) queryParams.append('role', params.role);
    if (params?.is_active !== undefined) queryParams.append('is_active', params.is_active.toString());
    if (params?.is_superuser !== undefined) queryParams.append('is_superuser', params.is_superuser.toString());
    if (params?.ordering) queryParams.append('ordering', params.ordering);
    if (params?.page) queryParams.append('page', params.page.toString());

    const response = await api.get<{ results: AdminUser[]; count: number } | AdminUser[]>(
      `/admin/users/${queryParams.toString() ? '?' + queryParams.toString() : ''}`
    );
    return response.data;
  },

  // Get single user detail
  getUser: async (id: number): Promise<AdminUser> => {
    const response = await api.get<AdminUser>(`/admin/users/${id}/`);
    return response.data;
  },

  // Create new user
  createUser: async (data: AdminUserCreate): Promise<AdminUser> => {
    const response = await api.post<AdminUser>('/admin/users/', data);
    return response.data;
  },

  // Update existing user
  updateUser: async (id: number, data: AdminUserUpdate): Promise<AdminUser> => {
    const response = await api.put<AdminUser>(`/admin/users/${id}/`, data);
    return response.data;
  },

  // Partial update user
  patchUser: async (id: number, data: Partial<AdminUserUpdate>): Promise<AdminUser> => {
    const response = await api.patch<AdminUser>(`/admin/users/${id}/`, data);
    return response.data;
  },

  // Delete user
  deleteUser: async (id: number): Promise<void> => {
    await api.delete(`/admin/users/${id}/`);
  },

  // Toggle user active status
  toggleActive: async (id: number): Promise<{ message: string; is_active: boolean }> => {
    const response = await api.post<{ message: string; is_active: boolean }>(
      `/admin/users/${id}/toggle_active/`
    );
    return response.data;
  },

  // Reset user password
  resetPassword: async (id: number, newPassword: string): Promise<{ message: string }> => {
    const response = await api.post<{ message: string }>(
      `/admin/users/${id}/reset_password/`,
      { new_password: newPassword }
    );
    return response.data;
  },

  // Get admin statistics
  getStats: async (): Promise<AdminStats> => {
    const response = await api.get<AdminStats>('/admin/stats/');
    return response.data;
  },

  // Get available roles
  getRoles: async (): Promise<Array<{ id: number; code: string; name: string }>> => {
    const response = await api.get<Array<{ id: number; code: string; name: string }>>('/roles/');
    return response.data;
  },
};
