export enum UserRole {
  ADMIN = 'ADMIN',
  MANAGER = 'MANAGER',
  VIEWER = 'VIEWER'
}

export enum UserStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  SUSPENDED = 'SUSPENDED'
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  status: UserStatus;
  createdAt: string;
  roomId?: string;
  department?: string;
  lastActive?: string;
  avatar?: string;
}

export interface UserFilters {
  role?: UserRole | string;
  status?: UserStatus | string;
  search?: string;
  page?: number;
  limit?: number;
}

export interface UserStats {
  totalUsers: number;
  activeUsers: number;
  adminCount: number;
  newThisMonth: number;
}

export interface CreateUserPayload {
  name: string;
  email: string;
  role: UserRole | string;
  roomId?: string;
  department?: string;
}

export interface UpdateUserPayload extends Partial<CreateUserPayload> {
  status?: UserStatus | string;
}

export interface ApiResponse<T> {
  data: T;
  message: string;
  success: boolean;
  pagination?: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}
