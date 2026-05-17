export interface User {
  user_id: string;
  name: string;
  username: string;
  email: string;
  role: string;
  avatar?: string;
  email_notifications?: boolean;
  system_notifications?: boolean;
  daily_digest?: boolean;
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message: string;
}
