export enum UserRole {
  ADMIN = 'admin',
  USER = 'user',
}

export interface User {
  user_id: string;
  name: string;
  email: string;
  role: UserRole | string;
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message: string;
}

export interface UserStats {
  totalUsers: number;
  activeNow: number;
  newThisMonth: number;
  pendingRequests: number;
}
