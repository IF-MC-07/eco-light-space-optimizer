export enum UserRole {
  ADMIN = 'admin',
  MAHASISWA = 'mahasiswa',
}

export interface User {
  user_id: string;
  id?: string;
  name: string;
  username?: string;
  email: string;
  role: UserRole | string;
  avatar?: string;
  lastActive?: string;
  password?: string;
  status?: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message: string;
  pagination?: {
    total: number;
    totalPages: number;
    page: number;
    limit: number;
  };
}

export interface UserStats {
  totalUsers: number;
  activeNow: number;
  newThisMonth: number;
  pendingRequests: number;
  adminCount: number;
  activeUsers: number;
}

export interface UserFilters {
  role?: string;
  search?: string;
  page?: number;
  limit?: number;
}
